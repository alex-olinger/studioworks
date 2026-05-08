import Fastify from 'fastify' // Fastify framework — HTTP server
import { clientRoutes } from './routes/clients.js' // client CRUD routes
import { projectRoutes } from './routes/projects.js' // project CRUD routes
import { timeEntryRoutes } from './routes/time-entries.js' // time entry routes
import { expenseRoutes } from './routes/expenses.js' // expense routes
import { invoiceRoutes } from './routes/invoices.js' // invoice routes including PDF endpoint
import { jobRoutes } from './routes/jobs.js' // job status polling route

export function buildApp() {
  const app = Fastify({ logger: false }) // logger off in test/dev — enable in prod

  app.register(clientRoutes) // register all client routes
  app.register(projectRoutes) // register all project routes
  app.register(timeEntryRoutes) // register all time entry routes
  app.register(expenseRoutes) // register all expense routes
  app.register(invoiceRoutes) // register all invoice routes
  app.register(jobRoutes) // register job status route

  app.ready().catch(console.error) // kick off Fastify async init so routes are ready before tests
  return app
}
