# StudioWorks Pivot: Freelancer Project Management + Invoicing

## Overview

Pivot StudioWorks from an AI video rendering platform to a freelancer project management and invoicing tool. The existing TypeScript monorepo architecture (Fastify API, BullMQ queue, Worker, Next.js frontend, Prisma, Docker Compose) stays intact. The domain changes: instead of submitting render specs and producing video, users manage clients/projects, log time and expenses, generate invoices, and the async pipeline produces invoice PDFs.

## Goals

- Real-world portfolio piece with clear business value (competes with FreshBooks, Harvest)
- Reuse existing pipeline architecture — rename and repurpose, don't rebuild
- MVP scope: Clients + Projects + Time/Expense tracking + Invoice generation with PDF output
- Future bolt-ons: payment tracking, overdue reminders, recurring invoices, S3 storage

## Non-Goals (MVP)

- Authentication / user accounts
- Payment processing or gateway integration
- S3 file storage (PDFs stored locally for MVP)
- Recurring invoices or scheduled reminders
- Automated overdue detection (OVERDUE status exists in the enum but is set manually via PATCH for MVP)
- Multi-currency support

---

## Domain Model

### Entities

| Entity | Purpose |
|--------|---------|
| **Client** | Someone the freelancer bills. Has name, email, address, notes. |
| **Project** | A body of work for a client. Has name, status, hourly rate (required for projects with billable time entries). |
| **TimeEntry** | Logged work against a project. Description, date, hours, billable flag, billed state. |
| **Expense** | A cost incurred on a project. Description, date, amount, category, billable flag, billed state. |
| **Invoice** | Generated from unbilled time + expenses. Line items, totals, status, due date, invoice number. |
| **Job** | Async pipeline record. When an invoice is finalized, a Job is created to generate the PDF. |

### Relationships

```
Client 1──* Project 1──* TimeEntry
                     1──* Expense
                     1──* Invoice 1──0..1 Job (PDF generation)
```

### Prisma Schema

```prisma
enum JobStatus {
  QUEUED
  PROCESSING
  COMPLETE
  FAILED
}

enum ProjectStatus {
  ACTIVE
  COMPLETED
  ARCHIVED
}

enum InvoiceStatus {
  DRAFT
  SENT
  PAID
  OVERDUE
}

model Client {
  id        String    @id @default(uuid())
  name      String
  email     String?
  address   String?
  notes     String?
  projects  Project[]
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
}

model Project {
  id          String        @id @default(uuid())
  name        String
  status      ProjectStatus @default(ACTIVE)
  hourlyRate  Float?
  client      Client        @relation(fields: [clientId], references: [id])
  clientId    String
  timeEntries TimeEntry[]
  expenses    Expense[]
  invoices    Invoice[]
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  @@index([clientId])
}

model TimeEntry {
  id          String   @id @default(uuid())
  description String
  date        DateTime
  hours       Float
  billable    Boolean  @default(true)
  billed      Boolean  @default(false)
  project     Project  @relation(fields: [projectId], references: [id])
  projectId   String
  invoice     Invoice? @relation(fields: [invoiceId], references: [id])
  invoiceId   String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([projectId])
  @@index([invoiceId])
}

model Expense {
  id          String   @id @default(uuid())
  description String
  date        DateTime
  amount      Float
  category    String?
  billable    Boolean  @default(true)
  billed      Boolean  @default(false)
  project     Project  @relation(fields: [projectId], references: [id])
  projectId   String
  invoice     Invoice? @relation(fields: [invoiceId], references: [id])
  invoiceId   String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([projectId])
  @@index([invoiceId])
}

model Invoice {
  id            String        @id @default(uuid())
  invoiceNumber String        @unique
  status        InvoiceStatus @default(DRAFT)
  dueDate       DateTime?
  subtotal      Float
  tax           Float         @default(0)
  total         Float
  notes         String?
  project       Project       @relation(fields: [projectId], references: [id])
  projectId     String
  timeEntries   TimeEntry[]
  expenses      Expense[]
  job           Job?
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  @@index([projectId])
  @@index([status])
}

model Job {
  id         String    @id @default(uuid())
  status     JobStatus @default(QUEUED)
  spec       Json
  outputPath String?
  error      String?
  invoice    Invoice   @relation(fields: [invoiceId], references: [id])
  invoiceId  String    @unique
  createdAt  DateTime  @default(now())
  updatedAt  DateTime  @updatedAt
}
```

---

## JobSpec (Zod Schema)

Replaces `RenderSpec`. Uses a discriminated union on `type` to support future job types.

```ts
// MVP: only invoice-pdf exists
{
  type: "invoice-pdf",
  invoiceId: string
}

// Future: payment-reminder
{
  type: "payment-reminder",
  invoiceId: string,
  recipientEmail: string,
  templateId: string
}
```

