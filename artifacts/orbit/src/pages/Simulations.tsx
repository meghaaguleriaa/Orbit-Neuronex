import { useState } from "react";
import { useListCandidates, useGetCandidateSimulation } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, TrendingUp, Users } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion";

function CandidateSimCard({ candidateId, name, role, initials }: {
  candidateId: number; name: string; role: string; initials: string;
}) {
  const { data: sim, isLoading } = useGetCandidateSimulation(candidateId, {
    query: { enabled: true }
  });

  if (isLoading) return <Skeleton className="h-64 rounded-xl" />;
  if (!sim) return null;

  return (
    <Card className="p-5 bg-card/60 border-border/40 hover:border-indigo-500/30 transition-all" data-testid={`sim-card-${candidateId}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className="h-9 w-9 rounded-full bg-indigo-600 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
          {initials}
        </div>
        <div>
          <div className="font-semibold text-sm text-foreground">{name}</div>
          <div className="text-xs text-muted-foreground">{role}</div>
        </div>
        <div className="ml-auto flex gap-2">
          <Badge className="bg-indigo-500/15 text-indigo-400 border-indigo-500/30 text-[10px]">
            {sim.twelveMonthScore}% @12mo
          </Badge>
          {sim.promotionPotential > 85 && (
            <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px]">High Potential</Badge>
          )}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={100}>
        <AreaChart data={sim.forecast.filter((_, i) => i % 2 === 0)}>
          <defs>
            <linearGradient id={`grad-${candidateId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(243 75% 59%)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(243 75% 59%)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="month" tick={{ fill: "hsl(215 20% 50%)", fontSize: 9 }} axisLine={false} tickLine={false} />
          <YAxis domain={[40, 100]} hide />
          <Tooltip contentStyle={{ background: "hsl(222 47% 11%)", border: "1px solid hsl(217 33% 20%)", borderRadius: 6, fontSize: 10 }} />
          <Area type="monotone" dataKey="performance" stroke="hsl(243 75% 59%)" fill={`url(#grad-${candidateId})`} strokeWidth={2} name="Performance" />
        </AreaChart>
      </ResponsiveContainer>
      <div className="grid grid-cols-4 gap-2 mt-3">
        {[
          { label: "3mo", val: sim.threeMonthScore, color: "text-blue-400" },
          { label: "6mo", val: sim.sixMonthScore, color: "text-violet-400" },
          { label: "12mo", val: sim.twelveMonthScore, color: "text-emerald-400" },
          { label: "Promo", val: sim.promotionPotential, color: "text-amber-400" },
        ].map(({ label, val, color }) => (
          <div key={label} className="text-center p-2 bg-border/20 rounded-lg">
            <div className={`text-sm font-bold font-mono ${color}`}>{Math.round(val)}%</div>
            <div className="text-[10px] text-muted-foreground">{label}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}

export default function Simulations() {
  const { data: candidates, isLoading } = useListCandidates();

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <Skeleton className="h-20 w-full rounded-xl" />
        <div className="grid grid-cols-2 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-64 rounded-xl" />)}
        </div>
      </div>
    );
  }

  const topCandidates = (candidates ?? []).slice(0, 8);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2 mb-1">
          <Activity className="h-4 w-4 text-indigo-400" />
          <span className="text-xs font-mono text-indigo-400 tracking-widest uppercase">AI Simulation Engine</span>
        </div>
        <h1 className="text-3xl font-bold">Performance Simulations</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Predictive 12-month performance trajectories for each candidate</p>
      </motion.div>

      <Card className="p-5 bg-indigo-950/30 border-indigo-500/20">
        <div className="flex items-center gap-6">
          {[
            { label: "Candidates Simulated", val: topCandidates.length, icon: Users },
            { label: "Avg 12mo Score", val: "89%", icon: TrendingUp },
            { label: "High Potential", val: topCandidates.filter(c => c.growthScore > 85).length, icon: Activity },
          ].map(({ label, val, icon: Icon }) => (
            <div key={label} className="flex items-center gap-3">
              <Icon className="h-4 w-4 text-indigo-400" />
              <div>
                <div className="font-bold text-foreground">{val}</div>
                <div className="text-xs text-muted-foreground">{label}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        {topCandidates.map((c, i) => (
          <motion.div key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <CandidateSimCard
              candidateId={c.id} name={c.name} role={c.role} initials={c.avatarInitials}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
