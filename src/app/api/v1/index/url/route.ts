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
  const collectionName = toCollectionName(url);
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
    const pages = await crawl(url);
    pages.forEach((p) => {
      console.log(`Crawled page: ${p.path}`);
    });

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1250,
      chunkOverlap: 125,
    });

    const text = pages.map((p) => `URL: ${p.path}\n${p.content}`).join("\n\n");
    const chunks = await splitter.splitText(text);
    const chunkSize = 25;

    const embeddings = new OllamaEmbeddings({
      model: "mxbai-embed-large:latest",
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
    .replace(/https?:\/\//, "")
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .slice(0, 255);
}

type CrawlScope = {
  origin: string;
  basePath: string;
  startUrl: string;
};

async function crawl(
  inputUrl: string,
): Promise<{ path: string; content: string }[]> {
  const scope = getCrawlScope(inputUrl);
  const visited = new Set<string>();
  const results: { path: string; content: string }[] = [];

  async function visit(url: string) {
    if (
      visited.has(url) ||
      visited.size >= MAX_PAGES ||
      !isWithinScope(url, scope)
    )
      return;

    visited.add(url);

    try {
      const content = await scrapeURL(url);

      results.push({ path: url, content: content.split("LINKS:")[0] });
      const links = extractLinks(content, url, scope);
      for (const link of links) await visit(link);
    } catch (e) {
      console.warn(`Failed to scrape ${url}, skipping`);
      console.log((e as Error).message);
    }
  }

  await visit(scope.startUrl);
  return results;
}

function getCrawlScope(inputUrl: string): CrawlScope {
  const url = new URL(inputUrl);
  url.hash = "";
  url.search = "";

  return {
    origin: url.origin,
    basePath: normalizePath(url.pathname),
    startUrl: url.toString(),
  };
}

function normalizePath(pathname: string): string {
  if (pathname === "/") return pathname;

  const normalized = pathname.replace(/\/+$/, "");
  return normalized || "/";
}

function isWithinScope(url: string, scope: CrawlScope): boolean {
  const parsedUrl = new URL(url);

  if (parsedUrl.origin !== scope.origin) return false;

  const pathname = normalizePath(parsedUrl.pathname);

  if (scope.basePath === "/") return true;

  return (
    pathname === scope.basePath || pathname.startsWith(`${scope.basePath}/`)
  );
}

function extractLinks(
  content: string,
  currentUrl: string,
  scope: CrawlScope,
): string[] {
  const linksPart = content.split("LINKS:")[1] ?? "";

  return linksPart
    .split(/\s+/)
    .map((href) => toScopedUrl(href, currentUrl, scope))
    .filter((href): href is string => Boolean(href))
    .filter((url, i, arr) => arr.indexOf(url) === i);
}

function toScopedUrl(
  href: string,
  currentUrl: string,
  scope: CrawlScope,
): string | null {
  if (!href) return null;

  try {
    const resolvedUrl = new URL(href, currentUrl);

    if (!["http:", "https:"].includes(resolvedUrl.protocol)) return null;

    resolvedUrl.hash = "";

    if (!isWithinScope(resolvedUrl.toString(), scope)) return null;

    return resolvedUrl.toString();
  } catch {
    return null;
  }
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
