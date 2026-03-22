# New Fastify Route

Scaffold a complete Fastify route following StudioWorks conventions.

## Step 1 — Read conventions

Read the following skills in full before writing any code:
- `.claude/skills/fastify-conventions/SKILL.md`
- `.claude/skills/codebase-memory-exploring/SKILL.md`
- `.claude/skills/claude-docs-structure/SKILL.md`

## Step 2 — Gather input

Ask the user for the following if not already provided:

1. **Domain name** — e.g. `payments`, `projects`, `users`
2. **Routes to scaffold** — list of method + path + description, e.g:
   - `GET /` — list all
   - `GET /:id` — get one
   - `POST /` — create
   - `PATCH /:id` — update
   - `DELETE /:id` — delete
3. **Auth required?** — yes / no / per-route
4. **App target** — which app under `apps/` (default: `api`)

## Step 3 — Check for existing domain

Use graph tools to check if this domain already exists before creating files:

```
search_graph(label="Route", qn_pattern=".*<domain>.*")
search_graph(label="Function", name_pattern=".*<Domain>.*")
```

If files already exist, warn the user before proceeding.

## Step 4 — Scaffold files

Generate all four files. Follow fastify-conventions exactly.

### `apps/<app>/src/routes/<domain>/index.ts`
- Fastify plugin registration
- Import and register each handler with its schema
- Apply `requireAuth` preHandler to protected routes

### `apps/<app>/src/routes/<domain>/<domain>.schema.ts`
- TypeBox schemas for every route's request and reply
- Include 400/404/409 error responses using `errorResponseSchema`
- Export each schema individually
- Use `Type.String({ format: 'uuid' })` for all ID params

### `apps/<app>/src/routes/<domain>/<domain>.handler.ts`
- Thin handlers only — validate input, call service, return result
- No business logic
- Catch domain-specific errors and map to correct HTTP status + error shape
- Re-throw unexpected errors

### `apps/<app>/src/services/<domain>.service.ts`
- All business logic and DB access here
- Parameterized queries only — no string interpolation
- Export typed domain error classes (e.g. `<Domain>NotFoundError`, `<Domain>AlreadyExistsError`)

## Step 5 — Show registration line

Print the line to add in `apps/<app>/src/app.ts`:

```typescript
fastify.register(import('./routes/<domain>'), { prefix: '/<domain>' })
```

## Step 6 — Update claude-docs

Check if `claude-docs/ARCHITECTURE.md` exists. If so, add a one-line entry for the new route domain under the API routes section.

## Step 7 — Output summary

```
✅ Scaffolded <domain> route

Files created:
  apps/<app>/src/routes/<domain>/index.ts
  apps/<app>/src/routes/<domain>/<domain>.schema.ts
  apps/<app>/src/routes/<domain>/<domain>.handler.ts
  apps/<app>/src/services/<domain>.service.ts

Register in app.ts:
  fastify.register(import('./routes/<domain>'), { prefix: '/<domain>' })

Routes:
  <METHOD> /<domain><path> — <description> [auth: yes/no]
```

## Notes

- Never put DB access in a handler
- Never put business logic in a route plugin
- All error codes must be SCREAMING_SNAKE_CASE
- If auth is required, import `requireAuth` from `../../hooks/auth.hook`
