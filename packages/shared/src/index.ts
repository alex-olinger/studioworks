export * from '../job-spec' // re-export all JobSpec types and schemas as the public API

export const JOB_QUEUE_NAME = 'jobs' // BullMQ queue name consumed by both api and worker
