const { chromium } = require("playwright-core");

const PORT = 9222;
const SHEET_URL = "https://docs.google.com/spreadsheets/d/1afeUsmftVlJhN4sh83MlcRQxFTnx3JZ3B-UhoYthf60/edit";

const prospects = [
  ["Date d'Ajout", "Pseudo Instagram", "Score Qualification (0-100)", "Catégorie", "Étape Hans", "Pertinence (Étoiles)", "Propension d'Achat (Étoiles)", "Fédération", "Catégorie Body", "Date Compétition", "Notes / Douleurs"],
  ["12/07/2026", "lvcxs_itl", "90", "hot", "4", "5", "4", "IFBB", "Classic Physique", "Octobre 2026", "Physique très prometteur (Classic). Échange de DMs entamé sur ses quarts de tour. Difficultés sur double biceps de dos."],
  ["12/07/2026", "vuckro", "85", "hot", "3", "5", "4", "WNBF", "Classic Physique", "Novembre 2026", "Valentin Vuckovic. Athlète naturel. Très intéressé par le posing pour valoriser sa ligne classique."],
  ["12/07/2026", "maelledeltour", "75", "principal", "2", "4", "3", "N/A", "Bikini Fitness", "Décembre 2026", "Suit le compte de Manael pour des conseils généraux. Potentiel de closing modéré."],
  ["12/07/2026", "jimboaww", "70", "principal", "1", "4", "3", "N/A", "Men's Physique", "N/A", "Abonné récent. Interaction sur une story d'entraînement."],
  ["12/07/2026", "nodaysoffffffff", "68", "tiede", "1", "3", "3", "N/A", "Bodybuilding", "N/A", "Nassim. Passionné de musculation, regarde le contenu éducatif de Posing Empire."]
];

async function main() {
  console.log("🔍 Connecting to Chrome on port 9222...");
  let browser;
  try {
    browser = await chromium.connectOverCDP(`http://127.0.0.1:${PORT}`);
    console.log("✅ Connected successfully!");
  } catch (error) {
    console.error("❌ Failed to connect to Chrome:", error.message);
    process.exit(1);
  }

  const contexts = browser.contexts();
  const page = await contexts[0].newPage();

  console.log("Navigating to Google Sheets...");
  await page.goto(SHEET_URL, { waitUntil: "load", timeout: 60000 });
  await page.waitForTimeout(6000); // Wait for Sheets to fully render

  console.log("Locating the grid canvas...");
  // Google Sheets renders the cells on a canvas with class 'grid-canvas'
  // Clicking the canvas at A1 position (top-left)
  await page.click(".grid-canvas", { position: { x: 50, y: 50 } });
  await page.waitForTimeout(500);

  // Let's write the rows by simulating keyboard typing and navigation!
  for (let r = 0; r < prospects.length; r++) {
    const row = prospects[r];
    console.log(`Writing row ${r + 1}/${prospects.length}...`);
    for (let c = 0; c < row.length; c++) {
      const text = row[c];
      
      // Press Enter to edit, type, then Tab
      await page.keyboard.press("Enter");
      await page.keyboard.type(text, { delay: 10 });
      await page.keyboard.press("Tab");
      await page.waitForTimeout(100);
    }
    // At the end of the row, move to the beginning of the next row
    // Press Enter to go down, then left multiple times or Home
    await page.keyboard.press("Enter");
    for (let i = 0; i < row.length; i++) {
      await page.keyboard.press("ArrowLeft");
    }
    await page.waitForTimeout(200);
  }

  console.log("Renaming the sheet tab to 'Prospects Qualifiés'...");
  // Double click the first sheet tab at the bottom to rename it
  // In French Google Sheets, it is usually called 'Feuille 1' or 'Sheet1'
  // We can find the element containing 'Feuille 1' or the active tab
  const tab = page.locator(".docs-sheet-tab-name").first();
  if (await tab.count() > 0) {
    await tab.dblclick();
    await page.waitForTimeout(500);
    await page.keyboard.type("Prospects Qualifiés", { delay: 20 });
    await page.keyboard.press("Enter");
    console.log("Sheet renamed successfully!");
  }

  console.log("Taking screenshot of the completed sheet...");
  const screenshotPath = "/Users/mily/.gemini/antigravity-ide/brain/8192c64f-e389-48d8-aaf4-66126c3082f2/sheet_populated.png";
  await page.screenshot({ path: screenshotPath });
  console.log("Screenshot saved at:", screenshotPath);

  await page.close();
  await browser.close();
}

main();
