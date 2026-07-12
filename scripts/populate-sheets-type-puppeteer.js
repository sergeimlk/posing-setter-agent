const puppeteer = require("puppeteer-core");

const PORT = 9222;
const SHEET_URL = "https://docs.google.com/spreadsheets/d/1afeUsmftVlJhN4sh83MlcRQxFTnx3JZ3B-UhoYthf60/edit";

const prospects = [
  ["Date d'Ajout", "Pseudo Instagram", "Score Qualification (0-100)", "Catégorie", "Étape Hans", "Pertinence (Étoiles)", "Propension d'Achat (Étoiles)", "Fédération", "Catégorie Body", "Date Compétition", "Notes / Douleurs"],
  ["12/07/2026", "lvcxs_itl", "90", "hot", "4", "5", "4", "IFBB", "Classic Physique", "Octobre 2026", "Physique très prometteur (Classic). Échange de DMs entamé sur ses quarts de tour. Difficultés sur double biceps de dos."],
  ["12/07/2026", "vuckro", "85", "hot", "3", "5", "4", "WNBF", "Classic Physique", "Novembre 2026", "Valentin Vuckovic. Athlète naturel. Très intéressé par le posing pour valoriser sa ligne classique."],
  ["12/07/2026", "maelledeltour", "75", "principal", "2", "4", "3", "N/A", "Bikini Fitness", "Décembre 2026", "Suit le compte de Manael pour des conseils généraux. Potentiel de closing modéré."],
  ["12/07/2026", "jimboaww", "70", "principal", "1", "4", "3", "N/A", "Men's Physique", "N/A", "Abonné réel récent. Interaction sur une story d'entraînement."],
  ["12/07/2026", "nodaysoffffffff", "68", "tiede", "1", "3", "3", "N/A", "Bodybuilding", "N/A", "Nassim. Passionné de musculation, regarde le contenu éducatif de Posing Empire."]
];

async function main() {
  console.log("🔍 Connecting to Chrome via CDP on port 9222...");
  const browser = await puppeteer.connect({
    browserURL: `http://127.0.0.1:${PORT}`,
    defaultViewport: null
  });
  console.log("✅ Connected successfully!");

  const pages = await browser.pages();
  // Filter precisely by "/spreadsheets/d/" to avoid matching workers or iframes
  let page = pages.find(p => p.url().includes("/spreadsheets/d/") && p.url().includes("/edit"));
  
  if (!page) {
    console.log("🌐 Opening Google Sheet in a new tab...");
    page = await browser.newPage();
    await page.goto(SHEET_URL, { waitUntil: "networkidle2" });
  } else {
    console.log("📊 Active Google Sheet tab found:", page.url());
    await page.bringToFront();
  }

  console.log("Waiting 6 seconds for Sheet interface...");
  await page.waitForTimeout(6000);

  console.log("Pressing Escape to dismiss any Workspace overlays...");
  await page.keyboard.press("Escape");
  await page.waitForTimeout(500);

  console.log("Focusing `.trix-offscreen` textarea...");
  // Focusing Sheets input catcher textarea
  await page.focus(".trix-offscreen").catch(() => console.log("   Could not focus .trix-offscreen directly."));
  
  console.log("Clicking cell A1 (position x=150, y=100) on the grid canvas...");
  await page.click(".grid-canvas", { x: 150, y: 100 });
  await page.waitForTimeout(500);

  // Clear existing content to be clean
  console.log("Clearing sheet content first...");
  await page.keyboard.down("Meta");
  await page.keyboard.press("a");
  await page.keyboard.up("Meta");
  await page.waitForTimeout(500);
  await page.keyboard.press("Backspace");
  await page.waitForTimeout(500);

  // Re-focus A1
  await page.click(".grid-canvas", { x: 150, y: 100 });
  await page.waitForTimeout(500);

  // Type cell by cell
  for (let r = 0; r < prospects.length; r++) {
    const row = prospects[r];
    console.log(`Writing row ${r + 1}/${prospects.length}...`);
    for (let c = 0; c < row.length; c++) {
      const text = row[c];
      
      // Press Enter to edit, type, then Tab
      await page.keyboard.press("Enter");
      await page.waitForTimeout(50);
      await page.keyboard.type(text, { delay: 5 });
      await page.keyboard.press("Tab");
      await page.waitForTimeout(50);
    }
    // Go down one row and return to column A
    await page.keyboard.press("Enter");
    for (let i = 0; i < row.length; i++) {
      await page.keyboard.press("ArrowLeft");
      await page.waitForTimeout(10);
    }
    await page.waitForTimeout(150);
  }

  console.log("Renaming active tab to 'Prospects Qualifiés'...");
  const tabSelector = '.docs-sheet-tab-name';
  const tabs = await page.$$(tabSelector);
  if (tabs.length > 0) {
    await tabs[0].click({ clickCount: 2 });
    await page.waitForTimeout(500);
    await page.keyboard.down("Meta");
    await page.keyboard.press("a");
    await page.keyboard.up("Meta");
    await page.keyboard.press("Backspace");
    await page.keyboard.type("Prospects Qualifiés");
    await page.keyboard.press("Enter");
    await page.waitForTimeout(1000);
    console.log("   Tab renamed successfully!");
  }

  console.log("Taking screenshot of Google Sheets to verify...");
  await page.screenshot({ path: "./sheet_success_typed.png" }).catch(() => {});

  await browser.disconnect();
  console.log("🎉 Google Sheets CRM populated successfully!");
}

main().catch(err => console.error("❌ Puppeteer Error:", err));
