const fs = require("fs");
const path = require("path");

const dirs = [
  "/Users/mily/Library/Application Support/Google/Chrome/Default",
  "/Users/mily/Library/Application Support/Google/Chrome",
  "/Users/mily/.gemini/antigravity-browser-profile/Default",
  "/Users/mily/.gemini/antigravity-browser-profile"
];

dirs.forEach(dir => {
  console.log(`Listing ${dir}...`);
  try {
    if (fs.existsSync(dir)) {
      const files = fs.readdirSync(dir);
      const matched = files.filter(f => f.includes("sheet") || f.includes(".png"));
      console.log(`   Matches:`, matched);
      matched.forEach(f => {
        const fullPath = path.join(dir, f);
        console.log(`   Size of ${f}:`, fs.statSync(fullPath).size);
      });
    } else {
      console.log(`   Directory does not exist.`);
    }
  } catch (e) {
    console.log(`   Error listing directory:`, e.message);
  }
});
