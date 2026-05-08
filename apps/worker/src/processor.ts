// TODO: import { db } from '@studioworks/db'
// TODO: import { JobSpecSchema } from '@studioworks/shared'
// TODO: import { generateInvoicePdf } from './providers/invoice-pdf.js'

// processJob is the main entry point called by the BullMQ worker for every dequeued job
export async function processJob({ jobId }: { jobId: string }) {
  // TODO: load job from DB, set status to PROCESSING
  // TODO: parse spec with JobSpecSchema
  // TODO: switch on spec.type:
  //   'invoice-pdf' → call generateInvoicePdf(spec.invoiceId)
  //                   set job.outputPath, set status to COMPLETE
  // TODO: on any error: set job.error to message, set status to FAILED, rethrow
}
