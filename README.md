# StudioWorks

**A TypeScript-first monorepo platform for freelancer invoicing — client management, project time tracking, expense logging, and automated PDF invoice generation.**

StudioWorks drives invoice generation through a persistent job queue, strict shared contracts, and a clean separation of concerns across three runtime services.

---

## Architecture Overview

```
studioworks/
  apps/
    web/                        # Next.js frontend (port 3000)
      src/app/
        page.tsx                # Dashboard — summary stats, recent activity
        clients/                # Client list, detail, new client form
        projects/               # Project list, detail, time entries, expenses
        invoices/               # Invoice list and detail with PDF download
    api/                        # Fastify backend (port 4000)
    worker/                     # BullMQ async job processor
  packages/
    shared/                     # JobSpec Zod schema, queue constants, shared types
    db/                         # Prisma schema and database client
  data/
    invoices/                   # PDF output directory
  docker/
    compose.dev.yml
  docs/
```

### Services

| Service | Runtime | Responsibility |
|---|---|---|
| `web` | Next.js | Client/project/invoice UI, job status polling, PDF download |
| `api` | Node / Fastify | Validate requests, persist domain records, enqueue job IDs |
| `worker` | Node / BullMQ | Dequeue job, load spec from DB, generate PDF, update job state |

### Data Flow

```
Frontend requests invoice generation
  → API gathers unbilled entries, calculates totals, persists Invoice + Job
    → Worker receives jobId only
      → Worker loads JobSpec from Postgres
        → Calls invoice-pdf provider
          → QUEUED → PROCESSING → COMPLETE / FAILED
```

### Domain Models

| Model | Description |
|---|---|
| `Client` | Freelancer client record |
| `Project` | Billable project under a client, with optional hourly rate |
| `TimeEntry` | Hours logged against a project |
| `Expense` | Cost logged against a project |
| `Invoice` | Groups billable entries and expenses into a payable document |
| `Job` | Async background job (PDF generation) tied 1:1 to an invoice |

### Data Stores

- **Postgres** — all domain records; `Job.spec` JSON is the source of truth for worker input
- **Redis** — BullMQ job queue (carries only `jobId`, never the full spec)

---

## Key Design Decisions

- **Minimal queue payload** — only `{ jobId }` is enqueued. The worker loads the `JobSpec` from Postgres itself, keeping the queue lightweight regardless of spec size.
- **Shared TypeScript contracts** — `@studioworks/shared` is the single source of truth for all cross-service types (`JobSpec`, `JOB_QUEUE_NAME`). `@studioworks/db` is the only path to the database — never import `@prisma/client` directly.
- **Zod guards trust boundaries, Prisma owns the DB** — Zod validates data that originates outside code we control: HTTP request bodies, webhook payloads, environment variables. Prisma query results are trusted internal infrastructure — already validated at write time and fully typed by the generated client.
- **Provider-agnostic worker** — the worker dispatches on `JobSpec.type`, making it straightforward to add new job types (e.g. email delivery, Stripe sync) without touching API or queue logic.

---

## Tech Stack

- **Language:** TypeScript (strict, throughout)
- **Monorepo:** pnpm workspaces + Turborepo
- **Frontend:** Next.js 14 (App Router)
- **Backend:** Fastify 4
- **Queue:** BullMQ 4 (Redis-backed)
- **ORM:** Prisma 5
- **Database:** PostgreSQL
- **Validation:** Zod (`JobSpec` schema in `@studioworks/shared`)
- **Testing:** Vitest + Testcontainers

---

## Getting Started

### Prerequisites

- Node.js v20+
- pnpm v10+
- Docker (for Postgres and Redis)

### Local Development

```bash
pnpm install
cp .env.example .env                                    # defaults work with Docker Compose
pnpm infra:up                                           # start Postgres (5432) + Redis (6379)
pnpm --filter @studioworks/db db:migrate:deploy         # apply migrations (first time only)
pnpm dev                                                # web (3000), api (4000), worker
```

See [`docs/local-dev.md`](docs/local-dev.md) for the full setup walkthrough.

---

## Current State

Phase 1 (infrastructure pivot) is complete:

- Old video rendering domain (`RenderJob`, `RenderSpec`, render/studio pages) removed
- New Prisma schema with six domain models migrated to Postgres
- `JobSpec` discriminated union schema replaces `RenderSpec` in `@studioworks/shared`
- All six API route plugins scaffolded (`/clients`, `/projects`, `/time-entries`, `/expenses`, `/invoices`, `/jobs`)
- Worker renamed and scaffolded (`processJob`, `invoice-pdf` provider)
- All web pages scaffolded for clients, projects, time entries, expenses, and invoices
- `pnpm typecheck` passes clean across all packages

Route handlers and the PDF provider have `// TODO` bodies — Phase 2 implements them.

---

## JobSpec

The `JobSpec` is a Zod discriminated union defined in `@studioworks/shared`:

```ts
// invoice-pdf is the only job type in MVP
{ type: 'invoice-pdf', invoiceId: string }
```

The worker switches on `type` to dispatch to the correct provider. New job types are added to the union without touching queue or API logic.

---

## Job Lifecycle

```
QUEUED → PROCESSING → COMPLETE
                    → FAILED
```

State is written by the worker directly to the `Job` record in Postgres.

---

## Documentation

| Document | Description |
|---|---|
| [`docs/local-dev.md`](docs/local-dev.md) | Local development setup |
| [`docs/architecture.md`](docs/architecture.md) | System design and key decisions |
| [`docs/deployment-plan.md`](docs/deployment-plan.md) | Production deployment roadmap |

---

## License

MIT
