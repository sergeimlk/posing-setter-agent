const { chromium } = require("playwright-core");
const fs = require("fs");
const path = require("path");

const DATA_FILE = path.join(__dirname, "../src/data/instagram-data.json");
const PORT = 9222;

const USERNAMES = [
  "lvcxs_itl",
  "vuckro",
  "maelledeltour",
  "jimboaww",
  "nodaysoffffffff"
];

async function main() {
  console.log("🔍 Connecting to Chrome on port 9222...");
  let browser;
  try {
    browser = await chromium.connectOverCDP(`http://127.0.0.1:${PORT}`);
    console.log("✅ Connected to Chrome successfully!");
  } catch (error) {
    console.error("❌ Failed to connect to Chrome. Make sure it's running with --remote-debugging-port=9222");
    process.exit(1);
  }

  const contexts = browser.contexts();
  if (contexts.length === 0) {
    console.error("No browser contexts found.");
    await browser.close();
    process.exit(1);
  }

  const context = contexts[0];
  const page = await context.newPage();
  
  // Read current data
  let currentData = { prospects: [], chatUsers: [] };
  if (fs.existsSync(DATA_FILE)) {
    currentData = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  }

  const updatedProspects = [];

  for (const username of USERNAMES) {
    console.log(`👤 Scraping profile picture for @${username}...`);
    try {
      await page.goto(`https://www.instagram.com/${username}/`, { waitUntil: "networkidle", timeout: 30000 });
      await page.waitForTimeout(3000); // Wait for images to load
      
      // Select profile picture image
      // Instagram uses alt="Photo de profil de ..." or similar, or class or header img
      const imgSelector = 'header img';
      const imgSrc = await page.$eval(imgSelector, el => el.src).catch(() => null);
      
      console.log(`   URL Image : ${imgSrc ? imgSrc.substring(0, 80) + "..." : "Non trouvée"}`);
      
      // Find existing prospect details to preserve them
      const existing = currentData.prospects.find(p => p.handle === username) || {};
      
      updatedProspects.push({
        handle: username,
        score: existing.score || 70,
        category: existing.category || "principal",
        hansStep: existing.hansStep || 1,
        pertinence: existing.pertinence || 4,
        propension: existing.propension || 3,
        federation: existing.federation || "N/A",
        categoryBody: existing.categoryBody || "Classic Physique",
        compDate: existing.compDate || "N/A",
        notes: existing.notes || "Abonné réel Instagram.",
        avatar: imgSrc || existing.avatar || "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=150&h=150&fit=crop&crop=faces"
      });
    } catch (err) {
      console.error(`❌ Error scraping @${username}:`, err.message);
      // Keep existing
      const existing = currentData.prospects.find(p => p.handle === username);
      if (existing) updatedProspects.push(existing);
    }
  }

  currentData.prospects = updatedProspects;
  currentData.lastSync = new Date().toISOString();

  fs.writeFileSync(DATA_FILE, JSON.stringify(currentData, null, 2), "utf8");
  console.log("🎉 Real profile pictures scraped and saved successfully!");

  await page.close();
  await browser.close();
}

main();
