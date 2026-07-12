const fs = require("fs");
const path = require("path");

const data = JSON.parse(fs.readFileSync(path.join(__dirname, "../../scraped_lessons_metadata.json"), "utf8"));
console.log("Modules in metadata:", Object.keys(data));
Object.keys(data).forEach(mKey => {
  const mod = data[mKey];
  console.log(`Module ${mKey}: title="${mod.title}"`);
  console.log(`  lessons count: ${mod.lessons.length}`);
  if (mod.lessons.length > 0) {
    console.log(`  First lesson properties:`, Object.keys(mod.lessons[0]));
    console.log(`  First lesson:`, JSON.stringify(mod.lessons[0]).substring(0, 300));
  }
});
