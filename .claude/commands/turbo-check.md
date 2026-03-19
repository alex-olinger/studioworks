# Turbo Check

Validate turbo.json pipeline dependencies. Catches circular task deps, missing pipeline entries, and misconfigured outputs/inputs.

## Step 1 — Read skills

Read `.claude/skills/codebase-memory-exploring/SKILL.md` in full. Use graph queries to find all modules and their scripts rather than grepping every package.json:

```
search_graph(label="Module")
```

This surfaces all workspace packages quickly. Fall back to filesystem reads if not indexed.

## Step 2 — Read turbo.json

```bash
cat turbo.json
```

Also read each app and package's package.json scripts:
```bash
find . -name "package.json" -not -path "*/node_modules/*" -not -path "*/.next/*" \
  | xargs grep -l '"scripts"'
```

## Step 3 — Build the task graph

For every task defined in `turbo.json`:
- List its `dependsOn` entries
- List which workspaces define that script
- Note `inputs` and `outputs` if declared

## Step 4 — Check for circular dependencies

Trace each `dependsOn` chain. Flag if any task eventually depends on itself:

```
Task A -> dependsOn Task B -> dependsOn Task A  ← CIRCULAR
```

## Step 5 — Check for missing pipeline entries

For every script in every workspace `package.json`, check if it's declared in `turbo.json`. Tasks run outside the pipeline won't benefit from caching or parallelism.

Flag scripts that are:
- In multiple workspaces but absent from `turbo.json`
- Named like pipeline tasks (`build`, `test`, `typecheck`, `lint`) but not declared

## Step 6 — Check outputs and inputs

For each pipeline task:
- `build` should declare `outputs` (e.g. `["dist/**", ".next/**"]`) — without this, caching is disabled
- `test` should declare `inputs` if it only needs source files — reduces unnecessary reruns
- Tasks with no `cache: false` and no `outputs` are silently not cached — flag them

## Step 7 — Check workspace dependencies

```bash
cat turbo.json | grep -A5 "\"build\""
```

Ensure `^build` is in `dependsOn` for tasks that require upstream packages to be built first.

## Step 8 — Output report

```
## Turbo Check

### Circular Dependencies
<none found | list of circular chains>

### Missing Pipeline Entries
| Script | Workspaces | Action |
|---|---|---|
| typecheck | apps/api, apps/web | Add to turbo.json pipeline |

### Missing outputs (caching disabled)
| Task | Action |
|---|---|
| build:worker | Add outputs: ["dist/**"] |

### Missing ^build in dependsOn
| Task | Affected workspace | Action |
|---|---|---|
| test | apps/api | Add "dependsOn": ["^build"] |

### Summary
Circular deps: <n> | Missing entries: <n> | Caching gaps: <n>
```

## Notes

- `^taskName` means "run this task in all dependencies first"
- `taskName` (no caret) means "run this task in the same workspace first"
- Always set `cache: false` on tasks that have side effects (deploys, DB migrations)
- Run `turbo run build --dry-run` to verify the pipeline resolves correctly after changes
