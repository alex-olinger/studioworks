import { z } from 'zod' // zod for runtime schema validation and type inference

// invoice PDF generation — only job type in MVP
const InvoicePdfSpecSchema = z.object({
  type: z.literal('invoice-pdf'), // discriminant field — identifies this variant in the union
  invoiceId: z.string(), // the invoice record to render into PDF
})

// discriminated union — worker switches on type to dispatch to correct provider
export const JobSpecSchema = z.discriminatedUnion('type', [InvoicePdfSpecSchema])

export type JobSpec = z.infer<typeof JobSpecSchema> // TypeScript union type derived from schema
export type InvoicePdfSpec = z.infer<typeof InvoicePdfSpecSchema> // narrowed type for invoice-pdf variant
