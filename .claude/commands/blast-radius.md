# Blast Radius

Trace what depends on a function or file before you change it.

## Step 1 — Read skills

Read `.claude/skills/codebase-memory-tracing/SKILL.md` and `.claude/skills/codebase-memory-exploring/SKILL.md` in full.

## Step 2 — Get target

Ask the user: what function or file are you about to change?

If a file is given, find its exported functions first:
```
search_graph(label="Function", qn_pattern=".*<filename>.*")
```

## Step 3 — Check index status

```
list_projects
```

If not indexed, run `index_repository(repo_path=".")` and wait.

## Step 4 — Discover exact function name

`trace_call_path` requires an exact match. Search first:

```
search_graph(name_pattern=".*<FunctionName>.*", label="Function")
```

Use the qualified name from the result.

## Step 5 — Trace callers

```
trace_call_path(function_name="<ExactName>", direction="inbound", depth=3)
```

This returns all callers up to 3 hops deep — routes, handlers, services, and tests that depend on the target.

## Step 6 — Assess impact

For each caller chain found:
- Identify which **app** is affected (`apps/api`, `apps/web`, `apps/worker`)
- Identify which **routes** are in the chain (check `search_graph(label="Route")`)
- Flag any **test files** that will need updating
- Flag any **`packages/`** exports that surface this function publicly

## Step 7 — Output report

```
## Blast Radius — <FunctionName>

Direct callers: <n>
Total affected (3 hops): <n>

### Affected Apps
- apps/api — <n> call chains
- apps/web — <n> call chains
- apps/worker — <n> call chains

### Affected Routes
| Route | Handler chain |
|---|---|
| GET /payments | paymentsHandler > processPayment > <target> |

### Tests to update
| File | Reason |
|---|---|
| <path> | Directly tests <target> |

### Risk level
LOW / MEDIUM / HIGH — based on number of callers and whether public package API is affected
```

## Notes

- depth=3 covers most real-world chains; increase to 5 for deeply nested utilities
- If the function is in `packages/`, treat blast radius as HIGH by default — all consumers are affected
- Run this before any refactor or signature change
