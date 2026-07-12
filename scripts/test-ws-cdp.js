const { chromium } = require("playwright-core");

async function main() {
  try {
    const res = await fetch("http://127.0.0.1:9222/json/version");
    const data = await res.json();
    const wsUrl = data.webSocketDebuggerUrl;
    console.log("Connecting directly to WebSocket URL:", wsUrl);
    
    const browser = await chromium.connectOverCDP(wsUrl);
    console.log("✅ Success! Connected without errors!");
    const contexts = browser.contexts();
    console.log("Contexts count:", contexts.length);
    if (contexts.length > 0) {
      const pages = contexts[0].pages();
      console.log("Pages count:", pages.length);
      pages.forEach(p => console.log("Page URL:", p.url()));
    }
    await browser.close();
  } catch (err) {
    console.error("❌ Direct WS connection failed:", err.message);
  }
}

main();
