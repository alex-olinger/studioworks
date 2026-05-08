# Freelancer Pivot — Phase 1: Refactoring & Scaffolding

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pivot the StudioWorks monorepo from a video rendering platform to a freelancer invoicing platform — delete the old render/studio domain, rename core infrastructure, apply the new Prisma schema, and scaffold all Phase 2 implementation files with `// TODO` bodies.

**Architecture:** The BullMQ queue, worker state machine, and Fastify app shell are preserved and renamed. `RenderJob`/`RenderSpec`/`RENDER_QUEUE_NAME` become `Job`/`JobSpec`/`JOB_QUEUE_NAME`. The Prisma schema is replaced wholesale with six domain models (Client, Project, TimeEntry, Expense, Invoice, Job). All new route and page files are scaffolded with correct signatures and `// TODO` bodies — ready for Phase 2 human implementation.

**Tech Stack:** TypeScript, Fastify 4, Prisma 5, BullMQ 4, Zod 3, Next.js 14, Tailwind CSS

**Spec:** `docs/superpowers/specs/2026-05-01-freelancer-invoicing-pivot-design.md`

**Phase 1 is complete when:** All files under "Gets Deleted" are gone, all renames in "Gets Renamed/Replaced" are applied, the new Prisma schema is migrated, and `pnpm typecheck` passes with no references to the old video platform.

---

## File Structure

### Delete
```
packages/shared/render-spec.ts
packages/shared/src/studio/index.ts
packages/shared/src/render-spec.test.ts
apps/api/src/routes/render-jobs.test.ts
apps/worker/src/providers/adapter.ts
apps/worker/src/processor.test.ts
apps/web/src/app/render/page.tsx
apps/web/src/app/render/[id]/page.tsx
apps/web/src/app/studio/page.tsx
apps/web/src/app/studio/clients/page.tsx
apps/web/src/app/studio/scripts/page.tsx
apps/web/src/app/studio/storyboards/page.tsx
apps/web/src/app/studio/prompts/page.tsx
```

### Create
```
packages/shared/job-spec.ts                          ← JobSpec Zod discriminated union
data/invoices/.gitkeep                               ← PDF output directory
apps/api/src/routes/clients.ts                       ← scaffold
apps/api/src/routes/projects.ts                      ← scaffold
apps/api/src/routes/time-entries.ts                  ← scaffold
apps/api/src/routes/expenses.ts                      ← scaffold
apps/api/src/routes/invoices.ts                      ← scaffold
apps/api/src/routes/jobs.ts                          ← scaffold
apps/worker/src/providers/invoice-pdf.ts             ← scaffold
apps/web/src/app/clients/page.tsx                    ← scaffold
apps/web/src/app/clients/new/page.tsx                ← scaffold
apps/web/src/app/clients/[id]/page.tsx               ← scaffold
apps/web/src/app/projects/page.tsx                   ← scaffold
apps/web/src/app/projects/[id]/page.tsx              ← scaffold
apps/web/src/app/projects/[id]/time/page.tsx         ← scaffold
apps/web/src/app/projects/[id]/expenses/page.tsx     ← scaffold
apps/web/src/app/invoices/page.tsx                   ← scaffold
apps/web/src/app/invoices/[id]/page.tsx              ← scaffold
```

### Modify
```
packages/shared/src/index.ts              ← export JobSpec, JOB_QUEUE_NAME
packages/db/prisma/schema.prisma          ← full domain schema
packages/db/src/index.ts                  ← export new domain types
apps/api/src/queue.ts                     ← use JOB_QUEUE_NAME
apps/api/src/app.ts                       ← register new route plugins, remove render route
apps/api/src/test/setup.ts                ← FK-safe teardown for new models
apps/worker/src/worker.ts                 ← use JOB_QUEUE_NAME, call processJob
apps/worker/src/processor.ts              ← rename processRenderJob → processJob, scaffold
apps/worker/src/test/setup.ts             ← FK-safe teardown for new models
apps/web/src/app/layout.tsx               ← new nav shell
apps/web/src/app/page.tsx                 ← dashboard scaffold
apps/web/src/test/msw/handlers.ts         ← replace old render-jobs handlers with new domain stubs
```

---

## Task 1: Delete Dead Files

- [ ] **Step 1: Delete old shared files**

```bash
rm packages/shared/render-spec.ts
rm packages/shared/src/render-spec.test.ts
rm -rf packages/shared/src/studio
```

