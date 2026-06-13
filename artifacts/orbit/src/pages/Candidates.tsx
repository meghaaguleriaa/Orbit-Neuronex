import { useState } from "react";
import { useListCandidates, useMoveCandidate, getListCandidatesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import { Search, Users, ChevronRight, Sparkles, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

const STAGES = [
  { id: "discovery", label: "Discovery", color: "border-t-slate-500" },
  { id: "analysis", label: "AI Analysis", color: "border-t-blue-500" },
  { id: "interview", label: "Interview", color: "border-t-violet-500" },
  { id: "decision", label: "Decision Chamber", color: "border-t-indigo-500" },
  { id: "offer", label: "Offer", color: "border-t-amber-500" },
  { id: "hired", label: "Hired", color: "border-t-emerald-500" },
];

const VERDICT_STYLES: Record<string, string> = {
  "STRONG HIRE": "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  "HIRE": "bg-blue-500/15 text-blue-400 border-blue-500/30",
  "CONSIDER": "bg-amber-500/15 text-amber-400 border-amber-500/30",
  "REJECT": "bg-rose-500/15 text-rose-400 border-rose-500/30",
};

function ScoreRing({ score, size = 40 }: { score: number; size?: number }) {
  const r = (size - 5) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 85 ? "hsl(160 84% 39%)" : score >= 70 ? "hsl(243 75% 59%)" : "hsl(38 92% 50%)";
  return (
    <svg width={size} height={size}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(217 33% 17%)" strokeWidth={3.5} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={3.5}
        strokeDasharray={circumference} strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text x={size / 2} y={size / 2 + 3.5} textAnchor="middle" fill="white" fontSize={9} fontWeight="bold">
        {Math.round(score)}
      </text>
    </svg>
  );
}

export default function Candidates() {
  const [search, setSearch] = useState("");
  const { data: allCandidates, isLoading } = useListCandidates();
  const moveCandidate = useMoveCandidate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const candidates = (allCandidates ?? []).filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.role.toLowerCase().includes(search.toLowerCase()) ||
    c.currentCompany.toLowerCase().includes(search.toLowerCase())
  );

  const byStage = (stageId: string) => candidates.filter(c => c.stage === stageId);

  const handleMove = async (candidateId: number, stage: string, candidateName: string) => {
    try {
      await moveCandidate.mutateAsync({ data: { candidateId, stage } });
      queryClient.invalidateQueries({ queryKey: getListCandidatesQueryKey() });
      toast({ title: "Moved", description: `${candidateName} moved to ${stage}` });
    } catch {
      toast({ title: "Error", description: "Failed to move candidate", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-full">
        <Skeleton className="h-16 w-full rounded-xl" />
        <div className="flex gap-4 overflow-x-auto pb-4">
          {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-96 w-64 flex-shrink-0 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between flex-shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Users className="h-4 w-4 text-indigo-400" />
            <span className="text-xs font-mono text-indigo-400 tracking-widest uppercase">Pipeline</span>
          </div>
          <h1 className="text-3xl font-bold">Candidate Pipeline</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{candidates.length} candidates across {STAGES.length} stages</p>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search candidates..."
            className="pl-9 bg-card/60 border-border/50 text-sm h-9"
            data-testid="input-search"
          />
        </div>
      </motion.div>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4 flex-1 min-h-0">
        {STAGES.map((stage, si) => {
          const stageCandidates = byStage(stage.id);
          return (
            <div key={stage.id} className="flex-shrink-0 w-64 flex flex-col" data-testid={`stage-${stage.id}`}>
              <div className={`bg-card/60 border border-border/40 rounded-xl border-t-2 ${stage.color} flex flex-col h-full overflow-hidden`}>
                <div className="p-3 border-b border-border/30 flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground uppercase tracking-wide">{stage.label}</span>
                  <span className="text-xs font-mono bg-border/40 text-muted-foreground px-2 py-0.5 rounded-full">{stageCandidates.length}</span>
                </div>
                <div className="flex-1 overflow-auto p-2 space-y-2">
                  {stageCandidates.map((c, ci) => (
                    <motion.div
                      key={c.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: si * 0.05 + ci * 0.03 }}
                      data-testid={`card-candidate-${c.id}`}
                    >
                      <Card className="p-3 bg-card/80 border-border/30 hover:border-indigo-500/30 transition-all group cursor-pointer">
                        <div className="flex items-start gap-2.5 mb-2">
                          <div className="h-8 w-8 rounded-full bg-indigo-600/80 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                            {c.avatarInitials}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-xs text-foreground truncate">{c.name}</div>
                            <div className="text-[10px] text-muted-foreground truncate">{c.role}</div>
                            <div className="text-[10px] text-muted-foreground/60 truncate">{c.currentCompany}</div>
                          </div>
                          <ScoreRing score={c.overallScore} size={36} />
                        </div>

                        <div className="flex flex-wrap gap-1 mb-2">
                          {c.hiddenTalent && (
                            <Badge className="text-[9px] bg-amber-500/15 text-amber-400 border-amber-500/30 px-1.5 py-0">
                              <Sparkles className="h-2.5 w-2.5 mr-0.5" />Hidden Talent
                            </Badge>
                          )}
                          {c.verdict && (
                            <Badge className={`text-[9px] px-1.5 py-0 ${VERDICT_STYLES[c.verdict] ?? "bg-muted/20 text-muted-foreground"}`}>
                              {c.verdict}
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          <Link href={`/candidates/${c.id}`}>
                            <button
                              className="flex-1 text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5 py-1 transition-colors"
                              data-testid={`link-candidate-${c.id}`}
                            >
                              View Twin <ChevronRight className="h-2.5 w-2.5" />
                            </button>
                          </Link>
                          {si < STAGES.length - 1 && (
                            <button
                              onClick={() => handleMove(c.id, STAGES[si + 1].id, c.name)}
                              className="text-[10px] text-muted-foreground hover:text-emerald-400 flex items-center gap-0.5 transition-colors py-1"
                              data-testid={`button-advance-${c.id}`}
                            >
                              <TrendingUp className="h-2.5 w-2.5" /> Advance
                            </button>
                          )}
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                  {stageCandidates.length === 0 && (
                    <div className="text-[10px] text-muted-foreground/50 text-center py-6">No candidates</div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
