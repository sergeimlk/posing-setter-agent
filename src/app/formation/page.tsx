"use client";
import { useState } from "react";
import lessonsData from "@/data/lessons.json";
import QuizModal from "@/components/QuizModal";

interface Lesson {
  id: string;
  title: string;
  summary: string;
  videoType: string;
  links?: string[];
}

interface Module {
  id: string;
  slug: string;
  title: string;
  lessons: Lesson[];
}

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
                  {mod.lessons.map((lesson) => (
                    <button
                      key={lesson.id}
                      onClick={() => setActiveLesson(lesson)}
                      className={`w-full text-left px-5 py-3 flex items-center gap-3 transition-all border-l-2 ${
                        activeLesson?.id === lesson.id
                          ? "bg-gold-900/20 border-l-gold-500 text-white"
                          : "border-l-transparent text-text-secondary hover:text-white hover:bg-bg-card-hover"
                      }`}
                    >
                      <span className="text-sm">{completed.has(lesson.id) ? "✅" : "📄"}</span>
                      <span className="text-xs font-medium flex-1 leading-tight">{lesson.title}</span>
                    </button>
                  ))}
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
            <h3 className="text-xs font-bold uppercase tracking-widest text-gold-500 mb-3">📎 Ressources</h3>
            <div className="space-y-2">
              <ResourceLink label="📅 Calendly" url="https://calendly.com/posing-session-reservation/appel-decouverte-posing-empire" />
              <ResourceLink label="📺 Quarts de tour" url="https://youtu.be/ZUXbjlT-Lmc" />
              <ResourceLink label="📺 Activation Quads" url="https://youtu.be/zVHV9o940nI" />
              <ResourceLink label="📺 Présence scénique" url="https://youtu.be/8_8QT46LcDM" />
              <ResourceLink label="📺 IFBB" url="https://youtu.be/7km-L4Na4YM" />
              <ResourceLink label="📺 WNBF" url="https://youtu.be/Y_Vgyqg0dN0" />
              <ResourceLink label="📸 Instagram PE" url="https://www.instagram.com/posingempire/" />
              <ResourceLink label="🎬 YouTube Témoignages" url="https://www.youtube.com/@ManaelPosingTémoignages" />
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

              {/* Video placeholder */}
              {activeLesson.videoType === "skool" && (
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

function ResourceLink({ label, url }: { label: string; url: string }) {
  return (
    <a href={url} target="_blank" className="flex items-center gap-2 p-2 rounded-lg bg-bg-card/50 border border-border-white hover:border-border-subtle transition-colors text-xs text-text-secondary hover:text-text-primary">
      <span>{label}</span>
    </a>
  );
}
