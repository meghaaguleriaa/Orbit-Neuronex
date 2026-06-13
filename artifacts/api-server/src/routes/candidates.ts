import { Router } from "express";
import { db } from "@workspace/db";
import { candidatesTable } from "@workspace/db";
import { eq, ilike, or } from "drizzle-orm";
import {
  ListCandidatesQueryParams,
  CreateCandidateBody,
  UpdateCandidateBody,
  GetCandidateParams,
  UpdateCandidateParams,
  DeleteCandidateParams,
  GetCandidateTwinParams,
  GetCandidateSimulationParams,
} from "@workspace/api-zod";

const router = Router();

// List candidates
router.get("/", async (req, res) => {
  const query = ListCandidatesQueryParams.safeParse(req.query);
  if (!query.success) {
    return res.status(400).json({ error: "Invalid query parameters" });
  }

  let candidates = await db.select().from(candidatesTable).orderBy(candidatesTable.overallScore);

  if (query.data.stage) {
    candidates = candidates.filter((c) => c.stage === query.data.stage);
  }
  if (query.data.jobId) {
    candidates = candidates.filter((c) => c.jobId === query.data.jobId);
  }
  if (query.data.search) {
    const s = query.data.search.toLowerCase();
    candidates = candidates.filter(
      (c) =>
        c.name.toLowerCase().includes(s) ||
        c.role.toLowerCase().includes(s) ||
        c.currentCompany.toLowerCase().includes(s),
    );
  }

  return res.json(candidates.reverse());
});

// Create candidate
router.post("/", async (req, res) => {
  const body = CreateCandidateBody.safeParse(req.body);
  if (!body.success) {
    return res.status(400).json({ error: "Invalid body" });
  }

  const { name, email, role, jobId, location, yearsExperience, currentCompany, summary } = body.data;

  const initials = name
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const [candidate] = await db
    .insert(candidatesTable)
    .values({
      name,
      email,
      role,
      jobId: jobId ?? null,
      location: location ?? "",
      yearsExperience: yearsExperience ?? 0,
      currentCompany: currentCompany ?? "",
      summary: summary ?? "",
      avatarInitials: initials,
      overallScore: Math.random() * 40 + 60,
      technicalScore: Math.random() * 40 + 60,
      cultureScore: Math.random() * 40 + 60,
      growthScore: Math.random() * 40 + 60,
      retentionProbability: Math.random() * 30 + 70,
      hiddenTalent: Math.random() > 0.8,
      skills: [],
      githubActivity: "moderate",
    })
    .returning();

  return res.status(201).json(candidate);
});

// Get candidate
router.get("/:id", async (req, res) => {
  const params = GetCandidateParams.safeParse(req.params);
  if (!params.success) return res.status(400).json({ error: "Invalid id" });

  const [candidate] = await db
    .select()
    .from(candidatesTable)
    .where(eq(candidatesTable.id, params.data.id));

  if (!candidate) return res.status(404).json({ error: "Not found" });
  return res.json(candidate);
});

// Update candidate
router.patch("/:id", async (req, res) => {
  const params = UpdateCandidateParams.safeParse(req.params);
  if (!params.success) return res.status(400).json({ error: "Invalid id" });

  const body = UpdateCandidateBody.safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: "Invalid body" });

  const updates: Record<string, unknown> = {};
  if (body.data.name !== undefined) updates.name = body.data.name;
  if (body.data.stage !== undefined) updates.stage = body.data.stage;
  if (body.data.verdict !== undefined) updates.verdict = body.data.verdict;

  const [updated] = await db
    .update(candidatesTable)
    .set(updates)
    .where(eq(candidatesTable.id, params.data.id))
    .returning();

  if (!updated) return res.status(404).json({ error: "Not found" });
  return res.json(updated);
});

// Delete candidate
router.delete("/:id", async (req, res) => {
  const params = DeleteCandidateParams.safeParse(req.params);
  if (!params.success) return res.status(400).json({ error: "Invalid id" });

  await db.delete(candidatesTable).where(eq(candidatesTable.id, params.data.id));
  return res.status(204).send();
});

