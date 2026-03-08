import "dotenv/config";
import { NextResponse } from "next/server";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { OllamaEmbeddings } from "@langchain/ollama";
import { prisma } from "@/lib/prisma";
import { Document } from "@langchain/core/documents";
import { QdrantVectorStore } from "@langchain/qdrant";

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get("pdf") as File;

  const loader = new PDFLoader(file);
  const docs = await loader.load();

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 150,
  });

  const texts = await splitter.splitDocuments(docs);
  const chunkArray: Document<Record<string, any>>[][] = [];
  const chunkSize = 25;
  const collectionName = file.name.replace(/[^a-zA-Z0-9_-]/g, "_");

  try {
    const pdfExists = await prisma.entry.findFirst({
      where: {
        title: collectionName,
      },
    });

    if (pdfExists) {
      return NextResponse.json(
        { message: "PDF entry already exists" },
        { status: 402 },
      );
    }

    const embeddings = new OllamaEmbeddings({
      model: "nomic-embed-text:latest",
      baseUrl: process.env.OLLAMA_URL ?? "http://localhost:11434",
    });

    while (true) {
      if (!texts.length) {
        break;
      } else if (texts.length < chunkSize) {
        const chunk = texts.splice(0, texts.length);

        chunkArray.push(chunk);
      } else {
        const chunk = texts.splice(0, chunkSize);
        chunkArray.push(chunk);
      }
    }

    const vectorStore = await QdrantVectorStore.fromDocuments(
      chunkArray[0],
      embeddings,
      {
        url: process.env.QDRANT_URL ?? "http://localhost:6333",
        collectionName,
      },
    );

    for (let i = 1; i < chunkArray.length; i++) {
      await vectorStore.addDocuments(chunkArray[i]);
    }

    await prisma.entry.create({ data: { type: "PDF", title: collectionName } });

    return NextResponse.json({ success: "PDF entry was added" });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Could not index pdf!",
      },
      { status: 500 },
    );
  }
}
