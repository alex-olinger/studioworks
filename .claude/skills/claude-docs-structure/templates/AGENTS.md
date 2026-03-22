# Agents

All Claude Code agents available in this project. Located in `.claude/agents/`.

## Workflow

| Agent | Invoke | Purpose |
|---|---|---|
| `node-monorepo-coder` | `/node-monorepo-coder` | Primary implementation agent — writes routes, workers, services, migrations |
| `node-monorepo-pr-reviewer` | `/node-monorepo-pr-reviewer` | Pre-push orchestrator — runs all review agents before pushing |
| `node-monorepo-docs-updater` | `/node-monorepo-docs-updater` | Updates `CLAUDE.md` and `claude-docs/` when architecture changes |

## Core Backend

| Agent | Invoke | Purpose |
|---|---|---|
| `typescript-type-checker` | `/typescript-type-checker` | Runs `pnpm typecheck` and reviews type safety issues |
| `fastify-route-reviewer` | `/fastify-route-reviewer` | Reviews routes for schema, error shape, service layer separation |
| `bullmq-job-validator` | `/bullmq-job-validator` | Reviews workers for retry config, error handling, DLQ setup |
| `postgres-migration-reviewer` | `/postgres-migration-reviewer` | Reviews migrations for safety and rollback viability |
| `sql-query-analyzer` | `/sql-query-analyzer` | Analyzes queries for N+1s, injection risk, missing indexes |

## Platform

| Agent | Invoke | Purpose |
|---|---|---|
| `docker-ci-validator` | `/docker-ci-validator` | Reviews Dockerfiles and CI YAML |
| `turbo-pipeline-checker` | `/turbo-pipeline-checker` | Reviews `turbo.json` pipeline config |
| `k8s-manifest-reviewer` | `/k8s-manifest-reviewer` | Reviews Kubernetes manifests |

## Orchestration

`node-monorepo-pr-reviewer` is the top-level orchestrator. Run it before every push:
```
/node-monorepo-pr-reviewer
```
It spawns the appropriate subagents based on what files changed and produces a unified pass/fail report.
