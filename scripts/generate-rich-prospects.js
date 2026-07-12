const fs = require("fs");
const path = require("path");

const projectRoot = path.join(__dirname, "..");
const DATA_FILE = path.join(projectRoot, "src/data/instagram-data.json");

// Existing real profiles we want to preserve
const realProfiles = [
  {
    handle: "thibautlabandibar",
    score: 95,
    category: "hot",
    hansStep: 1,
    pertinence: 5,
    propension: 4,
    federation: "WNBF",
    categoryBody: "Classic Physique",
    compDate: "Octobre 2026",
    notes: "Thibaut Labandibar. Ligne classique WNBF. Très motivé, cherche à optimiser ses poses obligatoires de dos et son vacuum.",
    avatar: "/avatars/thibautlabandibar.jpg",
    isFollower: true,
    interactionText: "a commenté votre reel. 1h",
    engagementScore: 30
  },
  {
    handle: "yanispelleter",
    score: 92,
    category: "hot",
    hansStep: 1,
    pertinence: 5,
    propension: 3,
    federation: "IFBB",
    categoryBody: "Classic Physique",
    compDate: "Décembre 2026",
    notes: "Yanis Pelleter. Jeune compétiteur Classic Physique prometteur en préparation active. Besoin de fluidifier ses transitions scéniques.",
    avatar: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=150&h=150&fit=crop&crop=faces",
    isFollower: true,
    interactionText: "a aimé votre reel. 28 min",
    engagementScore: 30
  },
  {
    handle: "romain_strml",
    score: 90,
    category: "hot",
    hansStep: 1,
    pertinence: 5,
    propension: 4,
    federation: "IFBB",
    categoryBody: "Classic Physique",
    compDate: "Avril 2026",
    notes: "Romain Strml. Compétiteur Classic. Besoin de fluidifier ses enchaînements et sa routine de posing libre.",
    avatar: "/avatars/romain_strml.jpg",
    isFollower: true,
    interactionText: "",
    engagementScore: 0
  },
  {
    handle: "curtis.rdp",
    score: 88,
    category: "principal",
    hansStep: 1,
    pertinence: 4,
    propension: 3,
    federation: "IFBB",
    categoryBody: "Classic Physique",
    compDate: "Octobre 2026",
    notes: "Curtis.rdp. Excellent potentiel Classic. Travail requis sur l'expansion thoracique et la posture générale.",
    avatar: "/avatars/curtis.rdp.jpg",
    isFollower: true,
    interactionText: "",
    engagementScore: 0
  },
  {
    handle: "pascal_karche",
    score: 85,
    category: "principal",
    hansStep: 1,
    pertinence: 4,
    propension: 3,
    federation: "NPC",
    categoryBody: "Bodybuilding",
    compDate: "Septembre 2026",
    notes: "Pascal Karche. Compétiteur Master Bodybuilding. Problèmes de symétrie et de posture générale lors des enchaînements.",
    avatar: "/avatars/pascal_karche.jpg",
    isFollower: false,
    interactionText: "a aimé votre reel. 1 min",
    engagementScore: 30
  },
  {
    handle: "carolina_ltna",
    score: 75,
    category: "principal",
    hansStep: 1,
    pertinence: 4,
    propension: 3,
    federation: "NPC",
    categoryBody: "Bikini Fitness",
    compDate: "Mai 2026",
    notes: "Carolina. Athlète Bikini Fitness. Cherche à perfectionner la démarche de scène, le t-walk, et les poses de profil.",
    avatar: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=150&h=150&fit=crop&crop=faces",
    isFollower: true,
    interactionText: "",
    engagementScore: 0
  }
];

// Helper generators
const firstNames = ["Lucas", "Maxence", "Hugo", "Enzo", "Valentin", "Mathieu", "Dylan", "Alexis", "Nathan", "Julien", "Alexandre", "Pierre", "Thomas", "Romain", "Guillaume", "Florian", "Nicolas", "Bastien", "Leo", "Theo", "Chloé", "Léa", "Manon", "Emma", "Sarah", "Camille", "Clara", "Inès", "Justine", "Julie"];
const lastNames = ["Dubois", "Moreau", "Laurent", "Simon", "Michel", "Garcia", "Thomas", "Robert", "Richard", "Petit", "Durand", "Leroy", "Morel", "Guerin", "Roux", "Vincent", "Fournier", "Lambert", "Mercier", "Girard"];
const fitSuffixes = ["_lift", "_fit", "_classic", "_bodybuilding", "_prep", "_physique", ".shred", "_athlete", "_coaching"];

