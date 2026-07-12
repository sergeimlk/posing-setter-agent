const { google } = require("googleapis");
const fs = require("fs");
const path = require("path");

// Load env vars
require("dotenv").config({ path: path.join(__dirname, "../.env.local") });

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID || "1afeUsmftVlJhN4sh83MlcRQxFTnx3JZ3B-UhoYthf60";

const SHEETS_TO_CREATE = [
  {
    title: "Tracking Journalier",
    headers: [
      "Date",
      "Messages Envoyés",
      "Réponses Reçues",
      "Taux Réponse (%)",
      "Leads Qualifiés",
      "Appels Bookés",
      "Ventes",
      "Chiffre d'Affaires (€)",
      "Commissions (€)"
    ]
  },
  {
    title: "Prospects Qualifiés",
    headers: [
      "Date d'Ajout",
      "Pseudo Instagram",
      "Score Qualification (0-100)",
      "Catégorie",
      "Étape Hans",
      "Pertinence (Étoiles)",
      "Propension d'Achat (Étoiles)",
      "Fédération",
      "Catégorie Body",
      "Date Compétition",
      "Notes / Douleurs"
    ]
  },
  {
    title: "Historique Messages",
    headers: [
      "Date/Heure",
      "Pseudo Instagram",
      "Expéditeur",
      "Type (Texte/Vocal)",
      "Contenu Message",
      "Transcription/Draft"
    ]
  },
  {
    title: "Performances Hebdo",
    headers: [
      "Semaine",
      "Total DMs",
      "Total Qualifiés",
      "Total Appels",
      "Total Ventes",
      "CA Généré",
      "Commissions",
      "Notes Agent IA"
    ]
  }
];

async function main() {
  console.log("🚀 Initialisation du Google Sheet CRM...");
  console.log(`Spreadsheet ID: ${SPREADSHEET_ID}`);

  // Check if we have credentials
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY;

  if (!clientEmail || !privateKey) {
    console.log("\n⚠️  [ATTENTION] Les identifiants Google Sheets ne sont pas configurés dans .env.local.");
    console.log("Pour l'initialisation automatique, ajoutez :");
    console.log("  GOOGLE_CLIENT_EMAIL=votre-service-account@project.iam.gserviceaccount.com");
    console.log("  GOOGLE_PRIVATE_KEY=\"-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\"\n");
    console.log("💡 [SOLUTIONS ALTERNATIVES] :");
    console.log("1. Vous pouvez également copier/coller ces en-têtes manuellement dans votre tableur.");
    console.log("2. Ou utilisez le script Google Apps Script fourni ci-dessous en l'insérant dans Extensions -> Apps Script.\n");
    
    generateAppsScriptInstructions();
    return;
  }

  try {
    const auth = new google.auth.JWT(
      clientEmail,
      null,
      privateKey.replace(/\\n/g, "\n"),
      ["https://www.googleapis.com/auth/spreadsheets"]
    );

    const sheets = google.sheets({ version: "v4", auth });

    // Get spreadsheet details
    const doc = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
    const existingSheets = doc.data.sheets || [];
    const existingTitles = existingSheets.map(s => s.properties.title);

    console.log(`Feuilles existantes: ${existingTitles.join(", ")}`);

    for (const sheetConfig of SHEETS_TO_CREATE) {
      // 1. Create sheet if not exists
      if (!existingTitles.includes(sheetConfig.title)) {
        console.log(`➕ Création de la feuille "${sheetConfig.title}"...`);
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId: SPREADSHEET_ID,
          requestBody: {
            requests: [
              {
                addSheet: {
                  properties: { title: sheetConfig.title }
                }
              }
            ]
          }
        });
      }

      // 2. Add headers
      console.log(`📝 Écriture des en-têtes pour "${sheetConfig.title}"...`);
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `"${sheetConfig.title}"!A1`,
        valueInputOption: "RAW",
        requestBody: {
          values: [sheetConfig.headers]
        }
      });
    }

    console.log("✨ Initialisation Google Sheets terminée avec succès !");
  } catch (error) {
    console.error("❌ Erreur lors de l'initialisation Google Sheets:", error.message);
  }
}

function generateAppsScriptInstructions() {
  const code = `
function initCRM() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheets = ${JSON.stringify(SHEETS_TO_CREATE, null, 2)};
  
  sheets.forEach(function(s) {
    var sheet = ss.getSheetByName(s.title);
    if (!sheet) {
      sheet = ss.insertSheet(s.title);
    }
    sheet.clear();
    sheet.appendRow(s.headers);
    sheet.getRange(1, 1, 1, s.headers.length)
         .setFontWeight("bold")
         .setBackground("#D4A843")
         .setFontColor("#FFFFFF");
  });
}
`;
  console.log("--- GOOGLE APPS SCRIPT CODE ---");
  console.log(code);
  console.log("--------------------------------");
}

main();
