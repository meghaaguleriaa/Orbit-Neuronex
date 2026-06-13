import React from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, Users, Brain, Zap, BarChart2,
  Sparkles, FlaskConical, UsersRound, ChevronRight, Satellite
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_SECTIONS = [
  {
    label: "Core",
    items: [
      { icon: LayoutDashboard, label: "Mission Control", href: "/" },
      { icon: Users, label: "Pipeline", href: "/candidates" },
    ],
  },
  {
    label: "AI Modules",
    items: [
      { icon: Brain, label: "Decision Chamber", href: "/decision-chamber" },
      { icon: Zap, label: "Autopilot", href: "/autopilot" },
      { icon: FlaskConical, label: "Simulations", href: "/simulations" },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { icon: Sparkles, label: "Hidden Talent", href: "/hidden-talent" },
      { icon: UsersRound, label: "Team Chemistry", href: "/team-chemistry" },
      { icon: BarChart2, label: "Analytics", href: "/analytics" },
    ],
  },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <aside className="w-60 border-r border-border/50 bg-card/80 backdrop-blur flex-shrink-0 flex flex-col">
        {/* Logo */}
        <div className="p-5 border-b border-border/30">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <Satellite className="h-4 w-4 text-white" />
            </div>
            <div>
              <div className="text-lg font-black tracking-tight text-foreground">ORBIT</div>
              <div className="text-[9px] text-indigo-400/80 tracking-[0.15em] uppercase -mt-0.5">Autonomous Hiring OS</div>
            </div>
          </div>
        </div>

        {/* Status indicator */}
        <div className="px-4 py-3 mx-3 mt-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
          <span className="text-[10px] text-emerald-400 font-mono tracking-wide">ALL AGENTS ACTIVE</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-auto px-3 py-4 space-y-5">
          {NAV_SECTIONS.map(section => (
            <div key={section.label}>
              <div className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-[0.15em] px-2 mb-1.5">
                {section.label}
              </div>
              <div className="space-y-0.5">
                {section.items.map(item => {
                  const isActive = item.href === "/" ? location === "/" : location.startsWith(item.href);
                  return (
                    <Link key={item.href} href={item.href}>
                      <div
                        className={cn(
                          "group flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer relative",
                          isActive
                            ? "bg-indigo-600/15 text-indigo-300 border border-indigo-500/25"
                            : "text-muted-foreground hover:bg-white/5 hover:text-foreground border border-transparent"
                        )}
                      >
                        {isActive && (
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-indigo-400 rounded-full" />
                        )}
                        <item.icon className={cn("h-3.5 w-3.5 flex-shrink-0", isActive ? "text-indigo-400" : "text-muted-foreground group-hover:text-foreground")} />
                        <span className="flex-1">{item.label}</span>
                        {isActive && <ChevronRight className="h-3 w-3 text-indigo-400/50" />}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border/30">
          <div className="text-[10px] text-muted-foreground/40 font-mono text-center">
            ORBIT v2.4 · Multi-Agent Core
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto bg-background relative min-w-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8b5cf608_1px,transparent_1px),linear-gradient(to_bottom,#8b5cf608_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />
        <div className="relative z-10 p-7 h-full">
          {children}
        </div>
      </main>
    </div>
  );
}