- [ ] **Step 2: Delete old API test**

```bash
rm apps/api/src/routes/render-jobs.test.ts
```

- [ ] **Step 3: Delete old worker files**

```bash
rm apps/worker/src/providers/adapter.ts
rm apps/worker/src/processor.test.ts
```

- [ ] **Step 4: Delete old web pages**

```bash
rm -rf apps/web/src/app/render
rm -rf apps/web/src/app/studio
```

- [ ] **Step 5: Replace MSW handlers with new domain stubs**

`apps/web/src/test/msw/handlers.ts`:
```ts
import { http, HttpResponse } from 'msw'

// Stub handlers for the invoicing domain — override in individual tests with server.use()
export const handlers = [
  http.get('/api/clients', () => HttpResponse.json({ data: [], nextCursor: null })),
  http.post('/api/clients', () => HttpResponse.json({ id: 'stub-client-id', name: 'Stub Client' }, { status: 201 })),
  http.get('/api/invoices', () => HttpResponse.json({ data: [], nextCursor: null })),
  http.get('/api/jobs/:id', ({ params }) =>
    HttpResponse.json({ id: params.id, status: 'QUEUED', outputPath: null, error: null })
  ),
]
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: delete old render/studio domain files, stub MSW handlers"
```

---

## Task 2: Replace packages/shared

**Files:**
- Create: `packages/shared/job-spec.ts`
- Modify: `packages/shared/src/index.ts`

- [ ] **Step 1: Write JobSpec schema**

`packages/shared/job-spec.ts`:
```ts
import { z } from 'zod'

// invoice PDF generation — only job type in MVP
const InvoicePdfSpecSchema = z.object({
  type: z.literal('invoice-pdf'),
  invoiceId: z.string(),
})

// discriminated union — worker switches on type to dispatch to correct provider
export const JobSpecSchema = z.discriminatedUnion('type', [InvoicePdfSpecSchema])

export type JobSpec = z.infer<typeof JobSpecSchema>
export type InvoicePdfSpec = z.infer<typeof InvoicePdfSpecSchema>
```

- [ ] **Step 2: Update shared index**

`packages/shared/src/index.ts`:
```ts
export * from '../job-spec'

export const JOB_QUEUE_NAME = 'jobs'
```

- [ ] **Step 3: Build shared to propagate types**

```bash
pnpm build --filter @studioworks/shared
```

Expected: build succeeds, no TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add packages/shared/
git commit -m "feat(shared): replace RenderSpec with JobSpec discriminated union"
```

---

## Task 3: Replace Prisma Schema + Migrate

**Files:**
- Modify: `packages/db/prisma/schema.prisma`

- [ ] **Step 1: Ensure Docker infra is running**

```bash
pnpm infra:up
```

Expected: Postgres on 5432, Redis on 6379.

- [ ] **Step 2: Write new schema**

`packages/db/prisma/schema.prisma`:
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

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

- [ ] **Step 3: Run migration**

```bash
pnpm --filter @studioworks/db db:migrate -- --name "pivot-to-freelancer-invoicing"
```

Expected: new migration file in `packages/db/prisma/migrations/`, Prisma client regenerated. The `--` is required to pass `--name` through to `prisma migrate dev`.

- [ ] **Step 4: Update db package exports**

> **Note:** Step 4 must only be executed after Step 3 succeeds and the Prisma client has been regenerated — the new type exports (`Client`, `Project`, etc.) won't exist in `@prisma/client` until the migration runs.

`packages/db/src/index.ts`:
```ts
import { PrismaClient } from '@prisma/client'

export const db = new PrismaClient()

export type {
  Client,
  Project,
  TimeEntry,
  Expense,
  Invoice,
  Job,
  JobStatus,
  ProjectStatus,
  InvoiceStatus,
} from '@prisma/client'
```

- [ ] **Step 5: Commit**

```bash
git add packages/db/
git commit -m "feat(db): pivot schema to freelancer invoicing domain"
```

---

## Task 4: Update API Infrastructure

**Files:**
- Modify: `apps/api/src/queue.ts`
- Modify: `apps/api/src/test/setup.ts`

- [ ] **Step 1: Update queue.ts**

`apps/api/src/queue.ts`:
```ts
import { Queue } from 'bullmq'
import { JOB_QUEUE_NAME } from '@studioworks/shared'

