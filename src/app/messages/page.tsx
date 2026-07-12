"use client";
import { useState } from "react";

interface Prospect {
  handle: string;
  score: number;
  category: "hot" | "principal" | "tiede" | "froid";
  hansStep: number;
  lastMessage: string;
  lastTime: string;
  messages: { from: string; text: string; time: string; type: "text" | "vocal" }[];
}

const demoProspects: Prospect[] = [
  {
    handle: "@lucas_bodyfit",
    score: 85,
    category: "hot",
    hansStep: 5,
    lastMessage: "Ouais je galère un peu sur le vacuum en fait...",
    lastTime: "14:32",
    messages: [
      { from: "moi", text: "Propre la sèche bro ! Tu vises quelle compète cette année ? 🔥", time: "11:05", type: "text" },
      { from: "prospect", text: "Merci ! Je prépare l'IFBB en octobre à Paris", time: "11:22", type: "text" },
      { from: "moi", text: "Classic Physique ? Gros objectif ! Tu te sens comment sur ton posing ?", time: "11:30", type: "text" },
      { from: "prospect", text: "Ouais je galère un peu sur le vacuum en fait...", time: "14:32", type: "text" },
    ],
  },
  {
    handle: "@fit_thomas_wnbf",
    score: 72,
    category: "hot",
    hansStep: 3,
    lastMessage: "🎤 Message vocal",
    lastTime: "13:15",
    messages: [
      { from: "moi", text: "Tes quarts de tour sont clean bro, WNBF cette année ?", time: "10:20", type: "text" },
      { from: "prospect", text: "🎤 [Vocal : Oui je fais la WNBF en septembre, Classic Physique. Je vise le top 3 minimum.]", time: "13:15", type: "vocal" },
    ],
  },
  {
    handle: "@muscle_alex_92",
    score: 45,
    category: "principal",
    hansStep: 2,
    lastMessage: "Je suis en men's physique IFBB",
    lastTime: "Hier",
    messages: [
      { from: "moi", text: "Bien le training ! Tu fais de la compétition ?", time: "Hier 18:10", type: "text" },
      { from: "prospect", text: "Je suis en men's physique IFBB", time: "Hier 19:45", type: "text" },
    ],
  },
  {
    handle: "@julien_natty",
    score: 30,
    category: "tiede",
    hansStep: 1,
    lastMessage: "Vu",
    lastTime: "Hier",
    messages: [
      { from: "moi", text: "Belle transformation bro ! 💪", time: "Hier 16:00", type: "text" },
    ],
  },
];

