# Conventions

## TypeScript
- Strict mode enabled project-wide — never weaken `tsconfig.json`
- All inter-service data shapes defined in `@studioworks/shared`, not inline within a service
- Avoid `any` — prefer `unknown` with runtime Zod parsing at service boundaries

## Schema & Validation

### RenderSpec

The canonical cross-service contract. Defined in `packages/shared/render-spec.ts` — never duplicated, always imported from `@studioworks/shared`.

**Shape:**
```ts
{
  projectId: string,           // opaque string in MVP — no FK enforcement until Part 3
  scenes: [                    // min 1
    {
      id: string,
      shots: [                 // min 1
        {
          id: string,
          prompt: string,      // min length 1
          durationSeconds: number  // must be positive
        }
      ]
    }
  ]
}
```

**Construction:** `apps/web` builds the `RenderSpec` from form input and validates it client-side using `RenderSpecSchema.safeParse()` before submission. This catches shape errors early without a round-trip.

**Ingestion:** `apps/api` re-validates the incoming body with `RenderSpecSchema.parse()` on `POST /render-jobs`. Never trust the client — always parse server-side. On failure, return a structured 400.

**Storage:** The validated spec is written into the `RenderJob.spec` JSON column as-is and never modified. The worker reads it back out by `renderJobId` — it never receives the spec directly over the queue.

**Immutability rule:** Once a `RenderJob` is written, its embedded spec is frozen. To change a spec, create a new `RenderJob`. This is a hard architectural constraint, not a preference.

**Adding fields:** Update the Zod schema in `packages/shared/render-spec.ts` first, then rebuild (`pnpm build --filter @studioworks/shared`), then update consumers. See the checklist in `workflow.md`.

### Zod vs Prisma

These are two different tools at two different layers — never conflate them.

**Zod** — validates untrusted input at trust boundaries. HTTP is the most common case, but the rule is broader: use Zod for any data that crosses a trust boundary — HTTP body/params/query, webhook payloads, S3 event payloads, environment variables, and uploaded file contents. Do not use Zod for Prisma results, intra-monorepo data, or constants defined in your own code.

**Prisma** — talks to Postgres. Generates TypeScript types from `prisma/schema.prisma`. Handles migrations. Has no knowledge of HTTP.

They meet in the route handler:

```ts
const result = RenderSpecSchema.parse(request.body)  // Zod: validate untrusted input
const job = await db.renderJob.create({ data: { spec: result.data } })  // Prisma: write to DB
```

**Rule:** Never use Zod to validate Prisma query results. Data returned from Prisma is trusted internal infrastructure — it has already been written through a validated path and typed by the generated client.

### General validation rules
- All API endpoints must validate request bodies and params with Zod — never skip
- Zod errors surface as structured 400 responses, not unhandled exceptions

## Fastify API Routes (`apps/api`)
- Define request/response types in `@studioworks/shared` if shared across services
- Validate all request bodies and params with Zod
- Return structured error responses — never raw exceptions or stack traces
- Auth checked at route level before any DB access

## Worker / Queue
- Provider adapters are isolated modules in `apps/worker/src/providers/`
- Swapping or adding a provider must not require changes to queue logic or `apps/api`/`apps/web`
- Every job handler: try/catch, log job ID at start and end, throw on failure (BullMQ handles retries)
- Use `job.updateProgress()` for long-running jobs

## Database
- All schema changes go through Prisma migrations — no raw DDL
- Never import `@prisma/client` directly in `apps/` — always through `@studioworks/db`
- `RenderJob` records are append-only — never mutate a persisted spec
- Always use `select` in Prisma queries — never return full objects unless every field is needed
- Cursor-based pagination only — no OFFSET
- Multi-step writes: `prisma.$transaction([])`

## S3 File Storage
- Generate presigned PUT URLs server-side — upload client-side directly to S3
- Never stream file uploads through `apps/api` or `apps/web`
- Validate file type and size with Zod before issuing presigned URL
- Store only the S3 key in the DB, never the full URL
- Key pattern: `{entity}/{userId}/{uuid}.{ext}`

## Testing
- Test runner: **Vitest** with root workspace config (`vitest.workspace.ts`) covering all packages and apps
- Integration tests (`apps/api`, `apps/worker`, `packages/db`): Testcontainers for real Postgres/Redis per suite
- Apply migrations in tests with `pnpm --filter @studioworks/db db:migrate:deploy` (non-interactive — not `db:migrate`)
- Web tests (`apps/web`): jsdom + MSW for API mocking — no direct DB or Redis access
- DB access in tests: `@studioworks/db` — never `@prisma/client`
- `afterEach` teardown deletes rows in FK-safe order to keep tests independent

## Commits & PRs
- Scope changes to a single service or package where possible
- Changes to `@studioworks/shared` or `@studioworks/db` must be called out explicitly in the PR description

## Branch Naming
- Pattern: `type/short-description` (kebab-case, no spaces)
- Type must be one of: `feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `ci`, `style`, `perf`, `build`, `revert`
- These match the conventional commit types enforced by `.github/workflows/pr-checks.yml`
- Examples: `feat/render-job-polling`, `fix/queue-name-typo`, `docs/zod-vs-prisma`, `ci/add-pr-checks`