// Get digital twin
router.get("/:id/twin", async (req, res) => {
  const params = GetCandidateTwinParams.safeParse(req.params);
  if (!params.success) return res.status(400).json({ error: "Invalid id" });

  const [candidate] = await db
    .select()
    .from(candidatesTable)
    .where(eq(candidatesTable.id, params.data.id));

  if (!candidate) return res.status(404).json({ error: "Not found" });

  const twin = {
    candidateId: candidate.id,
    skillDna: candidate.skills.length > 0 ? candidate.skills : [
      { skill: "Python", score: 87, category: "technical" },
      { skill: "Machine Learning", score: 82, category: "technical" },
      { skill: "System Design", score: 78, category: "technical" },
      { skill: "Leadership", score: 72, category: "soft" },
      { skill: "Communication", score: 81, category: "soft" },
      { skill: "Problem Solving", score: 90, category: "cognitive" },
    ],
    learningVelocity: Math.round(candidate.growthScore * 0.9),
    leadershipPotential: Math.round(candidate.growthScore * 0.85),
    adaptabilityScore: Math.round(candidate.cultureScore * 0.95),
    communicationScore: Math.round(candidate.cultureScore * 0.9),
    careerGoals: "Senior engineering leadership role with technical ownership",
    growthTrajectory: candidate.growthScore > 80 ? "accelerating" : candidate.growthScore > 65 ? "steady" : "developing",
    strengths: [
      "Exceptional problem-solving under pressure",
      "Strong collaborative mindset",
      "Rapid skill acquisition",
      "Data-driven decision making",
    ],
    weaknesses: [
      "Needs more executive presentation experience",
      "Limited cross-functional project ownership",
    ],
    futureSuccessPrediction: Math.round(candidate.overallScore * 1.05),
    retentionForecast: Math.round(candidate.retentionProbability),
    promotionTimeline: candidate.growthScore > 80 ? "12–18 months" : "18–24 months",
  };

  return res.json(twin);
});

// Get simulation
router.get("/:id/simulation", async (req, res) => {
  const params = GetCandidateSimulationParams.safeParse(req.params);
  if (!params.success) return res.status(400).json({ error: "Invalid id" });

  const [candidate] = await db
    .select()
    .from(candidatesTable)
    .where(eq(candidatesTable.id, params.data.id));

  if (!candidate) return res.status(404).json({ error: "Not found" });

  const base = candidate.technicalScore;
  const growth = candidate.growthScore / 100;

  const simulation = {
    candidateId: candidate.id,
    threeMonthScore: Math.min(100, Math.round(base * 0.85)),
    sixMonthScore: Math.min(100, Math.round(base * 0.95)),
    twelveMonthScore: Math.min(100, Math.round(base * (1 + growth * 0.2))),
    promotionPotential: Math.round(candidate.growthScore * 0.9),
    leadershipDevelopment: Math.round(candidate.growthScore * 0.85),
    teamInfluence: Math.round(candidate.cultureScore * 0.95),
    learningProgression: Math.round(candidate.growthScore),
    forecast: [
      { month: "Month 1", performance: Math.round(base * 0.75), productivity: 65, teamImpact: 55 },
      { month: "Month 2", performance: Math.round(base * 0.80), productivity: 72, teamImpact: 62 },
      { month: "Month 3", performance: Math.round(base * 0.85), productivity: 78, teamImpact: 70 },
      { month: "Month 4", performance: Math.round(base * 0.88), productivity: 82, teamImpact: 75 },
      { month: "Month 5", performance: Math.round(base * 0.90), productivity: 85, teamImpact: 79 },
      { month: "Month 6", performance: Math.round(base * 0.94), productivity: 88, teamImpact: 83 },
      { month: "Month 7", performance: Math.round(base * 0.96), productivity: 89, teamImpact: 85 },
      { month: "Month 8", performance: Math.round(base * 0.97), productivity: 91, teamImpact: 87 },
      { month: "Month 9", performance: Math.round(base * 0.98), productivity: 92, teamImpact: 88 },
      { month: "Month 10", performance: Math.round(base * 0.99), productivity: 93, teamImpact: 90 },
      { month: "Month 11", performance: Math.round(base * 1.00), productivity: 94, teamImpact: 91 },
      { month: "Month 12", performance: Math.min(100, Math.round(base * (1 + growth * 0.2))), productivity: 95, teamImpact: 93 },
    ],
    summary: `Based on historical patterns for candidates with similar profiles, ${candidate.name} is projected to reach peak productivity within 3–4 months. The simulation indicates a strong performance trajectory driven by exceptional ${candidate.technicalScore > 85 ? "technical aptitude" : "adaptability"} and ${candidate.cultureScore > 80 ? "team integration ability" : "growth mindset"}.`,
  };

  return res.json(simulation);
});

export default router;
