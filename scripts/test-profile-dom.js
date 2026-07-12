const puppeteer = require("puppeteer-core");
const path = require("path");

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

  console.log("🌐 Navigating to @romain_strml profile to test selectors...");
  await page.goto("https://www.instagram.com/romain_strml/", { waitUntil: "networkidle2" });
  await new Promise(r => setTimeout(r, 3000));

  const profileInfo = await page.evaluate(() => {
    // Let's get header elements
    const header = document.querySelector("header");
    if (!header) return { error: "Header not found" };

    const textContent = header.innerText;
    
    // Find all spans inside the header
    const spans = Array.from(header.querySelectorAll("span")).map(s => s.textContent.trim());

    // Find links in header
    const links = Array.from(header.querySelectorAll("a")).map(a => ({
      text: a.textContent.trim(),
      href: a.getAttribute("href")
    }));

    // Find images in header
    const img = header.querySelector("img");
    const imgSrc = img ? img.src : "none";

    return {
      textContent,
      spans: spans.slice(0, 30),
      links,
      imgSrc
    };
  });

  console.log("Profile Scraped Info:", JSON.stringify(profileInfo, null, 2));
  await browser.disconnect();
}

main().catch(err => console.error(err));