export const queue = new Queue(JOB_QUEUE_NAME, {
  connection: { url: process.env.REDIS_URL ?? 'redis://localhost:6379' },
})
```

- [ ] **Step 2: Update test teardown**

`apps/api/src/test/setup.ts`:
```ts
import { db } from '@studioworks/db'
import { afterEach } from 'vitest'

// delete in FK-safe order: children before parents
afterEach(async () => {
  await db.job.deleteMany()
  await db.invoice.deleteMany()
  await db.timeEntry.deleteMany()
  await db.expense.deleteMany()
  await db.project.deleteMany()
  await db.client.deleteMany()
})
```

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/queue.ts apps/api/src/test/setup.ts
git commit -m "chore(api): rename queue constant, update test teardown"
```

---

## Task 5: Scaffold API Routes

**Files:** Create all six route files + update `apps/api/src/app.ts`

- [ ] **Step 1: Scaffold clients.ts**

`apps/api/src/routes/clients.ts`:
```ts
import { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { db } from '@studioworks/db'

const CreateClientSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
})

const UpdateClientSchema = CreateClientSchema.partial()

export const clientRoutes: FastifyPluginAsync = async (app) => {
  app.post('/clients', async (request, reply) => {
    // TODO: validate body with CreateClientSchema, create client, return 201
  })

  app.get('/clients', async (request, reply) => {
    // TODO: cursor pagination query params, return { data, nextCursor }
  })

  app.get('/clients/:id', async (request, reply) => {
    // TODO: find client with projects included, return 404 if not found
  })

  app.patch('/clients/:id', async (request, reply) => {
    // TODO: validate body with UpdateClientSchema, update client, return 404 if not found
  })
}
```

- [ ] **Step 2: Scaffold projects.ts**

`apps/api/src/routes/projects.ts`:
```ts
import { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { db } from '@studioworks/db'

const CreateProjectSchema = z.object({
  name: z.string().min(1),
  hourlyRate: z.number().positive().optional(),
})

const UpdateProjectSchema = z.object({
  name: z.string().min(1).optional(),
  status: z.enum(['ACTIVE', 'COMPLETED', 'ARCHIVED']).optional(),
  hourlyRate: z.number().positive().optional(),
})

export const projectRoutes: FastifyPluginAsync = async (app) => {
  app.post('/clients/:clientId/projects', async (request, reply) => {
    // TODO: verify client exists, validate body, create project under client, return 201
  })

  app.get('/clients/:clientId/projects', async (request, reply) => {
    // TODO: verify client exists, cursor pagination, optional status filter
  })

  app.get('/projects/:id', async (request, reply) => {
    // TODO: find project with timeEntries and expenses, return 404 if not found
  })

  app.patch('/projects/:id', async (request, reply) => {
    // TODO: validate body with UpdateProjectSchema, update project, return 404 if not found
  })
}
```

- [ ] **Step 3: Scaffold time-entries.ts**

`apps/api/src/routes/time-entries.ts`:
```ts
import { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { db } from '@studioworks/db'

const CreateTimeEntrySchema = z.object({
  description: z.string().min(1),
  date: z.string().datetime().or(z.string().date()),
  hours: z.number().positive(),
  billable: z.boolean().default(true),
})

export const timeEntryRoutes: FastifyPluginAsync = async (app) => {
  app.post('/projects/:projectId/time-entries', async (request, reply) => {
    // TODO: verify project exists, validate body, create entry, return 201
  })

  app.get('/projects/:projectId/time-entries', async (request, reply) => {
    // TODO: cursor pagination, optional billable/billed filters
  })

  app.delete('/time-entries/:id', async (request, reply) => {
    // TODO: find entry, return 409 if billed, delete and return 204
  })
}
```

- [ ] **Step 4: Scaffold expenses.ts**

`apps/api/src/routes/expenses.ts`:
```ts
import { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { db } from '@studioworks/db'

const CreateExpenseSchema = z.object({
  description: z.string().min(1),
  date: z.string().datetime().or(z.string().date()),
  amount: z.number().positive(),
  category: z.string().optional(),
  billable: z.boolean().default(true),
})

export const expenseRoutes: FastifyPluginAsync = async (app) => {
  app.post('/projects/:projectId/expenses', async (request, reply) => {
    // TODO: verify project exists, validate body, create expense, return 201
  })

  app.get('/projects/:projectId/expenses', async (request, reply) => {
    // TODO: cursor pagination, optional billable/billed filters
  })

  app.delete('/expenses/:id', async (request, reply) => {
    // TODO: find expense, return 409 if billed, delete and return 204
  })
}
```

