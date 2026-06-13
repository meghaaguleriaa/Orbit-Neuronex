# ORBIT — Autonomous Hiring OS

ORBIT is an AI-powered hiring operating system where multi-agent AI debates candidates, builds digital twins, runs performance simulations, detects hidden talent, and autonomously manages the full hiring pipeline.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, path /api)
- `pnpm --filter @workspace/orbit run dev` — run the frontend (port 22982, path /)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind CSS v4 + shadcn/ui + Recharts + Framer Motion + Wouter
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/orbit/` — React+Vite frontend (dark theme, slate-950/indigo palette)
- `artifacts/api-server/` — Express 5 REST API
- `lib/db/` — Drizzle ORM schema and client
- `lib/api-spec/` — OpenAPI spec (source of truth for API contracts)
- `lib/api-client-react/` — generated React Query hooks (from codegen)

### DB Schema (`lib/db/src/schema/orbit.ts`)
- `jobs` — open roles (4 seeded)
- `candidates` — pipeline candidates (20 seeded with skills, scores, stage, verdict)
- `debates` — AI debate sessions with multi-agent message logs (2 seeded)
- `missions` — Autopilot mission records with step tracking

### API Routes (`artifacts/api-server/src/routes/`)
- `/api/candidates` — CRUD + /twin + /simulation per candidate
- `/api/jobs` — job listings
- `/api/pipeline` — pipeline moves
- `/api/debates` — AI debate creation and retrieval
- `/api/chemistry` — team chemistry + preview impact
- `/api/autopilot` — launch/list/get missions with timed step progression
- `/api/analytics` — dashboard stats, funnel, agent activity, hiring velocity

## Pages (9 total, all wired)

| Route | Page |
|---|---|
| `/` | Mission Control (Dashboard) |
| `/candidates` | Candidate Pipeline (Kanban) |
| `/candidates/:id` | Candidate Profile + Digital Twin |
| `/decision-chamber` | AI Boardroom Debate |
| `/autopilot` | Autonomous Mission Launch |
| `/simulations` | 12-Month Performance Simulations |
| `/hidden-talent` | Hidden Gems + Upskilling Roadmap |
| `/team-chemistry` | Team Chemistry Analysis |
| `/analytics` | Hiring Intelligence Analytics |

## Architecture decisions

- Contract-first API: OpenAPI spec → Orval codegen → typed React Query hooks in every page
- All AI "debate" content is generated server-side and stored in Postgres as JSON arrays
- Hidden talent detection is a `hiddenTalent: boolean` flag set at seed time; the route filters on it
- Missions use server-side timed step progression (polling every 2s on the client) rather than WebSockets
- Dark-only theme enforced via `forcedTheme="dark"` on ThemeProvider

## Gotchas

- Do NOT run `pnpm dev` at workspace root — use `restart_workflow` or per-package commands
- `pnpm --filter @workspace/orbit run typecheck` to check frontend types (not build — build needs PORT env)
- After any OpenAPI spec change, run `pnpm --filter @workspace/api-spec run codegen`
- The api-client-react lib generated hooks are in `@workspace/api-client-react` — barrel exports in `lib/api-client-react/src/index.ts`

## User preferences

_Populate as needed — explicit user instructions worth remembering across sessions._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
