import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { appsScriptUrl, action, prospect, kpis, message } = await req.json();

    if (!appsScriptUrl || !appsScriptUrl.startsWith("http")) {
      return NextResponse.json({ error: "URL Apps Script non configurée" }, { status: 400 });
    }

    console.log(`📡 Sending CRM action "${action}" to Apps Script Web App...`);
    
    const response = await fetch(appsScriptUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, prospect, kpis, message }),
      cache: "no-store"
    });

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("❌ Failed to communicate with Google Sheets Apps Script Web App:", error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
