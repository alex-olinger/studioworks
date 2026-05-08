import { FastifyPluginAsync } from 'fastify' // Fastify plugin type for route registration
import { z } from 'zod' // Zod for request body validation
import { db } from '@studioworks/db' // shared Prisma client
import { queue } from '../queue.js' // BullMQ queue instance for enqueuing PDF jobs
// TODO: import fs from 'fs' — needed for PDF serving in GET /invoices/:id/pdf

// schema for updating invoice metadata — all fields optional
const UpdateInvoiceSchema = z.object({
  status: z.enum(['DRAFT', 'SENT', 'PAID', 'OVERDUE']).optional(), // mirrors InvoiceStatus enum
  dueDate: z.string().datetime().optional(),
  notes: z.string().optional(),
})

export const invoiceRoutes: FastifyPluginAsync = async (app) => {
  app.post('/projects/:projectId/invoices', async (request, reply) => {
    // TODO: gather unbilled billable entries inside prisma.$transaction() with FOR UPDATE
    // TODO: return 400 if nothing to invoice
    // TODO: return 400 if time entries exist but project has no hourlyRate
    // TODO: calculate subtotal, create Invoice, mark entries billed, create Job, enqueue jobId
    // TODO: return 201 with invoice + job
  })

  app.get('/invoices', async (request, reply) => {
    // TODO: cursor pagination, optional status filter
  })

  app.get('/invoices/:id', async (request, reply) => {
    // TODO: find invoice with timeEntries, expenses, job, project+client, 404 if not found
  })

  app.patch('/invoices/:id', async (request, reply) => {
    // TODO: validate body, update invoice, 404 if not found
  })

  app.get('/invoices/:id/pdf', async (request, reply) => {
    // TODO: find invoice job, return 202 if not complete, serve PDF file if complete
  })
}
