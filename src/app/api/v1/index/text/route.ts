import "dotenv/config";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { OllamaEmbeddings } from "@langchain/ollama";
import { QdrantVectorStore } from "@langchain/qdrant";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const bodySchema = z.object({
  value: z.string().min(1),
});

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }
  const { value } = parsed.data;

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 100,
    chunkOverlap: 10,
  });

  const texts = await splitter.splitText(value);

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

      return NextResponse.json(
        {
          success: "Text entry was added to db!",
          id,
        },
        { status: 200 },
      );
    }

    return NextResponse.json(
      { success: "Text entry already exists" },
      { status: 201 },
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Could not index text!",
      },
      { status: 500 },
    );
  }
}