export default function MessagesPage() {
  const [prospects] = useState<Prospect[]>(demoProspects);
  const [selected, setSelected] = useState<Prospect | null>(demoProspects[0]);
  const [drafts, setDrafts] = useState<string[]>([]);
  const [draftLoading, setDraftLoading] = useState(false);
  const [copied, setCopied] = useState<number | null>(null);

  const generateDrafts = async () => {
    if (!selected) return;
    setDraftLoading(true);
    try {
      const res = await fetch("/api/agent/generate-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationHistory: selected.messages.map((m) => `${m.from}: ${m.text}`).join("\n"),
          prospectInfo: `${selected.handle}, score ${selected.score}/100, catégorie ${selected.category}`,
          hansStep: selected.hansStep,
        }),
      });
      const data = await res.json();
      setDrafts(data.drafts || []);
    } catch {
      setDrafts(["Erreur lors de la génération."]);
    } finally {
      setDraftLoading(false);
    }
  };

  const categoryBadge = (cat: string) => {
    const map: Record<string, { label: string; class: string }> = {
      hot: { label: "🔥 Hot", class: "badge-hot" },
      principal: { label: "🟡 Principal", class: "badge-principal" },
      tiede: { label: "🔵 Tiède", class: "badge-tiede" },
      froid: { label: "⚪ Froid", class: "badge-froid" },
    };
    const b = map[cat] || map.froid;
    return <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${b.class}`}>{b.label}</span>;
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest text-gold-500 mb-1">Messages</p>
        <h2 className="text-3xl md:text-4xl font-black font-display">
          <span className="text-white-gradient">Centre de </span>
          <span className="text-gold-gradient">Messagerie</span>
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[calc(100vh-220px)]">
        {/* Conversation List */}
        <div className="lg:col-span-4 glass-card p-4 overflow-y-auto">
          <h3 className="text-xs font-bold uppercase tracking-widest text-text-muted mb-3">Conversations</h3>
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
                <p className="text-xs text-text-muted truncate">{p.lastMessage}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10px] text-text-disabled">{p.lastTime}</span>
                  <span className="text-[10px] font-bold text-gold-600">Étape {p.hansStep}</span>
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
                  <p className="text-xs text-text-muted">Score : {selected.score}/100 • Étape Hans : {selected.hansStep}</p>
                </div>
                {categoryBadge(selected.category)}
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 mb-4">
                {selected.messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.from === "moi" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                      msg.from === "moi"
                        ? "bg-gold-900/40 text-gold-300 border border-border-subtle rounded-br-md"
                        : "bg-bg-card text-text-primary border border-border-white rounded-bl-md"
                    }`}>
                      {msg.type === "vocal" && <span className="text-xs text-gold-400 block mb-1">🎤 Message vocal</span>}
                      <p>{msg.text}</p>
                      <p className="text-[10px] text-text-disabled mt-1">{msg.time}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Draft Zone */}
              <div className="border-t border-border-subtle pt-3">
                <button onClick={generateDrafts} disabled={draftLoading} className="btn-gold w-full text-xs mb-3 disabled:opacity-50">
                  {draftLoading ? "⏳ Génération..." : "✨ Générer des brouillons de réponse"}
                </button>
                {drafts.map((d, i) => (
                  <div key={i} className="flex items-center gap-2 mb-2 p-2 bg-bg-card rounded-lg border border-border-white">
                    <p className="flex-1 text-xs text-text-primary">{d}</p>
                    <button
                      onClick={() => { navigator.clipboard.writeText(d); setCopied(i); setTimeout(() => setCopied(null), 2000); }}
                      className="text-[10px] text-gold-500 hover:text-gold-300 whitespace-nowrap"
                    >
                      {copied === i ? "✅" : "📋"}
                    </button>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-text-muted text-sm">
              Sélectionne une conversation
            </div>
          )}
        </div>

        {/* Prospect Profile */}
        <div className="lg:col-span-3 glass-card p-4">
          {selected && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-gold-500">Fiche prospect</h3>
              <div className="text-center py-4">
                <div className="w-16 h-16 rounded-full bg-gold-900/40 flex items-center justify-center mx-auto mb-2 text-2xl border border-border-subtle">
                  👤
                </div>
                <p className="font-bold text-white">{selected.handle}</p>
                <div className="mt-2">{categoryBadge(selected.category)}</div>
              </div>
              <div className="space-y-3">
                <InfoRow label="Score" value={`${selected.score}/100`} />
                <InfoRow label="Étape Hans" value={`${selected.hansStep}/7 — ${["", "Icebreaker", "Contexte", "Objectif", "Bilan", "Douleur", "Conscience", "CTA"][selected.hansStep]}`} />
                <InfoRow label="Messages échangés" value={`${selected.messages.length}`} />
              </div>
              {selected.hansStep >= 5 && (
                <div className="p-3 bg-gold-900/20 rounded-xl border border-border-subtle">
                  <p className="text-[10px] font-bold text-gold-400 uppercase mb-1">📎 Ressource suggérée</p>
                  <a href="https://youtu.be/ZUXbjlT-Lmc" target="_blank" className="text-xs text-gold-300 underline">
                    Vidéo Quarts de tour
                  </a>
                </div>
              )}
              {selected.hansStep >= 6 && (
                <a
                  href="https://calendly.com/posing-session-reservation/appel-decouverte-posing-empire"
                  target="_blank"
                  className="btn-gold w-full text-xs"
                >
                  📅 Lien Calendly
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
