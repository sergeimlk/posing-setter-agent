const fs = require("fs");
const path = require("path");

const src = "/Users/mily/.gemini/antigravity-ide/brain/8192c64f-e389-48d8-aaf4-66126c3082f2/lvcxs_itl_1783876065924.png";
const dest = "/Users/mily/Documents/MANAEL/TEAM PE SKOOL/posing-setter-agent/public/avatars/lvcxs_itl.jpg";
const DATA_FILE = "/Users/mily/Documents/MANAEL/TEAM PE SKOOL/posing-setter-agent/src/data/instagram-data.json";

try {
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log("✅ Success! Copied lvcxs_itl avatar.");
    
    // Also update json database to use local avatar path
    if (fs.existsSync(DATA_FILE)) {
      const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
      const lvcxs = data.prospects.find(p => p.handle === "lvcxs_itl");
      if (lvcxs) {
        lvcxs.avatar = "/avatars/lvcxs_itl.jpg";
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
        console.log("✅ Updated instagram-data.json with local avatar path for @lvcxs_itl.");
      }
    }
  } else {
    console.log("❌ Source image not found.");
  }
} catch (e) {
  console.error("❌ Error copying avatar:", e.message);
}
