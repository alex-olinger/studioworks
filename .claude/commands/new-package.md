# New Shared Package

Scaffold a new shared package in `packages/` following StudioWorks monorepo conventions.

## Step 1 — Read skills

Read `.claude/skills/codebase-memory-exploring/SKILL.md` and `.claude/skills/claude-docs-structure/SKILL.md` in full before proceeding.

## Step 1b — Gather input

Ask the user for the following if not already provided:

1. **Package name** — e.g. `types`, `utils`, `validators`, `config`
2. **Purpose** — one sentence description of what this package exports
3. **Consumers** — which apps will import it (e.g. `api`, `web`, `worker`)

## Step 2 — Check for conflicts

```bash
ls packages/
```

Also run:
```
search_graph(label="Module", name_pattern=".*<package-name>.*")
```

Warn if a similar package already exists.

## Step 3 — Scaffold files

### `packages/<name>/package.json`
```json
{
  "name": "@repo/<name>",
  "version": "0.0.1",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "typecheck": "tsc --noEmit"
  }
}
```

### `packages/<name>/tsconfig.json`
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist"
  },
  "include": ["src"]
}
```

### `packages/<name>/src/index.ts`
- Barrel file exporting everything from the package
- Add a comment describing the package purpose

### `turbo.json` update
Check if `typecheck` is already in the pipeline. If not, show the user what to add.

## Step 4 — Show consumer wiring

For each consuming app, show the import to add in their `package.json`:

```json
"dependencies": {
  "@repo/<name>": "*"
}
```

And example import usage:
```typescript
import { SomeThing } from '@repo/<name>'
```

## Step 5 — Update claude-docs

Check if `claude-docs/ARCHITECTURE.md` exists. If so, add a one-line entry for the new package:
- What it exports
- Which apps consume it

This keeps the deep reference layer current without requiring a full doc rewrite.

## Step 6 — Output summary

```
✅ Scaffolded @repo/<name>

Files created:
  packages/<name>/package.json
  packages/<name>/tsconfig.json
  packages/<name>/src/index.ts

Add as dependency in:
  <list of consumer apps>

turbo.json: <updated / already correct>
```
