# Architecture

## Overview
<!-- One paragraph: what the system does and how the major parts relate -->

## Services

| Service | Type | Purpose |
|---|---|---|
| `apps/api` | Fastify HTTP API | <!-- e.g. REST API for frontend and external clients --> |
| `apps/worker` | BullMQ worker | <!-- e.g. Processes background jobs from Redis queues --> |
| `apps/web` | Next.js frontend | <!-- e.g. User-facing web application --> |

## Data Flow

<!-- Describe how a typical request moves through the system -->
<!-- Example:
1. Client → apps/web (Next.js) — user interaction
2. apps/web → apps/api (HTTP) — data fetch or mutation
3. apps/api → Postgres — read/write
4. apps/api → Redis (BullMQ) — enqueue background job
5. apps/worker ← Redis — dequeue and process job
-->

## Service Boundaries

<!-- What each service owns and what it must not do -->
- **api**: owns HTTP surface, auth, request validation. Must not contain business logic — delegates to services/.
- **worker**: owns job processing. Must not expose HTTP endpoints.
- **web**: owns UI. Must not connect directly to Postgres or Redis.

## Shared Packages

| Package | Purpose |
|---|---|
| `packages/types` | Shared TypeScript interfaces and Zod schemas |
| `packages/utils` | Shared utility functions |
| `packages/config` | Shared ESLint, TypeScript, and tooling config |

## External Dependencies

| Dependency | Purpose |
|---|---|
| Postgres | Primary datastore |
| Redis | BullMQ queue backend |
| <!-- add others --> | |
