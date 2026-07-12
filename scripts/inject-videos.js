const fs = require("fs");
const path = require("path");

const CLASSROOM_FILE = path.join(__dirname, "../../next_data_classroom.json");
const LESSONS_FILE = path.join(__dirname, "../src/data/lessons.json");

function main() {
  if (!fs.existsSync(CLASSROOM_FILE)) {
    console.error("❌ next_data_classroom.json introuvable.");
    return;
  }

  const classroomData = JSON.parse(fs.readFileSync(CLASSROOM_FILE, "utf8"));
  
  // Navigate next data to find courses
  let courses = [];
  try {
    courses = classroomData.props.pageProps.renderData.allCourses || [];
  } catch (e) {
    try {
      courses = classroomData.props.pageProps.allCourses || [];
    } catch (err) {
      console.error("❌ Structure de next_data_classroom.json non reconnue.");
      return;
    }
  }

  // Map to store video details by lesson name/title
  const videoMap = {};

  courses.forEach(course => {
    const children = course.children || [];
    children.forEach(child => {
      const lesson = child.course || {};
      const title = lesson.metadata?.title || lesson.name;
      
      let videoUrl = null;
      let videoType = "none";

      // Check external video link
      if (lesson.metadata?.videoLink) {
        videoUrl = lesson.metadata.videoLink;
        if (videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be")) {
          videoType = "youtube";
          // Convert to embed url
          const ytIdMatch = videoUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?\s]+)/);
          if (ytIdMatch) {
            videoUrl = `https://www.youtube.com/embed/${ytIdMatch[1]}`;
          }
        } else if (videoUrl.includes("loom.com")) {
          videoType = "loom";
          const loomIdMatch = videoUrl.match(/loom\.com\/share\/([^&?\s]+)/);
          if (loomIdMatch) {
            videoUrl = `https://www.loom.com/embed/${loomIdMatch[1]}`;
          }
        }
      } 
      // Check native Mux video
      else if (lesson.video && lesson.video.playbackId) {
        const playbackId = lesson.video.playbackId;
        const token = lesson.video.playbackToken || "";
        videoUrl = `https://stream.video.skool.com/${playbackId}.m3u8?token=${token}`;
        videoType = "hls";
      }

      if (title && videoUrl) {
        const titleKey = title.toLowerCase().trim();
        console.log(`Extracted: "${titleKey}" -> ${videoType}`);
        videoMap[titleKey] = { videoUrl, videoType };
      }
    });
  });

  // Now load current lessons.json and inject videoUrls
  if (!fs.existsSync(LESSONS_FILE)) {
    console.error("❌ lessons.json introuvable.");
    return;
  }

  const lessonsData = JSON.parse(fs.readFileSync(LESSONS_FILE, "utf8"));
  
  lessonsData.modules.forEach(mod => {
    mod.lessons.forEach(les => {
      const key = les.title.toLowerCase().trim();
      const match = videoMap[key];
      if (match) {
        les.videoUrl = match.videoUrl;
        les.videoType = match.videoType;
        console.log(`✅ Injected video for: "${les.title}" (${match.videoType})`);
      } else {
        // Fallback or leave as is
        console.log(`⚠️ No video match found for: "${les.title}"`);
      }
    });
  });

  fs.writeFileSync(LESSONS_FILE, JSON.stringify(lessonsData, null, 2), "utf8");
  console.log("🎉 Injections vidéo terminées !");
}

main();
