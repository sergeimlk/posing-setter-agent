"use client";
import { useState } from "react";
import { Copy, Check, Send, Sparkles, Brain, HelpCircle } from "lucide-react";

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
      setChatHistory((prev) => [...prev, { role: "agent", text: cleanText(data.response || data.error || "Erreur") }]);
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
      setDrafts((data.drafts || []).map((d: string) => cleanText(d)));
      setDraftReasoning(data.reasoning || "");
      setDraftResource(data.resourceToSend || "none");
    } catch {
      setDrafts(["Erreur lors de la génération."]);
    } finally {
      setDraftLoading(false);
    }
  };

  const copyDraft = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
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
          <div className="flex items-center gap-2 border-b border-border-subtle pb-3 mb-4">
            <Brain size={18} className="text-gold-500" />
            <h3 className="text-sm font-bold uppercase tracking-widest text-white">Chat de coaching</h3>
          </div>
          <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-2 scrollbar-custom">
            {chatHistory.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-4">
                <HelpCircle size={40} className="text-text-disabled" />
                <div>
                  <p className="text-sm font-bold text-white">Posez vos questions à l&apos;Agent</p>
                  <p className="text-xs text-text-muted mt-1 max-w-xs">
                    Demandez des relances, des conseils de négociation, ou comment répondre à des objections sur le posing ou le prix.
                  </p>
                </div>
              </div>
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
              placeholder="Demander une réponse à une objection..."
              className="flex-1 bg-bg-input border border-border-subtle rounded-full px-4 py-3 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-border-active transition-colors"
            />
            <button onClick={sendChat} disabled={loading} className="btn-gold p-3 rounded-full flex items-center justify-center w-12 h-12 disabled:opacity-50">
              <Send size={16} />
            </button>
          </div>
        </div>

        {/* Draft Generator */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 border-b border-border-subtle pb-3 mb-4">
            <Sparkles size={18} className="text-gold-500" />
            <h3 className="text-sm font-bold uppercase tracking-widest text-white">Générateur de Réponses</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-text-muted uppercase tracking-wider block mb-1">Infos prospect</label>
              <input
                type="text"
                value={draftProspect}
                onChange={(e) => setDraftProspect(e.target.value)}
                placeholder="ex: @athlete_classic, IFBB oct 2026, vacuum à corriger"
                className="w-full bg-bg-input border border-border-subtle rounded-xl px-4 py-3 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-border-active"
              />
            </div>
            <div>
              <label className="text-xs text-text-muted uppercase tracking-wider block mb-1">Étape Hans actuelle</label>
              <div className="flex gap-1 flex-wrap">
                {[1, 2, 3, 4, 5, 6, 7].map((s) => (
                  <button
                    key={s}
                    type="button"
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
                {["", "Icebreaker (Accroche)", "Contexte (Fédération/Catégorie)", "Objectif (Scène/But)", "Bilan (Posing actuel)", "Douleur (Blocage)", "Prise de conscience", "CTA (Calendly)"][draftStep]}
              </p>
            </div>
            <div>
              <label className="text-xs text-text-muted uppercase tracking-wider block mb-1">Historique de conversation (facultatif)</label>
              <textarea
                value={draftConvo}
                onChange={(e) => setDraftConvo(e.target.value)}
                placeholder="Collez ici l'historique des derniers messages..."
                rows={4}
                className="w-full bg-bg-input border border-border-subtle rounded-xl px-4 py-3 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-border-active resize-none"
              />
            </div>
            <button onClick={generateDrafts} disabled={draftLoading} className="btn-gold w-full py-3.5 text-sm disabled:opacity-50">
              {draftLoading ? "⏳ Génération des brouillons..." : "✨ Générer 3 propositions de message"}
            </button>

            {/* Draft Results */}
            {drafts.length > 0 && (
              <div className="space-y-4 mt-6">
                {draftReasoning && (
                  <div className="bg-gold-950/20 border border-gold-900/50 rounded-xl p-3 text-xs text-gold-400">
                    💡 <strong>Conseil de l&apos;Agent :</strong> {draftReasoning}
                  </div>
                )}
                {draftResource && draftResource !== "none" && (
                  <div className="bg-bg-card border border-border-white rounded-xl p-3 text-xs flex justify-between items-center">
                    <span className="text-text-secondary">Ressource à envoyer :</span>
                    <a href={draftResource} target="_blank" className="text-gold-400 hover:underline font-bold font-mono">
                      {draftResource.substring(0, 30)}...
                    </a>
                  </div>
                )}
                {drafts.map((draft, idx) => (
                  <div key={idx} className="bg-bg-card border border-border-white rounded-xl p-4 flex flex-col justify-between gap-3 relative group">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-gold-500 uppercase tracking-wider">Option {idx + 1}</span>
                      <button
                        onClick={() => copyDraft(draft, idx)}
                        className="text-xs text-gold-400 hover:text-gold-300 flex items-center gap-1 transition-colors"
                      >
                        {copied === idx ? (
                          <>
                            <Check size={12} /> Copié !
                          </>
                        ) : (
                          <>
                            <Copy size={12} /> Copier le bloc
                          </>
                        )}
                      </button>
                    </div>
                    {/* Raw Textbox Ready to Copy */}
                    <textarea
                      readOnly
                      value={draft}
                      onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                      className="w-full bg-bg-input border border-border-subtle rounded-lg p-3 text-sm text-text-primary font-mono focus:outline-none resize-none select-all h-20"
                    />
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
