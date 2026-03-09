import { createOllama } from "ollama-ai-provider-v2";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { generateSystemPrompt } from "@/prompt/main";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getRelevantDocs } from "@/lib/relevant-docs";
import { z } from "zod";

const uiMessageSchema = z
  .object({
    id: z.string(),
    role: z.enum(["user", "assistant", "system", "tool"]),
    parts: z.array(z.any()),
    metadata: z.unknown().optional(),
  })
  .passthrough() as unknown as z.ZodType<UIMessage>;

const requestSchema = z.object({
  messages: z.array(uiMessageSchema),
  entry: z.string().min(1),
  entryId: z.string().min(1),
});

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = requestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        message: "Invalid request",
        errors: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const lastMessage = parsed.data.messages[parsed.data.messages.length - 1];
  const userQuery =
    lastMessage.parts[0].type === "text" ? lastMessage.parts[0].text : "";
  const { messages, entry, entryId } = parsed.data;

  const entryExists = await prisma.entry.findFirst({
    where: { title: entry, id: entryId },
  });

  if (!entryExists) {
    return NextResponse.json({ succcess: false, message: "No entry found" });
  }

  const docs = await getRelevantDocs(userQuery, entry);

  console.log("[chat] Retrieved docs length:", docs.length);
  console.log("[chat] Docs preview:", docs.slice(0, 200));

  const ollama = createOllama({
    baseURL: "http://localhost:11434/api",
  });
  const model = ollama("llama2:latest");

  const result = streamText({
    model,
    system: generateSystemPrompt(docs),
    messages: await convertToModelMessages(messages),
    temperature: 0.3,
    onFinish: async (e) => {
      await prisma.message.createMany({
        data: [
          { role: "user", content: userQuery, entryId: entryExists.id },
          {
            role: "assistant",
            content: e.content[0].type === "text" ? e.content[0].text : "",
            entryId: entryExists.id,
          },
        ],
      });
    },
  });

  return result.toUIMessageStreamResponse();
}
