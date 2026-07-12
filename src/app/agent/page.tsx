"use client";
import { useState } from "react";

export default function AgentPage() {
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState<{ role: string; text: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [draftProspect, setDraftProspect] = useState("");
  const [draftStep, setDraftStep] = useState(1);
  const [draftConvo, setDraftConvo] = useState("");
  const [drafts, setDrafts] = useState<string[]>([]);
  const [draftReasoning, setDraftReasoning] = useState("");
  const [draftResource, setDraftResource] = useState("");
  const [draftLoading, setDraftLoading] = useState(false);
  const [copied, setCopied] = useState<number | null>(null);

  const sendChat = async () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput.trim();
    setChatHistory((prev) => [...prev, { role: "user", text: userMsg }]);
    setChatInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg, context: chatHistory.map((m) => `${m.role}: ${m.text}`).join("\n") }),
      });
      const data = await res.json();
      setChatHistory((prev) => [...prev, { role: "agent", text: data.response || data.error || "Erreur" }]);
    } catch {
      setChatHistory((prev) => [...prev, { role: "agent", text: "Erreur de connexion." }]);
    } finally {
      setLoading(false);
    }
  };

  const generateDrafts = async () => {
    setDraftLoading(true);
    setDrafts([]);
    try {
      const res = await fetch("/api/agent/generate-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationHistory: draftConvo, prospectInfo: draftProspect, hansStep: draftStep }),
      });
      const data = await res.json();
      setDrafts(data.drafts || []);
      setDraftReasoning(data.reasoning || "");
      setDraftResource(data.resourceToSend || "none");
    } catch {
      setDrafts(["Erreur lors de la génération."]);
    } finally {
      setDraftLoading(false);
    }
  };

  const copyDraft = (idx: number) => {
    navigator.clipboard.writeText(drafts[idx]);
    setCopied(idx);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-8">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest text-gold-500 mb-1">Agent IA</p>
        <h2 className="text-3xl md:text-4xl font-black font-display">
          <span className="text-white-gradient">Assistant </span>
          <span className="text-gold-gradient">Setting</span>
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chat with Agent */}
        <div className="glass-card p-6 flex flex-col h-[600px]">
          <h3 className="text-sm font-bold uppercase tracking-widest text-gold-500 mb-4">💬 Chat avec l&apos;Agent</h3>
          <div className="flex-1 overflow-y-auto space-y-3 mb-4">
            {chatHistory.length === 0 && (
              <p className="text-sm text-text-muted italic">
                Pose une question à l&apos;agent : stratégie de setting, contournement d&apos;objection, qualification de prospect...
              </p>
            )}
            {chatHistory.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                    msg.role === "user"
                      ? "bg-gold-900/40 text-gold-300 border border-border-subtle rounded-br-md"
                      : "bg-bg-card text-text-primary border border-border-white rounded-bl-md"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-bg-card border border-border-white rounded-2xl rounded-bl-md p-3">
                  <span className="text-sm text-text-muted animate-pulse">L&apos;agent réfléchit...</span>
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendChat()}
              placeholder="Demande à l'agent..."
              className="flex-1 bg-bg-input border border-border-subtle rounded-full px-4 py-3 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-border-active transition-colors"
            />
            <button onClick={sendChat} disabled={loading} className="btn-gold px-6 disabled:opacity-50">
              →
            </button>
          </div>
        </div>

        {/* Draft Generator */}
        <div className="glass-card p-6">
          <h3 className="text-sm font-bold uppercase tracking-widest text-gold-500 mb-4">📝 Générateur de brouillons</h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-text-muted uppercase tracking-wider block mb-1">Infos prospect</label>
              <input
                type="text"
                value={draftProspect}
                onChange={(e) => setDraftProspect(e.target.value)}
                placeholder="ex: @athlete_23, compétiteur IFBB, scène oct 2026"
                className="w-full bg-bg-input border border-border-subtle rounded-xl px-4 py-3 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-border-active"
              />
            </div>
            <div>
              <label className="text-xs text-text-muted uppercase tracking-wider block mb-1">Étape Hans actuelle</label>
              <div className="flex gap-1 flex-wrap">
                {[1, 2, 3, 4, 5, 6, 7].map((s) => (
                  <button
                    key={s}
                    onClick={() => setDraftStep(s)}
                    className={`w-10 h-10 rounded-lg text-xs font-bold transition-all ${
                      draftStep === s ? "bg-gold-500 text-bg-primary" : "bg-bg-card border border-border-subtle text-text-secondary hover:border-border-hover"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-text-muted mt-1">
                {["", "Icebreaker", "Contexte", "Objectif", "Bilan posing", "Douleur/Blocage", "Prise de conscience", "Call-to-Action"][draftStep]}
              </p>
            </div>
            <div>
              <label className="text-xs text-text-muted uppercase tracking-wider block mb-1">Historique de conversation</label>
              <textarea
                value={draftConvo}
                onChange={(e) => setDraftConvo(e.target.value)}
                placeholder="Colle ici l'historique des messages échangés..."
                rows={4}
                className="w-full bg-bg-input border border-border-subtle rounded-xl px-4 py-3 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-border-active resize-none"
              />
            </div>
            <button onClick={generateDrafts} disabled={draftLoading} className="btn-gold w-full disabled:opacity-50">
              {draftLoading ? "⏳ Génération..." : "✨ Générer 3 brouillons"}
            </button>

            {/* Draft Results */}
            {drafts.length > 0 && (
              <div className="space-y-3 mt-4">
                {draftReasoning && <p className="text-xs text-text-muted italic">💡 {draftReasoning}</p>}
                {draftResource && draftResource !== "none" && (
                  <p className="text-xs text-gold-400">📎 Ressource suggérée : <a href={draftResource} target="_blank" className="underline">{draftResource}</a></p>
                )}
                {drafts.map((draft, idx) => (
                  <div key={idx} className="bg-bg-card border border-border-subtle rounded-xl p-4 group">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] font-bold text-text-muted uppercase">Option {idx + 1}</span>
                      <button
                        onClick={() => copyDraft(idx)}
                        className="text-xs text-gold-500 hover:text-gold-300 transition-colors"
                      >
                        {copied === idx ? "✅ Copié !" : "📋 Copier"}
                      </button>
                    </div>
                    <p className="text-sm text-text-primary">{draft}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
