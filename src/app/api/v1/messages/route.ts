import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const querySchema = z.object({
  entryId: z.string().min(1),
});

export async function POST(req: Request) {
  const body = await req.json();

  const parsed = querySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        message: "Invalid query params",
        errors: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  try {
    const messages = await prisma.message.findMany({
      where: {
        entryId: parsed.data.entryId,
      },
    });
    return NextResponse.json({ success: true, messages });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { success: false, message: "Could not fetch messages" },
      { status: 500 },
    );
  }
}
