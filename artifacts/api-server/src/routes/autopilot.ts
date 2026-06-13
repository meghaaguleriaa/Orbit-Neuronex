import { Router } from "express";
import { db } from "@workspace/db";
import { missionsTable, candidatesTable, debatesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { LaunchMissionBody, GetMissionParams } from "@workspace/api-zod";

const router = Router();

const MISSION_STEPS = [
  { id: "discover", label: "Talent Discovery", details: "Scanning candidate pool and ranking by fit" },
  { id: "analyze", label: "Deep Analysis", details: "Running Candidate Intelligence Agent" },
  { id: "twin", label: "Twin Construction", details: "Building Digital Twin profiles" },
  { id: "simulate", label: "Performance Simulation", details: "Simulating 12-month trajectories" },
  { id: "chemistry", label: "Team Chemistry", details: "Analyzing team impact" },
  { id: "debate", label: "AI Debate", details: "Decision Chamber consensus" },
  { id: "recommend", label: "Final Recommendation", details: "Generating hiring verdict" },
];

async function progressMission(missionId: number) {
  const [mission] = await db.select().from(missionsTable).where(eq(missionsTable.id, missionId));
  if (!mission || mission.status === "completed") return;

  const steps = mission.steps as Array<{
    id: string; label: string; status: string;
    startedAt?: string | null; completedAt?: string | null; details?: string | null;
  }>;

  const pendingIdx = steps.findIndex((s) => s.status === "pending");
  const runningIdx = steps.findIndex((s) => s.status === "running");

  if (runningIdx !== -1) {
    steps[runningIdx].status = "completed";
    steps[runningIdx].completedAt = new Date().toISOString();

    if (pendingIdx !== -1) {
      steps[pendingIdx].status = "running";
      steps[pendingIdx].startedAt = new Date().toISOString();
    } else {
      const candidates = await db.select().from(candidatesTable).orderBy(candidatesTable.overallScore);
      const top = candidates.length > 0 ? candidates[candidates.length - 1] : null;
      const debatesCount = await db.select().from(debatesTable);

      await db.update(missionsTable).set({
        status: "completed",
        steps,
        completedAt: new Date(),
        candidatesDiscovered: candidates.length,
        hiddenTalentsFound: candidates.filter((c) => c.hiddenTalent).length,
        debatesRun: debatesCount.length,
        topCandidateId: top?.id ?? null,
        topCandidateName: top?.name ?? null,
      }).where(eq(missionsTable.id, missionId));
      return;
    }
  }

  await db.update(missionsTable).set({ steps }).where(eq(missionsTable.id, missionId));
}

router.get("/missions", async (_req, res) => {
  const missions = await db.select().from(missionsTable).orderBy(missionsTable.startedAt);
  return res.json(missions.reverse());
});

router.post("/missions", async (req, res) => {
  const body = LaunchMissionBody.safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: "Invalid body" });

  const steps = MISSION_STEPS.map((s, i) => ({
    ...s,
    status: i === 0 ? "running" : "pending",
    startedAt: i === 0 ? new Date().toISOString() : null,
    completedAt: null,
  }));

  const [mission] = await db
    .insert(missionsTable)
    .values({
      jobId: body.data.jobId ?? null,
      jobTitle: body.data.jobTitle,
      status: "running",
      steps,
      candidatesDiscovered: 0,
      hiddenTalentsFound: 0,
      debatesRun: 0,
    })
    .returning();

  // Schedule step progressions
  for (let i = 0; i < MISSION_STEPS.length; i++) {
    const delay = (i + 1) * 3000;
    setTimeout(() => progressMission(mission.id), delay);
  }

  return res.status(201).json(mission);
});

router.get("/missions/:id", async (req, res) => {
  const params = GetMissionParams.safeParse(req.params);
  if (!params.success) return res.status(400).json({ error: "Invalid id" });

  const [mission] = await db.select().from(missionsTable).where(eq(missionsTable.id, params.data.id));
  if (!mission) return res.status(404).json({ error: "Not found" });
  return res.json(mission);
});

export default router;