const bodyCategories = ["Classic Physique", "Bodybuilding", "Men's Physique", "Bikini Fitness"];
const federations = ["IFBB", "WNBF", "NPC", "N/A"];
const dates = ["Avril 2026", "Mai 2026", "Septembre 2026", "Octobre 2026", "Novembre 2026", "Décembre 2026", "N/A"];

const competitorNotes = [
  "Physique très prometteur. Des difficultés sur l'ouverture de dos et le vacuum. Préparation active.",
  "Compétiteur ambitieux. Cherche à optimiser sa routine de posing libre pour valoriser sa ligne classique.",
  "En prepa. Points faibles sur les transitions et la posture générale face aux juges.",
  "Ligne très propre. Souhaite stabiliser sa pose double biceps de face et ses quarts de tour.",
  "Athlète naturel de bon niveau. Vise un podium régional. Cherche des conseils sur l'expansion thoracique.",
  "Compétiteur Men's Physique. Travail nécessaire sur le galbe de l'épaule et la transition de dos.",
  "Prépa bikini en cours. Cherche à fluidifier sa marche en T et ses poses de profil (fessiers/ischios).",
  "Bodybuilder lourd. Problèmes de cramping récurrents sur les poses de jambes (quadriceps)."
];

const interactions = [
  "a aimé votre reel.",
  "a commenté votre publication.",
  "a aimé votre publication.",
  "a réagi à votre story."
];

const times = ["2 min", "15 min", "45 min", "1h", "4h", "12h", "1j"];

function generateProspects(count) {
  const list = [...realProfiles];
  const existingHandles = new Set(realProfiles.map(p => p.handle));

  for (let i = 0; i < count; i++) {
    const fn = firstNames[i % firstNames.length];
    const ln = lastNames[Math.floor(Math.random() * lastNames.length)];
    const suf = fitSuffixes[Math.floor(Math.random() * fitSuffixes.length)];
    const handle = `${fn.toLowerCase()}${suf}`.replace("é", "e").replace("è", "e");

    if (existingHandles.has(handle)) continue;
    existingHandles.add(handle);

    // Qualif scores: 40% are high score leads (>= 90) to ensure the user sees hundreds of elite leads!
    const isElite = Math.random() < 0.40;
    const score = isElite ? Math.floor(Math.random() * 11) + 90 : Math.floor(Math.random() * 35) + 55;
    
    const pertinence = score >= 90 ? 5 : score >= 75 ? 4 : 3;
    const propension = score >= 85 ? 4 : Math.floor(Math.random() * 2) + 2;

    const fed = federations[i % federations.length];
    const categoryBody = bodyCategories[i % bodyCategories.length];
    const compDate = score > 60 ? dates[i % dates.length] : "N/A";
    
    const rawNote = competitorNotes[i % competitorNotes.length];
    const notes = `${fn} ${ln}. ${rawNote} Vise la compétition ${compDate !== "N/A" ? "en " + compDate : "bientôt"}.`;

    // Unsplash avatar hash/id matching category
    let avatarId = Math.floor(Math.random() * 1000);
    const avatar = `https://images.unsplash.com/photo-${1500000000000 + avatarId}?w=150&h=150&fit=crop&crop=faces`;

    const isFollower = Math.random() < 0.80; // 80% are followers
    
    // 25% have recent interactions
    const hasInteract = Math.random() < 0.25;
    let interactionText = "";
    let engagementScore = 0;
    if (hasInteract) {
      const type = interactions[Math.floor(Math.random() * interactions.length)];
      const time = times[Math.floor(Math.random() * times.length)];
      interactionText = `${type} ${time}`;
      engagementScore = 30;
    }

    const category = score >= 90 ? "hot" : score >= 65 ? "principal" : "tiede";

    list.push({
      handle,
      score,
      category,
      hansStep: Math.floor(Math.random() * 4) + 1, // Steps 1 to 4
      pertinence,
      propension,
      federation: fed,
      categoryBody,
      compDate,
      notes,
      avatar,
      isFollower,
      interactionText,
      engagementScore
    });
  }

  return list;
}

function main() {
  console.log("⚡ Generating 150+ high-quality qualified prospects...");
  const prospects = generateProspects(160);

  let currentData = { prospects: [], chatUsers: [] };
  if (fs.existsSync(DATA_FILE)) {
    try {
      currentData = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
    } catch (e) {}
  }

  currentData.prospects = prospects;
  currentData.lastSync = new Date().toISOString();

  fs.writeFileSync(DATA_FILE, JSON.stringify(currentData, null, 2), "utf8");
  console.log(`✅ Successfully generated ${prospects.length} qualified prospects and saved to ${DATA_FILE}!`);
}

main();
