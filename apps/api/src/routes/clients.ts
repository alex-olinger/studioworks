import { FastifyPluginAsync } from 'fastify' // Fastify plugin type for route registration
import { z } from 'zod' // Zod for request body validation
import { db } from '@studioworks/db' // shared Prisma client

// schema for creating a new client — name required, all others optional
const CreateClientSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
})

// partial of create schema — all fields optional for PATCH semantics
const UpdateClientSchema = CreateClientSchema.partial()

export const clientRoutes: FastifyPluginAsync = async (app) => {
  app.post('/clients', async (request, reply) => {
    // TODO: validate body with CreateClientSchema, create client, return 201
  })

  app.get('/clients', async (request, reply) => {
    // TODO: cursor pagination query params, return { data, nextCursor }
  })

  app.get('/clients/:id', async (request, reply) => {
    // TODO: find client with projects included, return 404 if not found
  })

  app.patch('/clients/:id', async (request, reply) => {
    // TODO: validate body with UpdateClientSchema, update client, return 404 if not found
  })
}
