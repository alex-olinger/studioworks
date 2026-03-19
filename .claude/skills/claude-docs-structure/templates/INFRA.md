# Infrastructure

## Local Development

```bash
docker compose up -d    # start all services
pnpm dev                # start all apps in watch mode
```

## Docker Compose Services

| Service | Image | Port | Purpose |
|---|---|---|---|
| `api` | `./apps/api/Dockerfile` | 3000 | Fastify API |
| `worker` | `./apps/worker/Dockerfile` | — | BullMQ worker |
| `web` | `./apps/web/Dockerfile` | 3001 | Next.js frontend |
| `postgres` | `postgres:16-alpine` | 5432 | Primary database |
| `redis` | `redis:7-alpine` | 6379 | Queue backend |

## Environment Variables

All required env vars are documented in `.env.example`. Never commit `.env`.

## Kubernetes

<!-- Fill in when K8s manifests are added -->
<!-- Location of manifests: k8s/ -->
<!-- Cluster: <!-- provider, e.g. GKE, EKS, local kind --> -->

### Workloads

| Workload | Kind | Replicas | Notes |
|---|---|---|---|
| `api` | Deployment | <!-- N --> | HPA configured |
| `worker` | Deployment | <!-- N --> | graceful drain on SIGTERM |
| `web` | Deployment | <!-- N --> | |

## CI/CD

<!-- GitHub Actions workflows -->
| Workflow | Trigger | Purpose |
|---|---|---|
| `ci.yml` | push, PR | Lint, typecheck, test |
| `deploy.yml` | push to main | Build and deploy |
