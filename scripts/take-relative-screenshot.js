const puppeteer = require("puppeteer-core");

async function main() {
  const browser = await puppeteer.connect({
    browserURL: "http://127.0.0.1:9222",
    defaultViewport: null
  });
  
  const pages = await browser.pages();
  let page = pages.find(p => p.url().includes("docs.google.com/spreadsheets"));
  
  if (page) {
    console.log("Found active sheet page:", page.url());
    await page.bringToFront();
    await page.screenshot({ path: "./sheet_success_typed.png" });
    console.log("✅ Screenshot saved to project root: sheet_success_typed.png");
  } else {
    console.log("❌ Sheet page not found!");
  }
  
  await browser.disconnect();
}

main().catch(err => console.error(err));
