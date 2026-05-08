'use client' // client component — handles form submission
import { useState } from 'react' // React hook for form state
import { useRouter } from 'next/navigation' // Next.js router for redirect after creation

export default function NewClientPage() {
  const router = useRouter() // used to redirect to /clients on successful creation
  // TODO: form state for name, email, address, notes
  // TODO: POST /clients on submit, redirect to /clients on success
  return (
    <div>
      <h1>New Client</h1>
      {/* TODO: form */}
    </div>
  )
}
