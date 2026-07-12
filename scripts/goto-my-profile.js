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

  console.log("🖱️ Clicking profile link in sidebar...");
  const clicked = await page.evaluate(() => {
    // Find all links containing the profile keyword or matching the profile link pattern
    const links = Array.from(document.querySelectorAll('a'));
    // Profile links are usually like /username/
    const profileLink = links.find(a => {
      const href = a.getAttribute("href") || "";
      return href.includes("manael.posing") || href.includes("posingempire") || (href.startsWith("/") && href.split('/').filter(Boolean).length === 1 && a.querySelector('img'));
    });
    if (profileLink) {
      profileLink.click();
      return { success: true, href: profileLink.getAttribute("href") };
    }
    return { success: false };
  });

  console.log("Click result:", clicked);
  await new Promise(r => setTimeout(r, 6000));
  console.log(`✅ Navigation result: URL: "${page.url()}", Title: "${await page.title()}"`);
  await browser.disconnect();
}

main().catch(err => console.error(err));
