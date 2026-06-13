import { pgTable, serial, text, integer, real, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const jobsTable = pgTable("jobs", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  department: text("department").notNull(),
  location: text("location").notNull(),
  description: text("description").notNull(),
  requirements: jsonb("requirements").$type<string[]>().notNull().default([]),
  candidateCount: integer("candidate_count").notNull().default(0),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertJobSchema = createInsertSchema(jobsTable).omit({ id: true, createdAt: true });
export type InsertJob = z.infer<typeof insertJobSchema>;
export type Job = typeof jobsTable.$inferSelect;

export const candidatesTable = pgTable("candidates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  role: text("role").notNull(),
  jobId: integer("job_id"),
  stage: text("stage").notNull().default("discovery"),
  overallScore: real("overall_score").notNull().default(0),
  technicalScore: real("technical_score").notNull().default(0),
  cultureScore: real("culture_score").notNull().default(0),
  growthScore: real("growth_score").notNull().default(0),
  retentionProbability: real("retention_probability").notNull().default(0),
  hiddenTalent: boolean("hidden_talent").notNull().default(false),
  verdict: text("verdict"),
  avatarInitials: text("avatar_initials").notNull(),
  location: text("location").notNull().default(""),
  yearsExperience: real("years_experience").notNull().default(0),
  currentCompany: text("current_company").notNull().default(""),
  skills: jsonb("skills").$type<Array<{ skill: string; score: number; category: string }>>().notNull().default([]),
  summary: text("summary").notNull().default(""),
  githubActivity: text("github_activity").notNull().default("moderate"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertCandidateSchema = createInsertSchema(candidatesTable).omit({ id: true, createdAt: true });
export type InsertCandidate = z.infer<typeof insertCandidateSchema>;
export type Candidate = typeof candidatesTable.$inferSelect;

export const debatesTable = pgTable("debates", {
  id: serial("id").primaryKey(),
  candidateId: integer("candidate_id").notNull(),
  candidateName: text("candidate_name").notNull(),
  jobTitle: text("job_title").notNull().default(""),
  messages: jsonb("messages").$type<Array<{
    agent: string;
    agentType: string;
    message: string;
    stance: string;
    evidence: string[];
    timestamp: string;
  }>>().notNull().default([]),
  verdict: text("verdict").notNull().default(""),
  confidenceScore: real("confidence_score").notNull().default(0),
  technicalScore: real("technical_score").notNull().default(0),
  cultureScore: real("culture_score").notNull().default(0),
  growthScore: real("growth_score").notNull().default(0),
  riskScore: real("risk_score").notNull().default(0),
  summary: text("summary").notNull().default(""),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertDebateSchema = createInsertSchema(debatesTable).omit({ id: true, createdAt: true });
export type InsertDebate = z.infer<typeof insertDebateSchema>;
export type Debate = typeof debatesTable.$inferSelect;

export const missionsTable = pgTable("missions", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id"),
  jobTitle: text("job_title").notNull(),
  status: text("status").notNull().default("running"),
  steps: jsonb("steps").$type<Array<{
    id: string;
    label: string;
    status: string;
    startedAt?: string | null;
    completedAt?: string | null;
    details?: string | null;
  }>>().notNull().default([]),
  candidatesDiscovered: integer("candidates_discovered").notNull().default(0),
  hiddenTalentsFound: integer("hidden_talents_found").notNull().default(0),
  debatesRun: integer("debates_run").notNull().default(0),
  topCandidateId: integer("top_candidate_id"),
  topCandidateName: text("top_candidate_name"),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const insertMissionSchema = createInsertSchema(missionsTable).omit({ id: true, startedAt: true, completedAt: true });
export type InsertMission = z.infer<typeof insertMissionSchema>;
export type Mission = typeof missionsTable.$inferSelect;
