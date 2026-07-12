const puppeteer = require("puppeteer-core");
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const PORT = 9222;
const SHEET_URL = "https://docs.google.com/spreadsheets/d/1afeUsmftVlJhN4sh83MlcRQxFTnx3JZ3B-UhoYthf60/edit";

const csvData = `Date d'Ajout\tPseudo Instagram\tScore Qualification (0-100)\tCatégorie\tÉtape Hans\tPertinence (Étoiles)\tPropension d'Achat (Étoiles)\tFédération\tCatégorie Body\tDate Compétition\tNotes / Douleurs
12/07/2026\tlvcxs_itl\t90\thot\t4\t5\t4\tIFBB\tClassic Physique\tOctobre 2026\tPhysique très prometteur (Classic). Échange de DMs entamé sur ses quarts de tour. Difficultés sur double biceps de dos.
12/07/2026\tvuckro\t85\thot\t3\t5\t4\tWNBF\tClassic Physique\tNovembre 2026\tValentin Vuckovic. Athlète naturel. Très intéressé par le posing pour valoriser sa ligne classique.
12/07/2026\tmaelledeltour\t75\tprincipal\t2\t4\t3\tN/A\tBikini Fitness\tDécembre 2026\tSuit le compte de Manael pour des conseils généraux. Potentiel de closing modéré.
12/07/2026\tjimboaww\t70\tprincipal\t1\t4\t3\tN/A\tMen's Physique\tN/A\tAbonné réel récent. Interaction sur une story d'entraînement.
12/07/2026\tnodaysoffffffff\t68\ttiede\t1\t3\t3\tN/A\tBodybuilding\tN/A\tNassim. Passionné de musculation, regarde le contenu éducatif de Posing Empire.`;

async function main() {
  console.log("📋 Copying CSV data to macOS clipboard...");
  const tempFile = path.join(__dirname, "temp_tsv.txt");
  fs.writeFileSync(tempFile, csvData, "utf8");
  execSync(`cat "${tempFile}" | pbcopy`);
  fs.unlinkSync(tempFile);
  console.log("   Clipboard populated.");

  console.log("🔍 Connecting to Chrome via CDP on port 9222...");
  const browser = await puppeteer.connect({
    browserURL: `http://127.0.0.1:${PORT}`,
    defaultViewport: null
  });
  console.log("✅ Connected to Chrome successfully!");

  const pages = await browser.pages();
  let page = pages.find(p => p.url().includes("docs.google.com/spreadsheets"));
  
  if (!page) {
    console.log("🌐 Opening Google Sheet in a new tab...");
    page = await browser.newPage();
    await page.goto(SHEET_URL, { waitUntil: "networkidle2" });
  } else {
    console.log("📊 Existing Google Sheet tab found.");
    await page.bringToFront();
  }

  console.log("Waiting 8 seconds for Sheet interface to be fully active...");
  await page.waitForTimeout(8000);

  console.log("Clicking cell A1 (position x=150, y=100) on the grid canvas...");
  // Clicking cell A1 (offset from row/col headers)
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

  console.log("Sending Command+V to paste the TSV data...");
  await page.keyboard.down("Meta");
  await page.keyboard.press("v");
  await page.keyboard.up("Meta");
  await page.waitForTimeout(2000);

  console.log("Renaming active tab to 'Prospects Qualifiés'...");
  const tabSelector = '.docs-sheet-tab-name';
  const tabs = await page.$$(tabSelector);
  if (tabs.length > 0) {
    console.log("   Found tab, double clicking to rename...");
    await tabs[0].click({ clickCount: 2 });
    await page.waitForTimeout(500);
    // Select all existing text in rename box and type new name
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
  const screenshotPath = "/Users/mily/Documents/MANAEL/TEAM PE SKOOL/posing-setter-agent/public/sheet_success.png";
  await page.screenshot({ path: screenshotPath });
  console.log("✅ Screenshot saved to public/sheet_success.png");

  await browser.disconnect();
  console.log("🎉 Google Sheets CRM populated successfully!");
}

main().catch(err => console.error("❌ Puppeteer Error:", err));
