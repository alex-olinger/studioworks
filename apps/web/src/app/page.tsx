'use client' // client component — fetches dashboard stats from API
import { useState, useEffect } from 'react' // React hooks for local state and data fetching

export default function DashboardPage() {
  // TODO: fetch summary stats from API:
  //   - active project count
  //   - total unbilled hours
  //   - outstanding invoice count + total
  //   - recent activity
  return (
    <div>
      <h1>Dashboard</h1>
      {/* TODO: render summary stat cards and recent activity feed */}
    </div>
  )
}
