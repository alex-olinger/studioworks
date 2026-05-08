'use client' // client component — fetches invoice detail and polls job status for PDF
import { useState, useEffect } from 'react' // React hooks for local state and polling

export default function InvoiceDetailPage({ params }: { params: { id: string } }) {
  // TODO: fetch invoice from GET /invoices/:id
  // TODO: poll GET /jobs/:jobId every 2s until status is COMPLETE or FAILED
  // TODO: show PDF download link once job is COMPLETE
  // TODO: PATCH /invoices/:id to update status (sent/paid)
  return (
    <div>
      {/* TODO: invoice header, line items table, totals, status badge, PDF download link */}
    </div>
  )
}
