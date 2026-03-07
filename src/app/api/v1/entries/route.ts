import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const entries = await prisma.entry.findMany({
      include: {
        messages: true,
      },
    });

    return NextResponse.json({ entries }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Could not fetch entries!",
      },
      { status: 500 },
    );
  }
}
