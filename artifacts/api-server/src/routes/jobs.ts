import { Router } from "express";
import { db } from "@workspace/db";
import { jobsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { CreateJobBody, UpdateJobBody, GetJobParams, UpdateJobParams } from "@workspace/api-zod";

const router = Router();

router.get("/", async (_req, res) => {
  const jobs = await db.select().from(jobsTable).orderBy(jobsTable.createdAt);
  return res.json(jobs.reverse());
});

router.post("/", async (req, res) => {
  const body = CreateJobBody.safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: "Invalid body" });

  const [job] = await db
    .insert(jobsTable)
    .values({
      title: body.data.title,
      department: body.data.department,
      location: body.data.location,
      description: body.data.description,
      requirements: body.data.requirements ?? [],
    })
    .returning();

  return res.status(201).json(job);
});

router.get("/:id", async (req, res) => {
  const params = GetJobParams.safeParse(req.params);
  if (!params.success) return res.status(400).json({ error: "Invalid id" });

  const [job] = await db.select().from(jobsTable).where(eq(jobsTable.id, params.data.id));
  if (!job) return res.status(404).json({ error: "Not found" });
  return res.json(job);
});

router.patch("/:id", async (req, res) => {
  const params = UpdateJobParams.safeParse(req.params);
  if (!params.success) return res.status(400).json({ error: "Invalid id" });

  const body = UpdateJobBody.safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: "Invalid body" });

  const updates: Record<string, unknown> = {};
  if (body.data.title !== undefined) updates.title = body.data.title;
  if (body.data.status !== undefined) updates.status = body.data.status;
  if (body.data.description !== undefined) updates.description = body.data.description;

  const [updated] = await db
    .update(jobsTable)
    .set(updates)
    .where(eq(jobsTable.id, params.data.id))
    .returning();

  if (!updated) return res.status(404).json({ error: "Not found" });
  return res.json(updated);
});

export default router;
