const fs = require("fs");
const path = require("path");

const data = JSON.parse(fs.readFileSync(path.join(__dirname, "../../next_data_classroom.json"), "utf8"));

function search(obj, path = "") {
  if (!obj) return;
  if (Array.isArray(obj)) {
    obj.forEach((item, idx) => search(item, `${path}[${idx}]`));
  } else if (typeof obj === "object") {
    Object.keys(obj).forEach(key => {
      const val = obj[key];
      if (key === "playbackId" || key === "videoLink") {
        console.log(`FOUND KEY: ${path}.${key} = ${val}`);
      } else {
        search(val, `${path}.${key}`);
      }
    });
  }
}

search(data, "root");
