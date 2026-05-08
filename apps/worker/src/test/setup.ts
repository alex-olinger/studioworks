import { db } from '@studioworks/db' // shared Prisma client
import { afterEach } from 'vitest' // vitest lifecycle hook

// delete in FK-safe order: children before parents
afterEach(async () => {
  await db.job.deleteMany() // remove jobs first — they reference invoices
  await db.invoice.deleteMany() // remove invoices — they reference projects
  await db.timeEntry.deleteMany() // remove time entries — they reference projects and invoices
  await db.expense.deleteMany() // remove expenses — they reference projects and invoices
  await db.project.deleteMany() // remove projects — they reference clients
  await db.client.deleteMany() // remove clients last — no outgoing FK references
})
