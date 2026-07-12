const puppeteer = require("puppeteer-core");

const PORT = 9222;

async function main() {
  const browser = await puppeteer.connect({
    browserURL: `http://127.0.0.1:${PORT}`,
    defaultViewport: null
  });

  const pages = await browser.pages();
  const page = pages.find(p => p.url().includes("instagram.com"));
  if (!page) {
    console.log("❌ No Instagram page open!");
    await browser.disconnect();
    return;
  }

  const links = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('a')).map(a => ({
      href: a.href,
      text: a.textContent.trim(),
      className: a.className
    }));
  });

  console.log("Found Links:", JSON.stringify(links, null, 2));
  await browser.disconnect();
}

main().catch(err => console.error(err));
