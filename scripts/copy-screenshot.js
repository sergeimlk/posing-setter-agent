const fs = require("fs");
const path = require("path");

const src = "/Users/mily/Library/Application Support/Google/Chrome/Default/sheet_success.png";
const dest = "/Users/mily/Documents/MANAEL/TEAM PE SKOOL/posing-setter-agent/public/sheet_success.png";

try {
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log("✅ Success! Screenshot copied to public/sheet_success.png");
  } else {
    // Try sandbox directory
    const src2 = "/Users/mily/.gemini/antigravity-browser-profile/Default/sheet_success.png";
    if (fs.existsSync(src2)) {
      fs.copyFileSync(src2, dest);
      console.log("✅ Success! Screenshot copied from sandbox profile.");
    } else {
      console.log("❌ Source screenshot file not found anywhere!");
    }
  }
} catch (err) {
  console.error("❌ Error copying file:", err.message);
}
