# Freelancer Pivot — Phase 2: Implementation

> **Prerequisites:** Phase 1 (`docs/superpowers/plans/2026-05-07-freelancer-pivot-phase1-refactor.md`) must be complete. All scaffold files exist with `// TODO` bodies. Prisma schema is migrated. `pnpm typecheck` passes.

**Goal:** Fill in all `// TODO` bodies across the API, worker, and frontend to produce a working freelancer invoicing platform.

**Implementation order:** `apps/api` → `apps/worker` → `apps/web`
Each API route must work before building the frontend page that calls it.

**Spec:** `docs/superpowers/specs/2026-05-01-freelancer-invoicing-pivot-design.md`

---

## Top-Level Checklist

### Prerequisites
- [ ] Confirm Phase 1 is complete (`pnpm typecheck` passes, no render/studio references)
- [ ] Confirm `@studioworks/shared` is built (`pnpm build --filter @studioworks/shared`)
- [ ] Confirm Prisma client is generated and migration is applied

### API
- [ ] Implement client routes (`POST`, `GET`, `GET /:id`, `PATCH /:id`)
- [ ] Implement project routes (`POST`, `GET`, `GET /:id`, `PATCH /:id`)
- [ ] Implement time entry routes (`POST`, `GET`, `DELETE`)
- [ ] Implement expense routes (`POST`, `GET`, `DELETE`)
- [ ] Implement invoice generation (`POST /projects/:id/invoices`)
- [ ] Implement invoice CRUD (`GET /invoices`, `GET /invoices/:id`, `PATCH`, `GET /pdf`)
- [ ] Implement job status route (`GET /jobs/:id`)

### Worker
- [ ] Implement `processJob` state machine
- [ ] Implement `generateInvoicePdf` with Puppeteer

### Frontend
- [ ] Implement nav layout
- [ ] Implement dashboard
- [ ] Implement clients list + new client form + client detail
- [ ] Implement projects list + project detail
- [ ] Implement time entry form + list
- [ ] Implement expense form + list
- [ ] Implement invoice list + invoice detail with PDF polling

---

## Section 1: Client Routes

**File:** `apps/api/src/routes/clients.ts`

### What to implement

**`POST /clients`**
Validate the request body using `CreateClientSchema`. If invalid, return 400 with `{ errors: result.error.flatten() }`. If valid, insert a new `Client` row via Prisma and return 201 with the created record. Use `select` to return only the fields you need — never return full objects.

**`GET /clients`**
Read `cursor` and `limit` from the query string (parse and coerce with Zod inline). Fetch clients ordered by `createdAt` descending. Fetch `limit + 1` rows to detect if there's a next page — if you got the extra row, slice it off and set `nextCursor` to the last item's `id`. Return `{ data, nextCursor }`.

**`GET /clients/:id`**
Look up the client by `id`, including their `projects` relation. Return 404 with `{ error: 'Client not found' }` if null.

**`PATCH /clients/:id`**
Validate body with `UpdateClientSchema` (partial). Call `db.client.update`. Wrap in try/catch — Prisma throws a `P2025` error when the record doesn't exist; catch that and return 404.

### Tests to Write

- [ ] `POST /clients` — creates a client and returns 201 with an `id`
- [ ] `POST /clients` — returns 400 when `name` is missing
- [ ] `POST /clients` — returns 400 when `email` is not a valid email
- [ ] `GET /clients` — returns a paginated list with `data` and `nextCursor`
- [ ] `GET /clients` — `nextCursor` is null when results fit on one page
- [ ] `GET /clients/:id` — returns client with `projects` array
- [ ] `GET /clients/:id` — returns 404 for an unknown id
- [ ] `PATCH /clients/:id` — updates only provided fields, leaves others unchanged
- [ ] `PATCH /clients/:id` — returns 404 for an unknown id

---

## Section 2: Project Routes

**File:** `apps/api/src/routes/projects.ts`

### What to implement

**`POST /clients/:clientId/projects`**
First verify the client exists — return 404 if not. Then validate the body with `CreateProjectSchema`. Insert a `Project` row with `clientId` bound to the verified client. Return 201.

**`GET /clients/:clientId/projects`**
Verify client exists. Apply cursor pagination. Accept an optional `status` query param (`ACTIVE`, `COMPLETED`, `ARCHIVED`) and add it to the `where` clause if present.

