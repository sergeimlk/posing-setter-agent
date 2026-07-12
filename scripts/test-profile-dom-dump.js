const puppeteer = require("puppeteer-core");

const PORT = 9222;

async function main() {
  console.log("🔍 Connecting to Chrome...");
  const browser = await puppeteer.connect({
    browserURL: `http://127.0.0.1:${PORT}`,
    defaultViewport: null
  });

  const pages = await browser.pages();
  let page = pages.find(p => p.url().includes("instagram.com"));
  if (!page) {
    page = await browser.newPage();
  }

  console.log("🌐 Page URL is currently:", page.url());
  const bodyText = await page.evaluate(() => {
    return document.body ? document.body.innerText.substring(0, 1000) : "No body element";
  });
  
  console.log("Dump of body text (first 1000 chars):", bodyText);
  await browser.disconnect();
}

main().catch(err => console.error(err));
