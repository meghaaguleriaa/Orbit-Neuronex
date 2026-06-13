import { useGetDashboardAnalytics, useGetHiringFunnel, useGetAgentActivity } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart2, TrendingUp, Activity, Clock } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, Cell, PieChart, Pie
} from "recharts";
import { motion } from "framer-motion";

const AGENT_COLORS: Record<string, string> = {
  discovery: "#3b82f6",
  intelligence: "#8b5cf6",
  match: "#10b981",
  interview: "#f59e0b",
  orchestrator: "#f43f5e",
};

const FUNNEL_COLORS = ["#6366f1","#7c3aed","#9333ea","#a855f7","#c084fc","#10b981"];

export default function Analytics() {
  const { data: analytics, isLoading } = useGetDashboardAnalytics();
  const { data: funnel } = useGetHiringFunnel();
  const { data: activity } = useGetAgentActivity();

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <Skeleton className="h-20 w-full rounded-xl" />
        <div className="grid grid-cols-2 gap-6">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-64 rounded-xl" />)}
        </div>
      </div>
    );
  }

  const agentTypeCounts: Record<string, number> = {};
  (activity ?? []).forEach(a => {
    agentTypeCounts[a.agentType] = (agentTypeCounts[a.agentType] ?? 0) + 1;
  });
  const agentPieData = Object.entries(agentTypeCounts).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2 mb-1">
          <BarChart2 className="h-4 w-4 text-indigo-400" />
          <span className="text-xs font-mono text-indigo-400 tracking-widest uppercase">Analytics</span>
        </div>
        <h1 className="text-3xl font-bold">Hiring Intelligence</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Data-driven insights from the autonomous pipeline</p>
      </motion.div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Time-to-Hire Reduction", val: `${analytics?.timeToHireReduction ?? 0}%`, color: "text-emerald-400", icon: Clock },
          { label: "Avg Match Score", val: `${analytics?.avgMatchScore ?? 0}%`, color: "text-indigo-400", icon: TrendingUp },
          { label: "Hidden Talents Found", val: analytics?.hiddenTalentsFound ?? 0, color: "text-amber-400", icon: Activity },
          { label: "Debates Completed", val: analytics?.debatesCompleted ?? 0, color: "text-violet-400", icon: BarChart2 },
        ].map(({ label, val, color, icon: Icon }) => (
          <Card key={label} className="p-4 bg-card/60 border-border/40">
            <div className="flex items-center gap-2 mb-2">
              <Icon className={`h-4 w-4 ${color}`} />
              <span className="text-xs text-muted-foreground">{label}</span>
            </div>
            <div className={`text-3xl font-black font-mono ${color}`}>{val}</div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Hiring Velocity */}
        <Card className="p-5 bg-card/60 border-border/40">
          <h3 className="font-semibold text-sm mb-4">Hiring Velocity</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={analytics?.hiringVelocity ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(217 33% 17%)" />
              <XAxis dataKey="week" tick={{ fill: "hsl(215 20% 50%)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "hsl(215 20% 50%)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "hsl(222 47% 11%)", border: "1px solid hsl(217 33% 20%)", borderRadius: 8, fontSize: 11 }} />
              <Bar dataKey="candidates" fill="hsl(243 75% 59%)" radius={[3, 3, 0, 0]} name="Candidates" opacity={0.8} />
              <Bar dataKey="offers" fill="hsl(160 84% 39%)" radius={[3, 3, 0, 0]} name="Offers" opacity={0.8} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Funnel */}
        {funnel && (
          <Card className="p-5 bg-card/60 border-border/40">
            <h3 className="font-semibold text-sm mb-4">Pipeline Conversion Funnel</h3>
            <div className="space-y-3">
              {funnel.map((stage, i) => {
                const maxCount = Math.max(...funnel.map(s => s.count), 1);
                const widthPct = (stage.count / maxCount) * 100;
                return (
                  <div key={i}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">{stage.stage}</span>
                      <div className="flex gap-2">
                        <span className="font-mono text-foreground">{stage.count}</span>
                        <span className="text-emerald-400">{stage.conversionRate}%</span>
                      </div>
                    </div>
                    <div className="h-2 bg-border/40 rounded-full">
                      <div
                        className="h-full rounded-full opacity-80"
                        style={{ width: `${widthPct}%`, backgroundColor: FUNNEL_COLORS[i % FUNNEL_COLORS.length] }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}
      </div>

      {/* Agent Activity */}
      <Card className="p-5 bg-card/60 border-border/40">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm">Agent Activity Log</h3>
          <span className="flex items-center gap-1.5 text-xs text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live Feed
          </span>
        </div>
        <div className="space-y-2 max-h-64 overflow-auto">
          {(activity ?? []).map(act => (
            <div key={act.id} className="flex items-center gap-3 py-2 border-b border-border/20 last:border-0" data-testid={`activity-${act.id}`}>
              <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: AGENT_COLORS[act.agentType] ?? "#64748b" }} />
              <div className="flex-1 text-xs">
                <span className="text-foreground font-medium">{act.agent}</span>
                <span className="text-muted-foreground"> — {act.action} </span>
                <span className="text-indigo-400">{act.target}</span>
              </div>
              <Badge className={`text-[9px] ${act.status === "success" ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" : act.status === "alert" ? "bg-amber-500/15 text-amber-400 border-amber-500/30" : "bg-blue-500/15 text-blue-400 border-blue-500/30"}`}>
                {act.status}
              </Badge>
              <span className="text-[10px] text-muted-foreground/60 font-mono">
                {new Date(act.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
