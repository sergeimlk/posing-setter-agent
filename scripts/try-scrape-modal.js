const { chromium } = require("playwright-core");

const PORT = 9222;

async function main() {
  try {
    const res = await fetch(`http://127.0.0.1:${PORT}/json/version`);
    const data = await res.json();
    const wsUrl = data.webSocketDebuggerUrl;
    console.log("Connecting directly to WebSocket URL:", wsUrl);
    
    const browser = await chromium.connectOverCDP(wsUrl);
    const contexts = browser.contexts();
    const pages = contexts[0].pages();
    const page = pages.find(p => p.url().includes("instagram.com"));
    
    if (!page) {
      console.log("❌ No Instagram page found!");
      await browser.close();
      return;
    }
    
    console.log("✅ Connected to Instagram page:", page.url());
    
    // Let's scrape the followers list
    const scrapedInfo = await page.evaluate(() => {
      // Find the followers dialog. Usually has a role="dialog" or a scrollable list
      const dialog = document.querySelector('div[role="dialog"]');
      if (!dialog) {
        return { error: "Followers dialog not found in the DOM" };
      }
      
      const rows = [];
      // Look for follower list items
      // They typically contain a button with text "Supprimer" or "Suivre" or similar
      const listItems = dialog.querySelectorAll('div');
      
      // Let's extract all profile links inside the dialog
      const anchors = Array.from(dialog.querySelectorAll('a[href*="/"]'));
      const uniqueUsers = new Map();
      
      anchors.forEach(a => {
        const href = a.getAttribute("href");
        const username = href.replace(/\//g, "").trim();
        // Skip links that are not usernames
        if (!username || username === "explore" || username === "direct" || username === "notifications" || username === "profile") {
          return;
        }
        
        // Find text content and sibling info
        const text = a.textContent.trim();
        if (text && text === username) {
          // It's a username link! Let's find the associated container to get full name and avatar image
          let parent = a.parentElement;
          let avatarSrc = "";
          let fullName = "";
          let buttonText = "";
          
          // Go up to find the row container (usually has a button)
          for (let i = 0; i < 6; i++) {
            if (parent) {
              const img = parent.querySelector('img');
              if (img && !avatarSrc) {
                avatarSrc = img.src;
              }
              const btn = parent.querySelector('button');
              if (btn && !buttonText) {
                buttonText = btn.textContent.trim();
              }
              parent = parent.parentElement;
            }
          }
          
          uniqueUsers.set(username, {
            username,
            avatar: avatarSrc,
            buttonText
          });
        }
      });
      
      return {
        count: uniqueUsers.size,
        users: Array.from(uniqueUsers.values())
      };
    });
    
    console.log("Scraped Followers:", JSON.stringify(scrapedInfo, null, 2));
    await browser.close();
  } catch (err) {
    console.error("❌ Error running script:", err.message);
  }
}

main();
