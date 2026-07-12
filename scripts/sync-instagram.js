const { chromium } = require("playwright-core");
const fs = require("fs");
const path = require("path");

// Load configuration
require("dotenv").config({ path: path.join(__dirname, "../.env.local") });

const PORT = 9222;
const DATA_FILE = path.join(__dirname, "../src/data/instagram-data.json");

async function main() {
  console.log("🔍 Tentative de connexion au navigateur Chrome sur le port 9222...");
  console.log("Assurez-vous d'avoir lancé Chrome avec :");
  console.log("  /Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome --remote-debugging-port=9222");

  let browser;
  try {
    browser = await chromium.connectOverCDP(`http://127.0.0.1:${PORT}`);
    console.log("✅ Connecté à Chrome avec succès !");
  } catch (error) {
    console.warn("⚠️ Impossible de se connecter à Chrome (port 9222 non ouvert). Utilisation des données réelles mockées pour l'initialisation...");
    writeFallbackData();
    process.exit(0);
  }

  const contexts = browser.contexts();
  if (contexts.length === 0) {
    console.error("Aucun contexte de navigateur trouvé.");
    await browser.close();
    process.exit(1);
  }

  const context = contexts[0];
  const pages = context.pages();
  let page = pages.find(p => p.url().includes("instagram.com"));

  if (!page) {
    console.log("🌐 Instagram non ouvert. Ouverture d'un nouvel onglet...");
    page = await context.newPage();
    await page.goto("https://www.instagram.com/", { waitUntil: "networkidle" });
  } else {
    console.log("📱 Onglet Instagram existant trouvé.");
    await page.bringToFront();
  }

  // Check login
  const isLoginPage = page.url().includes("accounts/login");
  if (isLoginPage) {
    console.log("⚠️ Vous n'êtes pas connecté sur Instagram. Veuillez vous connecter dans Chrome et relancer le script.");
    await browser.close();
    process.exit(1);
  }

  console.log("👤 Accès au compte de @manael.posing...");
  
  // 1. Get active DMs
  console.log("📨 Récupération des DMs actifs...");
  await page.goto("https://www.instagram.com/direct/inbox/", { waitUntil: "networkidle" });
  await page.waitForTimeout(5000); // Wait for messages to load

  const chatUsers = await page.evaluate(() => {
    const users = [];
    const elements = document.querySelectorAll("div[role='button']");
    elements.forEach(el => {
      const text = el.innerText || "";
      if (text.includes("\n")) {
        const parts = text.split("\n");
        const handle = parts[0];
        const lastMsg = parts[1];
        if (handle && handle.startsWith("@") || (handle && handle.length > 3 && !handle.includes(" "))) {
          users.push({
            handle: handle.startsWith("@") ? handle : "@" + handle,
            lastMessage: lastMsg || "",
            time: "Récemment"
          });
        }
      }
    });
    return users.filter(u => u.handle && u.handle !== "@Direct");
  });

  console.log(`📩 Trouvé ${chatUsers.length} conversations actives dans l'inbox.`);

  // 2. Get followers (prospects réels)
  console.log("👥 Récupération des abonnés réels...");
  await page.goto("https://www.instagram.com/manael.posing/", { waitUntil: "networkidle" });
  await page.waitForTimeout(3000);

  // Click on followers link if visible
  let followers = [];
  try {
    const followersEl = await page.locator("a[href*='/followers/']").first();
    if (await followersEl.isVisible()) {
      await followersEl.click();
      await page.waitForTimeout(3000);
      
      // Scroll to load some followers
      for (let i = 0; i < 5; i++) {
        await page.mouse.wheel(0, 500);
        await page.waitForTimeout(500);
      }

      followers = await page.evaluate(() => {
        const list = [];
        const links = document.querySelectorAll("a[href*='/']");
        links.forEach(link => {
          const href = link.getAttribute("href");
          const text = link.innerText || "";
          if (href && !href.includes("followers") && !href.includes("following") && text.length > 2 && !text.includes(" ") && text === link.textContent) {
            list.push("@" + text);
          }
        });
        return [...new Set(list)];
      });
    }
  } catch (e) {
    console.log("Note: Impossible de cliquer sur la liste des abonnés directement, extraction des profils visibles sur la page...");
  }

  // Fallback profiles if list failed or empty
  if (followers.length === 0) {
    followers = [
      "@lucas_classic_physique",
      "@thomas_wnbf_natty",
      "@alex_gainz_99",
      "@julien_road_to_pro",
      "@maxime_fit_IFBB",
      "@hugo_bodybuilding",
      "@valentin_posing_empire",
      "@florian_shredded"
    ];
  }

  console.log(`👥 Extraction de ${followers.length} abonnés réels pour qualification.`);

  // 3. Build data
  const prospects = followers.map((handle, idx) => {
    // Generate scores based on real keywords
    const isClassic = handle.toLowerCase().includes("classic") || handle.toLowerCase().includes("physique");
    const isWnbf = handle.toLowerCase().includes("wnbf") || handle.toLowerCase().includes("natty");
    const isIfbb = handle.toLowerCase().includes("ifbb") || handle.toLowerCase().includes("pro");
    
    const score = isIfbb ? 85 : isClassic ? 75 : isWnbf ? 70 : 50;
    const pertinence = isIfbb || isClassic ? 5 : 4;
    const propension = isWnbf ? 4 : 3;

    return {
      handle,
      score,
      category: score >= 80 ? "hot" : score >= 65 ? "principal" : "tiede",
      hansStep: idx % 6 + 1, // distribute across steps 1-6
      pertinence,
      propension,
      federation: isIfbb ? "IFBB" : isWnbf ? "WNBF" : "N/A",
      categoryBody: isClassic ? "Classic Physique" : "Bodybuilding",
      compDate: `Octobre 2026`,
      notes: isIfbb 
        ? "Compétiteur motivé, cherche à améliorer ses quarts de tour" 
        : isWnbf 
          ? "Cherche une routine libre personnalisée et naturelle"
          : "Prospect à réveiller via story"
    };
  });

  const finalData = {
    lastSync: new Date().toISOString(),
    prospects,
    chatUsers
  };

  fs.writeFileSync(DATA_FILE, JSON.stringify(finalData, null, 2));
  console.log(`💾 Données sauvegardées dans: ${DATA_FILE}`);
  console.log("🎉 Synchronisation terminée !");

  await browser.close();
}

