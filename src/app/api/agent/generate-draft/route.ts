import { NextRequest, NextResponse } from "next/server";
import { generateDrafts } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const { conversationHistory, prospectInfo, hansStep } = await req.json();
    const result = await generateDrafts(
      conversationHistory || "",
      prospectInfo || "Prospect bodybuilder compétiteur",
      hansStep || 1
    );
    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
