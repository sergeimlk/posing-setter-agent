import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const projectRoot = path.join(process.cwd());
    const scriptPath = path.join(projectRoot, "scripts/scrape-and-prioritize.js");

    console.log(`⚡ API Triggered: Running scrape-and-prioritize.js at ${scriptPath}`);

    // Run the scraper script in the background/async
    exec(`node "${scriptPath}"`, (error, stdout, stderr) => {
      if (error) {
        console.error("❌ Background Sync Script Error:", error);
        return;
      }
      console.log("✅ Background Sync Script Completed successfully!");
      console.log("Stdout:", stdout);
      if (stderr) console.warn("Stderr:", stderr);
    });

    return NextResponse.json({ 
      success: true, 
      message: "Synchronisation Instagram lancée en tâche de fond. Actualisez la page dans 15-20 secondes pour voir les nouveaux prospects prioritaires." 
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
