"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Brain, MessageCircle, GraduationCap, BarChart3 } from "lucide-react";

const items = [
  { href: "/", icon: LayoutDashboard, label: "Board" },
  { href: "/agent", icon: Brain, label: "Agent" },
  // { href: "/messages", icon: MessageCircle, label: "DMs" },
  { href: "/formation", icon: GraduationCap, label: "Cours" },
  { href: "/reports", icon: BarChart3, label: "Rapports" },
];

export default function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="mobile-nav fixed bottom-0 left-0 right-0 z-50 navbar-glass px-2 py-2 border-t border-border-subtle">
      <div className="flex justify-around items-center">
        {items.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors hover:bg-bg-card-hover">
              <Icon size={18} className={isActive ? "text-gold-400" : "text-text-muted"} />
              <span className={`text-[10px] font-semibold uppercase tracking-wider ${isActive ? "text-gold-400" : "text-text-secondary"}`}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
