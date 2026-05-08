'use client' // client component — handles expense logging and listing
import { useState, useEffect } from 'react' // React hooks for form state and data fetching

export default function ExpensesPage({ params }: { params: { id: string } }) {
  // TODO: form state for description, date, amount, category, billable toggle
  // TODO: POST /projects/:id/expenses on submit
  // TODO: fetch expenses from GET /projects/:id/expenses
  // TODO: DELETE /expenses/:expenseId on delete
  return (
    <div>
      <h1>Expenses</h1>
      {/* TODO: log expense form, expense list */}
    </div>
  )
}
