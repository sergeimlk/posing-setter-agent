import { NextRequest, NextResponse } from "next/server";
import { generateReport } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const { reportType, dailyData } = await req.json();
    const report = await generateReport(
      dailyData || "Données de démonstration. DMs envoyés: 45, Réponses: 12, Appels bookés: 1, Leads qualifiés: 5",
      reportType || "midday"
    );
    return NextResponse.json({ report });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
