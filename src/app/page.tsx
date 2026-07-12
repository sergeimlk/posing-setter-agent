"use client";
import { useState, useEffect, useCallback } from "react";
import QuizModal from "@/components/QuizModal";

// Mock data for demo - will be replaced by Google Sheets API data
const initialKPIs = {
  dmsSent: 0,
  dmsTarget: 150,
  callsBooked: 0,
  callsTarget: 3,
  qualifiedLeads: 0,
  responseRate: 0,
};

const initialActivity: { time: string; text: string; icon: string }[] = [];

export default function Dashboard() {
  const [kpis, setKpis] = useState(initialKPIs);
  const [activity, setActivity] = useState(initialActivity);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [lastReport, setLastReport] = useState<string | null>(null);

  // Listen for quiz event from navbar
  useEffect(() => {
    const handler = () => setShowQuiz(true);
    window.addEventListener("open-quiz", handler);
    return () => window.removeEventListener("open-quiz", handler);
  }, []);

  // Show quiz on first visit of the day
  useEffect(() => {
    const today = new Date().toDateString();
    const lastQuiz = localStorage.getItem("lastQuizDate");
    if (lastQuiz !== today) {
      setTimeout(() => setShowQuiz(true), 1500);
    }
  }, []);

  const handleAnalyzeDMs = useCallback(async () => {
    setAnalyzing(true);
    setAnalysisResult(null);
    try {
      const res = await fetch("/api/agent/analyze-dms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dmsData: "Nouvelles conversations depuis la dernière analyse. Simule 5 prospects ayant envoyé des DMs concernant leur préparation de compétition bodybuilding.",
        }),
      });
      const data = await res.json();
      setAnalysisResult(data.summary || data.result || "Analyse terminée.");
      setActivity((prev) => [
        { time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }), text: "Analyse des DMs terminée", icon: "🔍" },
        ...prev,
      ]);
    } catch (e) {
      setAnalysisResult("Erreur lors de l'analyse. Vérifiez votre clé API.");
    } finally {
      setAnalyzing(false);
    }
  }, []);

  const handleGenerateReport = useCallback(async () => {
    setReportLoading(true);
    try {
      const res = await fetch("/api/agent/daily-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportType: "midday",
          dailyData: JSON.stringify({
            dmsSent: kpis.dmsSent,
            callsBooked: kpis.callsBooked,
            qualifiedLeads: kpis.qualifiedLeads,
            responseRate: kpis.responseRate,
          }),
        }),
      });
      const data = await res.json();
      setLastReport(data.report);
      setActivity((prev) => [
        { time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }), text: "Rapport généré avec succès", icon: "📊" },
        ...prev,
      ]);
    } catch {
      setLastReport("Erreur lors de la génération du rapport.");
    } finally {
      setReportLoading(false);
    }
  }, [kpis]);

  const incrementKPI = (key: keyof typeof kpis, amount: number = 1) => {
    setKpis((prev) => ({ ...prev, [key]: (prev[key] as number) + amount }));
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-gold-500 mb-1">Dashboard</p>
          <h2 className="text-3xl md:text-4xl font-black font-display">
            <span className="text-white-gradient">Tableau de </span>
            <span className="text-gold-gradient">Bord</span>
          </h2>
          <p className="text-text-secondary text-sm mt-1">
            {new Date().toLocaleDateString("fr-FR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="DMs envoyés"
          value={kpis.dmsSent}
          target={kpis.dmsTarget}
          icon="📨"
          color={kpis.dmsSent >= kpis.dmsTarget ? "success" : kpis.dmsSent >= kpis.dmsTarget * 0.5 ? "warning" : "error"}
          onIncrement={() => incrementKPI("dmsSent", 10)}
        />
        <KPICard
          label="Appels bookés"
          value={kpis.callsBooked}
          target={kpis.callsTarget}
          icon="📞"
          color={kpis.callsBooked >= kpis.callsTarget ? "success" : "warning"}
          onIncrement={() => incrementKPI("callsBooked")}
        />
        <KPICard
          label="Leads qualifiés"
          value={kpis.qualifiedLeads}
          target={10}
          icon="🔥"
          color="warning"
          onIncrement={() => incrementKPI("qualifiedLeads")}
        />
        <KPICard
          label="Taux de réponse"
          value={kpis.responseRate}
          target={100}
          icon="📊"
          suffix="%"
          color="warning"
          onIncrement={() => incrementKPI("responseRate", 5)}
        />
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button onClick={handleAnalyzeDMs} disabled={analyzing} className="btn-gold w-full py-4 text-sm disabled:opacity-50">
          {analyzing ? (
            <span className="flex items-center gap-2">
              <span className="animate-spin">⏳</span> Analyse en cours...
            </span>
          ) : (
            <span>🔍 Lancer l&apos;analyse des DMs</span>
          )}
        </button>
        <button onClick={() => setShowQuiz(true)} className="btn-ghost w-full py-4 text-sm">
          🧠 Quiz du jour
        </button>
        <button onClick={handleGenerateReport} disabled={reportLoading} className="btn-ghost w-full py-4 text-sm disabled:opacity-50">
          {reportLoading ? "⏳ Génération..." : "📊 Générer le rapport"}
        </button>
      </div>

      {/* Analysis Result */}
      {analysisResult && (
        <div className="glass-card p-6">
          <h3 className="text-lg font-bold font-display text-gold-300 mb-3">🔍 Résultat de l&apos;analyse</h3>
          <div className="text-sm text-text-secondary whitespace-pre-wrap">{analysisResult}</div>
        </div>
      )}

      {/* Last Report */}
      {lastReport && (
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold font-display text-gold-300">📊 Dernier rapport</h3>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const blob = new Blob([lastReport], { type: "text/markdown" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `rapport_${new Date().toISOString().split("T")[0]}.md`;
                  a.click();
                }}
                className="btn-ghost text-xs"
              >
                ⬇️ .MD
              </button>
            </div>
          </div>
          <div className="text-sm text-text-secondary whitespace-pre-wrap max-h-96 overflow-y-auto">{lastReport}</div>
        </div>
      )}

      {/* Funnel + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Funnel */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-bold font-display text-gold-300 mb-4">🎯 Entonnoir de prospection</h3>
          <div className="space-y-3">
            <FunnelStep label="Contactés" value={kpis.dmsSent} max={150} color="#d4a843" />
            <FunnelStep label="Réponses" value={Math.round(kpis.dmsSent * (kpis.responseRate / 100))} max={kpis.dmsSent || 1} color="#ffca28" />
            <FunnelStep label="Qualifiés" value={kpis.qualifiedLeads} max={Math.round(kpis.dmsSent * 0.2) || 1} color="#ffd54f" />
            <FunnelStep label="Appels bookés" value={kpis.callsBooked} max={kpis.qualifiedLeads || 1} color="#4ade80" />
            <FunnelStep label="Closés" value={0} max={kpis.callsBooked || 1} color="#22c55e" />
          </div>
        </div>

        {/* Activity Feed */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-bold font-display text-gold-300 mb-4">📋 Fil d&apos;activité</h3>
          {activity.length === 0 ? (
            <p className="text-sm text-text-muted italic">Aucune activité pour le moment. Lance une analyse pour commencer !</p>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {activity.map((a, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-bg-card/50 border border-border-white">
                  <span className="text-lg">{a.icon}</span>
                  <div>
                    <p className="text-sm text-text-primary">{a.text}</p>
                    <p className="text-xs text-text-muted">{a.time}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quiz Modal */}
      {showQuiz && <QuizModal onClose={() => setShowQuiz(false)} />}
    </div>
  );
}

function KPICard({
  label, value, target, icon, color, suffix = "", onIncrement,
}: {
  label: string; value: number; target: number; icon: string; color: string; suffix?: string;
  onIncrement: () => void;
}) {
  const pct = Math.min((value / target) * 100, 100);
  const colorMap: Record<string, string> = { success: "#4ade80", warning: "#fbbf24", error: "#ef4444" };

  return (
    <div className="glass-card p-5 cursor-pointer group" onClick={onIncrement}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-2xl">{icon}</span>
        <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">{label}</span>
      </div>
      <p className="text-3xl font-black font-display text-white mb-1">
        {value}{suffix}
        <span className="text-sm font-normal text-text-muted ml-1">/ {target}{suffix}</span>
      </p>
      <div className="w-full bg-bg-primary rounded-full h-1.5 mt-2">
        <div className="h-1.5 rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: colorMap[color] || "#d4a843" }} />
      </div>
      <p className="text-[10px] text-text-muted mt-2 opacity-0 group-hover:opacity-100 transition-opacity">Cliquer pour +1</p>
    </div>
  );
}

function FunnelStep({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-text-secondary">{label}</span>
        <span className="font-bold" style={{ color }}>{value}</span>
      </div>
      <div className="w-full bg-bg-primary rounded-full h-2">
        <div className="h-2 rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}
