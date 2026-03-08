import "dotenv/config";
import { NextResponse } from "next/server";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { OllamaEmbeddings } from "@langchain/ollama";
import { QdrantVectorStore } from "@langchain/qdrant";
import { prisma } from "@/lib/prisma";

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

  try {
    const pdfExists = await prisma.entry.findFirst({
      where: {
        title: file.name,
      },
    });

    if (pdfExists) {
      return NextResponse.json(
        { message: "PDF entry already exists" },
        { status: 402 },
      );
    }

    const embeddings = new OllamaEmbeddings({
      model: "mxbai-embed-large:latest",
      baseUrl: process.env.OLLAMA_URL ?? "http://localhost:11434",
    });

    await QdrantVectorStore.fromDocuments(texts, embeddings, {
      url: process.env.QDRANT_URL ?? "http://localhost:6333",
      collectionName: `${file.name}`,
    });

    await prisma.entry.create({ data: { type: "PDF", title: file.name } });

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
