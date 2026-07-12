const fs = require("fs");
const path = require("path");

const WORKSPACE_DIR = path.join(__dirname, "../..");
const LESSONS_FILE = path.join(__dirname, "../src/data/lessons.json");
const VIDEOS_CACHE_DIR = path.join(WORKSPACE_DIR, "videos_cache");

function main() {
  if (!fs.existsSync(LESSONS_FILE)) {
    console.error("❌ lessons.json introuvable.");
    return;
  }
  if (!fs.existsSync(VIDEOS_CACHE_DIR)) {
    console.error("❌ Dossier videos_cache introuvable.");
    return;
  }

  const lessonsData = JSON.parse(fs.readFileSync(LESSONS_FILE, "utf8"));
  
  // Read all transcript files in videos_cache
  const files = fs.readdirSync(VIDEOS_CACHE_DIR).filter(f => f.endsWith("_transcript.txt"));
  console.log(`🔍 Trouvé ${files.length} transcriptions dans videos_cache.`);

  const transcriptsMap = {};
  files.forEach(f => {
    const filePath = path.join(VIDEOS_CACHE_DIR, f);
    const content = fs.readFileSync(filePath, "utf8").trim().substring(0, 150).toLowerCase();
    const mp4Name = f.replace("_transcript.txt", ".mp4");
    transcriptsMap[mp4Name] = content;
  });

  // Load scraped_lessons_metadata.json
  const metadataPath = path.join(WORKSPACE_DIR, "scraped_lessons_metadata.json");
  if (!fs.existsSync(metadataPath)) {
    console.error("❌ scraped_lessons_metadata.json introuvable.");
    return;
  }
  const metadata = JSON.parse(fs.readFileSync(metadataPath, "utf8"));

  // Match and update
  lessonsData.modules.forEach(mod => {
    const slug = mod.id === "mod1" ? "af9e1b1f" : "ed83a935";
    const modMeta = metadata[slug];
    if (!modMeta) return;

    mod.lessons.forEach(lesson => {
      // Find matching lesson in metadata
      const metaLes = modMeta.lessons.find(l => l.title.toLowerCase().trim() === lesson.title.toLowerCase().trim());
      if (metaLes && metaLes.transcription) {
        const metaTransStart = metaLes.transcription.trim().substring(0, 100).toLowerCase();
        
        // Find MP4 file with closest transcription match
        let bestMatchFile = null;
        let bestMatchScore = 0;

        Object.keys(transcriptsMap).forEach(mp4File => {
          if (!mp4File.startsWith(slug)) return; // match slug
          const transStart = transcriptsMap[mp4File];
          
          // Calculate overlap score
          let overlap = 0;
          for (let i = 0; i < Math.min(metaTransStart.length, transStart.length); i++) {
            if (metaTransStart[i] === transStart[i]) overlap++;
            else break;
          }
          if (overlap > bestMatchScore) {
            bestMatchScore = overlap;
            bestMatchFile = mp4File;
          }
        });

        if (bestMatchFile && bestMatchScore > 15) {
          lesson.videoUrl = `/api/video?name=${bestMatchFile}`;
          lesson.videoType = "local";
          console.log(`✅ mapped: "${lesson.title}" -> ${bestMatchFile}`);
        } else {
          // If no transcription match, check if it's an external YouTube or Calendly link
          if (metaLes.description && (metaLes.description.includes("youtube.com") || metaLes.description.includes("youtu.be"))) {
            const ytMatch = metaLes.description.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?\s\n]+)/);
            if (ytMatch) {
              lesson.videoUrl = `https://www.youtube.com/embed/${ytMatch[1]}`;
              lesson.videoType = "youtube";
              console.log(`✅ mapped external YouTube: "${lesson.title}" -> ${lesson.videoUrl}`);
            }
          } else {
            console.log(`⚠️ Unmapped: "${lesson.title}"`);
          }
        }
      }
    });
  });

  fs.writeFileSync(LESSONS_FILE, JSON.stringify(lessonsData, null, 2), "utf8");
  console.log("🎉 Mapping des vidéos locales terminé !");
}

main();
