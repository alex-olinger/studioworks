---
name: dockerfile-templates
description: Provides production-ready Dockerfile templates for Node.js/TypeScript monorepo apps. Use when creating or updating Dockerfiles for Fastify API, BullMQ worker, or Next.js frontend services. All templates use multi-stage builds, non-root users, pinned base images, and health checks. Reference templates in templates/ directory.
---

# Dockerfile Templates

Production-ready multi-stage Dockerfile templates for Node.js/TypeScript monorepo services.

## Usage

Copy the appropriate template from `templates/` and adjust:
- `APP_NAME` — the app directory name under `apps/`
- Base image version — pin to your Node.js version
- Health check path/port — match your app's actual endpoint and port

All templates follow these rules:
- Multi-stage build: `builder` compiles, `runner` is the final lean image
- Non-root user: final stage runs as `node`
- Pinned base image: no `:latest` tags
- Health check: built into the Dockerfile
- No secrets in layers: use runtime env vars only
- `.dockerignore` required — see bottom of this file

---

## Templates

### Fastify API → `templates/Dockerfile.api`
### BullMQ Worker → `templates/Dockerfile.worker`
### Next.js Frontend → `templates/Dockerfile.web`

---

## Required .dockerignore

Every service must have a `.dockerignore` at the repo root or app level:

```
node_modules
.git
.env
.env.*
!.env.example
dist
.next
coverage
*.log
.turbo
```

---

## Docker Compose Health Check Pattern

Services that depend on Postgres or Redis must use `condition: service_healthy`:

```yaml
services:
  api:
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy

  postgres:
    image: postgres:16-alpine
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5
```
