import 'dotenv/config' // load .env file into process.env
import { Worker } from 'bullmq' // BullMQ worker class
import { JOB_QUEUE_NAME } from '@studioworks/shared' // canonical queue name — must match api's queue
import { processJob } from './processor.js' // job processor function

// worker listens on the shared queue and dispatches each job to processJob
const worker = new Worker(
  JOB_QUEUE_NAME,
  async (job) => {
    await processJob({ jobId: job.data.jobId }) // job.data contains only the DB record id
  },
  { connection: { url: process.env.REDIS_URL ?? 'redis://localhost:6379' } }, // Redis connection from env
)

worker.on('completed', (job) => console.log(`Job ${job.id} completed`)) // log successful completions
worker.on('failed', (job, err) => console.error(`Job ${job?.id} failed:`, err)) // log failures

console.log('Worker listening on queue:', JOB_QUEUE_NAME) // startup confirmation
