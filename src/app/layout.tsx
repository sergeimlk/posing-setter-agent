import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";

export const metadata: Metadata = {
  title: "Posing Empire — Setter Agent",
  description: "Application agentique de prospection Instagram pour Posing Empire",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-bg-primary text-text-primary font-body antialiased">
        {/* Grid Background */}
        <div className="hero-grid-bg">
          <div className="grid-overlay" />
          <div className="radial-glow" />
        </div>

        {/* Navbar */}
        <Navbar />

        {/* Main Content */}
        <main className="relative z-10 pt-20 pb-24 md:pb-8 px-4 md:px-8 max-w-7xl mx-auto">
          {children}
        </main>

        {/* Mobile Bottom Navigation */}
        <nav className="mobile-nav fixed bottom-0 left-0 right-0 z-50 navbar-glass px-2 py-2 border-t border-border-subtle">
          <div className="flex justify-around items-center">
            <NavItem href="/" icon="📊" label="Board" />
            <NavItem href="/agent" icon="🤖" label="Agent" />
            <NavItem href="/messages" icon="💬" label="DMs" />
            <NavItem href="/formation" icon="🎓" label="Cours" />
            <NavItem href="/reports" icon="📈" label="Rapports" />
          </div>
        </nav>
      </body>
    </html>
  );
}

function NavItem({ href, icon, label }: { href: string; icon: string; label: string }) {
  return (
    <a href={href} className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors hover:bg-bg-card-hover">
      <span className="text-lg">{icon}</span>
      <span className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider">{label}</span>
    </a>
  );
}
