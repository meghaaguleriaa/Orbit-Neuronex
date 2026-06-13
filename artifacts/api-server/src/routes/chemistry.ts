import { Router } from "express";
import { db } from "@workspace/db";
import { candidatesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { PreviewChemistryBody } from "@workspace/api-zod";

const router = Router();

const CURRENT_TEAM = [
  { name: "Sarah Chen", role: "Lead Engineer", skills: ["System Design", "Python", "Leadership"], leadershipStyle: "Collaborative" },
  { name: "Marcus Webb", role: "Product Manager", skills: ["Strategy", "Communication", "Analytics"], leadershipStyle: "Directive" },
  { name: "Priya Nair", role: "ML Engineer", skills: ["Machine Learning", "Python", "Research"], leadershipStyle: "Servant" },
  { name: "Jordan Lee", role: "DevOps Engineer", skills: ["Infrastructure", "Kubernetes", "Automation"], leadershipStyle: "Technical" },
  { name: "Elena Vasquez", role: "UX Designer", skills: ["Design Thinking", "User Research", "Prototyping"], leadershipStyle: "Empathetic" },
];

const BASE_CHEMISTRY = {
  overallScore: 78,
  skillComplementarity: 82,
  leadershipBalance: 74,
  communicationCompatibility: 81,
  teamSynergy: 76,
  collaborationPotential: 79,
};

router.get("/", async (_req, res) => {
  return res.json({
    ...BASE_CHEMISTRY,
    dimensions: [
      { dimension: "Skill Complementarity", score: BASE_CHEMISTRY.skillComplementarity, description: "Team covers diverse technical domains" },
      { dimension: "Leadership Balance", score: BASE_CHEMISTRY.leadershipBalance, description: "Multiple leadership styles represented" },
      { dimension: "Communication", score: BASE_CHEMISTRY.communicationCompatibility, description: "Strong async and sync communication patterns" },
      { dimension: "Team Synergy", score: BASE_CHEMISTRY.teamSynergy, description: "High collaboration potential with current dynamics" },
      { dimension: "Collaboration", score: BASE_CHEMISTRY.collaborationPotential, description: "Cross-functional work well-established" },
    ],
    members: CURRENT_TEAM,
    insights: [
      "Team excels in technical execution but lacks dedicated data infrastructure expertise",
      "Leadership styles are balanced — no single dominant style",
      "Communication patterns show 94% async-first preference",
      "Current skill coverage: Backend 90%, ML 85%, Infrastructure 80%, Frontend 65%",
    ],
  });
});

router.post("/preview", async (req, res) => {
  const body = PreviewChemistryBody.safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: "Invalid body" });

  const [candidate] = await db
    .select()
    .from(candidatesTable)
    .where(eq(candidatesTable.id, body.data.candidateId));

  if (!candidate) return res.status(404).json({ error: "Candidate not found" });

  const skillBoost = candidate.technicalScore > 80 ? 5 : candidate.technicalScore > 65 ? 3 : 1;
  const cultureBoost = candidate.cultureScore > 80 ? 4 : candidate.cultureScore > 65 ? 2 : 0;
  const delta = Math.round((skillBoost + cultureBoost) / 2);

  return res.json({
    currentScore: BASE_CHEMISTRY.overallScore,
    projectedScore: Math.min(100, BASE_CHEMISTRY.overallScore + delta),
    delta,
    improvements: [
      candidate.technicalScore > 80 ? "Fills critical technical gap in distributed systems" : "Adds complementary engineering perspective",
      candidate.cultureScore > 80 ? "Strengthens team communication patterns" : "Maintains current communication balance",
      `Skill coverage expands to include ${candidate.role.split(" ").slice(-1)[0]} expertise`,
    ],
    risks: [
      candidate.retentionProbability < 75 ? "Retention risk may disrupt team continuity" : null,
      delta < 2 ? "Limited incremental impact on team chemistry" : null,
    ].filter(Boolean) as string[],
    recommendation: delta >= 4
      ? `STRONG ADD — ${candidate.name} would significantly elevate team chemistry`
      : delta >= 2
      ? `RECOMMENDED — Positive impact on team dynamics expected`
      : `NEUTRAL — Minimal chemistry change projected`,
  });
});

export default router;
