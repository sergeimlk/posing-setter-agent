const puppeteer = require("puppeteer-core");

const PORT = 9222;

async function main() {
  const browser = await puppeteer.connect({
    browserURL: `http://127.0.0.1:${PORT}`
  });

  const pages = await browser.pages();
  console.log("Total pages:", pages.length);
  for (let i = 0; i < pages.length; i++) {
    const p = pages[i];
    console.log(`Page #${i}: URL="${p.url()}" TITLE="${await p.title()}"`);
    if (p.url().includes("instagram.com")) {
      const html = await p.content();
      console.log(`   HTML Length: ${html.length}`);
      console.log(`   HTML preview:`, html.substring(0, 1000));
    }
  }
  await browser.disconnect();
}

main().catch(err => console.error(err));
