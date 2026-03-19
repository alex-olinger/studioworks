# Env Audit

Diff `.env.example` against what's actually used in code. Flags missing, undocumented, or stale vars.

## Step 1 — Read .env.example

```bash
cat .env.example
```

Also check for per-app env files:
```bash
find . -name ".env.example" -not -path "*/node_modules/*"
```

## Step 1b — Read skills

Read `.claude/skills/codebase-memory-exploring/SKILL.md` in full. Use graph queries for file and module discovery; use grep for env var string searches (env vars are string references, not structural graph nodes).

## Step 2 — Find all env var references in code

Use graph to discover which files to search:
```
search_graph(label="Module")
```

Then grep only within those files for env var references:
```bash
grep -rn "process.env\." --include="*.ts" --include="*.js" apps/ packages/ \
  | grep -v node_modules \
  | grep -v ".test." \
  | grep -v ".spec."
```

Extract the variable names from the output.

## Step 3 — Compare

Build two lists:

**Documented** — vars present in `.env.example`
**Used in code** — vars referenced via `process.env.*`

Then find:
- **Missing from .env.example** — used in code but not documented
- **Stale in .env.example** — documented but never referenced in code
- **No default / no comment** — documented but with no example value or explanation

## Step 4 — Check for hardcoded secrets

```bash
grep -rn "process.env\." --include="*.ts" apps/ packages/ \
  | grep -v node_modules \
  | grep -i "key\|secret\|password\|token\|auth"
```

Flag any that are accessed without a fallback or validation.

## Step 5 — Output report

```
## Env Audit

### Missing from .env.example (used in code, not documented)
| Variable | Used in | Action |
|---|---|---|
| DATABASE_URL | apps/api/src/db/index.ts | Add to .env.example |

### Stale in .env.example (documented, not used)
| Variable | Last seen | Action |
|---|---|---|
| OLD_API_KEY | Never | Remove from .env.example |

### Missing example values or comments
| Variable | Current entry | Action |
|---|---|---|
| STRIPE_SECRET_KEY | STRIPE_SECRET_KEY= | Add example value + comment |

### Summary
Missing: <n> | Stale: <n> | No docs: <n>
```

## Notes

- Never add real secret values to `.env.example` — use placeholder format like `sk_test_...`
- Add a one-line comment above each secret var explaining what it's for and where to get it
- If a var is required and missing, the app should throw on startup — check for startup validation
