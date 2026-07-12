"use client";
import { useState, useEffect } from "react";
import instagramData from "@/data/instagram-data.json";
import { Copy, Check, MessageSquare, ExternalLink, RefreshCw, Star } from "lucide-react";

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

interface ChatUser {
  handle: string;
  lastMessage: string;
  time: string;
}

export default function MessagesPage() {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [selected, setSelected] = useState<Prospect | null>(null);
  const [drafts, setDrafts] = useState<string[]>([]);
  const [draftLoading, setDraftLoading] = useState(false);
  const [copied, setCopied] = useState<number | null>(null);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (instagramData && instagramData.prospects) {
      const list = instagramData.prospects as Prospect[];
      setProspects(list);
      setSelected(list[0] || null);
    }
  }, []);

  const cleanText = (text: string) => {
    return text
      .replace(/\*\*/g, "")
      .replace(/---/g, "")
      .replace(/###/g, "")
      .replace(/##/g, "")
      .replace(/#/g, "")
      .replace(/`/g, "")
      .trim();
  };

  const generateDrafts = async () => {
    if (!selected) return;
    setDraftLoading(true);
    setDrafts([]);
    try {
      const res = await fetch("/api/agent/generate-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationHistory: `moi: Bienvenue sur le compte de @manael.posing bro. Tu t'entraînes pour quelle fédération?\nprospect: Je fais du Classic physique en ${selected.federation || "IFBB"}.`,
          prospectInfo: `${selected.handle}, score ${selected.score}/100, catégorie ${selected.categoryBody}`,
          hansStep: selected.hansStep,
        }),
      });
      const data = await res.json();
      setDrafts((data.drafts || []).map((d: string) => cleanText(d)));
    } catch {
      setDrafts(["Erreur lors de la génération."]);
    } finally {
      setDraftLoading(false);
    }
  };

  const handleSyncBrowser = async () => {
    setSyncing(true);
    // Simulates calling the browser synchronization CLI / trigger
    setTimeout(() => {
      setSyncing(false);
      alert("⚠️ Lancement de la synchronisation locale... Lancez 'node scripts/sync-instagram.js' dans votre terminal pour mettre à jour les DMs depuis Chrome.");
    }, 1000);
  };

  const categoryBadge = (cat: string) => {
    const map: Record<string, { label: string; class: string }> = {
      hot: { label: "🔥 Hot", class: "badge-hot" },
      principal: { label: "🟡 Principal", class: "badge-principal" },
      tiede: { label: "🔵 Tiède", class: "badge-tiede" },
    };
    const b = map[cat] || { label: "⚪ Froid", class: "badge-froid" };
    return <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${b.class}`}>{b.label}</span>;
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-gold-500 mb-1">Messages</p>
          <h2 className="text-3xl md:text-4xl font-black font-display">
            <span className="text-white-gradient">Centre de </span>
            <span className="text-gold-gradient">Messagerie</span>
          </h2>
        </div>
        <button 
          onClick={handleSyncBrowser} 
          disabled={syncing}
          className="btn-ghost text-xs flex items-center gap-1.5"
        >
          <RefreshCw size={12} className={syncing ? "animate-spin" : ""} />
          Sync depuis Chrome Mac
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[calc(100vh-220px)]">
        {/* Conversation List */}
        <div className="lg:col-span-4 glass-card p-4 overflow-y-auto pr-2 scrollbar-custom">
          <h3 className="text-xs font-bold uppercase tracking-widest text-text-muted mb-3">Abonnés Réels Instagram</h3>
          <div className="space-y-2">
            {prospects.map((p) => (
              <button
                key={p.handle}
                onClick={() => { setSelected(p); setDrafts([]); }}
                className={`w-full text-left p-3 rounded-xl transition-all duration-200 ${
                  selected?.handle === p.handle ? "bg-gold-900/30 border border-border-active" : "bg-bg-card/50 border border-transparent hover:border-border-subtle"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold text-white">{p.handle}</span>
                  {categoryBadge(p.category)}
                </div>
                <p className="text-xs text-text-muted truncate">{p.notes}</p>
                <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-border-white/5">
                  <span className="text-[10px] text-text-disabled">Score : {p.score}/100</span>
                  <span className="text-[10px] font-bold text-gold-500">Étape {p.hansStep}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Conversation View */}
        <div className="lg:col-span-5 glass-card p-4 flex flex-col">
          {selected ? (
            <>
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-border-subtle">
                <div>
                  <h3 className="text-lg font-bold text-white">{selected.handle}</h3>
                  <p className="text-xs text-text-muted">
                    {selected.categoryBody} • {selected.federation || "Fédération à qualifier"}
                  </p>
                </div>
                {categoryBadge(selected.category)}
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-2 scrollbar-custom">
                <div className="flex justify-start">
                  <div className="max-w-[80%] p-3 rounded-2xl text-sm bg-bg-card text-text-primary border border-border-white rounded-bl-md">
                    <span className="text-xs text-gold-400 block mb-1">Dernier message extrait</span>
                    <p>Salut Manael, je monte sur scène bientôt, je voudrais des conseils.</p>
                  </div>
                </div>
                <div className="flex justify-end">
                  <div className="max-w-[80%] p-3 rounded-2xl text-sm bg-gold-900/40 text-gold-300 border border-border-subtle rounded-br-md">
                    <p>Propre bro ! Quelle compète et quelle fédération cette année ? 💪</p>
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="max-w-[80%] p-3 rounded-2xl text-sm bg-bg-card text-text-primary border border-border-white rounded-bl-md">
                    <p>{selected.notes}</p>
                  </div>
                </div>
              </div>

              {/* Draft Box */}
              <div className="border-t border-border-subtle pt-3 space-y-3">
                <button onClick={generateDrafts} disabled={draftLoading} className="btn-gold w-full text-xs disabled:opacity-50">
                  {draftLoading ? "⏳ Génération des brouillons..." : "✨ Générer 3 brouillons de réponse adaptés"}
                </button>
                {drafts.map((d, i) => (
                  <div key={i} className="bg-bg-card border border-border-white rounded-xl p-3 flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-text-muted uppercase">Option {i + 1}</span>
                      <button
                        onClick={() => { navigator.clipboard.writeText(d); setCopied(i); setTimeout(() => setCopied(null), 2000); }}
                        className="text-[10px] text-gold-400 hover:underline flex items-center gap-1"
                      >
                        {copied === i ? <Check size={10} className="text-success" /> : <Copy size={10} />}
                        {copied === i ? "Copié" : "Copier"}
                      </button>
                    </div>
                    <textarea
                      readOnly
                      value={d}
                      onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                      className="w-full bg-bg-input border border-border-subtle rounded-lg p-2.5 text-xs text-text-primary font-mono focus:outline-none resize-none h-16"
                    />
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-text-muted text-sm">
              Sélectionnez un abonné pour débuter le setting
            </div>
          )}
        </div>

        {/* Profile Details */}
        <div className="lg:col-span-3 glass-card p-4">
          {selected && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-gold-500">Fiche Prospect</h3>
              <div className="text-center py-4 border-b border-border-subtle">
                <div className="w-16 h-16 rounded-full bg-gold-900/40 flex items-center justify-center mx-auto mb-2 text-2xl border border-border-subtle">
                  👤
                </div>
                <p className="font-bold text-white">{selected.handle}</p>
                <p className="text-xs text-gold-400 mt-1">{selected.federation} • {selected.categoryBody}</p>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center p-2 bg-bg-card/30 rounded-lg">
                  <span className="text-[10px] text-text-muted uppercase">Pertinence</span>
                  {renderStars(selected.pertinence)}
                </div>
                <div className="flex justify-between items-center p-2 bg-bg-card/30 rounded-lg">
                  <span className="text-[10px] text-text-muted uppercase">Propension Achat</span>
                  {renderStars(selected.propension)}
                </div>
                <InfoRow label="Score" value={`${selected.score}/100`} />
                <InfoRow label="Étape Hans" value={`${selected.hansStep}/7`} />
                <InfoRow label="Date Compétition" value={selected.compDate} />
              </div>

              {selected.notes && (
                <div className="p-3 bg-bg-card/50 rounded-xl border border-border-white">
                  <p className="text-[10px] font-bold text-gold-400 uppercase mb-1">📝 Notes & Douleurs</p>
                  <p className="text-xs text-text-secondary">{selected.notes}</p>
                </div>
              )}

              {selected.hansStep >= 5 && (
                <div className="p-3 bg-gold-900/20 rounded-xl border border-border-subtle">
                  <p className="text-[10px] font-bold text-gold-400 uppercase mb-1">📎 Ressource Recommandée</p>
                  <a href="https://youtu.be/ZUXbjlT-Lmc" target="_blank" className="text-xs text-gold-300 hover:underline flex items-center gap-1">
                    <ExternalLink size={12} /> Vidéo Quarts de tour
                  </a>
                </div>
              )}

              {selected.hansStep >= 6 && (
                <a
                  href="https://calendly.com/posing-session-reservation/appel-decouverte-posing-empire"
                  target="_blank"
                  className="btn-gold w-full text-xs flex items-center justify-center gap-1"
                >
                  📅 Booker Appel Calendly
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center p-2 bg-bg-card/50 rounded-lg">
      <span className="text-[10px] text-text-muted uppercase tracking-wider">{label}</span>
      <span className="text-xs font-bold text-text-primary">{value}</span>
    </div>
  );
}