- [ ] **Step 5: Scaffold invoices.ts**

`apps/api/src/routes/invoices.ts`:
```ts
import { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { db } from '@studioworks/db'
import { queue } from '../queue.js'
// TODO: import fs from 'fs' — needed for PDF serving in GET /invoices/:id/pdf

const UpdateInvoiceSchema = z.object({
  status: z.enum(['DRAFT', 'SENT', 'PAID', 'OVERDUE']).optional(),
  dueDate: z.string().datetime().optional(),
  notes: z.string().optional(),
})

export const invoiceRoutes: FastifyPluginAsync = async (app) => {
  app.post('/projects/:projectId/invoices', async (request, reply) => {
    // TODO: gather unbilled billable entries inside prisma.$transaction() with FOR UPDATE
    // TODO: return 400 if nothing to invoice
    // TODO: return 400 if time entries exist but project has no hourlyRate
    // TODO: calculate subtotal, create Invoice, mark entries billed, create Job, enqueue jobId
    // TODO: return 201 with invoice + job
  })

  app.get('/invoices', async (request, reply) => {
    // TODO: cursor pagination, optional status filter
  })

  app.get('/invoices/:id', async (request, reply) => {
    // TODO: find invoice with timeEntries, expenses, job, project+client, 404 if not found
  })

  app.patch('/invoices/:id', async (request, reply) => {
    // TODO: validate body, update invoice, 404 if not found
  })

  app.get('/invoices/:id/pdf', async (request, reply) => {
    // TODO: find invoice job, return 202 if not complete, serve PDF file if complete
  })
}
```

- [ ] **Step 6: Scaffold jobs.ts**

`apps/api/src/routes/jobs.ts`:
```ts
import { FastifyPluginAsync } from 'fastify'
import { db } from '@studioworks/db'

export const jobRoutes: FastifyPluginAsync = async (app) => {
  app.get('/jobs/:id', async (request, reply) => {
    // TODO: find job by id, return 404 if not found
  })
}
```

- [ ] **Step 7: Update app.ts**

`apps/api/src/app.ts`:
```ts
import Fastify from 'fastify'
import { clientRoutes } from './routes/clients.js'
import { projectRoutes } from './routes/projects.js'
import { timeEntryRoutes } from './routes/time-entries.js'
import { expenseRoutes } from './routes/expenses.js'
import { invoiceRoutes } from './routes/invoices.js'
import { jobRoutes } from './routes/jobs.js'

export function buildApp() {
  const app = Fastify({ logger: false })

  app.register(clientRoutes)
  app.register(projectRoutes)
  app.register(timeEntryRoutes)
  app.register(expenseRoutes)
  app.register(invoiceRoutes)
  app.register(jobRoutes)

  app.ready().catch(console.error)
  return app
}
```

- [ ] **Step 8: Commit**

```bash
git add apps/api/
git commit -m "feat(api): scaffold route plugins for invoicing domain"
```

---

## Task 6: Update Worker + Scaffold

**Files:**
- Modify: `apps/worker/src/worker.ts`
- Modify: `apps/worker/src/processor.ts`
- Create: `apps/worker/src/providers/invoice-pdf.ts`
- Modify: `apps/worker/src/test/setup.ts`

- [ ] **Step 1: Update worker.ts**

`apps/worker/src/worker.ts`:
```ts
import 'dotenv/config'
import { Worker } from 'bullmq'
import { JOB_QUEUE_NAME } from '@studioworks/shared'
import { processJob } from './processor.js'

const worker = new Worker(
  JOB_QUEUE_NAME,
  async (job) => {
    await processJob({ jobId: job.data.jobId })
  },
  { connection: { url: process.env.REDIS_URL ?? 'redis://localhost:6379' } },
)

worker.on('completed', (job) => console.log(`Job ${job.id} completed`))
worker.on('failed', (job, err) => console.error(`Job ${job?.id} failed:`, err))

console.log('Worker listening on queue:', JOB_QUEUE_NAME)
```

- [ ] **Step 2: Scaffold processor.ts**

