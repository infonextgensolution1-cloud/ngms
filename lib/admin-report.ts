import type { SupabaseClient } from '@supabase/supabase-js'
import { getSettings, jobCosting, n0, r2, type Job } from '@/lib/ngms-ops/core'
import type { Table } from '@/lib/admin-export'

// Month-end report for the owner and the bookkeeper. All figures in rand.
// Payments come from the "Payment R… received YYYY-MM-DD via …" lines that
// recording a payment writes into the invoice notes.

export type MonthReport = {
  month: string // YYYY-MM
  invoiced: number
  invoiceCount: number
  collected: number
  paymentCount: number
  outstanding: number
  quotedValue: number
  quoteCount: number
  wonValue: number
  wonCount: number
  jobsCompleted: number
  jobRevenue: number
  jobCost: number
  jobProfit: number
  spend: number
  leads: number
  leadsWon: number
  sheets: Table[]
}

const PAYMENT_LINE = /Payment (-?R[\d ]+\.\d{2}) received (\d{4}-\d{2}-\d{2}) via (\w+)(?: \(ref ([^)]*)\))?/g
const money = (s: string) => Number(s.replace(/[R ]/g, ''))
const one = <T,>(v: T | T[] | null | undefined): T | null => (Array.isArray(v) ? v[0] ?? null : v ?? null)

