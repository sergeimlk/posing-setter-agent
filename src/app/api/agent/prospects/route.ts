import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Path to local fallback file
const DATA_FILE = path.join(process.cwd(), "src/data/instagram-data.json");
const DEFAULT_SHEET_ID = "1afeUsmftVlJhN4sh83MlcRQxFTnx3JZ3B-UhoYthf60";

// Helper to parse CSV rows
function parseCSV(csvText: string) {
  const lines: string[][] = [];
  let row: string[] = [];
  let inQuotes = false;
  let currentVal = "";

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        currentVal += '"';
        i++; // skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push(currentVal.trim());
      currentVal = "";
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++; // skip LF
      }
      row.push(currentVal.trim());
      lines.push(row);
      row = [];
      currentVal = "";
    } else {
      currentVal += char;
    }
  }
  if (currentVal || row.length > 0) {
    row.push(currentVal.trim());
    lines.push(row);
  }
  return lines;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sheetId = searchParams.get("sheetId") || DEFAULT_SHEET_ID;
  const appsScriptUrl = searchParams.get("appsScriptUrl");

  // 1. Try Apps Script Web App first if configured
  if (appsScriptUrl && appsScriptUrl.startsWith("http")) {
    try {
      const response = await fetch(appsScriptUrl, { cache: "no-store", timeout: 8000 } as any);
      if (response.status === 200) {
        const json = await response.json();
        if (json && Array.isArray(json.prospects)) {
          const prospects = json.prospects.map((p: any) => {
            const handle = (p["Pseudo Instagram"] || p["pseudo"] || p["handle"] || "").replace("@", "").trim();
            if (!handle) return null;
            const score = parseInt(p["Score Qualification (0-100)"] || p["score"] || "50", 10) || 50;
            return {
              handle,
              score,
              category: score >= 80 ? "hot" : score >= 65 ? "principal" : "tiede",
              hansStep: parseInt(p["Étape Hans"] || p["etape"] || p["hansStep"] || "1", 10) || 1,
              pertinence: parseInt(p["Pertinence (Étoiles)"] || p["pertinence"] || "3", 10) || 3,
              propension: parseInt(p["Propension d'Achat (Étoiles)"] || p["propension"] || "3", 10) || 3,
              federation: p["Fédération"] || p["federation"] || "N/A",
              categoryBody: p["Catégorie Body"] || p["categoryBody"] || "Classic Physique",
              compDate: p["Date Compétition"] || p["compDate"] || "N/A",
              notes: p["Notes / Douleurs"] || p["notes"] || "",
              avatar: `https://images.unsplash.com/photo-${getAvatarHash(handle)}?w=150&h=150&fit=crop&crop=faces`
            };
          }).filter(Boolean);
          
          return NextResponse.json({
            lastSync: new Date().toISOString(),
            prospects,
            usingFallback: false,
          });
        }
      }
    } catch (e: any) {
      console.warn("⚠️ Failed to fetch from Apps Script Web App:", e.message);
    }
  }

  // 2. Try Public CSV export URL (try by name first, fallback to gid=0 if empty)
  const csvUrlByName = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&sheet=Prospects+Qualifi%C3%A9s`;
  const csvUrlByDefault = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=0`;

  try {
    let response = await fetch(csvUrlByName, { cache: "no-store" });
    let csvText = "";
    
    if (response.status === 200) {
      csvText = await response.text();
    }

    // Fallback if empty or name mismatch
    if (response.status !== 200 || csvText.trim().length === 0 || csvText.trim().startsWith("<!DOCTYPE")) {
      console.log("ℹ️ Fetching by sheet name returned empty or sign-in. Trying default sheet (gid=0)...");
      response = await fetch(csvUrlByDefault, { cache: "no-store" });
      if (response.status === 200) {
        csvText = await response.text();
      }
    }

    if (response.status === 200) {
      // If it returns HTML (Google Sign-In page), then it is not public!
      if (csvText.trim().startsWith("<!DOCTYPE")) {
        console.warn("⚠️ Google Sheet requires authentication (returned sign-in page). Using local fallback.");
        return loadFallback(true);
      }

      const rows = parseCSV(csvText);
      if (rows.length < 2) {
        return loadFallback(false, "Sheet has no rows");
      }

      // Headers (first row)
      const headers = rows[0].map(h => h.toLowerCase());
      
      // Parse rows into objects
      const prospects = rows.slice(1).map((row) => {
        // Map header positions
        const getVal = (possibleHeaders: string[], fallbackVal: string = "") => {
          const idx = headers.findIndex(h => possibleHeaders.some(ph => h.includes(ph)));
          return idx !== -1 && row[idx] !== undefined ? row[idx] : fallbackVal;
        };

        const handle = getVal(["pseudo", "instagram", "handle"]).replace("@", "");
        if (!handle) return null;

        const score = parseInt(getVal(["score"]), 10) || 50;
        const pertinence = parseInt(getVal(["pertinence"]), 10) || 3;
        const propension = parseInt(getVal(["propension"]), 10) || 3;
        const hansStep = parseInt(getVal(["étape", "etape", "hans"]), 10) || 1;

        return {
          handle,
          score,
          category: score >= 80 ? "hot" : score >= 65 ? "principal" : "tiede",
          hansStep,
          pertinence,
          propension,
          federation: getVal(["fédération", "federation"], "N/A"),
          categoryBody: getVal(["catégorie body", "categorie body", "class"], "Classic Physique"),
          compDate: getVal(["compétition", "competition", "date"], "N/A"),
          notes: getVal(["notes", "douleurs"], "Aucune note."),
          avatar: `https://images.unsplash.com/photo-${getAvatarHash(handle)}?w=150&h=150&fit=crop&crop=faces`
        };
      }).filter(Boolean);

      return NextResponse.json({
        lastSync: new Date().toISOString(),
        prospects,
        usingFallback: false,
      });
    } else {
      console.warn(`⚠️ Google Sheet fetch returned status ${response.status}. Using local fallback.`);
      return loadFallback(true);
    }
  } catch (error: any) {
    console.error("❌ Failed to fetch Google Sheet:", error.message);
    return loadFallback(true);
  }
}

function loadFallback(sheetPrivate: boolean = false, errorDetail: string = "") {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const fileContent = fs.readFileSync(DATA_FILE, "utf8");
      const localData = JSON.parse(fileContent);
      return NextResponse.json({
        ...localData,
        usingFallback: true,
        sheetPrivate,
        errorDetail,
      });
    }
  } catch (e) {
    console.error("❌ Fallback read failed:", e);
  }
  return NextResponse.json({ prospects: [], usingFallback: true, error: "No data available" });
}

// Generate deterministic Unsplash avatar based on handle string length/chars
function getAvatarHash(handle: string): string {
  const hashes = [
    "1534438327276-14e5300c3a48", // Lucas
    "1506794778202-cad84cf45f1d", // Valentin
    "1517841905240-472988babdf9", // Maelle
    "1507003211169-0a1dd7228f2d", // Jimbo
    "1500648767791-00dcc994a43e", // Nassim
  ];
  let sum = 0;
  for (let i = 0; i < handle.length; sum += handle.charCodeAt(i++));
  return hashes[sum % hashes.length];
}
