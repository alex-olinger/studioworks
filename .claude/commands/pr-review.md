# PR Agent Review

You are an orchestrator coordinating 8 specialized engineering agents to review the current PR diff.

## Step 1 — Get the diff

Run:
```bash
git diff origin/main...HEAD
```

Also run:
```bash
git diff origin/main...HEAD --name-only
```

Use the file list to determine which agents to trigger (see trigger matrix below).

---

## Step 2 — Trigger matrix

Based on changed files, activate only the relevant agents:

| Agent | Trigger condition |
|---|---|
| Security | Any `.ts` `.js` `.tsx` `.jsx`, any file with `auth`, `middleware`, `session` in path |
| Architecture | Files in `apps/`, `packages/`, `turbo.json`, any `tsconfig*.json` |
| UX | Files in `apps/web/`, any `.tsx`, `.css`, `components/` |
| Testing | Any `.test.` or `.spec.` file, `vitest.config`, `jest.config` |
| Docs | Any `.md`, `CHANGELOG`, `openapi`, `swagger` |
| DevOps | Files in `.github/`, `Dockerfile`, `docker-compose`, `k8s/`, `helm/`, `.env.example` |
| Code Review | Any `.ts` `.js` `.tsx` `.jsx` |
| Simplification | Any `.ts` `.js` `.tsx` `.jsx` |

---

## Step 3 — Load skills for triggered agents

Before running agents, read the following skill files if the corresponding agent is triggered. These define StudioWorks-specific conventions that agents must enforce — not just general best practices.

**Global — read before running any agent:**
Read `.claude/skills/codebase-memory-exploring/SKILL.md` first. Use graph queries (`search_graph`, `list_projects`) for all codebase lookups — routes, functions, exports, file structure. Only fall back to grep if the repo is not indexed.

| Agent triggered | Read this skill file first | Condition |
|---|---|---|
| Code Review | `.claude/skills/fastify-conventions/SKILL.md` | Always |
| Architecture | `.claude/skills/fastify-conventions/SKILL.md` | Always |
| Architecture | `.claude/skills/codebase-memory-tracing/SKILL.md` | Only if `packages/` files changed |
| DevOps | `.claude/skills/dockerfile-templates/SKILL.md` | Always |
| DevOps | `.claude/skills/k8s-manifest-templates/SKILL.md` | Always |
| Simplification | `.claude/skills/codebase-memory-quality/SKILL.md` | Always |
| Testing | `.claude/skills/webapp-testing/SKILL.md` | Only if `apps/web/` files changed |

Read each file in full before running the relevant agent. Findings must reference these conventions by name where applicable.

---

## Step 4 — Run each triggered agent

For each triggered agent, analyze the relevant diff through that agent's lens. Work through them sequentially.

---

### Security Agent
**Scope:** injection vectors, hardcoded secrets, broken auth, insecure deps, OWASP Top 10

For each finding:
- **Severity:** CRITICAL / HIGH / MEDIUM / LOW / INFO
- **File + line**
- **Issue:** what it is
- **Fix:** how to resolve it

If none: "No security issues found."

---

### Architecture Agent
**Scope:** layer boundary violations, coupling, scalability bottlenecks, pattern misuse (God objects, circular deps), alignment with monorepo structure

**Conventions to enforce (from fastify-conventions):**
- Service layer separation must be maintained — handlers must not touch DB directly
- Route plugins must not import from other route plugins — only from `services/` and `packages/`
- Circular dependencies between packages are a hard violation
- Changes to `packages/` have blast radius implications — flag them explicitly

**If `packages/` files changed (from codebase-memory-tracing):**
- Use `trace_call_path` on changed functions to determine how many callers are affected
- Report blast radius: how many services/routes depend on the changed code
- Flag any changes that affect high fan-in functions (many callers)

For each finding:
- **Severity:** HIGH / MEDIUM / LOW
- **File + area**
- **Issue:** what the structural problem is
- **Fix:** recommended refactor or ADR if needed

If none: "No architecture issues found."

---

### UX Agent
**Scope:** WCAG 2.2 AA violations, missing ARIA labels, focus order, contrast, empty/loading/error states, mobile edge cases

For each finding:
- **Severity:** HIGH / MEDIUM / LOW
- **File + component**
- **Issue:** violation and WCAG criterion if applicable
- **Fix:** specific code change

If none: "No UX issues found."

---

### Testing Agent
**Scope:** missing coverage for changed code paths, untested error branches, flaky patterns, missing edge cases

**If `apps/web/` files changed (from webapp-testing):**
- Reference Playwright patterns when suggesting missing frontend tests
- Note which UI interactions or flows lack test coverage based on the diff

