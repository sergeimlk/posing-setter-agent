"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navItems = [
  { href: "/", icon: "📊", label: "Dashboard" },
  { href: "/agent", icon: "🤖", label: "Agent IA" },
  { href: "/messages", icon: "💬", label: "Messages" },
  { href: "/formation", icon: "🎓", label: "Formation" },
  { href: "/reports", icon: "📈", label: "Rapports" },
  { href: "/settings", icon: "⚙️", label: "Paramètres" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [quizOpen, setQuizOpen] = useState(false);

  return (
    <>
      <header className="desktop-nav fixed top-0 left-0 right-0 z-50 navbar-glass">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <span className="text-2xl">🏛️</span>
            <div>
              <h1 className="text-sm font-black font-display tracking-tight">
                <span className="text-gold-gradient">POSING</span>
                <span className="text-white ml-1">EMPIRE</span>
              </h1>
              <p className="text-[9px] text-text-muted uppercase tracking-widest">Setter Agent</p>
            </div>
          </Link>

          {/* Nav Links */}
          <nav className="flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${
                    isActive
                      ? "bg-gold-900/50 text-gold-300 border border-border-active"
                      : "text-text-secondary hover:text-text-primary hover:bg-bg-card-hover"
                  }`}
                >
                  <span>{item.icon}</span>
                  <span className="hidden lg:inline">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Quiz Button */}
          <button
            onClick={() => {
              window.dispatchEvent(new CustomEvent("open-quiz"));
            }}
            className="btn-ghost text-xs"
          >
            🧠 Quiz
          </button>
        </div>
      </header>
    </>
  );
}
