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

  console.log("🔄 Reloading Instagram page...");
  await page.reload({ waitUntil: "networkidle2" });
  await new Promise(r => setTimeout(r, 6000));
  
  console.log(`✅ Reload completed! New Title: "${await page.title()}"`);
  await browser.disconnect();
}

main().catch(err => console.error(err));
