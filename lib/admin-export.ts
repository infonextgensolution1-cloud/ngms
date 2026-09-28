import type { SupabaseClient } from '@supabase/supabase-js'

// Admin exports: every record in a table (not just the page on screen), as
// plain values so Excel and Google Sheets can sum and sort them. Money is a
// number in rand, dates are YYYY-MM-DD in SA time.

export type Table = { title: string; headers: string[]; rows: (string | number | null)[][] }

type ClientRef = { name: string | null; phone: string | null; suburb: string | null } | null

const one = <T,>(v: T | T[] | null | undefined): T | null => (Array.isArray(v) ? v[0] ?? null : v ?? null)
const num = (v: unknown) => (v === null || v === undefined || v === '' ? null : Math.round(Number(v) * 100) / 100)
const day = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString('en-CA', { timeZone: 'Africa/Johannesburg' }) : null

async function all<T>(query: PromiseLike<{ data: T[] | null; error: { message: string } | null }>, what: string): Promise<T[]> {
  const { data, error } = await query
  if (error) throw new Error(`Could not load ${what}: ${error.message}`)
  return data ?? []
}

export async function exportQuotes(sb: SupabaseClient): Promise<Table> {
  type R = { quote_number: string; status: string; vat_included: boolean | null; total_amount: number | null; deposit_amount: number | null; valid_until: string | null; created_at: string; notes: string | null; clients: ClientRef | ClientRef[] }
  const data = await all<R>(
    sb.from('quotes').select('quote_number,status,vat_included,total_amount,deposit_amount,valid_until,created_at,notes,clients(name,phone,suburb)').order('created_at', { ascending: false }),
    'quotes',
  )
  return {
    title: 'Quotes',
    headers: ['Quote no', 'Date', 'Client', 'Phone', 'Suburb', 'Status', 'Total (R)', 'Deposit (R)', 'VAT incl.', 'Valid until', 'Notes'],
    rows: data.map((q) => {
      const c = one(q.clients)
      return [q.quote_number, day(q.created_at), c?.name ?? null, c?.phone ?? null, c?.suburb ?? null, q.status, num(q.total_amount), num(q.deposit_amount), q.vat_included ? 'Yes' : 'No', q.valid_until, q.notes]
    }),
  }
}

export async function exportInvoices(sb: SupabaseClient): Promise<Table> {
  type R = { invoice_number: string; status: string; total_amount: number | null; paid_amount: number | null; due_date: string | null; created_at: string; notes: string | null; clients: ClientRef | ClientRef[]; quotes: { quote_number: string } | { quote_number: string }[] | null }
  const data = await all<R>(
    sb.from('invoices').select('invoice_number,status,total_amount,paid_amount,due_date,created_at,notes,clients(name,phone,suburb),quotes(quote_number)').order('created_at', { ascending: false }),
    'invoices',
  )
  return {
    title: 'Invoices',
    headers: ['Invoice no', 'Date', 'Client', 'Phone', 'Suburb', 'Quote no', 'Status', 'Total (R)', 'Paid (R)', 'Balance (R)', 'Due date', 'Notes'],
    rows: data.map((i) => {
      const c = one(i.clients)
      const total = num(i.total_amount) ?? 0
      const paid = num(i.paid_amount) ?? 0
      const balance = i.status === 'void' ? 0 : Math.round((total - paid) * 100) / 100
      return [i.invoice_number, day(i.created_at), c?.name ?? null, c?.phone ?? null, c?.suburb ?? null, one(i.quotes)?.quote_number ?? null, i.status, total, paid, balance, i.due_date, i.notes]
    }),
  }
}

export async function exportJobs(sb: SupabaseClient): Promise<Table> {
  type R = { title: string | null; status: string; scheduled_date: string | null; completed_date: string | null; created_at: string; description: string | null; clients: ClientRef | ClientRef[]; quotes: { quote_number: string; total_amount: number | null } | { quote_number: string; total_amount: number | null }[] | null }
  const data = await all<R>(
    sb.from('jobs').select('title,status,scheduled_date,completed_date,created_at,description,clients(name,phone,suburb),quotes(quote_number,total_amount)').order('created_at', { ascending: false }),
    'jobs',
  )
  return {
    title: 'Jobs',
    headers: ['Job', 'Client', 'Phone', 'Suburb', 'Status', 'Scheduled', 'Completed', 'Quote no', 'Quote total (R)', 'Created', 'Description'],
    rows: data.map((j) => {
      const c = one(j.clients)
      const q = one(j.quotes)
      return [j.title, c?.name ?? null, c?.phone ?? null, c?.suburb ?? null, j.status, j.scheduled_date, j.completed_date, q?.quote_number ?? null, num(q?.total_amount), day(j.created_at), j.description]
    }),
  }
}

export async function exportLeads(sb: SupabaseClient): Promise<Table> {
  type R = { name: string; phone: string | null; email: string | null; suburb: string | null; service: string | null; service_slug: string | null; source: string | null; status: string; message: string | null; notes: string | null; created_at: string }
  const data = await all<R>(
    sb.from('leads').select('name,phone,email,suburb,service,service_slug,source,status,message,notes,created_at').order('created_at', { ascending: false }),
    'leads',
  )
  return {
    title: 'Leads',
    headers: ['Received', 'Name', 'Phone', 'Email', 'Suburb', 'Service', 'Source', 'Status', 'Message', 'Notes'],
    rows: data.map((l) => [day(l.created_at), l.name, l.phone, l.email, l.suburb, l.service ?? l.service_slug, l.source, l.status, l.message, l.notes]),
  }
}

export function fileStem(t: Table) {
  return `NGMS ${t.title} ${new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Johannesburg' })}`
}

/** Tab-separated text: pastes straight into Google Sheets as rows and columns. */
export function toTsv(t: Table): string {
  const clean = (v: string | number | null) => (v === null ? '' : String(v).replace(/[\t\r\n]+/g, ' ').trim())
  return [t.headers, ...t.rows].map((r) => r.map(clean).join('\t')).join('\n')
}
