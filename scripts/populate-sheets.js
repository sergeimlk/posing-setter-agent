const puppeteer = require("puppeteer-core");
const fs = require("fs");
const path = require("path");

const PORT = 9222;
const DATA_FILE = path.join(__dirname, "../src/data/instagram-data.json");

const sleep = ms => new Promise(res => setTimeout(res, ms));

async function main() {
  console.log("🔍 Reading local prospects...");
  if (!fs.existsSync(DATA_FILE)) {
    console.error("❌ No instagram-data.json database found!");
    return;
  }
  const db = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  const prospects = db.prospects || [];
  console.log(`ℹ️ Found ${prospects.length} prospects to write.`);

  // Generate TSV string
  const headers = [
    "Pseudo Instagram",
    "Score Qualification (0-100)",
    "Étape Hans",
    "Pertinence (Étoiles)",
    "Propension d'Achat (Étoiles)",
    "Fédération",
    "Catégorie Body",
    "Date Compétition",
    "Notes / Douleurs"
  ];

  let tsvContent = headers.join("\t") + "\n";
  prospects.forEach(p => {
    const row = [
      `@${p.handle}`,
      p.score || 50,
      p.hansStep || 1,
      p.pertinence || 3,
      p.propension || 3,
      p.federation || "N/A",
      p.categoryBody || "Classic Physique",
      p.compDate || "N/A",
      (p.notes || "").replace(/\t/g, " ").replace(/\n/g, " ")
    ];
    tsvContent += row.join("\t") + "\n";
  });

  console.log("🔍 Connecting to Chrome via CDP on port 9222...");
  const browser = await puppeteer.connect({
    browserURL: `http://127.0.0.1:${PORT}`,
    defaultViewport: null
  });

  const pages = await browser.pages();
  const sheetPage = pages.find(p => p.url().includes("docs.google.com/spreadsheets"));
  if (!sheetPage) {
    console.error("❌ No Google Sheets tab found open in Chrome!");
    await browser.disconnect();
    return;
  }

  console.log(`🎯 Found Google Sheets tab: "${await sheetPage.title()}"`);
  await sheetPage.bringToFront();
  await sleep(1500);

  // Grant clipboard write permissions
  const context = browser.defaultBrowserContext();
  await context.overridePermissions(sheetPage.url(), ["clipboard-write", "clipboard-read"]);

  // Write TSV to clipboard inside the page context
  console.log("📋 Copying prospects TSV data to clipboard...");
  await sheetPage.evaluate(async (text) => {
    await navigator.clipboard.writeText(text);
  }, tsvContent);
  await sleep(1000);

  // Focus cell A1 using OS-agnostic Arrow keys
  console.log("⌨️ Selecting cell A1 in Google Sheets...");
  // Escape edit mode
  await sheetPage.keyboard.press("Escape");
  await sleep(400);
  
  // Press ArrowUp 30 times to reach row 1
  for (let i = 0; i < 30; i++) {
    await sheetPage.keyboard.press("ArrowUp");
    await sleep(20);
  }
  // Press ArrowLeft 15 times to reach column A
  for (let i = 0; i < 15; i++) {
    await sheetPage.keyboard.press("ArrowLeft");
    await sleep(20);
  }
  await sleep(500);

  // Press Command + V to paste
  console.log("📋 Pasting data into Google Sheets...");
  await sheetPage.keyboard.down("Meta");
  await sheetPage.keyboard.press("v");
  await sheetPage.keyboard.up("Meta");

  console.log("⏳ Waiting for paste completion...");
  await sleep(5000);

  console.log("✅ Data successfully pasted to Google Sheets!");
  await browser.disconnect();
}

main().catch(err => console.error("❌ Error pasting data:", err));
