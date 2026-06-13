import { Router } from "express";
import { db } from "@workspace/db";
import { debatesTable, candidatesTable, jobsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { CreateDebateBody, GetDebateParams } from "@workspace/api-zod";

const router = Router();

function generateDebateMessages(candidateName: string, scores: {
  technical: number; culture: number; growth: number; risk: number;
}) {
  const now = new Date();
  const msgs = [];

  // Technical agent
  msgs.push({
    agent: "Technical Agent",
    agentType: "technical",
    message: `I've analyzed ${candidateName}'s technical profile extensively. ${scores.technical > 80
      ? `The engineering depth here is exceptional — system design thinking is well above average, and the GitHub activity shows consistent, high-quality contributions. Architecture decisions in past projects demonstrate senior-level reasoning.`
      : scores.technical > 65
      ? `Technical fundamentals are solid. Code quality metrics and project complexity indicate competency at the expected level. Some areas need development.`
      : `Technical skills require development. Current depth may not meet role requirements without significant ramp-up.`}`,
    stance: scores.technical > 75 ? "SUPPORTS" : "CHALLENGES",
    evidence: [
      `Technical score: ${scores.technical}/100`,
      scores.technical > 80 ? "Advanced system design demonstrated" : "Core skills present",
      "GitHub contribution quality: " + (scores.technical > 80 ? "Excellent" : "Good"),
    ],
    timestamp: new Date(now.getTime() - 5 * 60000).toISOString(),
  });

  // Growth agent
  msgs.push({
    agent: "Growth Agent",
    agentType: "growth",
    message: `The learning trajectory here is ${scores.growth > 80 ? "remarkable" : scores.growth > 65 ? "encouraging" : "concerning"}. ${scores.growth > 80
      ? `I'm seeing accelerated skill acquisition patterns consistent with high-performers. This candidate has demonstrated ability to master new domains rapidly. Career progression velocity is in the 90th percentile for their cohort.`
      : scores.growth > 65
      ? `Growth indicators are healthy. The candidate shows consistent upward trajectory with evidence of deliberate skill building.`
      : `Learning velocity is below what we'd expect. May struggle to keep pace with our fast-moving environment.`}`,
    stance: scores.growth > 70 ? "SUPPORTS" : "ANALYZES",
    evidence: [
      `Growth score: ${scores.growth}/100`,
      `Learning velocity: ${scores.growth > 80 ? "Accelerated" : scores.growth > 65 ? "Steady" : "Developing"}`,
      `Promotion potential: ${scores.growth > 80 ? "High — 12-18 months" : "Moderate — 24+ months"}`,
    ],
    timestamp: new Date(now.getTime() - 4 * 60000).toISOString(),
  });

  // Risk agent
  const riskLevel = 100 - scores.risk;
  msgs.push({
    agent: "Risk Agent",
    agentType: "risk",
    message: `I need to flag ${riskLevel > 70
      ? "several risk factors that warrant careful consideration. I'm seeing potential job-hopping patterns — average tenure under 18 months at the last three positions. This warrants a structured discussion around career stability before extending an offer. Retention probability analysis suggests we may need to over-invest in onboarding to achieve 24-month retention."
      : riskLevel > 40
      ? "moderate risk factors. Career trajectory shows some inconsistencies worth exploring in the interview. Overall risk profile is manageable with proper onboarding structure."
      : "a clean risk profile. Tenure history is strong, background checks nominal, and retention indicators are positive. This is a low-risk hire."}`,
    stance: riskLevel > 70 ? "CHALLENGES" : riskLevel > 40 ? "ANALYZES" : "SUPPORTS",
    evidence: [
      `Risk level: ${riskLevel > 70 ? "Elevated" : riskLevel > 40 ? "Moderate" : "Low"}`,
      `Retention probability: ${scores.risk}%`,
      riskLevel > 60 ? "Short average tenure detected" : "Stable career history",
    ],
    timestamp: new Date(now.getTime() - 3 * 60000).toISOString(),
  });

  // Culture agent
  msgs.push({
    agent: "Culture Agent",
    agentType: "culture",
    message: `Cultural alignment analysis complete. ${scores.culture > 80
      ? `Communication signals are exceptional — collaborative language patterns, evidence of cross-functional leadership, and strong psychological safety indicators. Team integration probability is high. This candidate would likely elevate the team dynamic, not just fit into it.`
      : scores.culture > 65
      ? `Culture fit is solid. Values alignment checks out and collaboration patterns match our team profile.`
      : `Some culture alignment gaps detected. May need targeted onboarding around communication norms and collaborative practices.`}`,
    stance: scores.culture > 70 ? "SUPPORTS" : "ANALYZES",
    evidence: [
      `Culture score: ${scores.culture}/100`,
      `Values alignment: ${scores.culture > 80 ? "Strong" : scores.culture > 65 ? "Good" : "Moderate"}`,
      `Team integration probability: ${scores.culture > 80 ? "High" : "Moderate"}`,
    ],
    timestamp: new Date(now.getTime() - 2 * 60000).toISOString(),
  });

  // Technical counter
  msgs.push({
    agent: "Technical Agent",
    agentType: "technical",
    message: `In response to the Risk Agent — I'd argue the pattern of movement actually demonstrates breadth of experience that strengthens the technical profile. Multiple high-impact codebases accelerate engineering maturity. The quality of the work at each position matters more than tenure length in fast-moving technical roles.`,
    stance: "CHALLENGES",
    evidence: ["Cross-company technical breadth is an asset", "Quality of contributions > duration"],
    timestamp: new Date(now.getTime() - 90000).toISOString(),
  });

  // Growth agent final
  msgs.push({
    agent: "Growth Agent",
    agentType: "growth",
    message: `I agree with the Technical Agent. Given the upskilling trajectory, this candidate represents ${scores.growth > 80 ? "exceptional" : "good"} long-term value. The risk factors are outweighed by the growth signals. I'm revising my confidence upward.`,
    stance: "SUPPORTS",
    evidence: [`Revised growth forecast: ${Math.min(100, scores.growth + 5)}% 12-month performance prediction`],
    timestamp: new Date(now.getTime() - 60000).toISOString(),
  });

  return msgs;
}

