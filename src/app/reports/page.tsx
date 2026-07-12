"use client";
import { useState } from "react";

interface Report {
  id: string;
  type: "morning" | "midday" | "evening";
  date: string;
  content: string;
  timestamp: string;
}

const typeLabels: Record<string, { label: string; icon: string; color: string }> = {
  morning: { label: "Matin", icon: "🌅", color: "#fbbf24" },
  midday: { label: "Mi-journée", icon: "☀️", color: "#d4a843" },
  evening: { label: "Soir", icon: "🌙", color: "#b8942d" },
};

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [generating, setGenerating] = useState<string | null>(null);
  const [sheetsUrl] = useState("https://docs.google.com/spreadsheets/d/1afeUsmftVlJhN4sh83MlcRQxFTnx3JZ3B-UhoYthf60/edit");

  const generateReport = async (type: "morning" | "midday" | "evening") => {
    setGenerating(type);
    try {
      const res = await fetch("/api/agent/daily-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportType: type,
          dailyData: `Date: ${new Date().toLocaleDateString("fr-FR")}. Type: ${typeLabels[type].label}. Données de la période actuelle.`,
        }),
      });
      const data = await res.json();
      const newReport: Report = {
        id: `${type}-${Date.now()}`,
        type,
        date: new Date().toLocaleDateString("fr-FR"),
        content: data.report || "Erreur lors de la génération",
        timestamp: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
      };
      setReports((prev) => [newReport, ...prev]);
      setSelectedReport(newReport);
    } catch {
      const errReport: Report = {
        id: `err-${Date.now()}`,
        type,
        date: new Date().toLocaleDateString("fr-FR"),
        content: "❌ Erreur de connexion à l'API. Vérifiez votre clé Gemini.",
        timestamp: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
      };
      setReports((prev) => [errReport, ...prev]);
      setSelectedReport(errReport);
    } finally {
      setGenerating(null);
    }
  };

  const downloadMD = (report: Report) => {
    const blob = new Blob([report.content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rapport_${report.type}_${report.date.replace(/\//g, "-")}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadTXT = (report: Report) => {
    const blob = new Blob([report.content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rapport_${report.type}_${report.date.replace(/\//g, "-")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-gold-500 mb-1">Rapports</p>
          <h2 className="text-3xl md:text-4xl font-black font-display">
            <span className="text-white-gradient">Rapports & </span>
            <span className="text-gold-gradient">Analytics</span>
          </h2>
        </div>
        <a href={sheetsUrl} target="_blank" className="btn-ghost text-xs">
          📊 Ouvrir Google Sheets
        </a>
      </div>

      {/* Generate Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(["morning", "midday", "evening"] as const).map((type) => {
          const info = typeLabels[type];
          return (
            <button
              key={type}
              onClick={() => generateReport(type)}
              disabled={generating !== null}
              className="glass-card p-6 text-left hover:border-border-hover transition-all disabled:opacity-50 group"
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">{info.icon}</span>
                <div>
                  <p className="text-sm font-bold text-white">Rapport {info.label}</p>
                  <p className="text-[10px] text-text-muted">
                    {type === "morning" ? "08h00" : type === "midday" ? "14h00" : "20h00"}
                  </p>
                </div>
              </div>
              <div className="btn-gold w-full text-xs group-hover:shadow-lg">
                {generating === type ? "⏳ Génération..." : `Générer le rapport ${info.label.toLowerCase()}`}
              </div>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Report List */}
        <div className="lg:col-span-4 glass-card p-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-text-muted mb-3">Historique</h3>
          {reports.length === 0 ? (
            <p className="text-sm text-text-muted italic p-4 text-center">
              Aucun rapport généré. Cliquez sur un bouton ci-dessus.
            </p>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {reports.map((r) => {
                const info = typeLabels[r.type];
                return (
                  <button
                    key={r.id}
                    onClick={() => setSelectedReport(r)}
                    className={`w-full text-left p-3 rounded-xl transition-all ${
                      selectedReport?.id === r.id
                        ? "bg-gold-900/30 border border-border-active"
                        : "bg-bg-card/50 border border-transparent hover:border-border-subtle"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span>{info.icon}</span>
                      <span className="text-sm font-bold text-white">Rapport {info.label}</span>
                    </div>
                    <p className="text-[10px] text-text-muted">{r.date} à {r.timestamp}</p>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Report Content */}
        <div className="lg:col-span-8 glass-card p-6">
          {selectedReport ? (
            <>
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-border-subtle">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{typeLabels[selectedReport.type].icon}</span>
                  <div>
                    <h3 className="text-lg font-bold text-white">Rapport {typeLabels[selectedReport.type].label}</h3>
                    <p className="text-xs text-text-muted">{selectedReport.date} à {selectedReport.timestamp}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => downloadMD(selectedReport)} className="btn-ghost text-[10px]">
                    ⬇️ .MD
                  </button>
                  <button onClick={() => downloadTXT(selectedReport)} className="btn-ghost text-[10px]">
                    ⬇️ .TXT
                  </button>
                </div>
              </div>
              <div className="prose prose-invert max-w-none text-sm text-text-secondary whitespace-pre-wrap leading-relaxed max-h-[500px] overflow-y-auto">
                {selectedReport.content}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-64 text-text-muted text-sm">
              Sélectionnez ou générez un rapport
            </div>
          )}
        </div>
      </div>

      {/* Google Sheets CRM Section */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-bold font-display text-gold-300 mb-4">📊 CRM Google Sheets</h3>
        <p className="text-sm text-text-secondary mb-4">
          Le document Google Sheets contient 4 feuilles auto-créées : Tracking Journalier, Prospects Qualifiés, Historique Messages, et Performances Hebdo.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <SheetCard title="📊 Tracking Journalier" desc="KPIs quotidiens : DMs, réponses, appels, ventes" />
          <SheetCard title="🔥 Prospects Qualifiés" desc="Fiches prospects avec scores et étapes Hans" />
          <SheetCard title="💬 Historique Messages" desc="Tous les messages envoyés/reçus avec transcriptions" />
          <SheetCard title="📈 Performances Hebdo" desc="Synthèse hebdomadaire et recommandations agent" />
        </div>
        <a href={sheetsUrl} target="_blank" className="btn-gold mt-4 inline-flex text-xs">
          Ouvrir le Google Sheets →
        </a>
      </div>
    </div>
  );
}

function SheetCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="bg-bg-card/50 rounded-xl p-4 border border-border-white">
      <h4 className="text-xs font-bold text-white mb-1">{title}</h4>
      <p className="text-[10px] text-text-muted">{desc}</p>
    </div>
  );
}
