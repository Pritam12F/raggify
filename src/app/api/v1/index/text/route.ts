import "dotenv/config";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { OllamaEmbeddings } from "@langchain/ollama";
import { QdrantVectorStore } from "@langchain/qdrant";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const { value } = await request.json();

  if (!value.trim().length || value.trim().length < 100) {
    return NextResponse.json(
      { error: "No input provided or too short input" },
      { status: 301 },
    );
  }

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 100,
    chunkOverlap: 10,
  });

  const texts = await splitter.splitText(value as string);

  try {
    const embeddings = new OllamaEmbeddings({
      model: "qwen3-embedding:4b",
      baseUrl: process.env.OLLAMA_URL ?? "http://localhost:11434",
    });

    await QdrantVectorStore.fromTexts(texts, {}, embeddings, {
      url: process.env.QDRANT_URL ?? "http://localhost:6333",
      collectionName: "textCollection",
    });

    const textExists = await prisma.entry.findFirst({
      where: { type: "TEXT" },
    });

    if (!textExists) {
      const { id } = await prisma.entry.create({
        data: {
          type: "TEXT",
        },
      });
      return NextResponse.json({
        success: "Text was successfully indexed!",
        id,
      });
    }

    return NextResponse.json({ success: "Text entry already exists" });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Could not index text!",
      },
      { status: 302 },
    );
  }
}
