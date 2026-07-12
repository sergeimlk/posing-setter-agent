const fs = require("fs");
const path = require("path");

const data = JSON.parse(fs.readFileSync(path.join(__dirname, "../../next_data_classroom.json"), "utf8"));

// Log pageProps keys
console.log("props keys:", Object.keys(data.props || {}));
if (data.props && data.props.pageProps) {
  console.log("pageProps keys:", Object.keys(data.props.pageProps));
  const renderData = data.props.pageProps.renderData || {};
  console.log("renderData keys:", Object.keys(renderData));
  if (renderData.allCourses) {
    console.log("allCourses count:", renderData.allCourses.length);
    renderData.allCourses.forEach((c, idx) => {
      console.log(`Course ${idx}: name="${c.name}", id="${c.id}"`);
      const children = c.children || [];
      console.log(`  children count: ${children.length}`);
      if (children.length > 0) {
        console.log(`  First child course properties:`, Object.keys(children[0].course || {}));
        console.log(`  First child course name:`, children[0].course?.name);
        console.log(`  First child course metadata:`, children[0].course?.metadata);
        console.log(`  First child course video:`, children[0].course?.video);
      }
    });
  }
}
