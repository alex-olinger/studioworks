# Workers

## Overview
<!-- BullMQ version, Redis connection, worker concurrency defaults -->

## Queue Topology

| Queue | Worker file | Purpose | Concurrency |
|---|---|---|---|
| <!-- queue-name --> | `workers/<name>.worker.ts` | <!-- purpose --> | <!-- N --> |

## Job Types

<!-- One section per queue -->

### `<queue-name>`

**Job data shape:**
```typescript
// packages/types/src/<queue-name>.ts
export interface <JobName>JobData {
  // fields
}
```

**Retry config:**
- attempts: <!-- N -->
- backoff: `{ type: 'exponential', delay: 1000 }`

**DLQ:** `<queue-name>-failed`

**Notes:** <!-- any special handling, timeouts, side effects -->

---

## Dead Letter Queue Strategy

Failed jobs that exhaust all retry attempts are forwarded to `<queue-name>-failed` queues. These queues are monitored and can be replayed manually via <!-- tooling or admin endpoint -->.

## Graceful Shutdown

Workers listen for SIGTERM and drain in-flight jobs before exiting. `WORKER_SHUTDOWN_TIMEOUT` env var controls the drain window (default: 60s). Kubernetes `terminationGracePeriodSeconds` must be set higher than this value.

## Redis Connection

```
REDIS_URL=redis://host:6379
```
