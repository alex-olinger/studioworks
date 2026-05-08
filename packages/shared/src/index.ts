export * from '../job-spec.js' // re-export all JobSpec types and schemas as the public API

export const JOB_QUEUE_NAME = 'jobs' // BullMQ queue name consumed by both api and worker
