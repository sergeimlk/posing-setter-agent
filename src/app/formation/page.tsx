"use client";
import { useState, useEffect } from "react";
import lessonsData from "@/data/lessons.json";
import QuizModal from "@/components/QuizModal";
import { 
  Play, BookOpen, Target, Users, Award, UserCheck, Key, 
  Cpu, Dumbbell, ShieldAlert, CheckCircle, HelpCircle, 
  Copy, Check, FileText, ExternalLink, Video 
} from "lucide-react";

interface Lesson {
  id: string;
  title: string;
  summary: string;
  videoType: string;
  videoUrl?: string;
  links?: string[];
}

interface Module {
  id: string;
  slug: string;
  title: string;
  lessons: Lesson[];
}

// Maps lesson title or ID to Lucide icon
const getLessonIcon = (title: string) => {
  const t = title.toLowerCase();
  if (t.includes("présentation du posing") || t.includes("introduction")) return BookOpen;
  if (t.includes("objectifs") || t.includes("vision")) return Target;
  if (t.includes("équipe")) return Users;
  if (t.includes("témoignages") || t.includes("résultats")) return Award;
  if (t.includes("avatar")) return UserCheck;
  if (t.includes("offre") || t.includes("tarifs")) return Key;
  if (t.includes("mécanisme unique")) return Cpu;
  if (t.includes("posing")) return Dumbbell;
  if (t.includes("standards") || t.includes("règles")) return ShieldAlert;
  if (t.includes("sop") || t.includes("tracking")) return CheckCircle;
  if (t.includes("calendly") || t.includes("lien")) return ExternalLink;
  return FileText;
};

