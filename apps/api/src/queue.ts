import { Queue } from 'bullmq' // BullMQ queue client
import { JOB_QUEUE_NAME } from '@studioworks/shared' // canonical queue name — shared with worker

export const queue = new Queue(JOB_QUEUE_NAME, { // single queue instance used by route handlers
  connection: { url: process.env.REDIS_URL ?? 'redis://localhost:6379' }, // Redis connection from env
})
