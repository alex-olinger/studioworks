import type { Metadata } from 'next' // Next.js metadata type

export const metadata: Metadata = { title: 'StudioWorks' } // page title used in <head>

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <nav>
          {/* TODO: links to /, /clients, /projects, /invoices */}
        </nav>
        <main>{children}</main>
      </body>
    </html>
  )
}
