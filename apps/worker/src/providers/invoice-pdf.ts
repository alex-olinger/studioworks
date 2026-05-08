// TODO: import { db } from '@studioworks/db'
// TODO: import puppeteer from 'puppeteer'  (pnpm add puppeteer --filter @studioworks/worker)
// TODO: import path from 'path'
// TODO: import fs from 'fs'

// generateInvoicePdf renders a PDF for the given invoice and writes it to data/invoices/
export async function generateInvoicePdf(invoiceId: string): Promise<string> {
  // TODO: load invoice with line items, project, and client from DB
  // TODO: build an HTML string representing the invoice (table of line items, totals, client info)
  // TODO: launch Puppeteer, open the HTML, export as PDF
  // TODO: ensure data/invoices/ directory exists
  // TODO: write PDF buffer to data/invoices/{invoiceId}.pdf
  // TODO: return the output file path
  throw new Error('not implemented') // placeholder — Phase 2 will implement this
}
