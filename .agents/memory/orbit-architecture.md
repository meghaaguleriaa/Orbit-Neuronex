---
name: ORBIT Architecture
description: Full-stack autonomous hiring OS — key decisions, seeded data, route structure
---

## What it is
ORBIT is a SaaS hackathon demo: AI-powered hiring OS with multi-agent debate, digital twins, performance simulations, hidden talent detection, team chemistry engine, and autonomous autopilot.

## Stack
- React+Vite (dark theme, slate-950/indigo) + Wouter + Recharts + Framer Motion + shadcn/ui
- Express 5 API at /api, port 8080
- PostgreSQL + Drizzle ORM, schema in `lib/db/src/schema/orbit.ts`
- Contract-first: OpenAPI spec → Orval codegen → React Query hooks

## DB Tables
- `jobs` (4 seeded), `candidates` (20 seeded), `debates` (2 seeded), `missions`

## Seeded data
- 20 realistic candidates across diverse tech roles, stages, scores, skills
- 5 hidden talents (hiddenTalent: boolean flag)
- 2 full debates with 5-6 AI agent messages each
- 4 jobs across ML, Platform, Product, DevOps

## Key routes
- `/api/candidates/:id/twin` — generates digital twin profile
- `/api/candidates/:id/simulation` — 12-month forecast
- `/api/debates` POST — creates AI debate with generated messages
- `/api/autopilot/launch` POST — starts autonomous mission with step progression
- `/api/chemistry/preview` POST — previews impact of adding a candidate to team

## Why: dark-only
ThemeProvider uses `forcedTheme="dark"` to prevent any light mode flash for demo context.

## How to apply
When adding new pages, follow the existing pattern: use `@workspace/api-client-react` hooks, motion animations, and the established dark card/border color tokens from index.css.
