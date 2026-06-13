import { useState } from "react";
import { useListDebates, useGetDebate, useCreateDebate, useListCandidates, getListDebatesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Code2, Heart, TrendingUp, ShieldAlert, Bot, ChevronRight, Gavel, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

const AGENT_CONFIG = {
  technical: { icon: Code2, color: "text-blue-400", bg: "bg-blue-500/15", border: "border-blue-500/40", label: "Technical" },
  culture: { icon: Heart, color: "text-rose-400", bg: "bg-rose-500/15", border: "border-rose-500/40", label: "Culture" },
  growth: { icon: TrendingUp, color: "text-emerald-400", bg: "bg-emerald-500/15", border: "border-emerald-500/40", label: "Growth" },
  risk: { icon: ShieldAlert, color: "text-amber-400", bg: "bg-amber-500/15", border: "border-amber-500/40", label: "Risk" },
};

const STANCE_COLORS: Record<string, string> = {
  SUPPORTS: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
  CHALLENGES: "text-amber-400 bg-amber-500/10 border-amber-500/30",
  CONCERNS: "text-rose-400 bg-rose-500/10 border-rose-500/30",
  ANALYZES: "text-blue-400 bg-blue-500/10 border-blue-500/30",
};

const VERDICT_CONFIG: Record<string, { color: string; bg: string; glow: string }> = {
  "STRONG HIRE": { color: "text-emerald-400", bg: "bg-emerald-500/10", glow: "shadow-emerald-900/60" },
  "HIRE": { color: "text-blue-400", bg: "bg-blue-500/10", glow: "shadow-blue-900/60" },
  "CONSIDER": { color: "text-amber-400", bg: "bg-amber-500/10", glow: "shadow-amber-900/60" },
  "REJECT": { color: "text-rose-400", bg: "bg-rose-500/10", glow: "shadow-rose-900/60" },
};

function ConfidenceRing({ score }: { score: number }) {
  const r = 46;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 100) * circumference;
  return (
    <svg width={108} height={108} className="rotate-[-90deg]">
      <circle cx={54} cy={54} r={r} fill="none" stroke="hsl(217 33% 17%)" strokeWidth={8} />
      <circle
        cx={54} cy={54} r={r} fill="none"
        stroke="hsl(243 75% 59%)" strokeWidth={8}
        strokeDasharray={circumference} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 1s ease" }}
      />
    </svg>
  );
}

