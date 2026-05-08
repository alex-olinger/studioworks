import { Queue } from 'bullmq' // BullMQ queue client
import { Redis } from 'ioredis' // ioredis named export — required under NodeNext module resolution
import { JOB_QUEUE_NAME } from '@studioworks/shared' // canonical queue name — shared with worker

// create ioredis connection from URL; maxRetriesPerRequest null required by BullMQ
const redis = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
})

export const queue = new Queue(JOB_QUEUE_NAME, { connection: redis }) // single queue instance used by route handlers
