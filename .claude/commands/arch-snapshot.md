# Architecture Snapshot

Generate a current, accurate architecture summary of this StudioWorks monorepo.
Output is designed to be portfolio-ready and resume-referenceable.

## Step 1 — Discover the repo structure

Run the following to build a picture of what exists:

```bash
# Top-level layout
ls -la

# Apps and packages
ls apps/ packages/ 2>/dev/null

# Per-app entry points and key config
find apps -name "package.json" -maxdepth 2 | head -20
find packages -name "package.json" -maxdepth 2 | head -20

# Infrastructure
find k8s helm .github/workflows -name "*.yaml" -o -name "*.yml" 2>/dev/null | head -30

# Docker
find . -name "Dockerfile*" -not -path "*/node_modules/*" 2>/dev/null

# Key config files
cat turbo.json 2>/dev/null
cat docker-compose*.yml 2>/dev/null | head -60
```

Read relevant files to understand the actual current state — do not guess or assume.

## Step 2 — Build the snapshot

Produce the following sections based on what you find:

---

### 🗂️ Monorepo Structure

List every app and package with a one-line description of its role.

```
apps/
  api         — [description]
  web         — [description]
  worker      — [description] (if exists)

packages/
  types       — [description]
  ui          — [description]
  ...
```

---

### 🛠️ Tech Stack

Organized by layer:

| Layer | Technology |
|---|---|
| Frontend | Next.js xx, TypeScript, Tailwind |
| API | Fastify xx, TypeScript |
| Queue | BullMQ + Redis (if present) |
| Database | PostgreSQL xx |
| ORM / Query | [detected] |
| Monorepo | Turborepo |
| Containerization | Docker (multi-stage) |
| Orchestration | Kubernetes (if present) |
| CI/CD | GitHub Actions (if present) |
| Auth | [detected] |

---

### 🔄 Data Flow

Describe how a request moves through the system — from browser/client to DB and back.
Keep it to 5–8 steps. Be specific about what each layer does.

Example format:
```
1. Next.js (apps/web) — SSR or client fetch
2. Fastify API (apps/api) — route handler validates request schema
3. Service layer — business logic, calls DB
4. PostgreSQL — query executed
5. Response flows back through service → handler → client
```

If a queue/worker exists, describe the async path separately.

---

### ⚙️ Infrastructure

Summarize what's deployed and how:

- **Environments:** [detected from k8s namespaces or docker-compose]
- **Services:** [list k8s Deployments/Services found]
- **Scaling:** HPA configured? Replicas?
- **Secrets management:** [ConfigMap + Secret / external secrets operator / etc]
- **CI/CD pipeline:** [what GHA workflows exist and what they do]

---

### 🤖 Agent Workflow (if applicable)

If the PR review agent or other agent commands are present, summarize:
- What agents exist
- What triggers them
- What they produce

---

### 📐 Key Design Decisions

List 3–5 notable architectural choices with brief rationale. Focus on decisions that show platform/DevEx thinking:

- Why Turborepo over nx or standalone repos
- Why Fastify over Express
- Why BullMQ for background jobs (if present)
- Monorepo package sharing strategy
- Any notable CI/CD optimizations

---

## Step 3 — Output two formats

### Format A: Full snapshot (for `docs/architecture.md`)
The complete output above, in markdown, ready to commit.

### Format B: Resume bullet set (3–5 bullets)
Compressed for a resume Projects section. Focus on scale, decisions, and platform-adjacent signals.

Example:
```
• Next.js + Fastify TypeScript monorepo managed with Turborepo; shared packages
  across web, API, and worker apps with strict layer boundaries enforced via
  custom Claude Code agent review pipeline

• Kubernetes deployment with per-service resource limits, HPA, liveness/readiness
  probes, and PodDisruptionBudgets; secrets managed via [method]

• 8-agent PR review system triggered on pull_request events; fans out to Security,
  Architecture, DevOps, UX, Testing, Docs, Code Review, and Simplification agents
  with findings merged into a single structured comment
```

## Notes

- Only describe what actually exists in the repo — no aspirational content
- If something is partially implemented, note it as "in progress"
- Resume bullets should lead with the most platform/DevEx-relevant signals
- Format A goes in `docs/architecture.md`, Format B goes wherever you need it
