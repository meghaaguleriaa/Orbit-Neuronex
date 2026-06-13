import { useGetDashboardAnalytics, useGetHiringFunnel, useGetAgentActivity } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, UserSearch, Bot, Gavel, TrendingUp, Clock, ChevronRight, Activity, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, FunnelChart, Funnel, LabelList
} from "recharts";
import { motion } from "framer-motion";

const AGENT_COLORS: Record<string, string> = {
  discovery: "bg-blue-500",
  intelligence: "bg-violet-500",
  match: "bg-emerald-500",
  interview: "bg-amber-500",
  orchestrator: "bg-rose-500",
};

const STATUS_COLORS: Record<string, string> = {
  success: "text-emerald-400",
  alert: "text-amber-400",
  running: "text-blue-400",
  info: "text-slate-400",
};

function ScoreRing({ score, size = 48 }: { score: number; size?: number }) {
  const r = (size - 6) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 100) * circumference;
  return (
    <svg width={size} height={size}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(217 33% 17%)" strokeWidth={4} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke="hsl(243 75% 59%)" strokeWidth={4}
        strokeDasharray={circumference} strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text x={size / 2} y={size / 2 + 4} textAnchor="middle" fill="white" fontSize={10} fontWeight="bold">
        {Math.round(score)}
      </text>
    </svg>
  );
}

