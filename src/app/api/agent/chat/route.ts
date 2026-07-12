import { NextRequest, NextResponse } from "next/server";
import { chatWithAgent } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const { message, context } = await req.json();
    const response = await chatWithAgent(message, context || "");
    return NextResponse.json({ response });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
