import { Router } from "express";
import { db } from "@workspace/db";
import { candidatesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { MoveCandidateBody } from "@workspace/api-zod";

const router = Router();

const STAGES = [
  { stage: "discovery", label: "Discovery" },
  { stage: "analysis", label: "AI Analysis" },
  { stage: "interview", label: "Interview" },
  { stage: "decision", label: "Decision Chamber" },
  { stage: "offer", label: "Offer" },
  { stage: "hired", label: "Hired" },
];

router.get("/", async (_req, res) => {
  const candidates = await db.select().from(candidatesTable).orderBy(candidatesTable.overallScore);

  const stages = STAGES.map(({ stage, label }) => {
    const stageCandidates = candidates.filter((c) => c.stage === stage).reverse();
    return {
      stage,
      label,
      count: stageCandidates.length,
      candidates: stageCandidates,
    };
  });

  return res.json({
    stages,
    totalCandidates: candidates.length,
    activeJobs: 3,
  });
});

router.post("/move", async (req, res) => {
  const body = MoveCandidateBody.safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: "Invalid body" });

  const [updated] = await db
    .update(candidatesTable)
    .set({ stage: body.data.stage })
    .where(eq(candidatesTable.id, body.data.candidateId))
    .returning();

  if (!updated) return res.status(404).json({ error: "Candidate not found" });
  return res.json(updated);
});

export default router;
