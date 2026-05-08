import { FastifyPluginAsync } from 'fastify' // Fastify plugin type for route registration
import { z } from 'zod' // Zod for request body validation
import { db } from '@studioworks/db' // shared Prisma client

// schema for creating a time entry — accepts ISO datetime or date string for flexibility
const CreateTimeEntrySchema = z.object({
  description: z.string().min(1),
  date: z.string().datetime().or(z.string().date()), // ISO 8601 datetime or date-only
  hours: z.number().positive(),
  billable: z.boolean().default(true), // defaults to billable — most entries are
})

export const timeEntryRoutes: FastifyPluginAsync = async (app) => {
  app.post('/projects/:projectId/time-entries', async (request, reply) => {
    // TODO: verify project exists, validate body, create entry, return 201
  })

  app.get('/projects/:projectId/time-entries', async (request, reply) => {
    // TODO: cursor pagination, optional billable/billed filters
  })

  app.delete('/time-entries/:id', async (request, reply) => {
    // TODO: find entry, return 409 if billed, delete and return 204
  })
}