For each finding:
- **Severity:** HIGH / MEDIUM / LOW
- **File**
- **Issue:** what's untested
- **Fix:** suggested test stub or description; use Playwright syntax for frontend tests

If none: "Test coverage looks sufficient."

---

### Docs Agent
**Scope:** public API changes without updated docs, missing JSDoc on exported functions, CHANGELOG not updated, OpenAPI spec drift

For each finding:
- **Severity:** HIGH / MEDIUM / LOW
- **File**
- **Issue:** what's missing or stale
- **Fix:** what needs to be written or updated

If none: "Docs are up to date."

---

### DevOps Agent
**Scope:** Dockerfile best practices, k8s manifest issues, CI workflow problems, exposed secrets in config

**Conventions to enforce (from dockerfile-templates):**
- Multi-stage build required: `builder` compiles, `runner` is the final lean image
- Final stage must run as non-root `node` user
- Base images must be pinned — no `:latest` tags
- Health check must be built into the Dockerfile
- No secrets in layers — runtime env vars only
- `.dockerignore` must exist and exclude: `node_modules`, `.git`, `.env`, `dist`, `.next`, `coverage`, `.turbo`
- Docker Compose: services depending on Postgres/Redis must use `condition: service_healthy`

**Conventions to enforce (from k8s-manifest-templates):**
- Resource limits and requests required on all containers
- Liveness and readiness probes required
- Never use `default` namespace — dedicated namespace per environment
- Non-sensitive config in ConfigMap; sensitive values in Secret
- Labels must include `app.kubernetes.io/name`, `app.kubernetes.io/component`, `app.kubernetes.io/part-of`

For each finding:
- **Severity:** HIGH / MEDIUM / LOW
- **File**
- **Issue:** what the infra/config problem is, and which convention it violates
- **Fix:** corrected config or recommendation

If none: "No DevOps issues found."

---

### Code Review Agent
**Scope:** naming clarity, dead code, error handling gaps, type safety issues, consistency with existing patterns

**Conventions to enforce (from fastify-conventions):**
- Routes must be registered as Fastify plugins — never inline on root instance
- Handlers must be thin — no business logic, only validate + call service + return
- All business logic and DB access lives in the service layer
- Every route must define a request/reply schema using TypeBox or JSON Schema
- All error responses must use `{ error: string, code: string }` shape with SCREAMING_SNAKE_CASE codes
- Auth must use `preHandler` hook — never inline auth in a handler
- File structure: `routes/<domain>/index.ts`, `<domain>.schema.ts`, `<domain>.handler.ts`, `services/<domain>.service.ts`

For each finding:
- **Severity:** MEDIUM / LOW / SUGGESTION
- **File + line**
- **Issue:** what the quality problem is, and which convention it violates
- **Fix:** suggested improvement with convention reference

If none: "Code quality looks good."

---

### Simplification Agent
**Scope:** over-engineering, speculative abstraction, unnecessary indirection, flat-before-layered violations

**From codebase-memory-quality:**
- Run `search_graph(label="Function", relationship="CALLS", direction="inbound", max_degree=0, exclude_entry_points=true)` to find dead code introduced or newly exposed by this PR
- Flag functions with unusually high fan-out (many outbound calls) as complexity hotspots

For each finding:
- **Severity:** MEDIUM / LOW / SUGGESTION
- **File**
- **Issue:** what's unnecessarily complex or dead
- **Fix:** simpler approach or removal recommendation

If none: "No simplification opportunities found."

---

## Step 5 — Output the merged report

```
## PR Agent Review
Branch: <branch name>  |  Files changed: <n>  |  Agents triggered: <n>

| Agent | Findings |
|---|---|
| Security | <n issues or Clean> |
| Architecture | <n issues or Clean> |
| UX | <n issues or Clean> |
| Testing | <n issues or Clean> |
| Docs | <n issues or Clean> |
| DevOps | <n issues or Clean> |
| Code Review | <n issues or Clean> |
| Simplification | <n issues or Clean> |

---

[Full findings per triggered agent, CRITICAL and HIGH first, skipping agents with no issues]
```

Agents not triggered by this diff appear in the summary table as "Not triggered" and are omitted from the findings section.

---

## Notes

- Never fail or block — this is informational only
- If the diff is very large (50+ files), note it and focus on highest-risk files
- Do not repeat findings across agents — if Security catches an issue, Code Review should not re-flag it
- codebase-memory graph tools require the repo to be indexed — run `index_status` before any graph query; if not found, skip graph-based checks, fall back to grep, and note it in the report
- Prefer graph queries over grep for all codebase searches — faster, lower context cost, more precise
