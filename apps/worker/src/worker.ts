import 'dotenv/config' // load .env file into process.env
import { Worker } from 'bullmq' // BullMQ worker class
import { Redis } from 'ioredis' // ioredis named export — required under NodeNext module resolution
import { JOB_QUEUE_NAME } from '@studioworks/shared' // canonical queue name — must match api's queue
import { processJob } from './processor.js' // job processor function

// create ioredis connection from URL; maxRetriesPerRequest null required by BullMQ
const redis = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
})

// worker listens on the shared queue and dispatches each job to processJob
const worker = new Worker(
  JOB_QUEUE_NAME,
  async (job) => {
    await processJob({ jobId: job.data.jobId }) // job.data contains only the DB record id
  },
  { connection: redis }, // ioredis instance satisfies BullMQ's ConnectionOptions
)

worker.on('completed', (job) => console.log(`Job ${job.id} completed`)) // log successful completions
worker.on('failed', (job, err) => console.error(`Job ${job?.id} failed:`, err)) // log failures

console.log('Worker listening on queue:', JOB_QUEUE_NAME) // startup confirmation
