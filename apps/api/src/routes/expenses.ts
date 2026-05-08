import { FastifyPluginAsync } from 'fastify' // Fastify plugin type for route registration
import { z } from 'zod' // Zod for request body validation
import { db } from '@studioworks/db' // shared Prisma client

// schema for creating an expense — accepts ISO datetime or date string for flexibility
const CreateExpenseSchema = z.object({
  description: z.string().min(1),
  date: z.string().datetime().or(z.string().date()), // ISO 8601 datetime or date-only
  amount: z.number().positive(),
  category: z.string().optional(), // e.g. "software", "travel", "hardware"
  billable: z.boolean().default(true), // defaults to billable
})

export const expenseRoutes: FastifyPluginAsync = async (app) => {
  app.post('/projects/:projectId/expenses', async (request, reply) => {
    // TODO: verify project exists, validate body, create expense, return 201
  })

  app.get('/projects/:projectId/expenses', async (request, reply) => {
    // TODO: cursor pagination, optional billable/billed filters
  })

  app.delete('/expenses/:id', async (request, reply) => {
    // TODO: find expense, return 409 if billed, delete and return 204
  })
}
