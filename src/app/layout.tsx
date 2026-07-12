import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import MobileNav from "@/components/layout/MobileNav";

export const metadata: Metadata = {
  title: "Posing Empire — Setter Agent",
  description: "Application agentique de prospection Instagram pour Posing Empire",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-bg-primary text-text-primary font-body antialiased">
        <div className="hero-grid-bg">
          <div className="grid-overlay" />
          <div className="radial-glow" />
        </div>
        <Navbar />
        <main className="relative z-10 pt-20 pb-24 md:pb-8 px-4 md:px-8 max-w-7xl mx-auto">
          {children}
        </main>
        <MobileNav />
      </body>
    </html>
  );
}
