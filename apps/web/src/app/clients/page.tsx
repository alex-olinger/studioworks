'use client' // client component — fetches client list from API
import { useState, useEffect } from 'react' // React hooks for local state and data fetching

export default function ClientsPage() {
  // TODO: fetch clients from GET /clients with cursor pagination
  // TODO: implement search/filter by name
  return (
    <div>
      <h1>Clients</h1>
      {/* TODO: search input, client list, link to /clients/new */}
    </div>
  )
}