`apps/worker/src/processor.ts`:
```ts
// TODO: import { db } from '@studioworks/db'
// TODO: import { JobSpecSchema } from '@studioworks/shared'
// TODO: import { generateInvoicePdf } from './providers/invoice-pdf.js'

export async function processJob({ jobId }: { jobId: string }) {
  // TODO: load job from DB, set status to PROCESSING
  // TODO: parse spec with JobSpecSchema
  // TODO: switch on spec.type:
  //   'invoice-pdf' → call generateInvoicePdf(spec.invoiceId)
  //                   set job.outputPath, set status to COMPLETE
  // TODO: on any error: set job.error to message, set status to FAILED, rethrow
}
```

- [ ] **Step 3: Scaffold invoice-pdf provider**

`apps/worker/src/providers/invoice-pdf.ts`:
```ts
// TODO: import { db } from '@studioworks/db'
// TODO: import puppeteer from 'puppeteer'  (pnpm add puppeteer --filter @studioworks/worker)
// TODO: import path from 'path'
// TODO: import fs from 'fs'

export async function generateInvoicePdf(invoiceId: string): Promise<string> {
  // TODO: load invoice with line items, project, and client from DB
  // TODO: build an HTML string representing the invoice (table of line items, totals, client info)
  // TODO: launch Puppeteer, open the HTML, export as PDF
  // TODO: ensure data/invoices/ directory exists
  // TODO: write PDF buffer to data/invoices/{invoiceId}.pdf
  // TODO: return the output file path
}
```

- [ ] **Step 4: Update worker test teardown**

`apps/worker/src/test/setup.ts`:
```ts
import { db } from '@studioworks/db'
import { afterEach } from 'vitest'

afterEach(async () => {
  await db.job.deleteMany()
  await db.invoice.deleteMany()
  await db.timeEntry.deleteMany()
  await db.expense.deleteMany()
  await db.project.deleteMany()
  await db.client.deleteMany()
})
```

- [ ] **Step 5: Commit**

```bash
git add apps/worker/
git commit -m "feat(worker): rename to processJob, scaffold invoice-pdf provider"
```

---

## Task 7: Scaffold Web Pages

**Files:** Modify layout + page, create all new route pages.

- [ ] **Step 1: Update layout.tsx with nav shell**

`apps/web/src/app/layout.tsx`:
```tsx
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'StudioWorks' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <nav>
          {/* TODO: links to /, /clients, /projects, /invoices */}
        </nav>
        <main>{children}</main>
      </body>
    </html>
  )
}
```

- [ ] **Step 2: Scaffold dashboard page**

`apps/web/src/app/page.tsx`:
```tsx
'use client'
import { useState, useEffect } from 'react'

export default function DashboardPage() {
  // TODO: fetch summary stats from API:
  //   - active project count
  //   - total unbilled hours
  //   - outstanding invoice count + total
  //   - recent activity
  return (
    <div>
      <h1>Dashboard</h1>
      {/* TODO: render summary stat cards and recent activity feed */}
    </div>
  )
}
```

- [ ] **Step 3: Scaffold clients pages**

`apps/web/src/app/clients/page.tsx`:
```tsx
'use client'
import { useState, useEffect } from 'react'

export default function ClientsPage() {
  // TODO: fetch clients from GET /clients with cursor pagination
  // TODO: implement search/filter by name
  return (
    <div>
      <h1>Clients</h1>
      {/* TODO: search input, client list, link to /clients/new */}
    </div>
  )
}
```

`apps/web/src/app/clients/new/page.tsx`:
```tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NewClientPage() {
  const router = useRouter()
  // TODO: form state for name, email, address, notes
  // TODO: POST /clients on submit, redirect to /clients on success
  return (
    <div>
      <h1>New Client</h1>
      {/* TODO: form */}
    </div>
  )
}
```

`apps/web/src/app/clients/[id]/page.tsx`:
```tsx
'use client'
import { useState, useEffect } from 'react'

export default function ClientDetailPage({ params }: { params: { id: string } }) {
  // TODO: fetch client from GET /clients/:id (includes projects array)
  return (
    <div>
      {/* TODO: client info, project list with links to /projects/:id */}
    </div>
  )
}
```

- [ ] **Step 4: Scaffold projects pages**

`apps/web/src/app/projects/page.tsx`:
```tsx
'use client'
import { useState, useEffect } from 'react'

export default function ProjectsPage() {
  // TODO: fetch all projects from GET /clients/:clientId/projects across clients
  //   or add a GET /projects global endpoint — see spec note
  // TODO: filter by status (ACTIVE, COMPLETED, ARCHIVED)
  return (
    <div>
      <h1>Projects</h1>
      {/* TODO: project list with status filter */}
    </div>
  )
}
```

