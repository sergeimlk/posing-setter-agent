const { chromium } = require("playwright-core");

async function main() {
  console.log("Launching Chromium...");
  const browser = await chromium.launch({
    headless: true,
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
  });
  const page = await browser.newPage();
  
  console.log("Navigating to Sheet...");
  await page.goto("https://docs.google.com/spreadsheets/d/1afeUsmftVlJhN4sh83MlcRQxFTnx3JZ3B-UhoYthf60/edit?usp=sharing", {
    waitUntil: "networkidle",
    timeout: 30000
  });
  
  await page.waitForTimeout(5000);
  
  const screenshotPath = "/Users/mily/.gemini/antigravity-ide/brain/8192c64f-e389-48d8-aaf4-66126c3082f2/sheet_page_state.png";
  await page.screenshot({ path: screenshotPath });
  console.log("Screenshot saved at:", screenshotPath);
  
  await browser.close();
}

main().catch(err => console.error(err));
