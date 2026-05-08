'use client' // client component — handles time entry logging and listing
import { useState, useEffect } from 'react' // React hooks for form state and data fetching

export default function TimeEntriesPage({ params }: { params: { id: string } }) {
  // TODO: form state for description, date, hours, billable toggle
  // TODO: POST /projects/:id/time-entries on submit
  // TODO: fetch entries from GET /projects/:id/time-entries
  // TODO: DELETE /time-entries/:entryId on delete
  return (
    <div>
      <h1>Time Entries</h1>
      {/* TODO: log time form, entry list with running totals */}
    </div>
  )
}
