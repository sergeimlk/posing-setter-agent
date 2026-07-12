import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const DATA_FILE = path.join(process.cwd(), "src/data/instagram-data.json");

export async function POST(req: NextRequest) {
  try {
    const { appsScriptUrl, action, prospect, kpis } = await req.json();

    // 1. Always update local database first to ensure persistent fallback data
    try {
      if (fs.existsSync(DATA_FILE)) {
        const fileContent = fs.readFileSync(DATA_FILE, "utf8");
        const db = JSON.parse(fileContent);

        if (action === "addOrUpdateProspect" && prospect) {
          const index = db.prospects.findIndex((p: any) => p.handle === prospect.handle);
          if (index !== -1) {
            db.prospects[index] = {
              ...db.prospects[index],
              ...prospect,
              category: prospect.score >= 80 ? "hot" : prospect.score >= 65 ? "principal" : "tiede"
            };
          } else {
            db.prospects.push({
              ...prospect,
              avatar: `/avatars/${prospect.handle}.jpg`,
              isFollower: true,
              interactionText: "",
              engagementScore: 0,
              category: prospect.score >= 80 ? "hot" : prospect.score >= 65 ? "principal" : "tiede"
            });
          }
          fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2), "utf8");
          console.log(`💾 Local database updated for prospect @${prospect.handle}`);
        } else if (action === "updateKPIs" && kpis) {
          // If we had KPIs in the JSON, we could save them here (optional)
          console.log("💾 KPIs updated locally (in-memory only or logged).");
        }
      }
    } catch (e: any) {
      console.warn("⚠️ Failed to write changes to local database file:", e.message);
    }

    // 2. If Apps Script is configured, forward the change to Google Sheets
    if (appsScriptUrl && appsScriptUrl.startsWith("http")) {
      console.log(`📡 Forwarding CRM action "${action}" to Apps Script Web App...`);
      try {
        const response = await fetch(appsScriptUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, prospect, kpis }),
          cache: "no-store"
        });

        const result = await response.json();
        return NextResponse.json({ ...result, savedLocally: true });
      } catch (err: any) {
        console.warn("⚠️ Failed to forward change to Google Sheets:", err.message);
        return NextResponse.json({ success: true, savedLocally: true, warning: "Sheets forward failed, but changes saved locally." });
      }
    }

    return NextResponse.json({ 
      success: true, 
      savedLocally: true, 
      message: "Modifications sauvegardées localement. Pour synchroniser avec Google Sheets, configurez l'URL Apps Script dans les paramètres." 
    });
  } catch (error: any) {
    console.error("❌ Failed to process CRM update:", error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