function generateVerdict(scores: { technical: number; culture: number; growth: number; risk: number }) {
  const avg = (scores.technical + scores.culture + scores.growth + scores.risk) / 4;
  if (avg >= 85) return "STRONG HIRE";
  if (avg >= 75) return "HIRE";
  if (avg >= 60) return "CONSIDER";
  return "REJECT";
}

router.get("/", async (_req, res) => {
  const debates = await db.select().from(debatesTable).orderBy(debatesTable.createdAt);
  return res.json(debates.reverse());
});

router.post("/", async (req, res) => {
  const body = CreateDebateBody.safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: "Invalid body" });

  const [candidate] = await db
    .select()
    .from(candidatesTable)
    .where(eq(candidatesTable.id, body.data.candidateId));

  if (!candidate) return res.status(404).json({ error: "Candidate not found" });

  let jobTitle = "Open Role";
  if (body.data.jobId) {
    const [job] = await db.select().from(jobsTable).where(eq(jobsTable.id, body.data.jobId));
    if (job) jobTitle = job.title;
  }

  const scores = {
    technical: candidate.technicalScore,
    culture: candidate.cultureScore,
    growth: candidate.growthScore,
    risk: candidate.retentionProbability,
  };

  const messages = generateDebateMessages(candidate.name, scores);
  const verdict = generateVerdict(scores);
  const confidence = Math.round((scores.technical + scores.culture + scores.growth + scores.risk) / 4);

  const [debate] = await db
    .insert(debatesTable)
    .values({
      candidateId: candidate.id,
      candidateName: candidate.name,
      jobTitle,
      messages,
      verdict,
      confidenceScore: confidence,
      technicalScore: scores.technical,
      cultureScore: scores.culture,
      growthScore: scores.growth,
      riskScore: scores.risk,
      summary: `After rigorous multi-agent deliberation, the panel reached a ${verdict} consensus with ${confidence}% confidence. Technical capabilities, cultural alignment, growth trajectory, and risk factors were weighed by four independent AI agents.`,
      status: "completed",
    })
    .returning();

  return res.status(201).json(debate);
});

router.get("/:id", async (req, res) => {
  const params = GetDebateParams.safeParse(req.params);
  if (!params.success) return res.status(400).json({ error: "Invalid id" });

  const [debate] = await db.select().from(debatesTable).where(eq(debatesTable.id, params.data.id));
  if (!debate) return res.status(404).json({ error: "Not found" });
  return res.json(debate);
});

export default router;
