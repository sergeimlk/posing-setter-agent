"use client";
import { useState, useEffect, useCallback } from "react";
import QuizModal from "@/components/QuizModal";
import instagramData from "@/data/instagram-data.json";
import { Star, MessageCircle, ExternalLink, RefreshCw, Sparkles, TrendingUp, HelpCircle, Edit2, Check, X } from "lucide-react";
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
  isFollower?: boolean;
  interactionText?: string;
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
  { time: "12:45", text: "Prospect @lvcxs_itl qualifié au niveau 4 (Bilan posing)", icon: "🔥" },
  { time: "11:30", text: "Message vocal transcrit pour @vuckro", icon: "🎤" },
  { time: "10:15", text: "Nouveau lead détecté dans les abonnés: @maelledeltour", icon: "👤" }
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

  const [usingFallback, setUsingFallback] = useState(false);
  const [sheetPrivate, setSheetPrivate] = useState(false);
  const [loadingProspects, setLoadingProspects] = useState(true);

  // Edit Prospect State
  const [editingHandle, setEditingHandle] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState("");
  const [editScore, setEditScore] = useState(50);
  const [editStep, setEditStep] = useState(1);
  const [editFed, setEditFed] = useState("N/A");
  const [savingProspect, setSavingProspect] = useState<string | null>(null);

  const fetchProspects = useCallback(async () => {
    setLoadingProspects(true);
    try {
      let sheetId = "1afeUsmftVlJhN4sh83MlcRQxFTnx3JZ3B-UhoYthf60";
      let appsScriptUrl = "";
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem("setterSettings");
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (parsed.sheetsId) sheetId = parsed.sheetsId;
            if (parsed.appsScriptUrl) appsScriptUrl = parsed.appsScriptUrl;
          } catch (e) {}
        }
      }

      const res = await fetch(`/api/agent/prospects?sheetId=${sheetId}&appsScriptUrl=${encodeURIComponent(appsScriptUrl)}`, { cache: "no-store" });
      const data = await res.json();
      if (data.prospects) {
        setProspects(data.prospects);
      }
      setUsingFallback(!!data.usingFallback);
      setSheetPrivate(!!data.sheetPrivate);
    } catch (err) {
      console.error("Error loading prospects:", err);
      setUsingFallback(true);
    } finally {
      setLoadingProspects(false);
    }
  }, []);

  useEffect(() => {
    fetchProspects();
  }, [fetchProspects]);

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
    try {
      const res = await fetch("/api/agent/sync-instagram", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setActivity((prev) => [
          { time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }), text: "Lancement de la synchronisation intelligente (Priorisation des abonnés actifs)", icon: "⚡" },
          ...prev,
        ]);
        alert("⚡ " + data.message);
        // Refresh prospects list after 15 seconds
        setTimeout(() => {
          fetchProspects();
        }, 15000);
      } else {
        alert("❌ Erreur de synchronisation: " + data.error);
      }
    } catch (err: any) {
      alert("❌ Échec de la requête: " + err.message);
    } finally {
      setSyncing(false);
    }
  };

  const adjustKPI = async (key: keyof typeof kpis, amount: number) => {
    const updatedValue = Math.max(0, (kpis[key] as number) + amount);
    const newKpis = { ...kpis, [key]: updatedValue };
    setKpis(newKpis);

    let appsScriptUrl = "";
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("setterSettings");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.appsScriptUrl) appsScriptUrl = parsed.appsScriptUrl;
        } catch (e) {}
      }
    }

    try {
      await fetch("/api/agent/sheets-crm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appsScriptUrl,
          action: "updateKPIs",
          kpis: newKpis,
        }),
      });
      setActivity((prev) => [
        { time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }), text: `KPI "${key}" mis à jour dans le CRM`, icon: "📊" },
        ...prev,
      ]);
    } catch (err) {
      console.error("Failed to sync KPIs:", err);
    }
  };

  const startEditing = (p: Prospect) => {
    setEditingHandle(p.handle);
    setEditNotes(p.notes);
    setEditScore(p.score);
    setEditStep(p.hansStep);
    setEditFed(p.federation);
  };

  const saveProspectChanges = async (p: Prospect) => {
    setSavingProspect(p.handle);
    
    const updatedProspect: Prospect = {
      ...p,
      notes: editNotes,
      score: editScore,
      hansStep: editStep,
      federation: editFed,
      category: editScore >= 80 ? "hot" : editScore >= 65 ? "principal" : "tiede"
    };

    // Update locally first
    setProspects((prev) => prev.map((pr) => (pr.handle === p.handle ? updatedProspect : pr)));

    let appsScriptUrl = "";
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("setterSettings");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.appsScriptUrl) appsScriptUrl = parsed.appsScriptUrl;
        } catch (e) {}
      }
    }

    try {
      const res = await fetch("/api/agent/sheets-crm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appsScriptUrl,
          action: "addOrUpdateProspect",
          prospect: {
            handle: updatedProspect.handle,
            score: updatedProspect.score,
            category: updatedProspect.category,
            hansStep: updatedProspect.hansStep,
            pertinence: updatedProspect.pertinence,
            propension: updatedProspect.propension,
            federation: updatedProspect.federation,
            categoryBody: updatedProspect.categoryBody,
            compDate: updatedProspect.compDate,
            notes: updatedProspect.notes
          }
        }),
      });
      const result = await res.json();
      if (result.success) {
        setActivity((prev) => [
          { time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }), text: `Prospect @${p.handle} enregistré avec succès`, icon: "✅" },
          ...prev,
        ]);
      } else {
        alert(`Erreur de synchronisation : ${result.error}`);
      }
    } catch (err: any) {
      console.error("Failed to save prospect:", err);
      alert(`Erreur lors de la sauvegarde : ${err.message}`);
    }

    setSavingProspect(null);
    setEditingHandle(null);
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

      {usingFallback && sheetPrivate && (
        <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-300 text-xs space-y-2 animate-fadeIn">
          <p className="font-bold flex items-center gap-1.5 text-sm">
            <span>⚠️</span> CRM Google Sheets Privé (Lecture impossible)
          </p>
          <p className="leading-relaxed">
            Votre document CRM actuel est privé. Pour afficher et gérer vos <strong>vrais prospects</strong> directement depuis Sheets en temps réel, suivez ces étapes simples :
          </p>
          <ol className="list-decimal pl-5 space-y-1">
            <li>Ouvrez votre document <a href="https://docs.google.com/spreadsheets/d/1afeUsmftVlJhN4sh83MlcRQxFTnx3JZ3B-UhoYthf60/edit" target="_blank" rel="noopener noreferrer" className="underline font-bold hover:text-amber-200">Google Sheet CRM</a>.</li>
            <li>Cliquez sur le bouton bleu <strong>Partager</strong> en haut à droite.</li>
            <li>Sous <strong>Accès général</strong>, changez &ldquo;Limité&rdquo; par <strong>&ldquo;Tous les utilisateurs disposant du lien&rdquo;</strong> en mode <strong>Lecteur</strong>.</li>
            <li>Actualisez ce tableau de bord pour charger les données réelles de votre CRM !</li>
          </ol>
        </div>
      )}

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
            {prospects.map((p) => {
              const isEditing = editingHandle === p.handle;
              return (
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
                      <div className="flex-1 min-w-0">
                        {/* Clickable Instagram Direct Link */}
                        <a
                          href={`https://www.instagram.com/${p.handle}/`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-bold text-white text-sm hover:text-gold-400 flex items-center gap-1.5 transition-colors truncate"
                        >
                          @{p.handle}
                          <ExternalLink size={12} className="text-text-muted opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                        </a>
                        <p className="text-[10px] text-gold-500 font-medium truncate">
                          {p.categoryBody} • {isEditing ? (
                            <input
                              type="text"
                              value={editFed}
                              onChange={(e) => setEditFed(e.target.value)}
                              className="bg-bg-input border border-border-subtle text-white text-[10px] px-1 py-0.5 w-16 focus:outline-none"
                            />
                          ) : (
                            p.federation
                          )}
                        </p>
                        
                        {/* Follower and Interaction Badges */}
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {p.isFollower !== false ? (
                            <span className="text-[8px] bg-green-500/10 text-green-400 border border-green-500/20 px-1 py-0.5 rounded uppercase font-extrabold tracking-wider">
                              Abonné
                            </span>
                          ) : (
                            <span className="text-[8px] bg-white/5 text-text-muted border border-white/10 px-1 py-0.5 rounded uppercase font-extrabold tracking-wider">
                              Non Abonné
                            </span>
                          )}
                          {p.interactionText && (
                            <span className="text-[8px] bg-gold-400/10 text-gold-300 border border-gold-400/20 px-1 py-0.5 rounded font-extrabold uppercase tracking-wider animate-pulse">
                              ⚡ Interagit
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Recent Activity Alert Box */}
                    {p.interactionText && (
                      <div className="bg-gold-500/5 border border-gold-500/10 rounded-lg p-2.5 mb-3 text-[11px] text-gold-200 font-medium flex items-start gap-1.5">
                        <span className="text-xs">🔥</span>
                        <div className="min-w-0">
                          <span className="text-[8px] text-gold-500 block uppercase font-black tracking-wider mb-0.5">Activité Récente</span>
                          <span className="truncate block" title={p.interactionText}>{p.interactionText}</span>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2 text-xs border-t border-border-white/5 pt-3 mb-4">
                      <div className="flex justify-between items-center h-6">
                        <span className="text-text-muted">Score Qualif :</span>
                        {isEditing ? (
                          <input
                            type="number"
                            value={editScore}
                            min={0}
                            max={100}
                            onChange={(e) => setEditScore(parseInt(e.target.value, 10) || 50)}
                            className="bg-bg-input border border-border-subtle text-gold-400 text-xs px-1.5 py-0.5 w-14 font-black focus:outline-none text-right"
                          />
                        ) : (
                          <span className="font-black text-gold-400">{p.score}/100</span>
                        )}
                      </div>
                      <div className="flex justify-between items-center h-6">
                        <span className="text-text-muted">Étape Hans :</span>
                        {isEditing ? (
                          <select
                            value={editStep}
                            onChange={(e) => setEditStep(parseInt(e.target.value, 10) || 1)}
                            className="bg-bg-input border border-border-subtle text-white text-[10px] px-1 py-0.5 focus:outline-none"
                          >
                            {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                              <option key={num} value={num}>Étape {num}</option>
                            ))}
                          </select>
                        ) : (
                          <span className="font-bold text-white">
                            {p.hansStep}/7 - {getStepName(p.hansStep)}
                          </span>
                        )}
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
                      
                      {/* Notes / Edit Notes */}
                      {isEditing ? (
                        <textarea
                          value={editNotes}
                          onChange={(e) => setEditNotes(e.target.value)}
                          rows={3}
                          className="w-full bg-bg-input border border-border-subtle rounded-lg p-2 text-xs text-text-primary focus:outline-none mt-2 resize-none"
                        />
                      ) : (
                        <p className="text-xs text-text-secondary mt-2 line-clamp-3 italic">
                          &ldquo; {p.notes} &rdquo;
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-border-white/5 flex gap-2">
                    {isEditing ? (
                      <>
                        <button
                          onClick={() => saveProspectChanges(p)}
                          disabled={savingProspect === p.handle}
                          className="btn-gold flex-1 py-2 text-xs flex items-center justify-center gap-1 disabled:opacity-50"
                        >
                          <Check size={12} /> {savingProspect === p.handle ? "Sauvegarde..." : "Enregistrer"}
                        </button>
                        <button
                          onClick={() => setEditingHandle(null)}
                          className="btn-ghost py-2 px-2 text-xs"
                        >
                          <X size={12} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => startEditing(p)}
                          className="btn-ghost p-2.5 text-xs flex items-center justify-center"
                          title="Modifier les infos"
                        >
                          <Edit2 size={12} />
                        </button>
                        <a
                          href={`https://www.instagram.com/${p.handle}/`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-ghost flex-1 text-center py-2.5 text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 whitespace-nowrap"
                        >
                          💬 DM
                        </a>
                        <Link
                          href={`/agent?prospect=${p.handle}&step=${p.hansStep}`}
                          className="btn-gold py-2.5 px-3 text-xs flex items-center justify-center"
                          title="Générer brouillon"
                        >
                          <Sparkles size={12} />
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
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
