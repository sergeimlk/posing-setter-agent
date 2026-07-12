"use client";
import { useState, useEffect } from "react";
import quizData from "@/data/quiz-bank.json";

interface Question {
  id: number;
  module: string;
  q: string;
  choices: string[];
  answer: number;
}

export default function QuizModal({ onClose, moduleFilter }: { onClose: () => void; moduleFilter?: string }) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    let pool = quizData.questions as Question[];
    if (moduleFilter) pool = pool.filter((q) => q.module === moduleFilter);
    const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, 5);
    setQuestions(shuffled);
  }, [moduleFilter]);

  const handleAnswer = (idx: number) => {
    if (answered) return;
    setSelected(idx);
    setAnswered(true);
    if (idx === questions[current].answer) setScore((s) => s + 1);
  };

  const handleNext = () => {
    if (current + 1 >= questions.length) {
      setFinished(true);
      localStorage.setItem("lastQuizDate", new Date().toDateString());
    } else {
      setCurrent((c) => c + 1);
      setSelected(null);
      setAnswered(false);
    }
  };

  if (questions.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-bg-overlay" />
      <div className="glass-card relative z-10 w-full max-w-lg p-8" onClick={(e) => e.stopPropagation()}>
        {!finished ? (
          <>
            {/* Progress */}
            <div className="flex items-center justify-between mb-6">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gold-500">
                🧠 Quiz — Question {current + 1}/{questions.length}
              </span>
              <span className="text-sm font-bold text-gold-300">{score} pts</span>
            </div>
            <div className="w-full bg-bg-primary rounded-full h-1.5 mb-6">
              <div
                className="progress-gold"
                style={{ width: `${((current + 1) / questions.length) * 100}%` }}
              />
            </div>

            {/* Question */}
            <h3 className="text-lg font-bold text-white mb-6 leading-relaxed">{questions[current].q}</h3>

            {/* Choices */}
            <div className="space-y-3">
              {questions[current].choices.map((choice, idx) => {
                let classes = "w-full text-left p-4 rounded-xl border text-sm font-medium transition-all duration-300 ";
                if (!answered) {
                  classes += selected === idx
                    ? "border-border-active bg-gold-900/30 text-gold-300"
                    : "border-border-subtle bg-bg-card hover:border-border-hover text-text-primary";
                } else if (idx === questions[current].answer) {
                  classes += "border-success/50 bg-success/10 text-success";
                } else if (idx === selected) {
                  classes += "border-error/50 bg-error/10 text-error";
                } else {
                  classes += "border-border-white bg-bg-card text-text-muted opacity-50";
                }
                return (
                  <button key={idx} onClick={() => handleAnswer(idx)} className={classes}>
                    <span className="mr-3 text-xs font-bold text-text-muted">{String.fromCharCode(65 + idx)}.</span>
                    {choice}
                  </button>
                );
              })}
            </div>

            {/* Next Button */}
            {answered && (
              <div className="mt-6 flex justify-between items-center">
                <p className="text-xs text-text-muted">
                  {selected === questions[current].answer ? "✅ Bonne réponse !" : "❌ Mauvaise réponse"}
                </p>
                <button onClick={handleNext} className="btn-gold text-xs">
                  {current + 1 >= questions.length ? "Voir le score" : "Question suivante →"}
                </button>
              </div>
            )}
          </>
        ) : (
          /* Score Screen */
          <div className="text-center py-8">
            <p className="text-6xl mb-4">{score >= 4 ? "🏆" : score >= 3 ? "💪" : "📚"}</p>
            <h3 className="text-2xl font-black font-display mb-2">
              <span className="text-gold-gradient">{score}</span>
              <span className="text-white"> / {questions.length}</span>
            </h3>
            <p className="text-text-secondary text-sm mb-6">
              {score >= 4
                ? "Excellent ! Tu maîtrises les procédures comme un pro."
                : score >= 3
                  ? "Bien joué ! Continue à réviser pour être au top."
                  : "Revois les modules de formation pour t'améliorer."}
            </p>
            <div className="flex gap-3 justify-center">
              <button onClick={onClose} className="btn-ghost text-xs">Fermer</button>
              <button
                onClick={() => {
                  setFinished(false);
                  setCurrent(0);
                  setScore(0);
                  setSelected(null);
                  setAnswered(false);
                  const pool = quizData.questions as Question[];
                  setQuestions([...pool].sort(() => Math.random() - 0.5).slice(0, 5));
                }}
                className="btn-gold text-xs"
              >
                🔄 Rejouer
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