function AgentCard({ type, score, active }: { type: string; score: number; active?: boolean }) {
  const cfg = AGENT_CONFIG[type as keyof typeof AGENT_CONFIG];
  if (!cfg) return null;
  const Icon = cfg.icon;
  return (
    <Card className={`p-5 ${cfg.bg} border ${cfg.border} ${active ? "ring-1 ring-indigo-500/50" : ""} transition-all`}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 rounded-lg ${cfg.bg} border ${cfg.border}`}>
          <Icon className={`h-5 w-5 ${cfg.color}`} />
        </div>
        <div>
          <div className="font-semibold text-sm text-foreground">{cfg.label} Agent</div>
          <div className="text-xs text-muted-foreground">Specialized Evaluator</div>
        </div>
        {active && <span className="ml-auto h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />}
      </div>
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">Score</div>
        <div className={`text-2xl font-bold font-mono ${cfg.color}`}>{Math.round(score)}</div>
      </div>
      <div className="mt-2 h-1.5 rounded-full bg-border/50">
        <div className={`h-full rounded-full bg-current ${cfg.color}`} style={{ width: `${score}%`, opacity: 0.7 }} />
      </div>
    </Card>
  );
}

export default function DecisionChamber() {
  const { data: debates, isLoading } = useListDebates();
  const { data: candidates } = useListCandidates();
  const [selectedDebateId, setSelectedDebateId] = useState<number | null>(null);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>("");
  const createDebate = useCreateDebate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: debate } = useGetDebate(
    selectedDebateId ?? (debates?.[0]?.id ?? 0),
    { query: { enabled: !!(selectedDebateId ?? debates?.[0]?.id) } }
  );

  const activeDebate = debate ?? debates?.[0];

  const handleRunDebate = async () => {
    if (!selectedCandidateId) {
      toast({ title: "Select a candidate", description: "Choose a candidate to run the debate for." });
      return;
    }
    try {
      const result = await createDebate.mutateAsync({ data: { candidateId: Number(selectedCandidateId) } });
      setSelectedDebateId(result.id);
      queryClient.invalidateQueries({ queryKey: getListDebatesQueryKey() });
      toast({ title: "Debate initiated", description: `AI agents are evaluating ${result.candidateName}` });
    } catch {
      toast({ title: "Error", description: "Failed to create debate", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto">
        <Skeleton className="h-20 w-full rounded-xl" />
        <div className="grid grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  const verdict = activeDebate?.verdict ?? "";
  const verdictCfg = VERDICT_CONFIG[verdict] ?? { color: "text-muted-foreground", bg: "bg-muted/20", glow: "" };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Gavel className="h-4 w-4 text-indigo-400" />
              <span className="text-xs font-mono text-indigo-400 tracking-widest uppercase">AI Decision Chamber</span>
            </div>
            <h1 className="text-4xl font-bold tracking-tight">Boardroom Intelligence</h1>
            <p className="text-muted-foreground mt-1">Four specialized agents deliberate. One verdict emerges.</p>
          </div>
          <div className="flex items-end gap-3">
            <Select value={selectedCandidateId} onValueChange={setSelectedCandidateId}>
              <SelectTrigger className="w-52 bg-card border-border/50" data-testid="select-candidate">
                <SelectValue placeholder="Select candidate" />
              </SelectTrigger>
              <SelectContent>
                {(candidates ?? []).map(c => (
                  <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={handleRunDebate}
              disabled={createDebate.isPending}
              className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-900/40"
              data-testid="button-run-debate"
            >
              <Zap className="mr-2 h-4 w-4" />
              {createDebate.isPending ? "Running..." : "Run Debate"}
            </Button>
          </div>
        </div>

        {/* Debate selector */}
        {(debates ?? []).length > 1 && (
          <div className="flex gap-2 mt-4 flex-wrap">
            {(debates ?? []).map(d => (
              <button
                key={d.id}
                onClick={() => setSelectedDebateId(d.id)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                  (selectedDebateId ?? debates?.[0]?.id) === d.id
                    ? "bg-indigo-600/20 border-indigo-500/50 text-indigo-300"
                    : "border-border/40 text-muted-foreground hover:border-indigo-500/30"
                }`}
              >
                {d.candidateName}
              </button>
            ))}
          </div>
        )}
      </motion.div>

      {activeDebate ? (
        <>
          {/* Candidate context */}
          <Card className="p-4 bg-indigo-950/40 border-indigo-500/20">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white">
                {activeDebate.candidateName.split(" ").map(n => n[0]).join("").slice(0, 2)}
              </div>
              <div>
                <div className="font-bold text-foreground">{activeDebate.candidateName}</div>
                <div className="text-sm text-muted-foreground">Candidate for: {activeDebate.jobTitle}</div>
              </div>
              <Badge className={`ml-auto ${verdictCfg.color} ${verdictCfg.bg} border-current/30 font-bold text-sm px-3 py-1`}>
                {verdict}
              </Badge>
            </div>
          </Card>

          {/* Agent Scorecards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <AgentCard type="technical" score={activeDebate.technicalScore} active />
            <AgentCard type="culture" score={activeDebate.cultureScore} active />
            <AgentCard type="growth" score={activeDebate.growthScore} active />
            <AgentCard type="risk" score={activeDebate.riskScore} active />
          </div>

          {/* Debate + Verdict */}
          <div className="grid grid-cols-3 gap-6">
            {/* Debate Timeline */}
            <div className="col-span-2">
              <Card className="bg-card/60 border-border/40 h-[520px] flex flex-col">
                <div className="p-5 border-b border-border/40 flex items-center gap-2">
                  <Bot className="h-4 w-4 text-indigo-400" />
                  <span className="font-semibold text-foreground">Live AI Debate</span>
                  <span className="text-xs text-muted-foreground ml-2">{activeDebate.messages.length} exchanges</span>
                </div>
                <div className="flex-1 overflow-auto p-5 space-y-4">
                  <AnimatePresence>
                    {activeDebate.messages.map((msg, i) => {
                      const cfg = AGENT_CONFIG[msg.agentType as keyof typeof AGENT_CONFIG];
                      const Icon = cfg?.icon ?? Bot;
                      const stanceCls = STANCE_COLORS[msg.stance] ?? "text-muted-foreground bg-muted/10 border-muted/20";
                      return (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="flex gap-3"
                          data-testid={`debate-message-${i}`}
                        >
                          <div className={`p-1.5 rounded-lg ${cfg?.bg ?? "bg-muted/20"} border ${cfg?.border ?? "border-border/40"} flex-shrink-0 h-8 w-8 flex items-center justify-center`}>
                            <Icon className={`h-4 w-4 ${cfg?.color ?? "text-muted-foreground"}`} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className={`text-xs font-semibold ${cfg?.color ?? "text-foreground"}`}>{msg.agent}</span>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded border ${stanceCls} font-mono`}>{msg.stance}</span>
                              <span className="text-[10px] text-muted-foreground/60 ml-auto">
                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </span>
                            </div>
                            <div className="text-sm text-foreground/90 leading-relaxed bg-card/40 rounded-lg p-3 border border-border/30">
                              {msg.message}
                            </div>
                            {msg.evidence && msg.evidence.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                {msg.evidence.map((e, ei) => (
                                  <span key={ei} className="text-[10px] px-2 py-0.5 rounded bg-border/30 text-muted-foreground">
                                    {e}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </Card>
            </div>

            {/* Verdict Panel */}
            <div className="space-y-4">
              <Card className={`p-6 ${verdictCfg.bg} border-current/30 shadow-2xl ${verdictCfg.glow} flex flex-col items-center text-center`}>
                <div className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-4">Final Verdict</div>
                <div className="relative">
                  <ConfidenceRing score={activeDebate.confidenceScore} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center rotate-0">
                    <div className="text-2xl font-bold font-mono text-foreground">{Math.round(activeDebate.confidenceScore)}%</div>
                    <div className="text-[10px] text-muted-foreground">confidence</div>
                  </div>
                </div>
                <div className={`text-3xl font-black tracking-tight mt-4 ${verdictCfg.color}`}>{verdict}</div>
                <p className="text-xs text-muted-foreground mt-3 leading-relaxed">{activeDebate.summary}</p>
              </Card>

              {/* Score Breakdown */}
              <Card className="p-5 bg-card/60 border-border/40">
                <div className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-4">Score Breakdown</div>
                <div className="space-y-3">
                  {[
                    { label: "Technical", score: activeDebate.technicalScore, color: "bg-blue-500" },
                    { label: "Culture", score: activeDebate.cultureScore, color: "bg-rose-500" },
                    { label: "Growth", score: activeDebate.growthScore, color: "bg-emerald-500" },
                    { label: "Retention", score: activeDebate.riskScore, color: "bg-amber-500" },
                  ].map(({ label, score, color }) => (
                    <div key={label}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">{label}</span>
                        <span className="font-mono text-foreground">{Math.round(score)}</span>
                      </div>
                      <div className="h-1.5 bg-border/40 rounded-full">
                        <div className={`h-full ${color} rounded-full opacity-80`} style={{ width: `${score}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Debate history */}
              {(debates ?? []).length > 0 && (
                <Card className="p-4 bg-card/60 border-border/40">
                  <div className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-3">Recent Debates</div>
                  <div className="space-y-2">
                    {(debates ?? []).slice(0, 4).map(d => {
                      const vc = VERDICT_CONFIG[d.verdict] ?? { color: "text-muted-foreground" };
                      return (
                        <button
                          key={d.id}
                          onClick={() => setSelectedDebateId(d.id)}
                          className="w-full flex items-center justify-between text-xs hover:bg-border/20 p-2 rounded transition-colors"
                          data-testid={`debate-history-${d.id}`}
                        >
                          <span className="text-foreground font-medium truncate flex-1 text-left">{d.candidateName}</span>
                          <span className={`font-bold ml-2 ${vc.color}`}>{d.verdict}</span>
                          <ChevronRight className="h-3 w-3 text-muted-foreground ml-1" />
                        </button>
                      );
                    })}
                  </div>
                </Card>
              )}
            </div>
          </div>
        </>
      ) : (
        <Card className="p-16 text-center bg-card/60 border-border/40">
          <Gavel className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
          <div className="text-lg font-semibold text-foreground mb-2">No Debates Yet</div>
          <p className="text-muted-foreground text-sm mb-6">Select a candidate above and run the first AI debate.</p>
        </Card>
      )}
    </div>
  );
}
