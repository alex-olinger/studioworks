# Plan: Real-Time Render Job Status Polling

## Context

The render pipeline UI pages (`render/page.tsx`, `render/[id]/page.tsx`) are empty stubs. The API has only `POST /render-jobs` — no GET endpoints exist, so the frontend has no way to fetch job status after submission. This plan adds GET endpoints, a client-side polling hook, and wires up both render pages to show live job status.

## Agent Assignment

```
Task type : api, frontend
Phase     : impl

Agents involved:
- [Frontend Developer] — polling hook, render pages
- [Backend Architect]   — GET endpoints, Zod validation
- [Code Reviewer]       — final review pass

Agents not applicable: infra, ml, security, data-pipeline
```

---

## Implementation Steps

### 1. [Backend Architect] Add shared response types — `packages/shared/src/render-job.ts` (new)

Define Zod schemas + inferred types:
- `RenderJobStatusSchema` — z.enum matching Prisma enum (`QUEUED`, `RUNNING`, `UPLOADING`, `COMPLETE`, `FAILED`)
- `RenderJobSummarySchema` — `{ id, status, createdAt: string, updatedAt: string }`
- `RenderJobDetailSchema` — extends summary with `spec`, `outputAssets`
- `RenderJobListResponseSchema` — `{ jobs: RenderJobSummary[], nextCursor: string | null }`

Export from `packages/shared/src/index.ts`, then `pnpm build --filter @studioworks/shared`.

### 2. [Backend Architect] Register CORS — `apps/api/src/app.ts`

`@fastify/cors` is installed but not registered. Add `app.register(cors)` so the web app on :3000 can fetch from :4000.

### 3. [Backend Architect] Add GET endpoints — `apps/api/src/app.ts`

**`GET /render-jobs`** — list with cursor pagination
- Query params: `status?`, `cursor?`, `limit?` (default 20, max 100) — validated with Zod
- Prisma: `findMany` with `select`, `orderBy: { createdAt: 'desc' }`, cursor-based pagination
- Returns `{ jobs, nextCursor }`

**`GET /render-jobs/:id`** — single job detail
- Params: `id` validated as UUID
- Prisma: `findUnique` with `select`
- 404 if not found

### 4. [Backend Architect] Add GET endpoint tests — `apps/api/src/routes/render-jobs.test.ts`

Follow existing supertest + `buildApp()` pattern:
- List returns `{ jobs: [], nextCursor: null }` when empty
- List filters by status
- List returns 400 for invalid status
- Detail returns job for valid ID
- Detail returns 404 for non-existent ID
- Detail returns 400 for non-UUID ID

### 5. [Frontend Developer] Create polling hook — `apps/web/src/hooks/use-polling.ts` (new)

~30-line custom hook using `useState` + `useEffect` + `setInterval`:
```ts
usePolling<T>(url: string, intervalMs: number, enabled: boolean)
  → { data: T | null, error: string | null, loading: boolean }
```
- Fetches on mount + every interval tick
- Clears interval when `enabled` is false or on unmount
- API base URL from `NEXT_PUBLIC_API_URL` env var (default `http://localhost:4000`)

### 6. [Frontend Developer] Wire up render list page — `apps/web/src/app/render/page.tsx`

Replace stub. `'use client'` component:
- Poll `GET /render-jobs` every 5s
- Render job rows: ID (link to `/render/[id]`), status (color-coded text), created time
- Status filter dropdown (`<select>`)
- "Load more" button using `nextCursor`
- Inline styles (no Tailwind/CSS infra exists yet)

### 7. [Frontend Developer] Wire up render detail page — `apps/web/src/app/render/[id]/page.tsx`

Replace stub. `'use client'` component:
- Poll `GET /render-jobs/:id` every 3s
- Stop polling on terminal state (`COMPLETE` or `FAILED`)
- Display: status badge, spec summary (project ID, scene/shot counts), output assets, timestamps
- "Back to jobs" link

### 8. [UNASSIGNED] Add env var — `.env.example`

Add `NEXT_PUBLIC_API_URL=http://localhost:4000`.

---

## Files Changed

| File | Action |
|---|---|
| `packages/shared/src/render-job.ts` | Create |
| `packages/shared/src/index.ts` | Modify (add export) |
| `apps/api/src/app.ts` | Modify (register CORS, add 2 GET routes) |
| `apps/api/src/routes/render-jobs.test.ts` | Modify (add GET tests) |
| `apps/web/src/hooks/use-polling.ts` | Create |
| `apps/web/src/app/render/page.tsx` | Replace stub |
| `apps/web/src/app/render/[id]/page.tsx` | Replace stub |
| `.env.example` | Modify |

**New dependencies:** None
**New env vars:** `NEXT_PUBLIC_API_URL`

---

## Verification

1. `pnpm build --filter @studioworks/shared` — types compile
2. `pnpm test --filter @studioworks/api` — GET endpoint tests pass
3. `pnpm infra:up && pnpm dev` — start full stack locally
4. `POST /render-jobs` with valid spec → job created
5. Open `http://localhost:3000/render` → job list loads, status visible
6. Click a job → detail page shows status, polls every 3s
7. Worker picks up job → status transitions visible in UI without page refresh
8. Job reaches COMPLETE/FAILED → polling stops (verify via network tab)
