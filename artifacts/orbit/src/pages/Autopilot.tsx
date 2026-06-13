import { useState, useEffect } from "react";
import { useLaunchMission, useListMissions, useGetMission, getListMissionsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Rocket, CheckCircle2, Clock, Loader2, Circle, Users, UserSearch, Gavel, Trophy } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

type StepStatus = "pending" | "running" | "completed";

const STEP_ICONS: Record<string, React.ReactNode> = {
  discover: <Users className="h-4 w-4" />,
  analyze: <Loader2 className="h-4 w-4" />,
  twin: <UserSearch className="h-4 w-4" />,
  simulate: <Clock className="h-4 w-4" />,
  chemistry: <Users className="h-4 w-4" />,
  debate: <Gavel className="h-4 w-4" />,
  recommend: <Trophy className="h-4 w-4" />,
};

function StepRow({ step }: {
  step: { id: string; label: string; status: string; startedAt?: string | null; completedAt?: string | null; details?: string | null }
}) {
  const status = step.status as StepStatus;
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-4"
      data-testid={`step-${step.id}`}
    >
      <div className={`flex-shrink-0 p-2 rounded-full border transition-all ${
        status === "completed" ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400" :
        status === "running" ? "bg-indigo-500/20 border-indigo-500/50 text-indigo-400 animate-pulse" :
        "bg-muted/20 border-border/40 text-muted-foreground"
      }`}>
        {status === "completed" ? <CheckCircle2 className="h-4 w-4" /> :
         status === "running" ? <Loader2 className="h-4 w-4 animate-spin" /> :
         <Circle className="h-4 w-4" />}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className={`font-medium text-sm ${status === "completed" ? "text-foreground" : status === "running" ? "text-indigo-300" : "text-muted-foreground"}`}>
            {step.label}
          </span>
          {status === "running" && (
            <Badge className="bg-indigo-500/20 text-indigo-400 border-indigo-500/30 text-[10px]">In Progress</Badge>
          )}
          {status === "completed" && (
            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px]">Done</Badge>
          )}
        </div>
        {step.details && (
          <div className="text-xs text-muted-foreground mt-0.5">{step.details}</div>
        )}
      </div>
      {status === "completed" && step.completedAt && (
        <span className="text-[10px] text-muted-foreground font-mono">
          {new Date(step.completedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
        </span>
      )}
    </motion.div>
  );
}

function LiveMission({ missionId }: { missionId: number }) {
  const queryClient = useQueryClient();
  const { data: mission, isLoading } = useGetMission(missionId, {
    query: {
      refetchInterval: (query) => {
        const data = query.state.data;
        return data?.status === "completed" ? false : 2000;
      }
    }
  });

  useEffect(() => {
    if (mission?.status === "completed") {
      queryClient.invalidateQueries({ queryKey: getListMissionsQueryKey() });
    }
  }, [mission?.status, queryClient]);

  if (isLoading || !mission) return <Skeleton className="h-64 rounded-xl" />;

  const completedSteps = (mission.steps as any[]).filter(s => s.status === "completed").length;
  const totalSteps = mission.steps.length;
  const progress = Math.round((completedSteps / totalSteps) * 100);

  return (
    <Card className="p-6 bg-card/60 border-indigo-500/30">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {mission.status === "running" ? (
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            )}
            <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
              {mission.status === "running" ? "Mission Active" : "Mission Complete"}
            </span>
          </div>
          <h3 className="font-bold text-xl text-foreground">{mission.jobTitle}</h3>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold font-mono text-indigo-400">{progress}%</div>
          <div className="text-xs text-muted-foreground">{completedSteps}/{totalSteps} steps</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-border/40 rounded-full mb-6 overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-indigo-600 to-violet-600 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      {/* Steps */}
      <div className="space-y-3 mb-6">
        {(mission.steps as any[]).map((step, i) => (
          <StepRow key={step.id} step={step} />
        ))}
      </div>

      {/* Results */}
      {mission.status === "completed" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 pt-4 border-t border-border/40"
        >
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold font-mono text-foreground">{mission.candidatesDiscovered}</div>
              <div className="text-xs text-muted-foreground">Candidates Found</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold font-mono text-amber-400">{mission.hiddenTalentsFound}</div>
              <div className="text-xs text-muted-foreground">Hidden Talents</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold font-mono text-violet-400">{mission.debatesRun}</div>
              <div className="text-xs text-muted-foreground">Debates Run</div>
            </div>
          </div>
          {mission.topCandidateName && (
            <Card className="p-4 bg-emerald-500/10 border-emerald-500/30">
              <div className="flex items-center gap-3">
                <Trophy className="h-5 w-5 text-emerald-400" />
                <div>
                  <div className="text-xs text-emerald-400 font-mono uppercase tracking-widest">Top Candidate Recommended</div>
                  <div className="font-bold text-foreground">{mission.topCandidateName}</div>
                </div>
              </div>
            </Card>
          )}
        </motion.div>
      )}
    </Card>
  );
}