**`GET /projects/:id`**
Find the project including `timeEntries` and `expenses`. Return 404 if not found. This response is the basis for the project detail page — include all fields the frontend will need to calculate unbilled totals.

**`PATCH /projects/:id`**
Validate body with `UpdateProjectSchema`. Update and return the updated record. Return 404 if not found.

### Tests to Write

- [ ] `POST /clients/:clientId/projects` — creates project and returns 201 with `clientId`
- [ ] `POST /clients/:clientId/projects` — returns 404 for an unknown client
- [ ] `POST /clients/:clientId/projects` — returns 400 when `name` is missing
- [ ] `GET /clients/:clientId/projects` — returns projects for that client only
- [ ] `GET /clients/:clientId/projects` — filters correctly by `status` query param
- [ ] `GET /projects/:id` — returns project with `timeEntries` and `expenses` arrays
- [ ] `GET /projects/:id` — returns 404 for unknown id
- [ ] `PATCH /projects/:id` — updates `name`, `status`, and `hourlyRate` independently
- [ ] `PATCH /projects/:id` — returns 404 for unknown id

---

## Section 3: Time Entry Routes

**File:** `apps/api/src/routes/time-entries.ts`

### What to implement

**`POST /projects/:projectId/time-entries`**
Verify project exists. Validate body with `CreateTimeEntrySchema`. The `date` field comes in as an ISO string — convert it to a `Date` before writing to Prisma. Return 201.

