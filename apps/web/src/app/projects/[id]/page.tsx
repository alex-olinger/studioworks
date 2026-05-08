'use client' // client component — fetches project detail and handles invoice generation
import { useState, useEffect } from 'react' // React hooks for local state and data fetching

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  // TODO: fetch project from GET /projects/:id (includes timeEntries, expenses)
  // TODO: calculate unbilled totals from unbilled entries
  // TODO: "Generate Invoice" button → POST /projects/:id/invoices, redirect to invoice detail
  return (
    <div>
      {/* TODO: project info, time entry list, expense list, unbilled total, generate invoice button */}
    </div>
  )
}