export default function Dashboard() {
  const { data: analytics, isLoading } = useGetDashboardAnalytics();
  const { data: funnel } = useGetHiringFunnel();
  const { data: activity } = useGetAgentActivity();

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <Skeleton className="h-24 w-2/3 rounded-xl" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
        <Skeleton className="h-80 w-full rounded-xl" />
      </div>
    );
  }

  const stats = [
    {
      label: "Total Candidates", value: analytics?.totalCandidates ?? 0,
      icon: Users, color: "text-blue-400", bg: "bg-blue-500/10", sub: `${analytics?.activeJobs ?? 0} active roles`
    },
    {
      label: "Hidden Talents Found", value: analytics?.hiddenTalentsFound ?? 0,
      icon: UserSearch, color: "text-emerald-400", bg: "bg-emerald-500/10", sub: "Resume-to-signal gap detected"
    },
    {
      label: "Active Agents", value: analytics?.activeAgents ?? 0,
      icon: Bot, color: "text-indigo-400", bg: "bg-indigo-500/10", sub: "All systems nominal"
    },
    {
      label: "Debates Completed", value: analytics?.debatesCompleted ?? 0,
      icon: Gavel, color: "text-purple-400", bg: "bg-purple-500/10", sub: `${analytics?.avgMatchScore ?? 0}% avg match score`
    },
  ];

  const velocityData = analytics?.hiringVelocity ?? [];
  const activityFeed = activity ?? analytics?.recentActivity ?? [];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-8">
      {/* Hero Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-mono text-indigo-400 tracking-widest uppercase">ORBIT v2.4 — Mission Active</span>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-foreground">Mission Control</h1>
            <p className="text-muted-foreground mt-1 text-base">
              {analytics?.timeToHireReduction ?? 0}% reduction in time-to-hire. All agents operational.
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/decision-chamber">
              <Button variant="outline" size="sm" className="border-border/50 hover:border-indigo-500/50">
                <Gavel className="mr-2 h-4 w-4" /> View Debate
              </Button>
            </Link>
            <Link href="/simulations">
              <Button variant="outline" size="sm" className="border-border/50 hover:border-indigo-500/50">
                <Activity className="mr-2 h-4 w-4" /> Simulations
              </Button>
            </Link>
            <Link href="/autopilot">
              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-900/50">
                <Zap className="mr-2 h-4 w-4" /> Launch Autopilot
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
            <Card className="p-5 bg-card/60 backdrop-blur border-border/40 hover:border-indigo-500/30 transition-colors group">
              <div className="flex items-start justify-between">
                <div className={`p-2 rounded-lg ${stat.bg}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold font-mono text-foreground">{stat.value}</div>
                </div>
              </div>
              <div className="mt-3">
                <div className="text-sm font-semibold text-foreground">{stat.label}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{stat.sub}</div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Top Candidate Banner */}
      {analytics?.topCandidate && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <Card className="p-5 bg-gradient-to-r from-indigo-950/60 via-card/60 to-card/60 border-indigo-500/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-11 w-11 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white text-sm">
                  {analytics.topCandidate.avatarInitials}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-indigo-400 uppercase tracking-widest">Top Recommended Candidate</span>
                    {analytics.topCandidate.hiddenTalent && (
                      <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs">Hidden Talent</Badge>
                    )}
                  </div>
                  <div className="font-bold text-foreground text-lg">{analytics.topCandidate.name}</div>
                  <div className="text-sm text-muted-foreground">{analytics.topCandidate.role} · {analytics.topCandidate.currentCompany}</div>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <ScoreRing score={analytics.topCandidate.overallScore} size={52} />
                  <div className="text-xs text-muted-foreground mt-1">Overall</div>
                </div>
                <Link href={`/candidates/${analytics.topCandidate.id}`}>
                  <Button variant="outline" size="sm" className="border-indigo-500/40 text-indigo-400 hover:bg-indigo-500/10">
                    View Profile <ChevronRight className="ml-1 h-3 w-3" />
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-3 gap-6">
        {/* Velocity Chart */}
        <Card className="col-span-2 p-6 bg-card/60 backdrop-blur border-border/40">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-foreground">Hiring Velocity</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Candidates discovered vs offers extended</p>
            </div>
            <TrendingUp className="h-4 w-4 text-emerald-400" />
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={velocityData}>
              <defs>
                <linearGradient id="candidatesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(243 75% 59%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(243 75% 59%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="offersGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(160 84% 39%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(160 84% 39%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(217 33% 17%)" />
              <XAxis dataKey="week" tick={{ fill: "hsl(215 20% 50%)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "hsl(215 20% 50%)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: "hsl(222 47% 11%)", border: "1px solid hsl(217 33% 20%)", borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: "hsl(210 40% 98%)" }}
              />
              <Area type="monotone" dataKey="candidates" stroke="hsl(243 75% 59%)" fill="url(#candidatesGrad)" strokeWidth={2} name="Candidates" />
              <Area type="monotone" dataKey="offers" stroke="hsl(160 84% 39%)" fill="url(#offersGrad)" strokeWidth={2} name="Offers" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Agent Activity Feed */}
        <Card className="p-5 bg-card/60 backdrop-blur border-border/40 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">Agent Activity</h3>
            <span className="flex items-center gap-1.5 text-xs text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live
            </span>
          </div>
          <div className="space-y-3 overflow-auto flex-1 pr-1">
            {activityFeed.slice(0, 10).map((act) => (
              <div key={act.id} className="flex gap-2.5 text-xs">
                <div className={`h-1.5 w-1.5 rounded-full mt-1.5 flex-shrink-0 ${AGENT_COLORS[act.agentType] ?? "bg-slate-500"}`} />
                <div>
                  <span className="text-muted-foreground">{act.agent}</span>
                  <div className={`${STATUS_COLORS[act.status] ?? "text-foreground"}`}>
                    {act.action} <span className="text-foreground font-medium">{act.target}</span>
                  </div>
                  <div className="text-muted-foreground/60 text-[10px] mt-0.5">
                    {new Date(act.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Hiring Funnel */}
      {funnel && funnel.length > 0 && (
        <Card className="p-6 bg-card/60 backdrop-blur border-border/40">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-foreground">Hiring Pipeline Funnel</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Stage-by-stage conversion</p>
            </div>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex items-end gap-3 h-28">
            {funnel.map((stage, i) => {
              const maxCount = Math.max(...funnel.map(s => s.count), 1);
              const heightPct = (stage.count / maxCount) * 100;
              const colors = ["bg-indigo-500", "bg-violet-500", "bg-purple-500", "bg-fuchsia-500", "bg-pink-500", "bg-emerald-500"];
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="text-[10px] font-mono text-foreground font-bold">{stage.count}</div>
                  <div
                    className={`w-full rounded-t-sm ${colors[i % colors.length]} opacity-80`}
                    style={{ height: `${heightPct}%` }}
                  />
                  <div className="text-[10px] text-muted-foreground text-center leading-tight">{stage.stage}</div>
                  <div className="text-[10px] text-emerald-400">{stage.conversionRate}%</div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
