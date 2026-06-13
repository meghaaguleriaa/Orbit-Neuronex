import { useState } from "react";
import { useGetTeamChemistry, useListCandidates, usePreviewChemistry } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, TrendingUp, ArrowRight, Zap } from "lucide-react";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, RadarProps } from "recharts";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

function ScoreBar({ label, score, color = "bg-indigo-500" }: { label: string; score: number; color?: string }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono text-foreground">{Math.round(score)}</span>
      </div>
      <div className="h-2 bg-border/40 rounded-full">
        <motion.div
          className={`h-full ${color} rounded-full opacity-80`}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

export default function TeamChemistry() {
  const { data: chemistry, isLoading } = useGetTeamChemistry();
  const { data: candidates } = useListCandidates();
  const [selectedCandidate, setSelectedCandidate] = useState<string>("");
  const [preview, setPreview] = useState<any>(null);
  const previewMutation = usePreviewChemistry();
  const { toast } = useToast();

  const handlePreview = async () => {
    if (!selectedCandidate) return;
    try {
      const result = await previewMutation.mutateAsync({ data: { candidateId: Number(selectedCandidate) } });
      setPreview(result);
    } catch {
      toast({ title: "Error", description: "Could not preview chemistry", variant: "destructive" });
    }
  };

  if (isLoading || !chemistry) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <Skeleton className="h-20 w-full rounded-xl" />
        <div className="grid grid-cols-2 gap-6">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </div>
    );
  }

  const radarData = chemistry.dimensions.map((d: any) => ({
    subject: d.dimension.split(" ")[0],
    current: d.score,
    projected: preview ? Math.min(100, d.score + (preview.delta ?? 0) * 0.8) : d.score,
    fullMark: 100,
  }));

  const selectedCandidateName = candidates?.find(c => String(c.id) === selectedCandidate)?.name;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2 mb-1">
          <Users className="h-4 w-4 text-indigo-400" />
          <span className="text-xs font-mono text-indigo-400 tracking-widest uppercase">Team Chemistry Engine</span>
        </div>
        <h1 className="text-3xl font-bold">Team Chemistry Analysis</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Understand how each hire shapes team dynamics and collective potential</p>
      </motion.div>

      {/* Overall score banner */}
      <Card className="p-6 bg-gradient-to-r from-indigo-950/60 to-card/60 border-indigo-500/20">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-1">Current Team Chemistry Score</div>
            <div className="text-5xl font-black font-mono text-indigo-400">{chemistry.overallScore}</div>
            <div className="text-sm text-muted-foreground mt-1">out of 100 — Good standing</div>
          </div>
          <div className="flex gap-3">
            <Select value={selectedCandidate} onValueChange={setSelectedCandidate}>
              <SelectTrigger className="w-52 bg-card border-border/50" data-testid="select-candidate-chemistry">
                <SelectValue placeholder="Select candidate" />
              </SelectTrigger>
              <SelectContent>
                {(candidates ?? []).map(c => (
                  <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={handlePreview}
              disabled={!selectedCandidate || previewMutation.isPending}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
              data-testid="button-preview-chemistry"
            >
              <Zap className="mr-2 h-4 w-4" />
              {previewMutation.isPending ? "Analyzing..." : "Preview Impact"}
            </Button>
          </div>
        </div>
      </Card>

      {/* Preview result */}
      {preview && selectedCandidateName && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className={`p-5 border ${preview.delta >= 3 ? "bg-emerald-500/10 border-emerald-500/20" : preview.delta >= 1 ? "bg-blue-500/10 border-blue-500/20" : "bg-muted/10 border-border/40"}`}>
            <div className="flex items-center gap-4 mb-4">
              <div className="text-center p-3 bg-card/60 rounded-lg">
                <div className="text-2xl font-bold font-mono text-foreground">{preview.currentScore}</div>
                <div className="text-xs text-muted-foreground">Current</div>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
              <div className="text-center p-3 bg-card/60 rounded-lg">
                <div className="text-2xl font-bold font-mono text-emerald-400">{preview.projectedScore}</div>
                <div className="text-xs text-muted-foreground">With {selectedCandidateName}</div>
              </div>
              <Badge className={`ml-4 text-sm px-3 py-1 ${preview.delta >= 3 ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-blue-500/20 text-blue-400 border-blue-500/30"}`}>
                +{preview.delta} pts
              </Badge>
              <div className="ml-auto">
                <div className="text-sm font-semibold text-foreground">{preview.recommendation}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-widest mb-2">Improvements</div>
                {preview.improvements.map((imp: string, i: number) => (
                  <div key={i} className="text-xs text-foreground flex items-start gap-1.5 mb-1">
                    <span className="text-emerald-400">+</span>{imp}
                  </div>
                ))}
              </div>
              {preview.risks.length > 0 && (
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-widest mb-2">Risks</div>
                  {preview.risks.map((r: string, i: number) => (
                    <div key={i} className="text-xs text-foreground flex items-start gap-1.5 mb-1">
                      <span className="text-amber-400">~</span>{r}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      )}

      <div className="grid grid-cols-2 gap-6">
        {/* Radar Chart */}
        <Card className="p-5 bg-card/60 border-border/40">
          <h3 className="font-semibold text-sm mb-4">Chemistry Dimensions</h3>
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="hsl(217 33% 20%)" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: "hsl(215 20% 55%)", fontSize: 11 }} />
              <Radar name="Current" dataKey="current" stroke="hsl(243 75% 59%)" fill="hsl(243 75% 59%)" fillOpacity={0.2} />
              {preview && (
                <Radar name="Projected" dataKey="projected" stroke="hsl(160 84% 39%)" fill="hsl(160 84% 39%)" fillOpacity={0.15} />
              )}
            </RadarChart>
          </ResponsiveContainer>
          <div className="flex gap-4 justify-center text-xs mt-2">
            <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-indigo-500" />Current Team</div>
            {preview && <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" />With Candidate</div>}
          </div>
        </Card>

        {/* Dimension Scores */}
        <Card className="p-5 bg-card/60 border-border/40">
          <h3 className="font-semibold text-sm mb-4">Score Breakdown</h3>
          <div className="space-y-4">
            {chemistry.dimensions.map((d: any) => (
              <ScoreBar
                key={d.dimension} label={d.dimension} score={d.score}
                color={d.score > 80 ? "bg-emerald-500" : d.score > 70 ? "bg-indigo-500" : "bg-amber-500"}
              />
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-border/40 space-y-2">
            {chemistry.insights.map((insight: string, i: number) => (
              <div key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                <TrendingUp className="h-3 w-3 text-indigo-400 mt-0.5 flex-shrink-0" />
                {insight}
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Team Members */}
      <Card className="p-5 bg-card/60 border-border/40">
        <h3 className="font-semibold text-sm mb-4">Current Team</h3>
        <div className="grid grid-cols-5 gap-3">
          {chemistry.members.map((m: any, i: number) => (
            <div key={i} className="text-center p-3 bg-border/20 rounded-lg" data-testid={`team-member-${i}`}>
              <div className="h-10 w-10 rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold text-white mx-auto mb-2">
                {m.name.split(" ").map((n: string) => n[0]).join("")}
              </div>
              <div className="text-xs font-medium text-foreground">{m.name}</div>
              <div className="text-[10px] text-muted-foreground">{m.role}</div>
              <Badge className="mt-1.5 text-[9px] bg-indigo-500/10 text-indigo-400 border-indigo-500/20">{m.leadershipStyle}</Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