The worker switches on `spec.type` and dispatches to the appropriate provider adapter. The queue wiring, state machine, and status tracking are type-agnostic.

---

## API Design

All routes in `apps/api`. Fastify + Zod validation.

### Client routes

| Endpoint | Purpose |
|----------|---------|
| `POST /clients` | Create a client |
| `GET /clients` | List clients (cursor pagination) |
| `GET /clients/:id` | Client detail with their projects |
| `PATCH /clients/:id` | Update client info |

### Project routes

| Endpoint | Purpose |
|----------|---------|
| `POST /clients/:clientId/projects` | Create a project under a client |
| `GET /clients/:clientId/projects` | List projects for a client |
| `GET /projects/:id` | Project detail with time entries, expenses, unbilled totals |
| `PATCH /projects/:id` | Update project (name, status, rate) |

### Time & Expense routes

| Endpoint | Purpose |
|----------|---------|
| `POST /projects/:projectId/time-entries` | Log time |
| `GET /projects/:projectId/time-entries` | List time entries (filterable: date range, billable, billed) |
| `POST /projects/:projectId/expenses` | Log an expense |
| `GET /projects/:projectId/expenses` | List expenses (filterable: date range, billable, billed) |
| `DELETE /time-entries/:id` | Delete a time entry (returns 409 if already billed) |
| `DELETE /expenses/:id` | Delete an expense (returns 409 if already billed) |

### Invoice routes

| Endpoint | Purpose |
|----------|---------|
| `POST /projects/:projectId/invoices` | Generate invoice from unbilled time + expenses |
| `GET /invoices` | List all invoices (cursor pagination, filterable by status) |
| `GET /invoices/:id` | Invoice detail with line items, totals, PDF download URL, job status |
| `PATCH /invoices/:id` | Update status (draft -> sent -> paid) |

### Job routes

| Endpoint | Purpose |
|----------|---------|
| `GET /jobs/:id` | Job status + result (PDF path when complete) |
| `GET /invoices/:id/pdf` | Download the generated PDF (serves file from local storage) |

### Invoice Generation Flow

`POST /projects/:projectId/invoices` is a multi-step operation inside `prisma.$transaction()` using interactive transaction mode for row-level locking:

