const puppeteer = require("puppeteer-core");
const fs = require("fs");
const path = require("path");

const PORT = 9222;
const AVATAR_DIR = path.join(__dirname, "../public/avatars");
const DATA_FILE = path.join(__dirname, "../src/data/instagram-data.json");

const usernames = [
  "lvcxs_itl",
  "vuckro",
  "maelledeltour",
  "jimboaww",
  "nodaysoffffffff"
];

const sleep = ms => new Promise(res => setTimeout(res, ms));

async function main() {
  if (!fs.existsSync(AVATAR_DIR)) {
    fs.mkdirSync(AVATAR_DIR, { recursive: true });
  }

  console.log("🔍 Connecting to Chrome via CDP on port 9222...");
  const browser = await puppeteer.connect({
    browserURL: `http://127.0.0.1:${PORT}`,
    defaultViewport: null
  });
  console.log("✅ Connected successfully!");

  const pages = await browser.pages();
  // Find or create a page
  let page = pages.find(p => p.url().includes("instagram.com"));
  if (!page) {
    page = await browser.newPage();
  }

  // Load current data
  let currentData = { prospects: [] };
  if (fs.existsSync(DATA_FILE)) {
    currentData = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  }

  for (const username of usernames) {
    console.log(`👤 Scraping profile picture for @${username}...`);
    try {
      await page.goto(`https://www.instagram.com/${username}/`, { waitUntil: "networkidle2", timeout: 30000 });
      await sleep(3000); // Let page settle
      
      // Look for the profile image inside the header
      const imgSrc = await page.evaluate(() => {
        const header = document.querySelector("header");
        if (!header) return null;
        const img = header.querySelector("img");
        return img ? img.src : null;
      });

      if (imgSrc) {
        console.log(`   Found image URL: ${imgSrc.substring(0, 60)}...`);
        
        // Download the image using page.evaluate to fetch it as base64
        const base64Data = await page.evaluate(async (url) => {
          const res = await fetch(url);
          const blob = await res.blob();
          return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result.split(',')[1]);
            reader.readAsDataURL(blob);
          });
        }, imgSrc);

        const imgPath = path.join(AVATAR_DIR, `${username}.jpg`);
        fs.writeFileSync(imgPath, Buffer.from(base64Data, "base64"));
        console.log(`   ✅ Saved avatar to public/avatars/${username}.jpg`);

        // Update in JSON
        const prospect = currentData.prospects.find(p => p.handle === username);
        if (prospect) {
          prospect.avatar = `/avatars/${username}.jpg`;
        }
      } else {
        console.log(`   ⚠️ No profile picture img found in header for @${username}`);
      }
    } catch (err) {
      console.error(`   ❌ Error fetching @${username}:`, err.message);
    }
  }

  fs.writeFileSync(DATA_FILE, JSON.stringify(currentData, null, 2), "utf8");
  console.log("🎉 Avatar download run completed!");
  await browser.disconnect();
}

main().catch(err => console.error("❌ Puppeteer Error:", err));
