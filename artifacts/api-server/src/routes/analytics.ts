import { Router } from "express";
import { db } from "@workspace/db";
import { candidatesTable, debatesTable, missionsTable } from "@workspace/db";

const router = Router();

const AGENT_NAMES = [
  { name: "Talent Discovery Agent", type: "discovery" },
  { name: "Candidate Intelligence Agent", type: "intelligence" },
  { name: "Predictive Match Agent", type: "match" },
  { name: "Interview Agent", type: "interview" },
  { name: "Hiring Orchestrator", type: "orchestrator" },
];

function randomActivity(candidateName: string) {
  const actions = [
    { action: "Discovered new candidate", status: "success" },
    { action: "Completed skill DNA analysis", status: "success" },
    { action: "Generated performance simulation", status: "success" },
    { action: "Identified hidden talent signal", status: "alert" },
    { action: "Completed debate session", status: "success" },
    { action: "Updated retention forecast", status: "info" },
    { action: "Running twin construction", status: "running" },
  ];
  const action = actions[Math.floor(Math.random() * actions.length)];
  const agent = AGENT_NAMES[Math.floor(Math.random() * AGENT_NAMES.length)];
  return {
    id: Math.random().toString(36).slice(2),
    ...agent,
    ...action,
    target: candidateName,
    timestamp: new Date(Date.now() - Math.random() * 3600000).toISOString(),
  };
}

router.get("/dashboard", async (_req, res) => {
  const candidates = await db.select().from(candidatesTable).orderBy(candidatesTable.overallScore);
  const debates = await db.select().from(debatesTable).orderBy(debatesTable.createdAt);

  const top = candidates.length > 0 ? candidates[candidates.length - 1] : null;
  const hiddenTalents = candidates.filter((c) => c.hiddenTalent);

  const recentActivity = candidates.slice(0, 8).map((c) => randomActivity(c.name));

  return res.json({
    totalCandidates: candidates.length,
    activeJobs: 4,
    hiddenTalentsFound: hiddenTalents.length,
    activeAgents: 5,
    debatesCompleted: debates.length,
    avgMatchScore: candidates.length > 0
      ? Math.round(candidates.reduce((a, c) => a + c.overallScore, 0) / candidates.length)
      : 0,
    timeToHireReduction: 67,
    topCandidate: top,
    recentActivity,
    hiringVelocity: [
      { week: "Week 1", candidates: 8, offers: 1 },
      { week: "Week 2", candidates: 14, offers: 2 },
      { week: "Week 3", candidates: 11, offers: 1 },
      { week: "Week 4", candidates: 20, offers: 3 },
      { week: "Week 5", candidates: 17, offers: 2 },
      { week: "Week 6", candidates: 23, offers: 4 },
    ],
  });
});

router.get("/hiring-funnel", async (_req, res) => {
  const candidates = await db.select().from(candidatesTable);

  const stageCounts: Record<string, number> = {};
  for (const c of candidates) {
    stageCounts[c.stage] = (stageCounts[c.stage] ?? 0) + 1;
  }

  const total = candidates.length || 1;
  const funnel = [
    { stage: "Discovered", count: total, conversionRate: 100 },
    { stage: "AI Analysis", count: Math.round(total * 0.82), conversionRate: 82 },
    { stage: "Interview", count: Math.round(total * 0.54), conversionRate: 66 },
    { stage: "Decision Chamber", count: Math.round(total * 0.31), conversionRate: 57 },
    { stage: "Offer", count: Math.round(total * 0.18), conversionRate: 58 },
    { stage: "Hired", count: Math.round(total * 0.12), conversionRate: 67 },
  ];

  return res.json(funnel);
});

router.get("/agent-activity", async (_req, res) => {
  const candidates = await db.select().from(candidatesTable).orderBy(candidatesTable.createdAt);
  const names = candidates.map((c) => c.name);
  if (names.length === 0) names.push("Open Candidate");

  const activities = Array.from({ length: 15 }, () =>
    randomActivity(names[Math.floor(Math.random() * names.length)])
  ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return res.json(activities);
});

router.get("/hidden-talents", async (_req, res) => {
  const hidden = await db
    .select()
    .from(candidatesTable)
    .orderBy(candidatesTable.overallScore);
  return res.json(hidden.filter((c) => c.hiddenTalent).reverse());
});

export default router;
