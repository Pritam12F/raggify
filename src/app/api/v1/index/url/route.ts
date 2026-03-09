import { NextRequest, NextResponse } from "next/server";
import { PuppeteerWebBaseLoader } from "@langchain/community/document_loaders/web/puppeteer";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { OllamaEmbeddings } from "@langchain/ollama";
import { QdrantVectorStore } from "@langchain/qdrant";
import { prisma } from "@/lib/prisma";
import { Document } from "@langchain/core/documents";
import { z } from "zod";

const MAX_PAGES = 80;

const bodySchema = z.object({
  url: z.string().url(),
});

export async function POST(req: NextRequest) {
  const parsed = bodySchema.safeParse(await req.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { url } = parsed.data;
  const origin = new URL(url).origin;
  const collectionName = toCollectionName(origin);

  const entryExists = await prisma.entry.findFirst({
    where: {
      title: collectionName,
      type: "URL",
    },
  });

  if (entryExists) {
    return NextResponse.json(
      { message: "Website is already indexed" },
      { status: 403 },
    );
  }

  try {
    const pages = await crawl(origin);

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1250,
      chunkOverlap: 125,
    });

    const text = pages.map((p) => `URL: ${p.path}\n${p.content}`).join("\n\n");
    const chunks = await splitter.splitText(text);
    const chunkSize = 25;

    const embeddings = new OllamaEmbeddings({
      model: "nomic-embed-text:latest",
      baseUrl: process.env.OLLAMA_URL ?? "http://localhost:11434",
    });

    const firstBatch = chunks
      .slice(0, chunkSize)
      .map((text) => new Document({ pageContent: text }));

    const store = await QdrantVectorStore.fromDocuments(
      firstBatch,
      embeddings,
      {
        url: process.env.QDRANT_URL ?? "http://localhost:6333",
        collectionName: `${collectionName}`,
      },
    );

    for (let i = chunkSize; i < chunks.length; i += chunkSize) {
      const chunk = chunks
        .slice(i, i + chunkSize)
        .map((text) => new Document({ pageContent: text }));

      await store.addDocuments(chunk);
    }

    const { id } = await prisma.entry.create({
      data: { type: "URL", title: collectionName },
    });

    return NextResponse.json({
      success: true,
      message: `Entry added id: ${id}`,
    });
  } catch (err) {
    console.log(err instanceof Error ? err.message : "Indexing failed");
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}

function toCollectionName(origin: string): string {
  return origin
    .replace(/https?:\/\//, "") // remove https:// or http://
    .replace(/[^a-zA-Z0-9_-]/g, "_") // replace invalid chars with _
    .slice(0, 255); // qdrant name length limit
}

async function crawl(
  baseUrl: string,
): Promise<{ path: string; content: string }[]> {
  const visited = new Set<string>();
  const results: { path: string; content: string }[] = [];

  async function visit(url: string) {
    if (visited.has(url) || visited.size >= MAX_PAGES) return;

    visited.add(url);
    try {
      const content = await scrapeURL(url);

      results.push({ path: url, content: content.split("LINKS:")[0] });
      const links = extractLinks(content, baseUrl);
      for (const link of links) await visit(link);
    } catch (e) {
      console.warn(`Failed to scrape ${url}, skipping`);
      console.log((e as Error).message);
    }
  }

  await visit(baseUrl);
  return results;
}

function extractLinks(content: string, baseUrl: string): string[] {
  const origin = new URL(baseUrl).origin;
  const linksPart = content.split("LINKS:")[1] ?? "";

  return linksPart
    .split(" ")
    .filter((h) => h.startsWith("/") && h !== "/")
    .map((h) => `${origin}${h}`)
    .filter((url, i, arr) => arr.indexOf(url) === i);
}

async function scrapeURL(url: string): Promise<string> {
  const loader = new PuppeteerWebBaseLoader(url, {
    launchOptions: { headless: true },
    gotoOptions: { waitUntil: "networkidle2" },
    evaluate: async (page, browser) => {
      const content = await page.evaluate(() => {
        // Extract links
        const links = [...document.querySelectorAll("a[href]")]
          .map((el) => el.getAttribute("href"))
          .filter((el) => el)
          .join(" ");

        // Clean the DOM
        document
          .querySelectorAll("script, style, iframe, img, svg, video")
          .forEach((el) => el.remove());

        const text = document.body.innerText.replace(/\s+/g, " ").trim();

        return `${text}\nLINKS:${links}`;
      });

      await browser.close();
      return content;
    },
  });

  const doc = await loader.load();
  return doc[0].pageContent;
}
