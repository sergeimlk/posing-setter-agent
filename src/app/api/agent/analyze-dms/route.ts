import { NextRequest, NextResponse } from "next/server";
import { analyzeDMs } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const { dmsData } = await req.json();
    const result = await analyzeDMs(dmsData || "Pas de DMs à analyser pour le moment.");
    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message, summary: "Erreur lors de l'analyse. Vérifiez la clé API Gemini." }, { status: 500 });
  }
}
