import { useRoute, Link } from "wouter";
import { useGetCandidate, useGetCandidateTwin, useGetCandidateSimulation, useCreateDebate, getListDebatesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, Sparkles, Gavel, Activity, MapPin, Briefcase, Clock, TrendingUp, Zap } from "lucide-react";
import { motion } from "framer-motion";
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip
} from "recharts";
import { useToast } from "@/hooks/use-toast";

const VERDICT_CONFIG: Record<string, { color: string; bg: string }> = {
  "STRONG HIRE": { color: "text-emerald-400", bg: "bg-emerald-500/15 border-emerald-500/30" },
  "HIRE": { color: "text-blue-400", bg: "bg-blue-500/15 border-blue-500/30" },
  "CONSIDER": { color: "text-amber-400", bg: "bg-amber-500/15 border-amber-500/30" },
  "REJECT": { color: "text-rose-400", bg: "bg-rose-500/15 border-rose-500/30" },
};

function ScoreBar({ label, score, color = "bg-indigo-500" }: { label: string; score: number; color?: string }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono text-foreground font-semibold">{Math.round(score)}</span>
      </div>
      <div className="h-1.5 bg-border/40 rounded-full">
        <div className={`h-full ${color} rounded-full opacity-80 transition-all`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

export default function CandidateProfile() {
  const [, params] = useRoute("/candidates/:id");
  const id = Number(params?.id ?? 0);
  const { data: candidate, isLoading: candLoading } = useGetCandidate(id, { query: { enabled: !!id } });
  const { data: twin, isLoading: twinLoading } = useGetCandidateTwin(id, { query: { enabled: !!id } });
  const { data: sim } = useGetCandidateSimulation(id, { query: { enabled: !!id } });
  const createDebate = useCreateDebate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleDebate = async () => {
    if (!candidate) return;
    try {
      await createDebate.mutateAsync({ data: { candidateId: candidate.id } });
      queryClient.invalidateQueries({ queryKey: getListDebatesQueryKey() });
      toast({ title: "Debate created", description: `AI agents are evaluating ${candidate.name}` });
    } catch {
      toast({ title: "Error", description: "Could not create debate", variant: "destructive" });
    }
  };

  if (candLoading || twinLoading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <Skeleton className="h-16 w-48 rounded-xl" />
        <div className="grid grid-cols-3 gap-6">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="col-span-2 h-80 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="text-muted-foreground">Candidate not found</div>
        <Link href="/candidates"><Button variant="outline">Back to Pipeline</Button></Link>
      </div>
    );
  }

  const verdictCfg = VERDICT_CONFIG[candidate.verdict ?? ""] ?? null;
  const radarData = (twin?.skillDna ?? candidate.skills ?? []).map(s => ({
    subject: s.skill, A: s.score, fullMark: 100
  }));

  const simForecast = sim?.forecast ?? [];

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-8">
      {/* Back + Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <Link href="/candidates">
          <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4" data-testid="link-back">
            <ChevronLeft className="h-4 w-4" /> Pipeline
          </button>
        </Link>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-5">
            <div className="h-16 w-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-xl font-black text-white">
              {candidate.avatarInitials}
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-3xl font-bold text-foreground">{candidate.name}</h1>
                {candidate.hiddenTalent && (
                  <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                    <Sparkles className="h-3 w-3 mr-1" /> Hidden Talent
                  </Badge>
                )}
                {verdictCfg && (
                  <Badge className={`${verdictCfg.bg} ${verdictCfg.color} font-bold`}>{candidate.verdict}</Badge>
                )}
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" />{candidate.role}</span>
                <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{candidate.location}</span>
                <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{candidate.yearsExperience}y exp at {candidate.currentCompany}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline" size="sm"
              onClick={handleDebate}
              disabled={createDebate.isPending}
              className="border-border/50 hover:border-indigo-500/50"
              data-testid="button-run-debate"
            >
              <Gavel className="mr-2 h-3.5 w-3.5" />
              {createDebate.isPending ? "Running..." : "Run Debate"}
            </Button>
            <Link href="/decision-chamber">
              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white" data-testid="link-chamber">
                <Zap className="mr-2 h-3.5 w-3.5" /> View Chamber
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Key Scores */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Overall Match", val: candidate.overallScore, color: "text-indigo-400" },
          { label: "Technical", val: candidate.technicalScore, color: "text-blue-400" },
          { label: "Culture Fit", val: candidate.cultureScore, color: "text-rose-400" },
          { label: "Growth", val: candidate.growthScore, color: "text-emerald-400" },
        ].map(({ label, val, color }) => (
          <Card key={label} className="p-5 bg-card/60 border-border/40 text-center">
            <div className={`text-3xl font-black font-mono ${color}`}>{Math.round(val)}</div>
            <div className="text-xs text-muted-foreground mt-1">{label}</div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Skill DNA Radar */}
        <Card className="p-5 bg-card/60 border-border/40">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-4 w-4 text-indigo-400" />
            <h3 className="font-semibold text-sm">Skill DNA</h3>
          </div>
          {radarData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="hsl(217 33% 20%)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: "hsl(215 20% 55%)", fontSize: 10 }} />
                <Radar name="Score" dataKey="A" stroke="hsl(243 75% 59%)" fill="hsl(243 75% 59%)" fillOpacity={0.25} />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">No skill data</div>
          )}
          <div className="space-y-2 mt-2">
            {(twin?.skillDna ?? candidate.skills ?? []).slice(0, 4).map(s => (
              <ScoreBar
                key={s.skill} label={s.skill} score={s.score}
                color={s.category === "technical" ? "bg-blue-500" : s.category === "soft" ? "bg-rose-500" : "bg-violet-500"}
              />
            ))}
          </div>
        </Card>

        {/* Twin Profile */}
        <Card className="col-span-2 p-5 bg-card/60 border-border/40">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-4 w-4 text-indigo-400" />
            <h3 className="font-semibold text-sm">Digital Twin Profile</h3>
          </div>
          {twin ? (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Growth Trajectory</div>
                  <div className="font-semibold text-foreground capitalize">{twin.growthTrajectory}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Promotion Timeline</div>
                  <div className="font-semibold text-foreground">{twin.promotionTimeline}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Future Success</div>
                  <div className="font-semibold text-emerald-400">{Math.round(twin.futureSuccessPrediction)}%</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Retention Forecast</div>
                  <div className="font-semibold text-blue-400">{Math.round(twin.retentionForecast)}%</div>
                </div>
              </div>
              <div className="space-y-2">
                <ScoreBar label="Learning Velocity" score={twin.learningVelocity} color="bg-violet-500" />
                <ScoreBar label="Leadership Potential" score={twin.leadershipPotential} color="bg-amber-500" />
                <ScoreBar label="Adaptability" score={twin.adaptabilityScore} color="bg-blue-500" />
                <ScoreBar label="Communication" score={twin.communicationScore} color="bg-rose-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-widest mb-2">Strengths</div>
                  <div className="space-y-1">
                    {twin.strengths.slice(0, 3).map((s, i) => (
                      <div key={i} className="text-xs text-foreground flex items-start gap-1.5">
                        <span className="text-emerald-400 mt-0.5">+</span>{s}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-widest mb-2">Development Areas</div>
                  <div className="space-y-1">
                    {twin.weaknesses.map((w, i) => (
                      <div key={i} className="text-xs text-foreground flex items-start gap-1.5">
                        <span className="text-amber-400 mt-0.5">~</span>{w}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">Twin data loading...</div>
          )}
        </Card>
      </div>

      {/* Performance Simulation */}
      {simForecast.length > 0 && (
        <Card className="p-5 bg-card/60 border-border/40">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-semibold text-sm">12-Month Performance Simulation</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Predicted trajectory based on candidate profile analysis</p>
            </div>
            <div className="flex gap-4 text-xs">
              <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-indigo-500" />Performance</div>
              <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" />Productivity</div>
              <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-violet-500" />Team Impact</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={simForecast}>
              <defs>
                {[
                  { id: "perfGrad", color: "hsl(243 75% 59%)" },
                  { id: "prodGrad", color: "hsl(160 84% 39%)" },
                  { id: "impactGrad", color: "hsl(262 83% 58%)" },
                ].map(({ id, color }) => (
                  <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(217 33% 17%)" />
              <XAxis dataKey="month" tick={{ fill: "hsl(215 20% 50%)", fontSize: 10 }} axisLine={false} tickLine={false} interval={1} />
              <YAxis domain={[0, 100]} tick={{ fill: "hsl(215 20% 50%)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: "hsl(222 47% 11%)", border: "1px solid hsl(217 33% 20%)", borderRadius: 8, fontSize: 11 }}
              />
              <Area type="monotone" dataKey="performance" stroke="hsl(243 75% 59%)" fill="url(#perfGrad)" strokeWidth={2} name="Performance" />
              <Area type="monotone" dataKey="productivity" stroke="hsl(160 84% 39%)" fill="url(#prodGrad)" strokeWidth={2} name="Productivity" />
              <Area type="monotone" dataKey="teamImpact" stroke="hsl(262 83% 58%)" fill="url(#impactGrad)" strokeWidth={2} name="Team Impact" />
            </AreaChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="text-center p-3 bg-border/20 rounded-lg">
              <div className="text-lg font-bold font-mono text-indigo-400">{sim?.threeMonthScore ?? "—"}%</div>
              <div className="text-xs text-muted-foreground">3-Month</div>
            </div>
            <div className="text-center p-3 bg-border/20 rounded-lg">
              <div className="text-lg font-bold font-mono text-violet-400">{sim?.sixMonthScore ?? "—"}%</div>
              <div className="text-xs text-muted-foreground">6-Month</div>
            </div>
            <div className="text-center p-3 bg-border/20 rounded-lg">
              <div className="text-lg font-bold font-mono text-emerald-400">{sim?.twelveMonthScore ?? "—"}%</div>
              <div className="text-xs text-muted-foreground">12-Month</div>
            </div>
          </div>
        </Card>
      )}

      {/* Summary */}
      <Card className="p-5 bg-card/60 border-border/40">
        <div className="text-xs text-muted-foreground uppercase tracking-widest mb-2">AI Assessment Summary</div>
        <p className="text-sm text-foreground leading-relaxed">{candidate.summary}</p>
      </Card>
    </div>
  );
}
