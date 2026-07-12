"use client";
import { useState, useEffect, useCallback } from "react";
import QuizModal from "@/components/QuizModal";
import instagramData from "@/data/instagram-data.json";
import { Star, MessageCircle, ExternalLink, RefreshCw, Sparkles, TrendingUp, HelpCircle } from "lucide-react";
import Link from "next/link";

interface Prospect {
  handle: string;
  score: number;
  category: string;
  hansStep: number;
  pertinence: number;
  propension: number;
  federation: string;
  categoryBody: string;
  compDate: string;
  notes: string;
  avatar?: string;
}

const initialKPIs = {
  dmsSent: 45,
  dmsTarget: 150,
  callsBooked: 1,
  callsTarget: 3,
  qualifiedLeads: 7,
  responseRate: 28,
};

const initialActivity = [
  { time: "12:45", text: "Prospect @lois_posing qualifié au niveau 5 (Bilan posing)", icon: "🔥" },
  { time: "11:30", text: "Message vocal transcrit pour @livio_posing", icon: "🎤" },
  { time: "10:15", text: "Nouveau lead détecté dans les abonnés: @mael_posing", icon: "👤" }
];

export default function Dashboard() {
  const [kpis, setKpis] = useState(initialKPIs);
  const [activity, setActivity] = useState(initialActivity);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [lastReport, setLastReport] = useState<string | null>(null);
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (instagramData && instagramData.prospects) {
      setProspects(instagramData.prospects as Prospect[]);
    }
  }, []);

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
          dmsData: JSON.stringify(prospects.slice(0, 3)),
        }),
      });
      const data = await res.json();
      setAnalysisResult(data.summary || data.result || "Analyse terminée.");
      setActivity((prev) => [
        { time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }), text: "Analyse automatique des DMs Instagram terminée", icon: "🔍" },
        ...prev,
      ]);
    } catch {
      setAnalysisResult("Erreur lors de l'analyse. Vérifiez votre clé API.");
    } finally {
      setAnalyzing(false);
    }
  }, [prospects]);

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
        { time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }), text: "Rapport de mi-journée généré", icon: "📊" },
        ...prev,
      ]);
    } catch {
      setLastReport("Erreur lors de la génération du rapport.");
    } finally {
      setReportLoading(false);
    }
  }, [kpis]);

  const handleSyncBrowser = async () => {
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
      alert("⚠️ Synchronisation initiée... Exécutez 'node scripts/sync-instagram.js' dans votre terminal pour extraire les DMs de Chrome.");
    }, 1000);
  };

  const adjustKPI = (key: keyof typeof kpis, amount: number) => {
    setKpis((prev) => ({
      ...prev,
      [key]: Math.max(0, (prev[key] as number) + amount),
    }));
  };

  const renderStars = (count: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star
            key={s}
            size={10}
            className={s <= count ? "text-gold-400 fill-gold-400" : "text-text-disabled"}
          />
        ))}
      </div>
    );
  };

  const getStepName = (step: number) => {
    return ["", "Icebreaker", "Contexte", "Objectif", "Bilan", "Douleur", "Conscience", "CTA"][step] || "";
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-gold-500 mb-1">Posing Empire</p>
          <h2 className="text-3xl md:text-4xl font-black font-display">
            <span className="text-white-gradient">Tableau de </span>
            <span className="text-gold-gradient">Bord</span>
          </h2>
          <p className="text-text-secondary text-sm mt-1">
            {new Date().toLocaleDateString("fr-FR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <button 
          onClick={handleSyncBrowser} 
          disabled={syncing}
          className="btn-ghost text-xs flex items-center gap-1.5 self-start md:self-auto"
        >
          <RefreshCw size={12} className={syncing ? "animate-spin" : ""} />
          Sync depuis Instagram Chrome Mac
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="DMs envoyés"
          value={kpis.dmsSent}
          target={kpis.dmsTarget}
          icon="📨"
          color={kpis.dmsSent >= kpis.dmsTarget ? "success" : kpis.dmsSent >= kpis.dmsTarget * 0.5 ? "warning" : "error"}
          onIncrement={() => adjustKPI("dmsSent", 10)}
          onDecrement={() => adjustKPI("dmsSent", -10)}
        />
        <KPICard
          label="Appels bookés"
          value={kpis.callsBooked}
          target={kpis.callsTarget}
          icon="📞"
          color={kpis.callsBooked >= kpis.callsTarget ? "success" : "warning"}
          onIncrement={() => adjustKPI("callsBooked", 1)}
          onDecrement={() => adjustKPI("callsBooked", -1)}
        />
        <KPICard
          label="Leads qualifiés"
          value={kpis.qualifiedLeads}
          target={10}
          icon="🔥"
          color="warning"
          onIncrement={() => adjustKPI("qualifiedLeads", 1)}
          onDecrement={() => adjustKPI("qualifiedLeads", -1)}
        />
        <KPICard
          label="Taux de réponse"
          value={kpis.responseRate}
          target={100}
          icon="📊"
          suffix="%"
          color="warning"
          onIncrement={() => adjustKPI("responseRate", 5)}
          onDecrement={() => adjustKPI("responseRate", -5)}
        />
      </div>

      {/* Grid of Prospects */}
      {prospects.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-black font-display text-gold-300 flex items-center gap-2">
            🔥 Meilleurs Prospects Qualifiés (Instagram Réel)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {prospects.map((p) => (
              <div
                key={p.handle}
                className="glass-card p-5 relative overflow-hidden flex flex-col justify-between hover:border-border-active transition-all group"
              >
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    {p.avatar ? (
                      <img
                        src={p.avatar}
                        alt={p.handle}
                        className="w-12 h-12 rounded-full object-cover border border-gold-500/20"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gold-900/40 border border-border-subtle flex items-center justify-center text-lg">
                        👤
                      </div>
                    )}
                    <div>
                      {/* Clickable Instagram Direct Link */}
                      <a
                        href={`https://www.instagram.com/${p.handle}/`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-bold text-white text-sm hover:text-gold-400 flex items-center gap-1.5 transition-colors"
                      >
                        @{p.handle}
                        <ExternalLink size={12} className="text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                      </a>
                      <p className="text-[10px] text-gold-500 font-medium">
                        {p.categoryBody} • {p.federation}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs border-t border-border-white/5 pt-3 mb-4">
                    <div className="flex justify-between">
                      <span className="text-text-muted">Score Qualif :</span>
                      <span className="font-black text-gold-400">{p.score}/100</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">Étape Hans :</span>
                      <span className="font-bold text-white">
                        {p.hansStep}/7 - {getStepName(p.hansStep)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">Pertinence :</span>
                      {renderStars(p.pertinence)}
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">Propension :</span>
                      {renderStars(p.propension)}
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">Compétition :</span>
                      <span className="text-white font-medium">{p.compDate}</span>
                    </div>
                    <p className="text-xs text-text-secondary mt-2 line-clamp-3 italic">
                      &ldquo; {p.notes} &rdquo;
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-border-white/5 flex gap-2">
                  <a
                    href={`https://www.instagram.com/${p.handle}/`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-ghost flex-1 text-center py-2 text-xs flex items-center justify-center gap-1"
                  >
                    💬 Message DM
                  </a>
                  <Link
                    href={`/agent?prospect=${p.handle}&step=${p.hansStep}`}
                    className="btn-gold py-2 px-3 text-xs flex items-center justify-center"
                    title="Générer brouillon"
                  >
                    <Sparkles size={12} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
          <div className="text-sm text-text-secondary whitespace-pre-wrap max-h-96 overflow-y-auto">{lastReport}</div>
        </div>
      )}

      {/* Funnel + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

        <div className="glass-card p-6">
          <h3 className="text-lg font-bold font-display text-gold-300 mb-4">📋 Fil d&apos;activité</h3>
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
        </div>
      </div>

      {showQuiz && <QuizModal onClose={() => setShowQuiz(false)} />}
    </div>
  );
}

function KPICard({
  label, value, target, icon, color, suffix = "", onIncrement, onDecrement,
}: {
  label: string; value: number; target: number; icon: string; color: string; suffix?: string;
  onIncrement: () => void; onDecrement: () => void;
}) {
  const pct = Math.min((value / target) * 100, 100);
  const colorMap: Record<string, string> = { success: "#4ade80", warning: "#fbbf24", error: "#ef4444" };

  return (
    <div className="glass-card p-5 relative overflow-hidden group">
      <div className="flex items-center justify-between mb-3">
        <span className="text-2xl">{icon}</span>
        <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">{label}</span>
      </div>
      
      <div className="flex items-center justify-between mb-1">
        <p className="text-3xl font-black font-display text-white">
          {value}{suffix}
          <span className="text-sm font-normal text-text-muted ml-1">/ {target}{suffix}</span>
        </p>
        
        {/* +/- Adjust buttons */}
        <div className="flex gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); onDecrement(); }}
            className="w-7 h-7 rounded-lg bg-bg-primary border border-border-subtle hover:border-border-hover text-white flex items-center justify-center font-bold text-sm transition-all"
          >
            -
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onIncrement(); }}
            className="w-7 h-7 rounded-lg bg-bg-primary border border-border-subtle hover:border-border-hover text-white flex items-center justify-center font-bold text-sm transition-all"
          >
            +
          </button>
        </div>
      </div>

      <div className="w-full bg-bg-primary rounded-full h-1.5 mt-2">
        <div className="h-1.5 rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: colorMap[color] || "#d4a843" }} />
      </div>
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