export default function Autopilot() {
  const { data: missions, isLoading } = useListMissions();
  const [activeMissionId, setActiveMissionId] = useState<number | null>(null);
  const [jobTitle, setJobTitle] = useState("Senior ML Engineer");
  const [isLaunching, setIsLaunching] = useState(false);
  const launchMission = useLaunchMission();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const currentMissionId = activeMissionId ?? missions?.[0]?.id ?? null;

  const handleLaunch = async () => {
    if (!jobTitle.trim()) return;
    setIsLaunching(true);
    try {
      const mission = await launchMission.mutateAsync({ data: { jobTitle } });
      setActiveMissionId(mission.id);
      queryClient.invalidateQueries({ queryKey: getListMissionsQueryKey() });
      toast({ title: "Mission launched", description: `Autopilot is finding the best candidate for: ${jobTitle}` });
    } catch {
      toast({ title: "Error", description: "Failed to launch mission", variant: "destructive" });
    } finally {
      setIsLaunching(false);
    }
  };

  const WORKFLOW = [
    { label: "DISCOVER", desc: "Talent pool search" },
    { label: "ANALYZE", desc: "Deep intelligence" },
    { label: "SIMULATE", desc: "12-month forecast" },
    { label: "DEBATE", desc: "AI boardroom" },
    { label: "RECOMMEND", desc: "Final verdict" },
  ];

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2 mb-2">
          <Rocket className="h-4 w-4 text-indigo-400" />
          <span className="text-xs font-mono text-indigo-400 tracking-widest uppercase">Autonomous Mode</span>
        </div>
        <h1 className="text-4xl font-bold tracking-tight">ORBIT Autopilot</h1>
        <p className="text-muted-foreground mt-1">One button. Complete autonomous hiring intelligence.</p>
      </motion.div>

      {/* Workflow visualization */}
      <Card className="p-6 bg-card/60 border-border/40">
        <div className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-5">Autonomous Workflow</div>
        <div className="flex items-center">
          {WORKFLOW.map((step, i) => (
            <div key={i} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1 text-center">
                <div className="h-10 w-10 rounded-full bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center mb-2">
                  <span className="text-xs font-bold font-mono text-indigo-400">{String(i + 1).padStart(2, "0")}</span>
                </div>
                <div className="text-xs font-bold text-foreground">{step.label}</div>
                <div className="text-[10px] text-muted-foreground">{step.desc}</div>
              </div>
              {i < WORKFLOW.length - 1 && (
                <div className="w-8 h-px bg-gradient-to-r from-indigo-500/40 to-violet-500/40 flex-shrink-0" />
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Launch Pad */}
      <Card className="p-8 bg-gradient-to-b from-indigo-950/40 to-card/60 border-indigo-500/20">
        <div className="text-center space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-1">Launch Autonomous Mission</h2>
            <p className="text-muted-foreground text-sm">AI agents will run the complete hiring pipeline end-to-end</p>
          </div>
          <div className="flex gap-3 max-w-md mx-auto">
            <Input
              value={jobTitle}
              onChange={e => setJobTitle(e.target.value)}
              placeholder="Role title (e.g. Senior ML Engineer)"
              className="bg-card/60 border-border/50"
              data-testid="input-job-title"
            />
            <Button
              size="lg"
              onClick={handleLaunch}
              disabled={isLaunching || !jobTitle.trim()}
              className="px-6 bg-indigo-600 hover:bg-indigo-700 text-white shadow-[0_0_40px_-10px_rgba(99,102,241,0.6)] font-bold whitespace-nowrap"
              data-testid="button-launch-autopilot"
            >
              {isLaunching ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Rocket className="mr-2 h-5 w-5" />
              )}
              LAUNCH
            </Button>
          </div>
        </div>
      </Card>

      {/* Live Mission */}
      <AnimatePresence>
        {currentMissionId && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm font-semibold text-foreground">Active Mission</span>
              {(missions ?? []).length > 1 && (
                <div className="flex gap-1.5 ml-4">
                  {(missions ?? []).map(m => (
                    <button
                      key={m.id}
                      onClick={() => setActiveMissionId(m.id)}
                      className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                        currentMissionId === m.id
                          ? "bg-indigo-600/20 border-indigo-500/50 text-indigo-300"
                          : "border-border/40 text-muted-foreground hover:border-indigo-500/30"
                      }`}
                    >
                      {m.jobTitle}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <LiveMission missionId={currentMissionId} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mission history */}
      {(missions ?? []).length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">Mission History</h3>
          <div className="space-y-2">
            {(missions ?? []).slice(0, 5).map(m => (
              <button
                key={m.id}
                onClick={() => setActiveMissionId(m.id)}
                className="w-full"
                data-testid={`mission-${m.id}`}
              >
                <Card className="p-4 bg-card/40 border-border/30 hover:border-indigo-500/30 transition-all flex items-center gap-4 text-left">
                  <div className={`h-2 w-2 rounded-full flex-shrink-0 ${m.status === "completed" ? "bg-emerald-400" : "bg-amber-400 animate-pulse"}`} />
                  <div className="flex-1">
                    <div className="font-medium text-sm text-foreground">{m.jobTitle}</div>
                    <div className="text-xs text-muted-foreground">
                      {m.candidatesDiscovered} candidates · {m.hiddenTalentsFound} hidden talents · {new Date(m.startedAt).toLocaleDateString()}
                    </div>
                  </div>
                  <Badge className={m.status === "completed" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-amber-500/20 text-amber-400 border-amber-500/30"}>
                    {m.status}
                  </Badge>
                </Card>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
