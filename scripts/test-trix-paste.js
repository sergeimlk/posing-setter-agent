const puppeteer = require("puppeteer-core");

const PORT = 9222;
const SHEET_URL = "https://docs.google.com/spreadsheets/d/1afeUsmftVlJhN4sh83MlcRQxFTnx3JZ3B-UhoYthf60/edit";

const csvData = `Date d'Ajout\tPseudo Instagram\tScore Qualification (0-100)\tCatégorie\tÉtape Hans\tPertinence (Étoiles)\tPropension d'Achat (Étoiles)\tFédération\tCatégorie Body\tDate Compétition\tNotes / Douleurs
12/07/2026\tlvcxs_itl\t90\thot\t4\t5\t4\tIFBB\tClassic Physique\tOctobre 2026\tPhysique très prometteur (Classic). Échange de DMs entamé sur ses quarts de tour. Difficultés sur double biceps de dos.
12/07/2026\tvuckro\t85\thot\t3\t5\t4\tWNBF\tClassic Physique\tNovembre 2026\tValentin Vuckovic. Athlète naturel. Très intéressé par le posing pour valoriser sa ligne classique.
12/07/2026\tmaelledeltour\t75\tprincipal\t2\t4\t3\tN/A\tBikini Fitness\tDécembre 2026\tSuit le compte de Manael pour des conseils généraux. Potentiel de closing modéré.
12/07/2026\tjimboaww\t70\tprincipal\t1\t4\t3\tN/A\tMen's Physique\tN/A\tAbonné réel récent. Interaction sur une story d'entraînement.
12/07/2026\tnodaysoffffffff\t68\ttiede\t1\t3\t3\tN/A\tBodybuilding\tN/A\tNassim. Passionné de musculation, regarde le contenu éducatif de Posing Empire.`;

async function main() {
  const browser = await puppeteer.connect({
    browserURL: `http://127.0.0.1:${PORT}`,
    defaultViewport: null
  });
  console.log("✅ Connected successfully!");

  const pages = await browser.pages();
  let page = pages.find(p => p.url().includes("/spreadsheets/d/") && p.url().includes("/edit"));
  
  if (page) {
    console.log("Active sheet page found:", page.url());
    await page.bringToFront();
    
    console.log("Clicking cell A1...");
    await page.click(".grid-canvas", { x: 150, y: 100 });
    await page.waitForTimeout(500);

    console.log("Dispatching paste event on trix-offscreen...");
    const pasteSuccess = await page.evaluate((data) => {
      const textarea = document.querySelector('.trix-offscreen');
      if (!textarea) return false;
      textarea.focus();
      
      const clipboardData = new DataTransfer();
      clipboardData.setData('text/plain', data);
      
      const pasteEvent = new ClipboardEvent('paste', {
        bubbles: true,
        cancelable: true,
        clipboardData: clipboardData
      });
      
      textarea.dispatchEvent(pasteEvent);
      return true;
    }, csvData);

    console.log("Paste dispatched:", pasteSuccess);
    await page.waitForTimeout(3000); // Wait for Sheets to process the paste
    
    console.log("Taking screenshot to check...");
    await page.screenshot({ path: "./sheet_success_trix_paste.png" });
  } else {
    console.log("Sheet page not found!");
  }
  
  await browser.disconnect();
}

main().catch(err => console.error(err));
