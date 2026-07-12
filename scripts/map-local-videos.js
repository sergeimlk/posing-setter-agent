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

  const lessonsData = JSON.parse(fs.readFileSync(LESSONS_FILE, "utf8"));
  
  // Read all files in videos_cache
  if (!fs.existsSync(VIDEOS_CACHE_DIR)) {
    console.error("❌ Dossier videos_cache introuvable.");
    return;
  }

  const files = fs.readdirSync(VIDEOS_CACHE_DIR).filter(f => f.endsWith(".mp4"));
  console.log(`🎥 Trouvé ${files.length} fichiers MP4 dans videos_cache.`);

  // Group files by module
  const filesByModule = {};
  files.forEach(f => {
    const parts = f.split("_");
    const modSlug = parts[0];
    if (!filesByModule[modSlug]) {
      filesByModule[modSlug] = [];
    }
    filesByModule[modSlug].push(f);
  });

  // Now we need to map them. Since we don't have the exact IDs in lessons.json, 
  // let's look at next_data_classroom.json or scraped_lessons_metadata.json to match them!
  // Wait, let's read scraped_lessons_metadata.json if it exists.
  const metadataPath = path.join(WORKSPACE_DIR, "scraped_lessons_metadata.json");
  if (!fs.existsSync(metadataPath)) {
    console.error("❌ scraped_lessons_metadata.json introuvable.");
    return;
  }

  const metadata = JSON.parse(fs.readFileSync(metadataPath, "utf8"));

  // Match lessons by comparing titles
  lessonsData.modules.forEach(mod => {
    // Determine slug based on module ID (mod1 -> af9e1b1f, mod2 -> ed83a935)
    const slug = mod.id === "mod1" ? "af9e1b1f" : "ed83a935";
    const modMeta = metadata[slug];
    if (!modMeta) return;

    mod.lessons.forEach(lesson => {
      // Find the lesson in metadata that matches this title
      const metaLessonIndex = modMeta.lessons.findIndex(l => l.title.toLowerCase().trim() === lesson.title.toLowerCase().trim());
      if (metaLessonIndex !== -1) {
        // We need to find the ID of this lesson from next_data_classroom.json or file names
        // Wait, next_data_classroom.json has allCourses. Course name is the slug.
        // Let's parse next_data_classroom.json to get the list of lesson IDs in order!
        const classroomPath = path.join(WORKSPACE_DIR, "next_data_classroom.json");
        if (fs.existsSync(classroomPath)) {
          const classroom = JSON.parse(fs.readFileSync(classroomPath, "utf8"));
          let courses = classroom.props?.pageProps?.renderData?.allCourses || classroom.props?.pageProps?.allCourses || [];
          const course = courses.find(c => c.name === slug);
          if (course && course.children) {
            // Wait, in test_structure.js, we saw children count was 0 at the top level.
            // But let's check if the lesson IDs are in the file names of videos_cache!
            // Yes! The filename is slug_lessonid.mp4. So we can scan the files in videos_cache, 
            // and see if we can find any file matching slug_*.mp4.
          }
        }

        // Alternative: match the files by index if they were scraped in order!
        // Let's look at the filenames. In videos_cache, does it have lesson IDs? Yes, e.g., af9e1b1f_0a367c1c557042b1b9ad5ef5628c9933.mp4
        // Let's inspect the scrape_and_transcribe.py script to see how it resolves the files.
        // It uses: lesson_id = c_data.get("id")
        // Let's write the mapped video file directly into the lesson!
      }
    });
  });

  // Let's write a simple hardcoded mapping since we know the slugs and files.
  // Let's list the files again and find their matches in the metadata.
  // Wait, let's create a custom route that matches the video file directly!
}

main();
