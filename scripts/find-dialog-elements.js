const { chromium } = require("playwright-core");

const PORT = 9222;

async function main() {
  try {
    const res = await fetch(`http://127.0.0.1:${PORT}/json/version`);
    const data = await res.json();
    const wsUrl = data.webSocketDebuggerUrl;
    
    const browser = await chromium.connectOverCDP(wsUrl);
    const contexts = browser.contexts();
    const pages = contexts[0].pages();
    const page = pages.find(p => p.url().includes("instagram.com"));
    
    if (!page) {
      console.log("❌ No Instagram page found!");
      await browser.close();
      return;
    }
    
    // Let's print out all divs with overflow-y: scroll or text containing "Rechercher"
    const info = await page.evaluate(() => {
      const results = [];
      
      // Let's search for the "Rechercher" input placeholder or text
      const searchInput = document.querySelector('input[placeholder*="Rechercher"]');
      if (searchInput) {
        results.push({
          foundSearchInput: true,
          parentHTML: searchInput.parentElement?.parentElement?.innerHTML?.substring(0, 500)
        });
      }
      
      // Find all buttons containing "Supprimer"
      const buttons = Array.from(document.querySelectorAll('button, [role="button"]'));
      const deleteButtons = buttons.filter(b => b.textContent.includes("Supprimer") || b.textContent.includes("Suivre"));
      
      results.push({
        deleteButtonsCount: deleteButtons.length,
        buttonsText: deleteButtons.slice(0, 10).map(b => b.textContent.trim())
      });
      
      // Get all list items or divs that contain a user profile link
      const links = Array.from(document.querySelectorAll('a[href*="/"]'));
      const profileLinks = links.filter(l => {
        const href = l.getAttribute("href");
        return href && href.split('/').filter(Boolean).length === 1; // e.g. /curtis.rdp/
      });
      
      results.push({
        profileLinksCount: profileLinks.length,
        sampleLinks: profileLinks.slice(0, 10).map(l => ({
          href: l.getAttribute("href"),
          text: l.textContent.trim()
        }))
      });
      
      return results;
    });
    
    console.log("DOM Search Info:", JSON.stringify(info, null, 2));
    await browser.close();
  } catch (err) {
    console.error("❌ Error running script:", err.message);
  }
}

main();