function bounds(month: string) {
  const [y, m] = month.split('-').map(Number)
  const next = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`
  const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate()
  return {
    startTs: `${month}-01T00:00:00+02:00`,
    endTs: `${next}-01T00:00:00+02:00`,
    startDay: `${month}-01`,
    endDay: `${month}-${String(lastDay).padStart(2, '0')}`,
  }
}

const sastDay = (iso: string) => new Date(iso).toLocaleDateString('en-CA', { timeZone: 'Africa/Johannesburg' })

export async function monthReport(sb: SupabaseClient, month: string): Promise<MonthReport> {
  const b = bounds(month)
  const [inv, allInv, quotes, jobs, costs, labour, purchases, leads, settings] = await Promise.all([
    sb.from('invoices').select('invoice_number,status,total_amount,paid_amount,created_at,clients(name)').gte('created_at', b.startTs).lt('created_at', b.endTs).order('created_at'),
    sb.from('invoices').select('invoice_number,status,total_amount,paid_amount,notes,clients(name)'),
    sb.from('quotes').select('quote_number,status,total_amount,created_at').gte('created_at', b.startTs).lt('created_at', b.endTs),
    sb.from('jobs').select('*').eq('status', 'completed').gte('completed_date', b.startDay).lte('completed_date', b.endDay),
    sb.from('job_costs').select('category,description,amount,created_at,jobs(title)').gte('created_at', b.startTs).lt('created_at', b.endTs),
    sb.from('labour_entries').select('employee_name,hours,rate_per_hour,date,jobs(title)').gte('date', b.startDay).lte('date', b.endDay),
    sb.from('supplier_purchases').select('purchase_date,description,category,amount,job_cost_id,suppliers(name)').gte('purchase_date', b.startDay).lte('purchase_date', b.endDay),
    sb.from('leads').select('status,source').gte('created_at', b.startTs).lt('created_at', b.endTs),
    getSettings(sb),
  ])
  for (const r of [inv, allInv, quotes, jobs, costs, labour, purchases, leads]) if (r.error) throw new Error(`Could not build the report: ${r.error.message}`)

  // Invoices raised this month
  type InvRow = { invoice_number: string; status: string; total_amount: number | null; paid_amount: number | null; created_at: string; clients: unknown }
  const invRows = ((inv.data ?? []) as InvRow[]).filter((i) => i.status !== 'void')
  const invoiced = r2(invRows.reduce((t, i) => t + n0(i.total_amount), 0))

  // Payments received this month (any invoice)
  type AnyInv = { invoice_number: string; status: string; total_amount: number | null; paid_amount: number | null; notes: string | null; clients: unknown }
  const payments: { date: string; invoice: string; client: string | null; amount: number; method: string; ref: string | null }[] = []
  let outstanding = 0
  for (const i of (allInv.data ?? []) as AnyInv[]) {
    if (i.status !== 'void') outstanding += Math.max(0, n0(i.total_amount) - n0(i.paid_amount))
    for (const m of (i.notes ?? '').matchAll(PAYMENT_LINE)) {
      if (m[2] >= b.startDay && m[2] <= b.endDay) {
        payments.push({ date: m[2], invoice: i.invoice_number, client: one(i.clients as { name: string | null })?.name ?? null, amount: money(m[1]), method: m[3].toUpperCase(), ref: m[4] ?? null })
      }
    }
  }
  payments.sort((a, z) => a.date.localeCompare(z.date))
  const collected = r2(payments.reduce((t, p) => t + p.amount, 0))

  // Quotes
  type Q = { quote_number: string; status: string; total_amount: number | null }
  const qRows = (quotes.data ?? []) as Q[]
  const won = qRows.filter((q) => q.status === 'accepted')

  // Completed-job profit
  const jobRows = (jobs.data ?? []) as Job[]
  const costed = await Promise.all(jobRows.map(async (j) => ({ j, c: await jobCosting(sb, j, settings) })))
  const jobRevenue = r2(costed.reduce((t, x) => t + x.c.revenue_ex_vat, 0))
  const jobCost = r2(costed.reduce((t, x) => t + x.c.total_cost, 0))

  // Spend this month: job costs + labour + supplier purchases not already logged as a job cost
  type Cost = { category: string; description: string | null; amount: number; created_at: string; jobs: unknown }
  type Lab = { employee_name: string; hours: number; rate_per_hour: number; date: string; jobs: unknown }
  type Buy = { purchase_date: string; description: string | null; category: string | null; amount: number; job_cost_id: string | null; suppliers: unknown }
  const spendRows: [string, string, string, string, number][] = [
    ...((costs.data ?? []) as Cost[]).map((c): [string, string, string, string, number] => [sastDay(c.created_at), c.category, c.description ?? '', one(c.jobs as { title: string | null })?.title ?? '', r2(n0(c.amount))]),
    ...((labour.data ?? []) as Lab[]).map((l): [string, string, string, string, number] => [l.date, 'Labour', `${l.employee_name} · ${n0(l.hours)} h`, one(l.jobs as { title: string | null })?.title ?? '', r2(n0(l.hours) * n0(l.rate_per_hour))]),
    ...((purchases.data ?? []) as Buy[])
      .filter((p) => !p.job_cost_id)
      .map((p): [string, string, string, string, number] => [p.purchase_date, p.category ?? 'Purchase', [one(p.suppliers as { name: string | null })?.name, p.description].filter(Boolean).join(' · '), '', r2(n0(p.amount))]),
  ].sort((a, z) => a[0].localeCompare(z[0]))
  const spend = r2(spendRows.reduce((t, r) => t + r[4], 0))

  const leadRows = (leads.data ?? []) as { status: string; source: string | null }[]

  const summary: Table = {
    title: 'Summary',
    headers: ['Item', 'Amount (R)', 'Count'],
    rows: [
      ['Invoiced (raised this month)', invoiced, invRows.length],
      ['Collected (payments received)', collected, payments.length],
      ['Outstanding (all invoices, today)', r2(outstanding), null],
      ['Quoted', r2(qRows.reduce((t, q) => t + n0(q.total_amount), 0)), qRows.length],
      ['Quotes accepted', r2(won.reduce((t, q) => t + n0(q.total_amount), 0)), won.length],
      ['Completed jobs: revenue ex VAT', jobRevenue, costed.length],
      ['Completed jobs: costs', jobCost, null],
      ['Completed jobs: gross profit', r2(jobRevenue - jobCost), null],
      ['Spend (job costs, labour, purchases)', spend, spendRows.length],
      ['New leads', null, leadRows.length],
      ['Leads won', null, leadRows.filter((l) => l.status === 'won').length],
    ],
  }

  return {
    month,
    invoiced,
    invoiceCount: invRows.length,
    collected,
    paymentCount: payments.length,
    outstanding: r2(outstanding),
    quotedValue: r2(qRows.reduce((t, q) => t + n0(q.total_amount), 0)),
    quoteCount: qRows.length,
    wonValue: r2(won.reduce((t, q) => t + n0(q.total_amount), 0)),
    wonCount: won.length,
    jobsCompleted: costed.length,
    jobRevenue,
    jobCost,
    jobProfit: r2(jobRevenue - jobCost),
    spend,
    leads: leadRows.length,
    leadsWon: leadRows.filter((l) => l.status === 'won').length,
    sheets: [
      summary,
      {
        title: 'Invoices',
        headers: ['Date', 'Invoice no', 'Client', 'Status', 'Total (R)', 'Paid (R)', 'Balance (R)'],
        rows: invRows.map((i) => [sastDay(i.created_at), i.invoice_number, one(i.clients as { name: string | null })?.name ?? null, i.status, r2(n0(i.total_amount)), r2(n0(i.paid_amount)), r2(n0(i.total_amount) - n0(i.paid_amount))]),
      },
      {
        title: 'Payments',
        headers: ['Date', 'Invoice no', 'Client', 'Method', 'Reference', 'Amount (R)'],
        rows: payments.map((p) => [p.date, p.invoice, p.client, p.method, p.ref, p.amount]),
      },
      {
        title: 'Job profit',
        headers: ['Completed', 'Job', 'Revenue ex VAT (R)', 'Costs (R)', 'Profit (R)', 'Margin %'],
        rows: costed.map(({ j, c }) => [j.completed_date, j.title, c.revenue_ex_vat, c.total_cost, r2(c.revenue_ex_vat - c.total_cost), c.revenue_ex_vat > 0 ? Math.round(((c.revenue_ex_vat - c.total_cost) / c.revenue_ex_vat) * 100) : null]),
      },
      {
        title: 'Spend',
        headers: ['Date', 'Category', 'Description', 'Job', 'Amount (R)'],
        rows: spendRows,
      },
    ],
  }
}
