# K8s Manifest Review

Audit all Kubernetes manifests in the repo against StudioWorks conventions.

## Step 1 — Read conventions

Read the following skills in full before auditing:
- `.claude/skills/k8s-manifest-templates/SKILL.md`
- `.claude/skills/dockerfile-templates/SKILL.md`

If Dockerfiles are present alongside manifests, audit them against dockerfile-templates conventions at the same time.

## Step 2 — Find all manifests

```bash
find k8s/ -name "*.yaml" -o -name "*.yml" 2>/dev/null
find helm/ -name "*.yaml" -o -name "*.yml" 2>/dev/null
```

If neither directory exists, report: "No k8s/ or helm/ directory found. Nothing to audit."

Read every file found.

## Step 3 — Audit each manifest

For every manifest, check the following. Flag any violation with file, severity, and fix.

### Deployments
- [ ] `resources.requests` and `resources.limits` defined for every container
- [ ] CPU/memory within expected ranges per service type:
  - api: 100m–500m CPU, 128Mi–512Mi mem
  - worker: 200m–1000m CPU, 256Mi–1Gi mem
  - web: 100m–500m CPU, 128Mi–512Mi mem
- [ ] `livenessProbe` defined
- [ ] `readinessProbe` defined
- [ ] `securityContext` defined at pod or container level
- [ ] `namespace` is not `default`
- [ ] Labels include `app.kubernetes.io/name`, `app.kubernetes.io/component`, `app.kubernetes.io/part-of`
- [ ] No hardcoded env var values that should be in ConfigMap or Secret
- [ ] No secrets as plain `value:` — must use `secretKeyRef`
- [ ] Resource names follow `<app>-<type>` convention (e.g. `api-deployment`, `worker-hpa`)

### Services
- [ ] Type is appropriate (`ClusterIP` for internal; `LoadBalancer`/`NodePort` only if explicitly needed)
- [ ] Selector labels match Deployment labels
- [ ] Port naming follows convention

### ConfigMaps
- [ ] No sensitive values (passwords, tokens, keys) — those belong in Secrets

### Secrets
- [ ] Values are base64 encoded placeholders or use external secrets operator reference
- [ ] No actual secret values committed

### HPAs
- [ ] `minReplicas` and `maxReplicas` defined
- [ ] Metrics defined (CPU and/or memory)
- [ ] Target matches a real Deployment

### PodDisruptionBudgets
- [ ] Present for any Deployment with `replicas > 1`
- [ ] `minAvailable` or `maxUnavailable` is reasonable

### General
- [ ] No `:latest` image tags
- [ ] `imagePullPolicy` is `IfNotPresent` or `Always` — never omitted on pinned tags
- [ ] Namespace defined on every resource

## Step 4 — Output report

```
## K8s Manifest Review
Files audited: <n>  |  Total findings: <n>

| File | Findings |
|---|---|
| k8s/api/deployment.yaml | <n> issues |
| ... | ... |

---

### CRITICAL / HIGH
[list — these block deploy]

---

### MEDIUM
[list — fix before prod]

---

### LOW / SUGGESTION
[list — nice to have]

---

### Clean files
[files with no findings]
```

## Severity guide

- **CRITICAL** — missing resource limits, hardcoded secrets, namespace is `default`
- **HIGH** — missing probes, missing PDB on replicated deployment, `:latest` image tag
- **MEDIUM** — missing anti-affinity, label convention violations, wrong resource naming
- **LOW** — style or naming nitpicks, suboptimal but not dangerous
