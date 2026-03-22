# Dead Code Audit

Find unused functions across the StudioWorks monorepo using the codebase knowledge graph.

## Step 1 — Read skills

Read the following skills in full:
- `.claude/skills/codebase-memory-quality/SKILL.md`
- `.claude/skills/codebase-memory-exploring/SKILL.md`
- `.claude/skills/codebase-memory-reference/SKILL.md` — consult for advanced query syntax if standard queries return unexpected results

## Step 2 — Check index status

```
list_projects
```

If StudioWorks is not indexed:
```
index_repository(repo_path=".")
```

Wait for indexing to complete before proceeding.

## Step 3 — Find dead code candidates

```
search_graph(
  label="Function",
  relationship="CALLS",
  direction="inbound",
  max_degree=0,
  exclude_entry_points=true
)
```

`exclude_entry_points=true` removes route handlers, `main()`, and framework-registered functions that have zero callers by design.

## Step 4 — Verify each candidate

For each result, confirm it truly has no callers:

```
trace_call_path(function_name="<FunctionName>", direction="inbound", depth=1)
```

Discard any that have callers surfaced by the deeper trace.

## Step 5 — Find high fan-out hotspots

Find functions with unusually many outbound calls (complexity hotspots):

```
search_graph(
  label="Function",
  relationship="CALLS",
  direction="outbound",
  min_degree=10
)
```

These aren't dead code but are refactor candidates — too many responsibilities.

## Step 6 — Output report

```
## Dead Code Audit

### Confirmed Dead Functions
| Function | File | Recommendation |
|---|---|---|
| <name> | <path> | Safe to delete / Needs verification |

### High Fan-out Hotspots (refactor candidates)
| Function | Outbound calls | File |
|---|---|---|
| <name> | <n> | <path> |

### Summary
Dead functions found: <n>
Hotspots found: <n>
Estimated lines removable: <n>
```

## Notes

- Always verify before deleting — some functions may be called dynamically or via string references
- Check for usage in test files before removing
- High fan-out functions should be split, not deleted
