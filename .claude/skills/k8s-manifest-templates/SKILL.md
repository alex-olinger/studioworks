---
name: k8s-manifest-templates
description: Provides production-ready Kubernetes manifest templates for Node.js/TypeScript monorepo services. Use when writing K8s manifests for Fastify API, BullMQ worker, or Next.js frontend deployments. All templates include resource limits, liveness/readiness probes, security context, and anti-affinity rules. Templates are in templates/ directory.
---

# Kubernetes Manifest Templates

Production-ready Kubernetes manifest templates for Node.js/TypeScript monorepo services.

## Templates

```
templates/
├── api-deployment.yaml         — Fastify API Deployment + HPA
├── worker-deployment.yaml      — BullMQ Worker Deployment
├── service.yaml                — ClusterIP Service (reuse for any app)
├── configmap.yaml              — ConfigMap pattern
├── secret.yaml                 — Secret pattern (use with external secrets operator)
└── pdb.yaml                    — PodDisruptionBudget pattern
```

## Usage

1. Copy the relevant template into `k8s/<service>/`
2. Replace all `<PLACEHOLDER>` values
3. Run `/k8s-manifest-reviewer` to validate before applying

## Naming Conventions

- Resources: `<app>-<type>` — e.g. `api-deployment`, `worker-hpa`
- Labels: always include `app.kubernetes.io/name`, `app.kubernetes.io/component`, `app.kubernetes.io/part-of`
- Namespaces: never use `default` — create a dedicated namespace per environment

## Environment Variables

Never hardcode env vars in manifests. Pattern:
- Non-sensitive config → `ConfigMap` + `envFrom`
- Sensitive values → `Secret` + `secretKeyRef` (or external secrets operator)

## Resource Sizing Defaults

Adjust these based on actual load testing — these are conservative starting points:

| Service | CPU Request | CPU Limit | Memory Request | Memory Limit |
|---|---|---|---|---|
| api | 100m | 500m | 128Mi | 512Mi |
| worker | 200m | 1000m | 256Mi | 1Gi |
| web | 100m | 500m | 128Mi | 512Mi |
