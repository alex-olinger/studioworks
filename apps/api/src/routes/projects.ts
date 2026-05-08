import { FastifyPluginAsync } from 'fastify' // Fastify plugin type for route registration
import { z } from 'zod' // Zod for request body validation
import { db } from '@studioworks/db' // shared Prisma client

// schema for creating a new project under a client
const CreateProjectSchema = z.object({
  name: z.string().min(1),
  hourlyRate: z.number().positive().optional(), // optional — some projects are fixed-price
})

// schema for updating a project — all fields optional
const UpdateProjectSchema = z.object({
  name: z.string().min(1).optional(),
  status: z.enum(['ACTIVE', 'COMPLETED', 'ARCHIVED']).optional(), // mirrors ProjectStatus enum
  hourlyRate: z.number().positive().optional(),
})

export const projectRoutes: FastifyPluginAsync = async (app) => {
  app.post('/clients/:clientId/projects', async (request, reply) => {
    // TODO: verify client exists, validate body, create project under client, return 201
  })

  app.get('/clients/:clientId/projects', async (request, reply) => {
    // TODO: verify client exists, cursor pagination, optional status filter
  })

  app.get('/projects/:id', async (request, reply) => {
    // TODO: find project with timeEntries and expenses, return 404 if not found
  })

  app.patch('/projects/:id', async (request, reply) => {
    // TODO: validate body with UpdateProjectSchema, update project, return 404 if not found
  })
}
