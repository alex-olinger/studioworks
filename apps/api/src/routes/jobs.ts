import { FastifyPluginAsync } from 'fastify' // Fastify plugin type for route registration
import { db } from '@studioworks/db' // shared Prisma client

export const jobRoutes: FastifyPluginAsync = async (app) => {
  app.get('/jobs/:id', async (request, reply) => {
    // TODO: find job by id, return 404 if not found
  })
}
