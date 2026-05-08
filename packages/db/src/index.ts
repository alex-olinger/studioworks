import { PrismaClient } from '@prisma/client' // Prisma-generated client — connects to Postgres

export const db = new PrismaClient() // singleton — import this everywhere, never import @prisma/client directly

export type {
  Client,      // freelancer client record
  Project,     // project under a client
  TimeEntry,   // billable hours logged against a project
  Expense,     // expense logged against a project
  Invoice,     // generated invoice grouping entries and expenses
  Job,         // async background job (e.g. PDF generation)
  JobStatus,   // QUEUED | PROCESSING | COMPLETE | FAILED
  ProjectStatus, // ACTIVE | COMPLETED | ARCHIVED
  InvoiceStatus, // DRAFT | SENT | PAID | OVERDUE
} from '@prisma/client'