export default function FormationPage() {
  const modules = lessonsData.modules as Module[];
  const [activeModule, setActiveModule] = useState(modules[0].id);
  const [activeLesson, setActiveLesson] = useState<Lesson>(modules[0].lessons[0]);
  const [completed, setCompleted] = useState<Set<string>>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("completedLessons");
      return saved ? new Set(JSON.parse(saved)) : new Set<string>();
    }
    return new Set<string>();
  });
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizModule, setQuizModule] = useState<string | undefined>();
  const [copiedResource, setCopiedResource] = useState<string | null>(null);

  const totalLessons = modules.reduce((acc, m) => acc + m.lessons.length, 0);
  const completedCount = completed.size;
  const progressPct = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  const toggleComplete = (lessonId: string) => {
    setCompleted((prev) => {
      const next = new Set(prev);
      if (next.has(lessonId)) next.delete(lessonId);
      else next.add(lessonId);
      localStorage.setItem("completedLessons", JSON.stringify([...next]));
      return next;
    });
  };

  const copyResourceLink = (url: string, label: string) => {
    navigator.clipboard.writeText(url);
    setCopiedResource(label);
    setTimeout(() => setCopiedResource(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-gold-500 mb-1">Formation</p>
          <h2 className="text-3xl md:text-4xl font-black font-display">
            <span className="text-white-gradient">Modules de </span>
            <span className="text-gold-gradient">Cours</span>
          </h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs text-text-muted">{completedCount}/{totalLessons} leçons</p>
            <div className="w-40 bg-bg-primary rounded-full h-2 mt-1">
              <div className="progress-gold" style={{ width: `${progressPct}%` }} />
            </div>
          </div>
          <button onClick={() => { setQuizModule(undefined); setShowQuiz(true); }} className="btn-ghost text-xs">
            🧠 Quiz global
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sidebar - Module List */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-4">
          {modules.map((mod) => (
            <div key={mod.id} className="glass-card overflow-hidden">
              <button
                onClick={() => setActiveModule(activeModule === mod.id ? "" : mod.id)}
                className="w-full text-left px-5 py-4 flex items-center justify-between hover:bg-bg-card-hover transition-colors"
              >
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gold-500 mb-1">
                    {mod.id === "mod1" ? "Module 1" : "Module 2"}
                  </p>
                  <h3 className="text-sm font-bold text-white">{mod.title.split("—")[1]?.trim() || mod.title}</h3>
                  <p className="text-[10px] text-text-muted mt-1">{mod.lessons.length} leçons</p>
                </div>
                <span className="text-text-muted transition-transform duration-300" style={{ transform: activeModule === mod.id ? "rotate(180deg)" : "rotate(0)" }}>
                  ▼
                </span>
              </button>

              {activeModule === mod.id && (
                <div className="border-t border-border-subtle">
                  {mod.lessons.map((lesson) => {
                    const Icon = getLessonIcon(lesson.title);
                    return (
                      <button
                        key={lesson.id}
                        onClick={() => setActiveLesson(lesson)}
                        className={`w-full text-left px-5 py-3 flex items-center gap-3 transition-all border-l-2 ${
                          activeLesson?.id === lesson.id
                            ? "bg-gold-900/20 border-l-gold-500 text-white"
                            : "border-l-transparent text-text-secondary hover:text-white hover:bg-bg-card-hover"
                        }`}
                      >
                        <Icon size={14} className={activeLesson?.id === lesson.id ? "text-gold-400" : "text-text-disabled"} />
                        <span className="text-xs font-medium flex-1 leading-tight">{lesson.title}</span>
                        {completed.has(lesson.id) && <span className="text-[10px]">✅</span>}
                      </button>
                    );
                  })}
                  <div className="px-5 py-3 border-t border-border-white">
                    <button
                      onClick={() => { setQuizModule(mod.id); setShowQuiz(true); }}
                      className="btn-ghost text-[10px] w-full"
                    >
                      🧠 Quiz {mod.id === "mod1" ? "Module 1" : "Module 2"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Resources */}
          <div className="glass-card p-5">
            <h3 className="text-xs font-bold uppercase tracking-widest text-gold-500 mb-3">📎 Ressources YouTube</h3>
            <div className="space-y-2">
              <ResourceRow label="📅 Calendly" url="https://calendly.com/posing-session-reservation/appel-decouverte-posing-empire" onCopy={copyResourceLink} copied={copiedResource} />
              <ResourceRow label="📺 Quarts de tour" url="https://youtu.be/ZUXbjlT-Lmc" onCopy={copyResourceLink} copied={copiedResource} />
              <ResourceRow label="📺 Activation Quads" url="https://youtu.be/zVHV9o940nI" onCopy={copyResourceLink} copied={copiedResource} />
              <ResourceRow label="📺 Présence scénique" url="https://youtu.be/8_8QT46LcDM" onCopy={copyResourceLink} copied={copiedResource} />
              <ResourceRow label="📺 IFBB" url="https://youtu.be/7km-L4Na4YM" onCopy={copyResourceLink} copied={copiedResource} />
              <ResourceRow label="📺 WNBF" url="https://youtu.be/Y_Vgyqg0dN0" onCopy={copyResourceLink} copied={copiedResource} />
            </div>
          </div>
        </div>

        {/* Main Content - Lesson View */}
        <div className="lg:col-span-8 xl:col-span-9">
          {activeLesson ? (
            <div className="glass-card p-6 md:p-8 space-y-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gold-600 mb-1">
                    {modules.find((m) => m.lessons.some((l) => l.id === activeLesson.id))?.title.split("—")[0]}
                  </p>
                  <h2 className="text-2xl font-black font-display text-white">{activeLesson.title}</h2>
                </div>
                <button
                  onClick={() => toggleComplete(activeLesson.id)}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                    completed.has(activeLesson.id)
                      ? "bg-success/20 text-success border border-success/30"
                      : "bg-bg-card border border-border-subtle text-text-muted hover:border-border-hover"
                  }`}
                >
                  {completed.has(activeLesson.id) ? "✅ Terminé" : "Marquer comme vu"}
                </button>
              </div>

              {/* Video Section - Supports Native streaming or YouTube iframe */}
              {activeLesson.videoType === "local" && activeLesson.videoUrl ? (
                <div className="aspect-video bg-black rounded-xl border border-border-subtle overflow-hidden relative group">
                  <video 
                    src={activeLesson.videoUrl} 
                    controls 
                    className="w-full h-full object-contain"
                    poster="/assets/video-placeholder.png"
                  />
                  <div className="absolute top-2 right-2 bg-gold-950/80 border border-gold-500/30 px-3 py-1 rounded-full text-[10px] font-bold text-gold-300 flex items-center gap-1">
                    <Video size={10} /> Vidéo Locale
                  </div>
                </div>
              ) : activeLesson.videoType === "youtube" && activeLesson.videoUrl ? (
                <div className="aspect-video bg-black rounded-xl border border-border-subtle overflow-hidden">
                  <iframe
                    src={activeLesson.videoUrl}
                    title={activeLesson.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full border-0"
                  />
                </div>
              ) : (
                <div className="aspect-video bg-bg-primary rounded-xl border border-border-subtle flex items-center justify-center">
                  <div className="text-center p-8">
                    <span className="text-4xl mb-4 block">🎬</span>
                    <p className="text-sm text-text-secondary mb-2">Vidéo disponible sur Skool</p>
                    <a
                      href="https://www.skool.com/team-posing-empire-4746/classroom"
                      target="_blank"
                      className="btn-gold text-xs"
                    >
                      Voir sur Skool →
                    </a>
                  </div>
                </div>
              )}

              {/* Links */}
              {activeLesson.links && activeLesson.links.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {activeLesson.links.map((link, i) => (
                    <a key={i} href={link} target="_blank" className="btn-ghost text-xs">
                      🔗 {link.includes("youtube") ? "YouTube" : link.includes("instagram") ? "Instagram" : "Lien"}
                    </a>
                  ))}
                </div>
              )}

              {/* Summary */}
              <div className="bg-bg-card/50 rounded-xl p-5 border border-border-white">
                <h3 className="text-sm font-bold text-gold-400 mb-3">📝 Résumé exécutif</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{activeLesson.summary}</p>
              </div>

              {/* Key Points */}
              <div className="bg-bg-card/50 rounded-xl p-5 border border-border-white">
                <h3 className="text-sm font-bold text-gold-400 mb-3">🎯 Points clés à retenir</h3>
                <ul className="space-y-2">
                  {activeLesson.summary.split(". ").filter(Boolean).map((point, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                      <span className="text-gold-500 mt-0.5">▸</span>
                      <span>{point.trim()}{!point.endsWith(".") ? "." : ""}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="glass-card p-12 text-center">
              <span className="text-4xl block mb-4">🎓</span>
              <p className="text-text-muted">Sélectionne une leçon pour commencer</p>
            </div>
          )}
        </div>
      </div>

      {showQuiz && <QuizModal onClose={() => setShowQuiz(false)} moduleFilter={quizModule} />}
    </div>
  );
}

function ResourceRow({ 
  label, url, onCopy, copied 
}: { 
  label: string; url: string; onCopy: (url: string, label: string) => void; copied: string | null 
}) {
  const isCopied = copied === label;
  return (
    <div className="flex items-center justify-between p-2 rounded-lg bg-bg-card/50 border border-border-white hover:border-border-subtle transition-colors text-xs">
      <a href={url} target="_blank" className="text-text-secondary hover:text-text-primary truncate mr-2">
        {label}
      </a>
      <button 
        onClick={() => onCopy(url, label)} 
        className="p-1 rounded bg-bg-primary hover:bg-bg-card text-gold-400 hover:text-gold-300 transition-colors"
      >
        {isCopied ? <Check size={12} className="text-success" /> : <Copy size={12} />}
      </button>
    </div>
  );
}
