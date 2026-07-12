"use client";
import { useState, useEffect } from "react";

interface Settings {
  geminiKey: string;
  sheetsId: string;
  appsScriptUrl?: string;
  calendlyUrl: string;
  commissionRate: number;
  cronMorning: string;
  cronMidday: string;
  cronEvening: string;
  exclusionList: string;
  youtubeLinks: {
    quarts_de_tour: string;
    activation_quads: string;
    presence_scenique: string;
    specifique_ifbb: string;
    specifique_wnbf: string;
  };
}

const defaultSettings: Settings = {
  geminiKey: "",
  sheetsId: "1afeUsmftVlJhN4sh83MlcRQxFTnx3JZ3B-UhoYthf60",
  appsScriptUrl: "",
  calendlyUrl: "https://calendly.com/posing-session-reservation/appel-decouverte-posing-empire",
  commissionRate: 5,
  cronMorning: "08:00",
  cronMidday: "14:00",
  cronEvening: "20:00",
  exclusionList: "",
  youtubeLinks: {
    quarts_de_tour: "https://youtu.be/ZUXbjlT-Lmc?si=KLcH78RoAP-XYThZ",
    activation_quads: "https://youtu.be/zVHV9o940nI?si=9Zk6OpIK5U_XfFPd",
    presence_scenique: "https://youtu.be/8_8QT46LcDM?si=07X0UTXre3ts4-9j",
    specifique_ifbb: "https://youtu.be/7km-L4Na4YM",
    specifique_wnbf: "https://youtu.be/Y_Vgyqg0dN0",
  },
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [saved, setSaved] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("setterSettings");
    if (stored) {
      try {
        setSettings({ ...defaultSettings, ...JSON.parse(stored) });
      } catch { /* ignore */ }
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem("setterSettings", JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const testGemini = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "Test de connexion. Réponds juste 'Connexion OK — Agent Setter opérationnel !' en 1 phrase." }),
      });
      const data = await res.json();
      setTestResult(data.response || data.error || "Réponse reçue");
    } catch {
      setTestResult("❌ Erreur de connexion à l'API.");
    } finally {
      setTesting(false);
    }
  };

  const update = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest text-gold-500 mb-1">Paramètres</p>
        <h2 className="text-3xl md:text-4xl font-black font-display">
          <span className="text-white-gradient">Configuration</span>
        </h2>
      </div>

      {/* API Keys */}
      <div className="glass-card p-6 space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-widest text-gold-500 mb-2">🔑 Clés API</h3>
        <div>
          <label className="text-xs text-text-muted uppercase tracking-wider block mb-1">Clé API Gemini</label>
          <div className="flex gap-2">
            <input
              type="password"
              value={settings.geminiKey}
              onChange={(e) => update("geminiKey", e.target.value)}
              placeholder="Configurée via .env.local sur le serveur"
              className="flex-1 bg-bg-input border border-border-subtle rounded-xl px-4 py-3 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-border-active"
            />
            <button onClick={testGemini} disabled={testing} className="btn-ghost text-xs disabled:opacity-50">
              {testing ? "⏳" : "🧪 Tester"}
            </button>
          </div>
          <p className="text-[10px] text-text-muted mt-1">La clé API est déjà configurée côté serveur (.env.local). Ce champ est optionnel.</p>
          {testResult && (
            <p className="text-xs mt-2 p-2 rounded-lg bg-bg-card border border-border-white text-text-secondary">{testResult}</p>
          )}
        </div>
      </div>

      {/* Google Sheets */}
      <div className="glass-card p-6 space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-widest text-gold-500 mb-2">📊 Google Sheets CRM</h3>
        <div>
          <label className="text-xs text-text-muted uppercase tracking-wider block mb-1">ID du document</label>
          <input
            type="text"
            value={settings.sheetsId}
            onChange={(e) => update("sheetsId", e.target.value)}
            className="w-full bg-bg-input border border-border-subtle rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-border-active font-mono"
          />
        </div>
        <div>
          <label className="text-xs text-text-muted uppercase tracking-wider block mb-1">URL de l&apos;application Google Apps Script (Écriture)</label>
          <input
            type="url"
            value={settings.appsScriptUrl || ""}
            onChange={(e) => update("appsScriptUrl", e.target.value)}
            placeholder="https://script.google.com/macros/s/.../exec"
            className="w-full bg-bg-input border border-border-subtle rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-border-active font-mono"
          />
          <p className="text-[10px] text-text-muted mt-1.5 leading-relaxed">
            Pour écrire directement dans votre Google Sheet sans identifiants complexes, déployez le script fourni dans Extensions &rarr; Apps Script en tant que <strong>&ldquo;Application Web&rdquo;</strong> accessible par <strong>&ldquo;Tout le monde&rdquo;</strong> (Anyone), puis collez l&apos;URL d&apos;exécution ici.
          </p>
        </div>
        <a
          href={`https://docs.google.com/spreadsheets/d/${settings.sheetsId}/edit`}
          target="_blank"
          className="btn-ghost text-xs"
        >
          📊 Ouvrir le Google Sheets
        </a>
      </div>

      {/* Calendly */}
      <div className="glass-card p-6 space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-widest text-gold-500 mb-2">📅 Calendly</h3>
        <input
          type="url"
          value={settings.calendlyUrl}
          onChange={(e) => update("calendlyUrl", e.target.value)}
          className="w-full bg-bg-input border border-border-subtle rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-border-active"
        />
      </div>

      {/* Commission */}
      <div className="glass-card p-6 space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-widest text-gold-500 mb-2">💰 Commission</h3>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min={4}
            max={7}
            step={0.5}
            value={settings.commissionRate}
            onChange={(e) => update("commissionRate", parseFloat(e.target.value))}
            className="flex-1"
          />
          <span className="text-xl font-black text-gold-300 w-16 text-right">{settings.commissionRate}%</span>
        </div>
        <p className="text-xs text-text-muted">
          Commission par vente : <span className="text-gold-400 font-bold">{(1497 * settings.commissionRate / 100).toFixed(2)} €</span> (sur 1 497 €)
        </p>
      </div>

      {/* Cron Schedule */}
      <div className="glass-card p-6 space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-widest text-gold-500 mb-2">⏰ Horaires des rapports</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-text-muted block mb-1">🌅 Matin</label>
            <input type="time" value={settings.cronMorning} onChange={(e) => update("cronMorning", e.target.value)} className="w-full bg-bg-input border border-border-subtle rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-border-active" />
          </div>
          <div>
            <label className="text-xs text-text-muted block mb-1">☀️ Mi-journée</label>
            <input type="time" value={settings.cronMidday} onChange={(e) => update("cronMidday", e.target.value)} className="w-full bg-bg-input border border-border-subtle rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-border-active" />
          </div>
          <div>
            <label className="text-xs text-text-muted block mb-1">🌙 Soir</label>
            <input type="time" value={settings.cronEvening} onChange={(e) => update("cronEvening", e.target.value)} className="w-full bg-bg-input border border-border-subtle rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-border-active" />
          </div>
        </div>
      </div>

      {/* Exclusion List */}
      <div className="glass-card p-6 space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-widest text-gold-500 mb-2">🚫 Liste d&apos;exclusion</h3>
        <textarea
          value={settings.exclusionList}
          onChange={(e) => update("exclusionList", e.target.value)}
          rows={4}
          placeholder="@handle1, @handle2, @handle3..."
          className="w-full bg-bg-input border border-border-subtle rounded-xl px-4 py-3 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-border-active resize-none"
        />
        <p className="text-xs text-text-muted">Séparer les handles par des virgules. Ces profils ne seront jamais contactés.</p>
      </div>

      {/* YouTube Resources */}
      <div className="glass-card p-6 space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-widest text-gold-500 mb-2">📺 Ressources YouTube</h3>
        {Object.entries(settings.youtubeLinks).map(([key, url]) => (
          <div key={key}>
            <label className="text-xs text-text-muted uppercase tracking-wider block mb-1">{key.replace(/_/g, " ")}</label>
            <input
              type="url"
              value={url}
              onChange={(e) => update("youtubeLinks", { ...settings.youtubeLinks, [key]: e.target.value })}
              className="w-full bg-bg-input border border-border-subtle rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-border-active"
            />
          </div>
        ))}
      </div>

      {/* Save Button */}
      <button onClick={handleSave} className="btn-gold w-full py-4 text-sm">
        {saved ? "✅ Sauvegardé !" : "💾 Sauvegarder les paramètres"}
      </button>

      {/* App Info */}
      <div className="text-center py-6">
        <p className="text-[10px] text-text-disabled uppercase tracking-widest">
          Posing Empire Setter Agent v1.0 — Built with Next.js + Gemini AI
        </p>
      </div>
    </div>
  );
}
