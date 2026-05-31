# StudioWorks Platform Architecture

- `apps/` — runtime services
- `packages/` — shared logic
- `docker/` — local infrastructure containers
- `infra/` — production infrastructure definition (future)
- `data/invoices/` — PDF output directory

---

## How the System Fits Together

The platform is split into three services that communicate only through well-defined boundaries — HTTP and a Redis queue — never by calling each other's code directly.

```
web (Next.js)
  └─ POST /projects/:id/invoices ──► api (Fastify)
                                        ├─ gathers unbilled entries (Postgres transaction)
                                        ├─ creates Invoice + Job records
                                        └─ enqueues jobId ──► Redis
                                                                └─ worker (BullMQ)
                                                                    ├─ loads JobSpec from DB
                                                                    ├─ calls invoice-pdf provider
                                                                    └─ updates job status + outputPath
```

**Key constraint:** The API only ever enqueues the `jobId`, never the full spec. The worker loads the `JobSpec` from the database itself. This keeps the queue lightweight and the spec read from a single source of truth.

---

## Why the Worker Is Split Into Two Layers

**`worker.ts`** is the BullMQ entry point. It knows about the queue — how to connect, dequeue jobs, and report success or failure back to BullMQ. It contains no business logic.

**`processor.ts`** owns the job state machine (`QUEUED → PROCESSING → COMPLETE / FAILED`) and dispatches to the correct provider based on `JobSpec.type`. It knows nothing about BullMQ internals.

This separation keeps the processing logic testable without a running queue, and makes it straightforward to add new job types by extending `processor.ts` without touching queue wiring.

---

## Why the Provider Pattern Exists

`apps/worker/src/providers/invoice-pdf.ts` is the handler for the `invoice-pdf` job type. It exists as its own module so that:

- The processor dispatches to a stable function interface (`generateInvoicePdf(invoiceId)`) regardless of implementation details
- Adding a new job type (e.g. email delivery, Stripe sync) only requires a new provider file and a new case in `processor.ts` — no changes to queue wiring
- Providers can be tested in isolation without a running queue

---

## How Prisma Connects the Database to TypeScript

```
schema.prisma        ← define shape here
      ↓  prisma migrate dev
migration.sql        ← Prisma generates SQL to match Postgres
      ↓  applied to Postgres
actual tables

schema.prisma
      ↓  prisma generate
PrismaClient         ← Prisma generates TypeScript types
      ↓
your code            ← db.client.create(), db.invoice.findUnique(), etc.
```

TypeScript knows the exact shape of every database record at compile time — fields, types, valid enum values — so mistakes are caught while writing code, not at runtime.

`schema.prisma` is the single source of truth. Migrations keep Postgres in sync; `prisma generate` keeps TypeScript types in sync.

### What `db.client.findMany()` Actually Does at Runtime

A single query call passes through three layers. No layer does all the work — each hands off to the next:

```
db.client.findMany({ where: {...} })
      │
      ▼
PrismaClient          ← routes the call: "that's the Client delegate's job"
      │
      ▼
Client delegate       ← type-checks the args against the Client model and
      │                 builds a structured query (does NOT run SQL itself)
      ▼
Query engine          ← shared by all delegates; executes the actual SQL
      │                 against Postgres and returns rows
      ▼
typed Client[] result
```

- **`PrismaClient`** (`db`) is a thin container. It has no `findMany` of its own — it exposes one **delegate** per model (`db.client`, `db.project`, `db.invoice`, …) and routes each call to the right one.
- **A delegate** is the typed entry point for exactly one model. It enforces the model's contract (only valid fields/types compile) and translates your call into an internal query representation. It does not talk to the database.
- **The query engine** is a single instance shared by every delegate. It is the only layer that executes SQL against Postgres.

Client-level methods like `db.$transaction()` live on `PrismaClient` itself, not on a delegate — which is why the invoice-creation flow (gather entries → create invoice → mark billed → create job) calls `db.$transaction()` directly rather than going through a model delegate.

---

## Zod vs Prisma

**Zod** validates untrusted input at trust boundaries:
- HTTP request bodies, params, query strings
- Webhook payloads from third parties
- Environment variables (`process.env` is untyped)

**Prisma** talks to Postgres. It generates TypeScript types from `schema.prisma`, applies migrations, and handles all DB reads and writes.

```
HTTP request body (untrusted)
      │
      ▼
  z.object({...}).parse(request.body)   ← Zod: reject bad input at the boundary
      │
      ▼
  db.client.create({ data: ... })       ← Prisma: write validated data to Postgres
      │
      ▼
  Prisma result (trusted)               ← no Zod needed — typed by generated client
```

**Rule:** Never use Zod to validate Prisma query results. Data returned from Prisma was written through a validated path and is fully typed by the generated client.

---

## Source File Map

### `packages/shared`
| File | Purpose |
|---|---|
| `job-spec.ts` | Zod discriminated union for `JobSpec` — canonical cross-service contract |
| `src/index.ts` | Re-exports `JobSpec` types and `JOB_QUEUE_NAME` constant |

### `packages/db`
| File | Purpose |
|---|---|
| `src/index.ts` | Exports `db` (PrismaClient singleton) and all domain types |
| `prisma/schema.prisma` | DB schema source of truth — six domain models |

### `apps/api`
| File | Purpose |
|---|---|
| `src/index.ts` | Server entry point, listens on port 4000 |
| `src/app.ts` | Fastify app — registers all route plugins |
| `src/queue.ts` | BullMQ `Queue` instance connected to Redis |
| `src/routes/clients.ts` | Client CRUD — scaffold, awaiting Phase 2 |
| `src/routes/projects.ts` | Project CRUD — scaffold, awaiting Phase 2 |
| `src/routes/time-entries.ts` | Time entry routes — scaffold, awaiting Phase 2 |
| `src/routes/expenses.ts` | Expense routes — scaffold, awaiting Phase 2 |
| `src/routes/invoices.ts` | Invoice routes including PDF endpoint — scaffold, awaiting Phase 2 |
| `src/routes/jobs.ts` | Job status polling — scaffold, awaiting Phase 2 |

### `apps/worker`
| File | Purpose |
|---|---|
| `src/worker.ts` | BullMQ Worker entry point — dequeues `jobId`, calls `processJob` |
| `src/processor.ts` | `processJob` — drives state machine, dispatches on `JobSpec.type` — scaffold, awaiting Phase 2 |
| `src/providers/invoice-pdf.ts` | PDF generation provider — scaffold, awaiting Phase 2 |

### `apps/web`
| File | Purpose |
|---|---|
| `src/app/layout.tsx` | Root layout with nav shell |
| `src/app/page.tsx` | Dashboard — summary stats scaffold |
| `src/app/clients/page.tsx` | Client list — scaffold |
| `src/app/clients/new/page.tsx` | New client form — scaffold |
| `src/app/clients/[id]/page.tsx` | Client detail — scaffold |
| `src/app/projects/page.tsx` | Project list — scaffold |
| `src/app/projects/[id]/page.tsx` | Project detail with invoice generation — scaffold |
| `src/app/projects/[id]/time/page.tsx` | Time entry log — scaffold |
| `src/app/projects/[id]/expenses/page.tsx` | Expense log — scaffold |
| `src/app/invoices/page.tsx` | Invoice list — scaffold |
| `src/app/invoices/[id]/page.tsx` | Invoice detail with job polling and PDF download — scaffold |
