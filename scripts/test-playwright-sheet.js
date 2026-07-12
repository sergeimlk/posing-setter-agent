const { chromium } = require("playwright-core");

async function main() {
  try {
    console.log("Connecting to Chrome on port 9222...");
    const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
    
    // Get first context
    const contexts = browser.contexts();
    if (contexts.length === 0) {
      throw new Error("No active browser contexts found. Make sure Chrome is open.");
    }
    const page = await contexts[0].newPage();
    
    console.log("Navigating to Sheet...");
    await page.goto("https://docs.google.com/spreadsheets/d/1afeUsmftVlJhN4sh83MlcRQxFTnx3JZ3B-UhoYthf60/edit", {
      timeout: 60000,
      waitUntil: "load"
    });
    
    console.log("Waiting 5 seconds for Sheet UI to render...");
    await page.waitForTimeout(5000);
    
    console.log("Taking screenshot...");
    const screenshotPath = "/Users/mily/.gemini/antigravity-ide/brain/8192c64f-e389-48d8-aaf4-66126c3082f2/sheet_view.png";
    await page.screenshot({ path: screenshotPath });
    console.log("Screenshot saved at:", screenshotPath);
    
    await page.close();
    await browser.close();
  } catch (err) {
    console.error("Playwright CDP error:", err);
  }
}

main();
