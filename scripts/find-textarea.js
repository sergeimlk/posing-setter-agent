const puppeteer = require("puppeteer-core");

async function main() {
  const browser = await puppeteer.connect({
    browserURL: "http://127.0.0.1:9222",
    defaultViewport: null
  });
  
  const pages = await browser.pages();
  let page = pages.find(p => p.url().includes("docs.google.com/spreadsheets"));
  
  if (page) {
    const elements = await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll("input, textarea")).map(el => ({
        tagName: el.tagName,
        className: el.className,
        id: el.id,
        visible: el.offsetWidth > 0 && el.offsetHeight > 0
      }));
      return inputs;
    });
    console.log("Inputs and Textareas found on page:", elements);
  } else {
    console.log("Sheet page not found!");
  }
  
  await browser.disconnect();
}

main().catch(err => console.error(err));
