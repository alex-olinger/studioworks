---
name: claude-docs-structure
description: Defines the standard claude-docs/ folder structure and document templates for Node.js/TypeScript monorepos. Use when initializing claude-docs/ for the first time, adding a new doc file, or auditing whether docs are complete. Pairs directly with node-monorepo-docs-updater. Templates are in templates/ directory.
---

# claude-docs Structure

Standard folder structure and document templates for the `claude-docs/` directory in a Node.js/TypeScript monorepo.

## Purpose

`claude-docs/` is the deep reference layer beneath `CLAUDE.md`. While `CLAUDE.md` is the quick-reference shared brain (stack, commands, conventions, agents), `claude-docs/` contains domain-specific documentation that agents and sessions load on demand.

## Standard Structure

```
claude-docs/
├── ARCHITECTURE.md   — system design, data flow, service boundaries
├── DATABASE.md       — schema overview, migration strategy, indexing conventions
├── WORKERS.md        — queue topology, job types, retry and DLQ strategy
├── API.md            — route inventory, auth model, error handling conventions
├── INFRA.md          — Docker setup, Compose services, K8s overview
└── AGENTS.md         — inventory of all .claude/agents/ with usage notes
```

## When to Create Each File

| File | Create when... |
|---|---|
| `ARCHITECTURE.md` | The project has more than one app or service |
| `DATABASE.md` | There are migrations or a defined schema |
| `WORKERS.md` | BullMQ workers or any background job system exists |
| `API.md` | There are more than 5 routes |
| `INFRA.md` | Docker Compose or Kubernetes config exists |
| `AGENTS.md` | `.claude/agents/` has any files |

## Templates

Full starter templates for each file are in `templates/`. Copy and fill in from the codebase.

## Usage with node-monorepo-docs-updater

When `node-monorepo-docs-updater` runs, it:
1. Reads this skill to know what files should exist
2. Checks which files are missing and creates them from templates
3. Updates existing files where content is stale

## Maintenance Rules

- Never delete a `claude-docs/` file — update or add sections instead
- Never add aspirational or TODO content — document what exists now
- Keep files concise — these are reference docs, not design documents
- If a domain no longer exists (e.g. workers removed), mark the file as deprecated at the top rather than deleting
