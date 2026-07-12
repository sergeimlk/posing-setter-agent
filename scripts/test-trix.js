const puppeteer = require("puppeteer-core");

async function main() {
  const browser = await puppeteer.connect({
    browserURL: "http://127.0.0.1:9222",
    defaultViewport: null
  });
  
  const pages = await browser.pages();
  let page = pages.find(p => p.url().includes("docs.google.com/spreadsheets"));
  
  if (page) {
    console.log("Found active sheet page.");
    await page.bringToFront();
    
    console.log("Clicking cell A1...");
    await page.click(".grid-canvas", { x: 150, y: 100 });
    await page.waitForTimeout(500);
    
    console.log("Focusing .trix-offscreen...");
    await page.focus(".trix-offscreen");
    await page.waitForTimeout(500);
    
    console.log("Typing 'TestType' via page.keyboard...");
    await page.keyboard.type("TestType");
    await page.keyboard.press("Enter");
    
    await page.waitForTimeout(2000);
    console.log("Taking screenshot to check if typed...");
    await page.screenshot({ path: "./sheet_success_trix.png" });
  } else {
    console.log("Sheet page not found!");
  }
  
  await browser.disconnect();
}

main().catch(err => console.error(err));
