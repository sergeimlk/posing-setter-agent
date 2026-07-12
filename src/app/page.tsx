"use client";
import { useState, useEffect, useCallback } from "react";
import QuizModal from "@/components/QuizModal";
import instagramData from "@/data/instagram-data.json";
import { Star, ChevronLeft, ChevronRight, MessageCircle, AlertTriangle, CheckCircle2, Trophy, BarChart3, TrendingUp } from "lucide-react";

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
}

const initialKPIs = {
  dmsSent: 45,
  dmsTarget: 150,
  callsBooked: 1,
  callsTarget: 3,
  qualifiedLeads: 4,
  responseRate: 25,
};

const initialActivity = [
  { time: "12:45", text: "Prospect @lucas_classic_physique qualifié au niveau 5 (Bilan posing)", icon: "🔥" },
  { time: "11:30", text: "Message vocal transcrit pour @thomas_wnbf_natty", icon: "🎤" },
  { time: "10:15", text: "Nouveau lead détecté dans les abonnés: @alex_gainz_99", icon: "👤" }
];

export default function Dashboard() {
  const [kpis, setKpis] = useState(initialKPIs);
  const [activity, setActivity] = useState(initialActivity);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [lastReport, setLastReport] = useState<string | null>(null);

  // Card Swap state
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAllGrid, setShowAllGrid] = useState(false);

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
            size={12}
            className={s <= count ? "text-gold-400 fill-gold-400" : "text-text-disabled"}
          />
        ))}
      </div>
    );
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

      {/* Card Swap Section */}
      {prospects.length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3
              onClick={() => setShowAllGrid(!showAllGrid)}
              className="text-lg font-black font-display text-gold-300 cursor-pointer hover:text-gold-200 transition-colors flex items-center gap-2 group"
            >
              🔥 Meilleurs prospects qualifiés du jour
              <span className="text-xs font-normal text-text-muted group-hover:underline">
                (Voir tout sous forme de grille)
              </span>
            </h3>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentCardIndex((prev) => (prev > 0 ? prev - 1 : prospects.length - 1))}
                className="p-2 rounded-full border border-border-subtle bg-bg-card hover:bg-bg-card-hover text-white transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setCurrentCardIndex((prev) => (prev < prospects.length - 1 ? prev + 1 : 0))}
                className="p-2 rounded-full border border-border-subtle bg-bg-card hover:bg-bg-card-hover text-white transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Chroma Grid View Overlay / Toggle */}
          {showAllGrid ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-bg-card/30 rounded-2xl border border-border-white animate-fadeIn">
              {prospects.map((p, idx) => (
                <div
                  key={p.handle}
                  className="glass-card p-5 relative overflow-hidden group hover:border-border-active transition-all cursor-pointer"
                  onClick={() => {
                    setCurrentCardIndex(idx);
                    setShowAllGrid(false);
                  }}
                >
                  <div className="flex justify-between items-start mb-3">
                    <span className="font-bold text-white text-sm">{p.handle}</span>
                    <span className="text-xs font-black text-gold-400">{p.score}/100</span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-text-muted">Étape Hans:</span>
                      <span className="font-bold text-white">{p.hansStep}/7</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">Pertinence:</span>
                      {renderStars(p.pertinence)}
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">Propension:</span>
                      {renderStars(p.propension)}
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted">Fédération:</span>
                      <span className="font-semibold text-white">{p.federation}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Card Swap Display */
            <div className="relative h-[320px] max-w-xl mx-auto flex items-center justify-center">
              {prospects.map((p, idx) => {
                const isCurrent = idx === currentCardIndex;
                const offset = idx - currentCardIndex;
                if (Math.abs(offset) > 1 && idx !== 0 && idx !== prospects.length - 1) return null;

                let transformStyle = "scale(0.9) translate3d(0, 0, 0)";
                let opacityStyle = 0;
                let zIndex = 0;

                if (isCurrent) {
                  transformStyle = "scale(1) translate3d(0, 0, 0)";
                  opacityStyle = 1;
                  zIndex = 30;
                } else if (offset === 1 || (offset === -(prospects.length - 1) && currentCardIndex === prospects.length - 1)) {
                  transformStyle = "scale(0.95) translate3d(40px, 0, -20px)";
                  opacityStyle = 0.6;
                  zIndex = 20;
                } else if (offset === -1 || (offset === (prospects.length - 1) && currentCardIndex === 0)) {
                  transformStyle = "scale(0.95) translate3d(-40px, 0, -20px)";
                  opacityStyle = 0.6;
                  zIndex = 10;
                }

                return (
                  <div
                    key={p.handle}
                    className="absolute w-full max-w-md h-full glass-card p-6 flex flex-col justify-between transition-all duration-500 ease-out border-t-4 border-t-gold-500"
                    style={{
                      transform: transformStyle,
                      opacity: opacityStyle,
                      zIndex: zIndex,
                      pointerEvents: isCurrent ? "auto" : "none",
                    }}
                  >
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="text-xl font-black text-white">{p.handle}</h4>
                          <p className="text-xs text-gold-400 font-semibold">{p.categoryBody} • {p.federation}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-black text-gold-500">{p.score}</p>
                          <p className="text-[10px] text-text-muted uppercase tracking-widest">Score Qualif</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 bg-bg-primary/50 rounded-xl p-3 border border-border-white mb-4">
                        <div>
                          <p className="text-[10px] text-text-muted uppercase">Pertinence</p>
                          <div className="mt-1">{renderStars(p.pertinence)}</div>
                        </div>
                        <div>
                          <p className="text-[10px] text-text-muted uppercase">Propension Achat</p>
                          <div className="mt-1">{renderStars(p.propension)}</div>
                        </div>
                      </div>

                      <p className="text-sm text-text-secondary line-clamp-2 italic">“ {p.notes} ”</p>
                    </div>

                    <div className="flex items-center justify-between border-t border-border-subtle pt-4">
                      <div>
                        <p className="text-[10px] text-text-muted uppercase">Étape Hans</p>
                        <p className="text-xs font-bold text-white">{p.hansStep}/7 - {["", "Icebreaker", "Contexte", "Objectif", "Bilan", "Douleur", "Conscience", "CTA"][p.hansStep]}</p>
                      </div>
                      <a href="/messages" className="btn-gold py-2 px-4 text-xs flex items-center gap-1.5">
                        <MessageCircle size={14} /> Setter
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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