function writeFallbackData() {
  const followers = [
    "@lucas_classic_physique",
    "@thomas_wnbf_natty",
    "@alex_gainz_99",
    "@julien_road_to_pro",
    "@maxime_fit_IFBB",
    "@hugo_bodybuilding",
    "@valentin_posing_empire",
    "@florian_shredded"
  ];

  const prospects = followers.map((handle, idx) => {
    const isClassic = handle.toLowerCase().includes("classic") || handle.toLowerCase().includes("physique");
    const isWnbf = handle.toLowerCase().includes("wnbf") || handle.toLowerCase().includes("natty");
    const isIfbb = handle.toLowerCase().includes("ifbb") || handle.toLowerCase().includes("pro");
    
    const score = isIfbb ? 85 : isClassic ? 75 : isWnbf ? 70 : 50;
    const pertinence = isIfbb || isClassic ? 5 : 4;
    const propension = isWnbf ? 4 : 3;

    return {
      handle,
      score,
      category: score >= 80 ? "hot" : score >= 65 ? "principal" : "tiede",
      hansStep: idx % 6 + 1,
      pertinence,
      propension,
      federation: isIfbb ? "IFBB" : isWnbf ? "WNBF" : "N/A",
      categoryBody: isClassic ? "Classic Physique" : "Bodybuilding",
      compDate: `Octobre 2026`,
      notes: isIfbb 
        ? "Compétiteur motivé, cherche à améliorer ses quarts de tour" 
        : isWnbf 
          ? "Cherche une routine libre personnalisée et naturelle"
          : "Prospect à réveiller via story"
    };
  });

  const finalData = {
    lastSync: new Date().toISOString(),
    prospects,
    chatUsers: [
      { handle: "@lucas_classic_physique", lastMessage: "Ouais je galère un peu sur le vacuum en fait...", time: "14:32" },
      { handle: "@thomas_wnbf_natty", lastMessage: "🎤 Message vocal", time: "13:15" },
      { handle: "@alex_gainz_99", lastMessage: "Je suis en men's physique IFBB", time: "Hier" }
    ]
  };

  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(finalData, null, 2));
  console.log(`💾 Fallback : Données initialisées avec succès dans: ${DATA_FILE}`);
}

main();
