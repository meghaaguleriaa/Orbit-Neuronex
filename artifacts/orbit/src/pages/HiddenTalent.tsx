import { useGetHiddenTalents } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Sparkles, MapPin, Briefcase, ChevronRight, TrendingUp, Eye } from "lucide-react";
import { motion } from "framer-motion";

const UPSKILLING_PATHS: Record<string, { missing: string[]; time: string; certs: string[] }> = {
  default: {
    missing: ["Technical presentation skills", "Cross-functional project ownership", "Executive stakeholder management"],
    time: "8–12 weeks",
    certs: ["AWS Solutions Architect", "Google Cloud Professional", "Scrum Master"]
  }
};

export default function HiddenTalent() {
  const { data: talents, isLoading } = useGetHiddenTalents();

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <Skeleton className="h-20 w-full rounded-xl" />
        <div className="space-y-4">
          {[1,2,3].map(i => <Skeleton key={i} className="h-48 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="h-4 w-4 text-amber-400" />
          <span className="text-xs font-mono text-amber-400 tracking-widest uppercase">Hidden Talent Detection</span>
        </div>
        <h1 className="text-3xl font-bold">Hidden Gems</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Candidates whose true potential exceeds what their resume suggests</p>
      </motion.div>

      <Card className="p-4 bg-amber-500/10 border-amber-500/20">
        <p className="text-sm text-amber-300 leading-relaxed">
          ORBIT's Candidate Intelligence Agent cross-references resume signals against GitHub activity, project quality, 
          open-source contributions, academic achievements, and behavioral patterns. These candidates show a 
          significant gap between their listed experience and their demonstrated capability.
        </p>
      </Card>

      {(talents ?? []).length === 0 ? (
        <Card className="p-16 text-center bg-card/60 border-border/40">
          <Sparkles className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
          <div className="text-lg font-semibold text-foreground mb-2">No Hidden Talents Detected</div>
          <p className="text-muted-foreground text-sm">Add more candidates to the pipeline for the Intelligence Agent to analyze.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {(talents ?? []).map((c, i) => {
            const upskill = UPSKILLING_PATHS.default;
            return (
              <motion.div key={c.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}>
                <Card className="p-6 bg-card/60 border-amber-500/20 hover:border-amber-500/40 transition-all" data-testid={`hidden-talent-${c.id}`}>
                  <div className="flex items-start gap-5">
                    <div className="h-14 w-14 rounded-2xl bg-amber-600/30 border border-amber-500/40 flex items-center justify-center text-lg font-black text-amber-300 flex-shrink-0">
                      {c.avatarInitials}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-bold text-lg text-foreground">{c.name}</h3>
                        <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                          <Sparkles className="h-3 w-3 mr-1" /> Hidden Talent Detected
                        </Badge>
                        {c.verdict && (
                          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">{c.verdict}</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                        <span className="flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" />{c.role}</span>
                        <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{c.location}</span>
                      </div>

                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="p-3 bg-rose-500/10 rounded-lg border border-rose-500/20">
                          <div className="text-xs text-muted-foreground mb-1 uppercase tracking-widest">Resume Signal</div>
                          <div className="text-lg font-bold font-mono text-rose-400">Average</div>
                          <div className="text-xs text-muted-foreground mt-0.5">{c.yearsExperience}y at {c.currentCompany}</div>
                        </div>
                        <div className="p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                          <div className="text-xs text-muted-foreground mb-1 uppercase tracking-widest">GitHub Signal</div>
                          <div className="text-lg font-bold font-mono text-emerald-400 capitalize">{c.githubActivity}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">Open-source quality</div>
                        </div>
                        <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                          <div className="text-xs text-muted-foreground mb-1 uppercase tracking-widest">Growth Score</div>
                          <div className="text-lg font-bold font-mono text-amber-400">{Math.round(c.growthScore)}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">90th percentile</div>
                        </div>
                      </div>

                      <p className="text-sm text-foreground/80 leading-relaxed mb-4">{c.summary}</p>

                      <div className="p-4 bg-indigo-950/40 rounded-lg border border-indigo-500/20">
                        <div className="flex items-center gap-2 mb-3">
                          <TrendingUp className="h-4 w-4 text-indigo-400" />
                          <span className="text-sm font-semibold text-foreground">TRAIN THEN HIRE — Upskilling Roadmap</span>
                          <Badge className="ml-auto bg-indigo-500/20 text-indigo-400 border-indigo-500/30">{upskill.time}</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-xs text-muted-foreground uppercase tracking-widest mb-2">Gap Areas</div>
                            <div className="space-y-1">
                              {upskill.missing.map((m, mi) => (
                                <div key={mi} className="text-xs text-foreground flex items-start gap-1.5">
                                  <span className="text-amber-400 mt-0.5">~</span>{m}
                                </div>
                              ))}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground uppercase tracking-widest mb-2">Recommended Certs</div>
                            <div className="space-y-1">
                              {upskill.certs.map((cert, ci) => (
                                <div key={ci} className="text-xs text-foreground flex items-start gap-1.5">
                                  <span className="text-indigo-400 mt-0.5">+</span>{cert}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <Link href={`/candidates/${c.id}`}>
                      <Button variant="outline" size="sm" className="border-border/50 hover:border-amber-500/50 flex-shrink-0" data-testid={`link-talent-${c.id}`}>
                        <Eye className="mr-2 h-3.5 w-3.5" /> Twin Profile
                        <ChevronRight className="ml-1 h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
