'use client' // client component — fetches project list from API
import { useState, useEffect } from 'react' // React hooks for local state and data fetching

export default function ProjectsPage() {
  // TODO: fetch all projects from GET /clients/:clientId/projects across clients
  //   or add a GET /projects global endpoint — see spec note
  // TODO: filter by status (ACTIVE, COMPLETED, ARCHIVED)
  return (
    <div>
      <h1>Projects</h1>
      {/* TODO: project list with status filter */}
    </div>
  )
}