**`GET /projects/:projectId/time-entries`**
Cursor pagination. Accept optional `billable` and `billed` query params as `'true'` / `'false'` strings (Zod coercion from query strings doesn't handle booleans directly — compare the string value). Order by `date` descending. Date-range filtering is out of scope for MVP.

**`DELETE /time-entries/:id`**
Find the entry. If not found return 404. If `billed` is true, return 409 — deleting a billed entry would corrupt the invoice it's attached to. Otherwise delete and return 204.

### Tests to Write

- [ ] `POST` — creates entry and returns 201 with correct `hours`
- [ ] `POST` — returns 400 when `hours` is negative or zero
- [ ] `POST` — returns 400 when `date` is not a valid date string
- [ ] `POST` — returns 404 for an unknown project
- [ ] `GET` — returns entries for that project only
- [ ] `GET` — `billable=false` filter returns only non-billable entries
- [ ] `GET` — `billed=true` filter returns only billed entries
- [ ] `DELETE` — deletes an unbilled entry and returns 204
- [ ] `DELETE` — returns 409 when the entry is already billed
- [ ] `DELETE` — returns 404 for an unknown id

---

## Section 4: Expense Routes

**File:** `apps/api/src/routes/expenses.ts`

### What to implement

Same pattern as time entries. Key differences: the value field is `amount` (not `hours`), and expenses have an optional `category` field. The 409 guard on delete is the same — return 409 if `billed` is true.

### Tests to Write

- [ ] `POST` — creates expense and returns 201 with correct `amount`
- [ ] `POST` — returns 400 when `amount` is negative
- [ ] `POST` — returns 404 for an unknown project
- [ ] `GET` — returns expenses for that project only
- [ ] `GET` — `billable=false` filter works correctly
- [ ] `GET` — `billed=true` filter returns only billed expenses
- [ ] `DELETE` — deletes unbilled expense and returns 204
- [ ] `DELETE` — returns 409 for a billed expense
- [ ] `DELETE` — returns 404 for unknown id

---

## Section 5: Invoice Generation Route

**File:** `apps/api/src/routes/invoices.ts` — `POST /projects/:projectId/invoices`

### What to implement

This is the most complex route. It runs inside `prisma.$transaction()` with `{ isolationLevel: 'Serializable' }` to prevent two concurrent requests from billing the same entries twice.

Inside the transaction:
1. Use a raw `SELECT ... FOR UPDATE` query to lock unbilled billable time entries for the project. Prisma's `findMany` doesn't support `FOR UPDATE` — you need `tx.$queryRaw`. Same for expenses.
2. If both arrays are empty, throw a sentinel error `{ code: 'NOTHING_TO_INVOICE' }` — not a real Error, just a plain object so you can distinguish it in the catch block.
3. If there are time entries and the project has no `hourlyRate`, throw `{ code: 'MISSING_HOURLY_RATE' }`.
4. Calculate `subtotal` = (time entries × hourlyRate) + expense amounts. `total` = subtotal (tax is 0 for MVP).
5. Create the `Invoice` record with a unique `invoiceNumber` (e.g. `INV-${Date.now()}`).
6. Connect gathered entries to the invoice and mark them `billed: true`.
7. Create a `Job` record with `spec: { type: 'invoice-pdf', invoiceId: invoice.id }`.
8. **After** the transaction returns: call `queue.add('invoice-pdf', { jobId: job.id })`. The queue call must be outside the transaction — BullMQ is not Postgres and can't participate in a DB transaction.
9. Return 201 with the invoice + job.

In the catch block, check `err.code` — return 400 for the two sentinel errors, rethrow everything else.

### Tests to Write

- [ ] Generates invoice from unbilled time entries — `subtotal` = hours × hourlyRate
- [ ] Generates invoice from expenses only — no hourlyRate required
- [ ] Generates invoice from a mix of time entries and expenses
- [ ] Returns 400 when there are no unbilled billable entries
- [ ] Returns 400 when time entries exist but the project has no `hourlyRate`
- [ ] Marks gathered time entries as `billed: true` after generation
- [ ] Marks gathered expenses as `billed: true` after generation
- [ ] Non-billable entries are not included in the invoice
- [ ] Enqueues a job after the transaction commits (spy on `queue.add`)
- [ ] Concurrent requests don't double-bill the same entries (run two requests simultaneously)

---

## Section 6: Invoice CRUD + PDF Routes

**File:** `apps/api/src/routes/invoices.ts` — remaining routes

### What to implement

**`GET /invoices`**
Cursor pagination. Optional `status` filter. Include the project's name and client's name in the response — the invoice list page needs these for display.

**`GET /invoices/:id`**
Return the invoice with `timeEntries`, `expenses`, `job`, and the full project + client details. The frontend needs all of this to render the invoice detail page.

**`PATCH /invoices/:id`**
Update `status`, `dueDate`, and/or `notes`. If `dueDate` is provided as a string, convert to `Date`. Return 404 if not found.

**`GET /invoices/:id/pdf`**
Check the invoice's job status. If the job doesn't exist or isn't `COMPLETE`, return 202 with `{ status, message: 'PDF not ready yet' }`. If complete, read the PDF from `job.outputPath` using `fs.readFileSync` and send it with `Content-Type: application/pdf` and `Content-Disposition: attachment`.

### Tests to Write

- [ ] `GET /invoices` — returns paginated list with project and client names
- [ ] `GET /invoices` — `status=SENT` filter returns only sent invoices
- [ ] `GET /invoices/:id` — returns full invoice with line items and job
- [ ] `GET /invoices/:id` — returns 404 for unknown id
- [ ] `PATCH /invoices/:id` — transitions status from DRAFT to SENT
- [ ] `PATCH /invoices/:id` — returns 404 for unknown id
- [ ] `GET /invoices/:id/pdf` — returns 202 while job is QUEUED
- [ ] `GET /invoices/:id/pdf` — returns PDF bytes when job is COMPLETE and file exists
- [ ] `GET /invoices/:id/pdf` — returns 500 when job is COMPLETE but `outputPath` file is missing from disk

---

## Section 7: Job Status Route

**File:** `apps/api/src/routes/jobs.ts`

### What to implement

`GET /jobs/:id` — look up the job by id. Return 404 if not found. Return the job's `id`, `status`, `outputPath`, `error`, `invoiceId`, and timestamps. This endpoint is polled by the frontend every 2 seconds until the job is `COMPLETE` or `FAILED`.

### Tests to Write

- [ ] Returns job with correct `status`
- [ ] Returns all required fields: `id`, `status`, `outputPath`, `error`, `invoiceId`, `createdAt`, `updatedAt`
- [ ] Returns 404 for unknown id

---

## Section 8: Worker — processJob

**File:** `apps/worker/src/processor.ts`

### What to implement

`processJob({ jobId })`:
1. Load the `Job` row from Postgres. If not found, throw — BullMQ will mark the queue item failed.
2. Set `status` to `PROCESSING`.
3. Parse `job.spec` with `JobSpecSchema` from `@studioworks/shared`. If parsing fails, set status to `FAILED` with an error message and return.
4. Switch on `spec.type`:
   - `'invoice-pdf'`: call `await generateInvoicePdf(spec.invoiceId)`, which returns the output file path. Set `job.outputPath` to that path and `status` to `COMPLETE`.
5. Catch any error from the provider: set `job.error` to the message, set `status` to `FAILED`, and rethrow so BullMQ records the failure.

### Tests to Write

- [ ] Sets status to `PROCESSING` at the start, then `COMPLETE` on success
- [ ] Sets status to `FAILED` and records `error` when the provider throws
- [ ] Calls `generateInvoicePdf` with the correct `invoiceId` for an `invoice-pdf` spec
- [ ] Throws on unknown job id

---

## Section 9: Worker — generateInvoicePdf

**File:** `apps/worker/src/providers/invoice-pdf.ts`

### What to implement

`generateInvoicePdf(invoiceId)`:
1. Load the invoice from Postgres with `timeEntries`, `expenses`, and the full `project + client`.
2. Build an HTML string. At minimum it should show: client name and address, invoice number, due date, a table of line items (description, quantity, rate, amount for time entries; description and amount for expenses), subtotal, tax, total.
3. Launch Puppeteer in headless mode. Open the HTML as a data URL (`page.setContent(html)`). Call `page.pdf({ format: 'A4' })` to get a PDF buffer.
4. Ensure `data/invoices/` exists (create if not). Write the buffer to `data/invoices/{invoiceId}.pdf`.
5. Close the browser. Return the file path.

Puppeteer must be installed: `pnpm add puppeteer --filter @studioworks/worker`

### Tests to Write

- [ ] Produces a file at `data/invoices/{invoiceId}.pdf` when called with a valid invoice id
- [ ] The output file is a valid PDF (check magic bytes: first 4 bytes are `%PDF`)
- [ ] The generated HTML contains the client name, invoice number, and at least one line item description (test the HTML string directly before passing to Puppeteer)
- [ ] Throws when the invoice id doesn't exist in the database

---

## Section 10: Frontend — Nav Layout

**File:** `apps/web/src/app/layout.tsx`

### What to implement

Replace the `{/* TODO */}` nav with real links using Next.js `<Link>` from `next/link`. Links: Dashboard (`/`), Clients (`/clients`), Projects (`/projects`), Invoices (`/invoices`). Style is up to you — even unstyled links are fine to start.

### Tests to Write

- [ ] Nav renders links to all four routes (render with jsdom, check `href` attributes)

---

## Section 11: Frontend — Dashboard

**File:** `apps/web/src/app/page.tsx`

### What to implement

Fetch and display summary stats. There is no single `/dashboard` endpoint — derive stats from multiple calls:
- Active projects: fetch all clients (`GET /clients`), then fetch projects per client (`GET /clients/:id/projects?status=ACTIVE`) and sum the counts
- Outstanding invoices: call `GET /invoices?status=DRAFT` and `GET /invoices?status=SENT`, combine totals
- Recent activity: call `GET /invoices` ordered by `createdAt` (default) and show the first page

Display loading state while fetching. Display an error message if any request fails.

### Tests to Write

- [ ] Renders the four stat sections without crashing on empty data
- [ ] Shows loading state before data arrives (mock the API with MSW)
- [ ] Shows data once the API responds

---

## Section 12: Frontend — Clients

**Files:** `clients/page.tsx`, `clients/new/page.tsx`, `clients/[id]/page.tsx`

### What to implement

**Clients list (`/clients`):**
Fetch from `GET /clients`. Render each client as a row/card with their name, email, and a link to their detail page. Add a "New Client" link to `/clients/new`. Implement search by filtering the fetched list client-side (sufficient for MVP).

**New client form (`/clients/new`):**
A controlled form with fields for name (required), email, address, notes. On submit, `POST /clients`. On success, redirect to `/clients`. On error, show the error message.

**Client detail (`/clients/[id]`):**
Fetch from `GET /clients/:id`. Show client info at the top, then a list of their projects with links to `/projects/:id`. Show the project's status badge and hourly rate.

### Tests to Write

- [ ] Clients list renders client names from API response
- [ ] New client form submits to `POST /clients` with the right body
- [ ] New client form shows a validation error when name is blank
- [ ] Client detail shows the client's projects list

---

## Section 13: Frontend — Projects

**Files:** `projects/page.tsx`, `projects/[id]/page.tsx`

### What to implement

**Projects list (`/projects`):**
Fetch all clients (`GET /clients`), then for each client fetch their projects (`GET /clients/:id/projects`). Combine into a single flat list. Implement status filter tabs (All / Active / Completed / Archived) by filtering client-side. There is no `GET /projects` global endpoint in the spec — don't add one.

**Project detail (`/projects/[id]`):**
Fetch from `GET /projects/:id`. Show project name, client, status, hourly rate. Show counts/totals for time entries and expenses. Show unbilled totals (sum of unbilled billable hours × rate + unbilled billable expenses). Add links to `/projects/:id/time` and `/projects/:id/expenses`. "Generate Invoice" button: `POST /projects/:id/invoices` — disable if no unbilled entries exist. On success, redirect to `/invoices/:id`.

### Tests to Write

- [ ] Projects list renders project names
- [ ] Projects list status filter shows only matching projects
- [ ] Project detail shows unbilled total correctly (hours × rate + expenses)
- [ ] Generate Invoice button is disabled when there are no unbilled entries
- [ ] Generate Invoice button calls `POST` and redirects on success

---

## Section 14: Frontend — Time Entries

**File:** `projects/[id]/time/page.tsx`

### What to implement

Form fields: description (text), date (date input), hours (number), billable (checkbox, default checked). On submit: `POST /projects/:id/time-entries`. After successful submission, clear the form and re-fetch the list.

Below the form, show a table of all time entries for this project. Each row shows description, date, hours, billable badge, billed badge. Show a running total of unbilled billable hours. Add a delete button per row that calls `DELETE /time-entries/:id` — disable it (or hide it) if the entry is billed.

### Tests to Write

- [ ] Form submits with correct body to `POST`
- [ ] Form shows validation error when hours is 0 or negative
- [ ] Entry list re-fetches after a successful submission
- [ ] Delete button is disabled for billed entries
- [ ] Delete button calls `DELETE` and removes the entry from the list

---

## Section 15: Frontend — Expenses

**File:** `projects/[id]/expenses/page.tsx`

### What to implement

Same structure as the time entries page. Form fields: description, date, amount (number), category (optional text), billable (checkbox). Table shows description, date, amount, category, billable/billed badges, delete button.

### Tests to Write

- [ ] Form submits with correct body to `POST`
- [ ] Form shows validation error when amount is 0 or negative
- [ ] Delete button is disabled for billed expenses

---

## Section 16: Frontend — Invoices

**Files:** `invoices/page.tsx`, `invoices/[id]/page.tsx`

### What to implement

**Invoice list (`/invoices`):**
Fetch from `GET /invoices`. Show status filter tabs. Each invoice row shows invoice number, client name, project name, total, status badge, created date. Click to go to detail.

**Invoice detail (`/invoices/[id]`):**
Fetch from `GET /invoices/:id`. Display:
- Header: invoice number, status badge, due date
- Client info block: name, email, address
- Line items table: time entries (description, date, hours, rate, amount) + expenses (description, date, amount, category)
- Totals: subtotal, tax (0 for MVP), total
- PDF section: if `job.status` is `QUEUED` or `PROCESSING`, show a "Generating PDF…" spinner and poll `GET /jobs/:jobId` every 2 seconds. When `COMPLETE`, stop polling and show a download link to `GET /invoices/:id/pdf`. When `FAILED`, show the error message.
- Status actions: if status is `DRAFT`, show a "Mark as Sent" button (`PATCH` with `{ status: 'SENT' }`). If `SENT`, show "Mark as Paid".

### Tests to Write

- [ ] Invoice list renders invoice numbers and status badges
- [ ] Invoice list status filter shows only matching invoices
- [ ] Invoice detail renders all line items
- [ ] PDF section shows spinner while job is QUEUED/PROCESSING
- [ ] PDF section shows download link when job is COMPLETE
- [ ] PDF section shows error when job is FAILED
- [ ] Polling stops after job reaches a terminal state (COMPLETE or FAILED)
- [ ] "Mark as Sent" button calls PATCH with correct body
