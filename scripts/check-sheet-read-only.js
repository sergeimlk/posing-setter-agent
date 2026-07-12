const puppeteer = require("puppeteer-core");

async function main() {
  const browser = await puppeteer.connect({
    browserURL: "http://127.0.0.1:9222",
    defaultViewport: null
  });
  
  const pages = await browser.pages();
  let page = pages.find(p => p.url().includes("docs.google.com/spreadsheets"));
  
  if (!page) {
    page = await browser.newPage();
    await page.goto("https://docs.google.com/spreadsheets/d/1afeUsmftVlJhN4sh83MlcRQxFTnx3JZ3B-UhoYthf60/edit", { waitUntil: "networkidle2" });
  }
  
  const bodyText = await page.evaluate(() => document.body.innerText);
  console.log("Is 'Lecture seule' or 'View only' on page?", bodyText.includes("Lecture seule") || bodyText.includes("View only") || bodyText.includes("Affichage uniquement"));
  console.log("Is there a 'Se connecter' or 'Sign in' button?", bodyText.includes("Se connecter") || bodyText.includes("Sign in"));
  
  // Check if we can find any class related to read-only
  const hasReadOnlyClass = await page.evaluate(() => {
    return !!document.querySelector('.docs-sheet-readonly') || !!document.querySelector('.docs-sheet-viewonly');
  });
  console.log("Has read-only class?", hasReadOnlyClass);
  
  await browser.disconnect();
}

main().catch(err => console.error(err));