1. Gather unbilled time entries + expenses for the project using `SELECT ... FOR UPDATE` to prevent concurrent invoice generation from grabbing overlapping entries
2. If both collections are empty, return 400 ("nothing to invoice")
3. If there are unbilled time entries, validate that the project has an `hourlyRate` set — return 400 if missing. Expense-only invoices do not require `hourlyRate`.
4. Calculate line items and totals (time entries priced at the project's `hourlyRate`)
5. Create the `Invoice` record
6. Mark the gathered entries as billed (`billed: true`, set `invoiceId`)
7. Create a `Job` with an `invoice-pdf` spec
8. Enqueue the `jobId`
9. Return the invoice with job status

---

## Pipeline & Worker Design

### State Machine

`QUEUED -> PROCESSING -> COMPLETE / FAILED`

Simplified from the render pipeline's `QUEUED -> RUNNING -> UPLOADING -> COMPLETE / FAILED` since PDF generation is a single step.

### Worker Flow (invoice-pdf)

1. Dequeue `jobId` from Redis
2. Load `Job` row from Postgres, read the `spec` JSON
3. Switch on `spec.type` — dispatch to `invoice-pdf` provider
4. Load the full `Invoice` with line items, client details from DB
5. Render an HTML template with the invoice data
6. Convert HTML to PDF using Puppeteer (headless Chrome)
7. Write PDF to local filesystem (`data/invoices/{invoiceId}.pdf`)
8. Store the file path in `Job.outputPath`
9. Mark job `COMPLETE`

### PDF Storage (MVP)

PDFs are stored locally in `data/invoices/`. The API serves them via a static file route or a download endpoint. S3 is a future bolt-on — the provider adapter interface stays the same either way.

### Provider Adapter Pattern

`apps/worker/src/providers/invoice-pdf.ts` replaces the old render adapter. Each job type gets its own adapter file. Adding a new job type (e.g. `payment-reminder`) means adding a new adapter — no changes to queue logic or state machine.

---

## Frontend Design

Next.js App Router, Tailwind CSS. Client components with `useState`/`useEffect` for interactive pages.

### Page Structure

| Route | Purpose |
|-------|---------|
| `/` | Dashboard — summary stats (active projects, unbilled hours, outstanding invoices, recent activity) |
| `/clients` | Client list with search |
| `/clients/[id]` | Client detail — info, their projects |
| `/clients/new` | Create client form |
| `/projects` | All projects list (filterable by status, client) |
| `/projects/[id]` | Project detail — time log, expenses, unbilled total, "Generate Invoice" button |
| `/projects/[id]/time` | Time entry form + log for this project |
| `/projects/[id]/expenses` | Expense form + log for this project |
| `/invoices` | Invoice list (filterable by status: draft/sent/paid/overdue) |
| `/invoices/[id]` | Invoice detail — line items, totals, status badge, PDF download link (polls job status until ready) |

### Key Interactions

- **Time logging:** Form with description, date, hours, billable toggle. Table below shows logged entries with running totals.
- **Generate Invoice:** Button on project detail page. Gathers unbilled time + expenses, shows confirmation, POSTs. Redirects to invoice detail where PDF generation is tracked via polling.
- **Invoice PDF:** Once the job completes, a download link appears. Status badge transitions through draft/sent/paid.

### Navigation

Top nav bar: StudioWorks logo, links to Dashboard, Clients, Projects, Invoices.

---

## Pivot Mapping: What Changes

### Stays (same code, same purpose)

- Monorepo structure, Turborepo, pnpm workspace
- Docker Compose (Postgres + Redis)
- BullMQ queue wiring (`apps/api/src/queue.ts`) — rename queue constant
- Worker entry point (`apps/worker/src/worker.ts`) — dequeues jobId, calls processor
- Worker state machine shape in `processor.ts`
- Fastify app scaffold (`apps/api/src/app.ts`) — new routes, same setup
- Test infrastructure (Testcontainers, vitest configs)
- CI workflows
- Next.js app shell

### Gets Renamed/Replaced

| Old | New |
|-----|-----|
| `RenderJob` Prisma model | `Job` model with `invoiceId`, `outputPath`, `error` fields |
| `RenderSpec` Zod schema | `JobSpec` Zod schema (discriminated union) |
| `RenderJobStatus` enum | `JobStatus` enum (`RUNNING/UPLOADING` -> `PROCESSING`) |
| `RENDER_QUEUE_NAME` | `JOB_QUEUE_NAME` |
| `processRenderJob()` | `processJob()` |
| `apps/worker/src/providers/adapter.ts` | `apps/worker/src/providers/invoice-pdf.ts` |
| `packages/shared/render-spec.ts` | `packages/shared/job-spec.ts` |

### Gets Deleted

- `/render/*` frontend pages (replaced by `/clients`, `/projects`, `/invoices`)
- `/studio/*` frontend pages (no longer relevant)
- `packages/shared/src/studio/` (no longer relevant)
- Existing `RenderJob` migration (new migration replaces entire schema)
- Shared response types (`RenderJobListItem`, `RenderJobDetail`)

### Gets Added

- `Client`, `Project`, `TimeEntry`, `Expense`, `Invoice` Prisma models
- CRUD routes for all entities
- Invoice generation logic (gather unbilled -> create invoice -> enqueue job)
- HTML invoice template + Puppeteer PDF conversion
- Local file storage for PDFs (`data/invoices/`)
- New frontend pages (dashboard, clients, projects, time, expenses, invoices)

---

## Future Bolt-Ons (Post-MVP)

These are explicitly out of scope for MVP but the architecture supports them without structural changes.

### Service/Consulting Specialization (Phase B)

- Retainer tracking: monthly hour budgets per project, usage vs allocation
- Recurring time entries: templates for regular work
- Rate tiers: different rates per project phase or activity type

### Payment Tracking & Reminders (Phase C)

- Mark invoices as paid with payment date and method
- Track overdue invoices (past due date + not paid)
- Worker job type `payment-reminder`: sends email reminders for overdue invoices
- New provider adapter: `apps/worker/src/providers/payment-reminder.ts`
- Scheduled jobs: BullMQ repeatable jobs to check for overdue invoices daily

### Production Infrastructure

- S3 for PDF storage (replace local filesystem)
- Authentication (NextAuth / Auth.js)
- Multi-user support
- Email sending (invoice delivery, reminders)
- Production Dockerfiles, CI/CD, deployment

---

## Implementation Guidance

This spec is implemented in two distinct phases with different executors:

**Phase 1 — Refactoring (agent-executed):** Agents handle the mechanical pivot from the old video platform — deleting dead files, renaming constants/models/schemas per the Pivot Mapping section, and applying the new Prisma schema with a migration. Plans for this phase should be written as agent instructions.

**Phase 2 — Implementation (human hand-coded):** A human writes all internal logic. Plans for this phase should:

- Scaffold file structure, function signatures, type definitions, and Zod schemas in full
- Leave all function bodies as `// TODO` — the human fills in the logic
- Be written as step-by-step human-readable instructions, not agent automation scripts
- Note dependencies between steps (e.g. "build shared before touching api") as prose
