const puppeteer = require("puppeteer-core");

const PORT = 9222;

async function main() {
  const browser = await puppeteer.connect({
    browserURL: `http://127.0.0.1:${PORT}`
  });

  const pages = await browser.pages();
  const page = pages.find(p => p.url().includes("instagram.com"));
  if (!page) {
    console.log("❌ No Instagram page open!");
    await browser.disconnect();
    return;
  }

  console.log("🌐 Navigating to Instagram Home...");
  await page.goto("https://www.instagram.com/", { waitUntil: "networkidle2", timeout: 30000 });
  await new Promise(r => setTimeout(r, 6000));
  
  console.log(`✅ Navigation completed! URL: "${page.url()}", Title: "${await page.title()}"`);
  await browser.disconnect();
}

main().catch(err => console.error(err));
