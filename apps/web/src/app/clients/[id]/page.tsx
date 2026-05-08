'use client' // client component — fetches client detail from API
import { useState, useEffect } from 'react' // React hooks for local state and data fetching

export default function ClientDetailPage({ params }: { params: { id: string } }) {
  // TODO: fetch client from GET /clients/:id (includes projects array)
  return (
    <div>
      {/* TODO: client info, project list with links to /projects/:id */}
    </div>
  )
}