`apps/web/src/app/projects/[id]/page.tsx`:
```tsx
'use client'
import { useState, useEffect } from 'react'

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  // TODO: fetch project from GET /projects/:id (includes timeEntries, expenses)
  // TODO: calculate unbilled totals from unbilled entries
  // TODO: "Generate Invoice" button → POST /projects/:id/invoices, redirect to invoice detail
  return (
    <div>
      {/* TODO: project info, time entry list, expense list, unbilled total, generate invoice button */}
    </div>
  )
}
```

`apps/web/src/app/projects/[id]/time/page.tsx`:
```tsx
'use client'
import { useState, useEffect } from 'react'

export default function TimeEntriesPage({ params }: { params: { id: string } }) {
  // TODO: form state for description, date, hours, billable toggle
  // TODO: POST /projects/:id/time-entries on submit
  // TODO: fetch entries from GET /projects/:id/time-entries
  // TODO: DELETE /time-entries/:entryId on delete
  return (
    <div>
      <h1>Time Entries</h1>
      {/* TODO: log time form, entry list with running totals */}
    </div>
  )
}
```

`apps/web/src/app/projects/[id]/expenses/page.tsx`:
```tsx
'use client'
import { useState, useEffect } from 'react'

export default function ExpensesPage({ params }: { params: { id: string } }) {
  // TODO: form state for description, date, amount, category, billable toggle
  // TODO: POST /projects/:id/expenses on submit
  // TODO: fetch expenses from GET /projects/:id/expenses
  // TODO: DELETE /expenses/:expenseId on delete
  return (
    <div>
      <h1>Expenses</h1>
      {/* TODO: log expense form, expense list */}
    </div>
  )
}
```

- [ ] **Step 5: Scaffold invoices pages**

`apps/web/src/app/invoices/page.tsx`:
```tsx
'use client'
import { useState, useEffect } from 'react'

export default function InvoicesPage() {
  // TODO: fetch invoices from GET /invoices, optional status filter
  return (
    <div>
      <h1>Invoices</h1>
      {/* TODO: status filter tabs (all / draft / sent / paid / overdue), invoice list */}
    </div>
  )
}
```

`apps/web/src/app/invoices/[id]/page.tsx`:
```tsx
'use client'
import { useState, useEffect } from 'react'

export default function InvoiceDetailPage({ params }: { params: { id: string } }) {
  // TODO: fetch invoice from GET /invoices/:id
  // TODO: poll GET /jobs/:jobId every 2s until status is COMPLETE or FAILED
  // TODO: show PDF download link once job is COMPLETE
  // TODO: PATCH /invoices/:id to update status (sent/paid)
  return (
    <div>
      {/* TODO: invoice header, line items table, totals, status badge, PDF download link */}
    </div>
  )
}
```

- [ ] **Step 6: Commit**

```bash
git add apps/web/
git commit -m "feat(web): scaffold all invoicing pages"
```

---

## Task 8: Create PDF Output Directory

- [ ] **Step 1: Create directory with gitkeep**

```bash
mkdir -p data/invoices
touch data/invoices/.gitkeep
```

- [ ] **Step 2: Commit**

```bash
git add data/invoices/.gitkeep
git commit -m "chore: add data/invoices directory for PDF output"
```

---

## Task 9: Verify Compilation

- [ ] **Step 1: Build shared (if not already built)**

```bash
pnpm build --filter @studioworks/shared
```

- [ ] **Step 2: Typecheck all packages**

```bash
pnpm typecheck
```

Expected: no TypeScript errors. No references to `RenderJob`, `RenderSpec`, `RENDER_QUEUE_NAME`, `processRenderJob`, or `render-jobs` anywhere.

- [ ] **Step 3: Grep for old references as a sanity check**

```bash
grep -r "RenderJob\|RenderSpec\|RENDER_QUEUE_NAME\|processRenderJob" apps/ packages/ --include="*.ts" --include="*.tsx"
```

Expected: no matches.

- [ ] **Step 4: Final commit if any fixes needed**

```bash
git add -A
git commit -m "chore: fix any remaining type errors from pivot"
```

---

## Phase 1 Complete

Continue in `docs/superpowers/plans/2026-05-07-freelancer-pivot-phase2-implementation.md` for human-coded implementation of all `// TODO` bodies.
