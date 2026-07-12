import { GoogleGenerativeAI } from "@google/generative-ai";

const SYSTEM_PROMPT = `Tu es un expert d'élite en Appointment Setting High-Ticket, ultra-spécialisé dans la niche du bodybuilding et du posing. Tu assistes un setter qui opère depuis le compte Instagram @manael.posing pour l'offre de Manaël Tacher (Posing Empire).

CONTEXTE CLÉ :
- Offre : Accompagnement posing 1:1 sur 3 mois à 1 497 €
- Objectif : Booker 3+ appels qualifiés/jour sur Calendly
- Volume : 150 DMs/jour (50 nouveaux, 50 stories, 50 relances)
- Avatar : Bodybuilder français ~27 ans, compétiteur, autodidacte sur le posing

MÉTHODE HANS (Entonnoir de qualification en 7 étapes) :
1. Icebreaker : Réagir à une story/post de façon naturelle
2. Contexte : Catégorie (Classic/Body) et fédération (IFBB/WNBF)
3. Objectif : But ultime sur scène (Pro Card, top 1)
4. Bilan Posing : Auto-évaluation de son posing actuel
5. Douleur/Blocage : Identifier ce qui coince (vacuum, transitions, crampes)
6. Prise de conscience : "Avec ton posing actuel, les juges valoriseront ton physique ?"
7. Call-to-Action : Proposer un diagnostic rapide de 15 min via Calendly

RÈGLES DE RÉDACTION :
- Ton fraternel, direct, énergique. Utilise "bro" modérément
- Messages COURTS (1-3 phrases max, format DM Instagram)
- ZÉRO faute d'orthographe
- JAMAIS de message robotique ou générique
- Personnaliser en référençant le profil/story du prospect
- Ne PAS proposer le Calendly avant l'étape 7

RESSOURCES YOUTUBE (selon le blocage) :
- Quarts de tour : https://youtu.be/ZUXbjlT-Lmc
- Activation Quads : https://youtu.be/zVHV9o940nI
- Présence scénique : https://youtu.be/8_8QT46LcDM
- IFBB : https://youtu.be/7km-L4Na4YM
- WNBF : https://youtu.be/Y_Vgyqg0dN0
- Calendly : https://calendly.com/posing-session-reservation/appel-decouverte-posing-empire

CRITÈRES DE QUALIFICATION :
- Compétiteur montant sur scène en 2026 (priorité) ou 2027
- Conscience du problème posing
- Capacité financière (facilités de paiement possibles)

EXCLUSIONS : Non-compétiteurs, profils toxiques, concurrents, chasseurs de gratuit`;

function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not set");
  return new GoogleGenerativeAI(apiKey);
}

export async function scoreProspect(profileData: string): Promise<{
  score: number;
  category: string;
  hansStep: number;
  reasoning: string;
  suggestedAction: string;
  suggestedResource: string;
}> {
  const genAI = getGenAI();
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `Analyse ce profil Instagram de prospect et attribue un score de qualification (0-100).

Profil du prospect :
${profileData}

Réponds UNIQUEMENT en JSON valide avec cette structure exacte :
{
  "score": <nombre 0-100>,
  "category": "<Hot Lead|Principal|Tiède|Hors-cible>",
  "hansStep": <1-7>,
  "reasoning": "<explication courte>",
  "suggestedAction": "<prochaine action recommandée>",
  "suggestedResource": "<lien YouTube pertinent ou 'none'>"
}`;

  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    systemInstruction: { role: "model", parts: [{ text: SYSTEM_PROMPT }] },
  });
  const text = result.response.text();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Invalid response from Gemini");
  return JSON.parse(jsonMatch[0]);
}

export async function generateDrafts(
  conversationHistory: string,
  prospectInfo: string,
  hansStep: number
): Promise<{ drafts: string[]; reasoning: string; resourceToSend: string }> {
  const genAI = getGenAI();
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `Le prospect est actuellement à l'étape ${hansStep} de la méthode Hans.

Infos prospect : ${prospectInfo}

Historique de conversation :
${conversationHistory}

Génère 3 variantes de réponses à envoyer en DM Instagram. Les messages doivent :
- Être courts (1-3 phrases max)
- Sonner naturels et humains (PAS robotique)
- Faire avancer le prospect dans l'entonnoir Hans
- Être en français avec le ton fraternel de Manaël

Réponds UNIQUEMENT en JSON valide :
{
  "drafts": ["message 1", "message 2", "message 3"],
  "reasoning": "<pourquoi ces messages sont adaptés>",
  "resourceToSend": "<lien YouTube à envoyer si pertinent, sinon 'none'>"
}`;

  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    systemInstruction: { role: "model", parts: [{ text: SYSTEM_PROMPT }] },
  });
  const text = result.response.text();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Invalid response from Gemini");
  return JSON.parse(jsonMatch[0]);
}

export async function generateReport(
  dailyData: string,
  reportType: "morning" | "midday" | "evening"
): Promise<string> {
  const genAI = getGenAI();
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const typeLabels = { morning: "Matin", midday: "Mi-journée", evening: "Soir" };

  const prompt = `Génère un rapport de setting ${typeLabels[reportType]} au format Markdown.

Données du jour :
${dailyData}

Le rapport doit contenir :
1. 🔥 Prospects prioritaires à contacter (avec score et suggestion)
2. 📬 Nouvelles réponses reçues (avec étape Hans et action)
3. 📈 KPIs de la période (tableau)
4. 💡 Optimisations suggérées (3 points concrets)

Utilise des emojis et un ton professionnel mais engageant. Le rapport sera téléchargé en MD et PDF.`;

  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    systemInstruction: { role: "model", parts: [{ text: SYSTEM_PROMPT }] },
  });
  return result.response.text();
}

export async function analyzeDMs(dmsData: string): Promise<{
  hotLeads: Array<{ handle: string; score: number; reason: string; suggestedMessage: string }>;
  newReplies: Array<{ handle: string; message: string; hansStep: number; action: string }>;
  summary: string;
}> {
  const genAI = getGenAI();
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `Analyse ces DMs Instagram et identifie les meilleurs prospects.

DMs reçus :
${dmsData}

Réponds UNIQUEMENT en JSON valide :
{
  "hotLeads": [
    { "handle": "@pseudo", "score": 85, "reason": "Compétiteur IFBB, scène en oct 2026", "suggestedMessage": "message d'accroche naturel" }
  ],
  "newReplies": [
    { "handle": "@pseudo", "message": "contenu du message reçu", "hansStep": 4, "action": "prochaine action" }
  ],
  "summary": "Résumé concis de l'analyse"
}`;

  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    systemInstruction: { role: "model", parts: [{ text: SYSTEM_PROMPT }] },
  });
  const text = result.response.text();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Invalid response");
  return JSON.parse(jsonMatch[0]);
}

export async function chatWithAgent(userMessage: string, context: string): Promise<string> {
  const genAI = getGenAI();
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `${context ? `Contexte actuel :\n${context}\n\n` : ""}Question/demande du setter :\n${userMessage}`;

  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    systemInstruction: { role: "model", parts: [{ text: SYSTEM_PROMPT }] },
  });
  return result.response.text();
}
