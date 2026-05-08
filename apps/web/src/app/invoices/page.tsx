'use client' // client component — fetches invoice list with status filtering
import { useState, useEffect } from 'react' // React hooks for local state and data fetching

export default function InvoicesPage() {
  // TODO: fetch invoices from GET /invoices, optional status filter
  return (
    <div>
      <h1>Invoices</h1>
      {/* TODO: status filter tabs (all / draft / sent / paid / overdue), invoice list */}
    </div>
  )
}
