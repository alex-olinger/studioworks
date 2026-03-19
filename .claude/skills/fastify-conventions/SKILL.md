---
name: fastify-conventions
description: Provides Fastify conventions, patterns, and boilerplate for Node.js/TypeScript monorepos. Use when writing or reviewing Fastify routes, plugins, hooks, or error handlers. Covers plugin registration, request/reply schema patterns, error shapes, service layer separation, and authentication hooks.
---

# Fastify Conventions

Reference conventions for writing Fastify routes and plugins in a Node.js/TypeScript monorepo.

## Plugin Pattern

All routes must be registered as Fastify plugins, never inline on the root instance.

```typescript
// apps/api/src/routes/users/index.ts
import { FastifyPluginAsync } from 'fastify'

const usersRoute: FastifyPluginAsync = async (fastify) => {
  fastify.get('/', { schema: listUsersSchema }, listUsersHandler)
  fastify.post('/', { schema: createUserSchema }, createUserHandler)
  fastify.get('/:id', { schema: getUserSchema }, getUserHandler)
}

export default usersRoute
```

Register in the root app:
```typescript
fastify.register(usersRoute, { prefix: '/users' })
```

---

## Schema Pattern

Every route must define a schema for request and reply. Use `@sinclair/typebox` or plain JSON Schema.

```typescript
// apps/api/src/routes/users/users.schema.ts
import { Type } from '@sinclair/typebox'

export const createUserSchema = {
  body: Type.Object({
    email: Type.String({ format: 'email' }),
    name: Type.String({ minLength: 1 }),
  }),
  response: {
    201: Type.Object({
      id: Type.String(),
      email: Type.String(),
      name: Type.String(),
      createdAt: Type.String(),
    }),
    400: errorResponseSchema,
    409: errorResponseSchema,
  },
}

export const getUserSchema = {
  params: Type.Object({
    id: Type.String({ format: 'uuid' }),
  }),
  response: {
    200: Type.Object({
      id: Type.String(),
      email: Type.String(),
      name: Type.String(),
    }),
    404: errorResponseSchema,
  },
}
```

---

## Error Shape

All error responses must use this shape — no exceptions:

```typescript
// packages/types/src/errors.ts
export interface ApiError {
  error: string   // human-readable message
  code: string    // machine-readable code in SCREAMING_SNAKE_CASE
}
```

Standard error schema:
```typescript
export const errorResponseSchema = Type.Object({
  error: Type.String(),
  code: Type.String(),
})
```

Common error codes:
```
VALIDATION_ERROR       — request failed schema validation
NOT_FOUND              — resource does not exist
ALREADY_EXISTS         — unique constraint violation
UNAUTHORIZED           — missing or invalid auth token
FORBIDDEN              — authenticated but not permitted
INTERNAL_ERROR         — unexpected server error
```

---

## Route Handler Pattern

Handlers must be thin — validate input, call service, return result. No business logic.

```typescript
// apps/api/src/routes/users/users.handler.ts
import { FastifyRequest, FastifyReply } from 'fastify'
import { CreateUserBody } from '@repo/types'
import { createUser } from '../../services/users.service'

export async function createUserHandler(
  request: FastifyRequest<{ Body: CreateUserBody }>,
  reply: FastifyReply
) {
  try {
    const user = await createUser(request.body)
    return reply.status(201).send(user)
  } catch (err) {
    if (err instanceof UserAlreadyExistsError) {
      return reply.status(409).send({
        error: 'A user with this email already exists',
        code: 'ALREADY_EXISTS',
      })
    }
    throw err // let Fastify's error handler catch unexpected errors
  }
}
```

---

## Service Layer Pattern

All business logic and database access lives in the service layer.

```typescript
// apps/api/src/services/users.service.ts
import { db } from '../db'
import { CreateUserBody, User } from '@repo/types'

export async function createUser(data: CreateUserBody): Promise<User> {
  const existing = await db.query(
    'SELECT id FROM users WHERE email = $1',
    [data.email]
  )
  if (existing.rows.length > 0) {
    throw new UserAlreadyExistsError(data.email)
  }

  const result = await db.query(
    'INSERT INTO users (email, name) VALUES ($1, $2) RETURNING id, email, name, created_at',
    [data.email, data.name]
  )
  return result.rows[0]
}

export class UserAlreadyExistsError extends Error {
  constructor(email: string) {
    super(`User with email ${email} already exists`)
    this.name = 'UserAlreadyExistsError'
  }
}
```

---

## Authentication Hook Pattern

Protected routes use a `preHandler` hook. Never inline auth logic in the handler.

```typescript
// apps/api/src/hooks/auth.hook.ts
import { FastifyRequest, FastifyReply } from 'fastify'

export async function requireAuth(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    await request.jwtVerify()
  } catch {
    return reply.status(401).send({
      error: 'Authentication required',
      code: 'UNAUTHORIZED',
    })
  }
}
```

Apply to a route:
```typescript
fastify.get('/me', {
  preHandler: [requireAuth],
  schema: getMeSchema,
}, getMeHandler)
```

---

## File Structure

```
apps/api/src/
├── routes/
│   └── <domain>/
│       ├── index.ts          — plugin registration
│       ├── <domain>.schema.ts — request/reply schemas
│       └── <domain>.handler.ts — thin handlers
├── services/
│   └── <domain>.service.ts   — business logic + DB access
├── hooks/
│   └── auth.hook.ts          — reusable preHandler hooks
└── db/
    └── index.ts              — db connection pool
```

---

## Global Error Handler

Register once in the root app to catch unexpected errors:

```typescript
fastify.setErrorHandler((error, request, reply) => {
  fastify.log.error(error)
  return reply.status(500).send({
    error: 'An unexpected error occurred',
    code: 'INTERNAL_ERROR',
  })
})
```
