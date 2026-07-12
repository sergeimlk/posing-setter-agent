const { google } = require("googleapis");
const path = require("path");

const SPREADSHEET_ID = "1afeUsmftVlJhN4sh83MlcRQxFTnx3JZ3B-UhoYthf60";

const SHEETS_CONFIG = [
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
  console.log("🚀 Initialisation automatique des feuilles & colonnes du CRM...");
  
  try {
    // Try to get credentials from ADC (Application Default Credentials)
    const auth = new google.auth.GoogleAuth({
      scopes: ["https://www.googleapis.com/auth/spreadsheets"]
    });
    
    const client = await auth.getClient();
    const sheets = google.sheets({ version: "v4", auth: client });

    console.log("🔓 Authentifié via les identifiants locaux. Accès au Google Sheet...");

    // Get spreadsheet
    const doc = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
    const existingSheets = doc.data.sheets || [];
    const existingTitles = existingSheets.map(s => s.properties.title);

    for (const sheetConfig of SHEETS_CONFIG) {
      if (!existingTitles.includes(sheetConfig.title)) {
        console.log(`➕ Création de la feuille: "${sheetConfig.title}"`);
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
    
    console.log("🎉 Initialisation réussie ! Les colonnes ont été créées.");

  } catch (error) {
    console.warn("\n⚠️ Authentification locale impossible ou accès refusé.");
    console.log("Veuillez suivre ces instructions pour initialiser votre Sheet en 2 clics :");
    console.log("\n1. Ouvrez votre tableur Google Sheets.");
    console.log("2. Allez dans Extensions -> Apps Script.");
    console.log("3. Remplacez le code existant par le code ci-dessous :");
    console.log("\n------------------------------------------------");
    
    const appsScript = `
function initCRM() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheets = ${JSON.stringify(SHEETS_CONFIG, null, 2)};
  
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
    console.log(appsScript);
    console.log("------------------------------------------------");
    console.log("\n4. Cliquez sur 'Enregistrer' puis 'Exécuter'. Les feuilles se créeront instantanément.");
  }
}

main();
