# API

## Overview
<!-- Fastify version, base URL, auth mechanism -->

## Auth Model

<!-- How authentication works — JWT, session, API key, etc. -->
- Protected routes require: <!-- e.g. Authorization: Bearer <jwt> -->
- Auth hook: `apps/api/src/hooks/auth.hook.ts`
- Public routes: <!-- list routes that do not require auth -->

## Error Shape

All errors return:
```json
{ "error": "Human readable message", "code": "SCREAMING_SNAKE_CASE_CODE" }
```

## Route Inventory

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/health` | None | Health check |
| <!-- METHOD --> | <!-- /path --> | <!-- Yes/No --> | <!-- purpose --> |

## Request Validation

All routes validate request body, params, and query strings via JSON Schema. Invalid requests return `400` with `code: VALIDATION_ERROR`.

## Rate Limiting

<!-- If applicable — limits, headers, behavior when exceeded -->
