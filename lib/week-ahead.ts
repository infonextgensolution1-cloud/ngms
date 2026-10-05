import type { SupabaseClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { handlersA } from '@/lib/ngms-ops/handlers-a'
import { jobWeather } from '@/lib/job-weather-core'
import { getWeather, type WxDay } from '@/lib/helderberg'
import { addDaysSAST, todaySAST } from '@/lib/ngms-leads-ui'
import { groupThousands } from '@/lib/solar-pricing'
import { NOTIFY_TO, REPLY_FROM } from '@/lib/lead-email'
import { site } from '@/lib/site'

/**
 * "Week ahead" email to the owner: this week's jobs, money, quotes, leads and last week's recap.
 * The money numbers come from the same ngms_business_summary the admin dashboard uses, so the
 * email and the dashboard always agree. Sent every Monday by the 08:00 cron, and on demand
 * from the admin dashboard button.
 */

export type WeekJob = { id: string; title: string | null; date: string; client_name: string | null; suburb: string | null; status: string; warning: string | null }
export type WeekOverdue = { id: string; invoice_number: string; client: string | null; balance: number; days_overdue: number }
export type WeekQuote = { id: string; quote_number: string; client: string | null; valid_until: string | null }

export type WeekAheadData = {
  from: string
  to: string
  jobs: WeekJob[]
  owed_total: number
  owed_count: number
  overdue_total: number
  overdue_count: number
  overdue_top: WeekOverdue[]
  quotes_sent_count: number
  quotes_sent_value: number
  quotes_expiring: WeekQuote[]
  leads_new: number
  leads_cold: number
  followups_due: number
  recap_jobs: number
  recap_revenue: number
  recap_profit: number
}

type Summary = {
  quotes_by_status?: Record<string, { count: number; value: number }>
  quotes_expiring?: WeekQuote[]
  invoices_outstanding_total?: number
  invoices_outstanding_count?: number
  invoices_overdue_total?: number
  invoices_overdue?: WeekOverdue[]
  completed_jobs?: number
  completed_revenue_ex_vat?: number
  completed_gross_profit?: number
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const R = (n: number) => `R${groupThousands(n)}`

/** True when today (South African time) is a Monday. */
export function isMondaySAST(now: Date = new Date()): boolean {
  return now.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'Africa/Johannesburg' }) === 'Monday'
}

const niceDay = (date: string) => new Date(`${date}T12:00:00Z`).toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })

async function summaryOf(db: SupabaseClient, sinceDays: number): Promise<Summary> {
  const res = await handlersA.ngms_business_summary(db, { since_days: sinceDays })
  if (res.isError) throw new Error(res.content[0]?.text ?? 'Could not load the business summary')
  return (res.structuredContent ?? {}) as Summary
}

async function countOf(q: PromiseLike<{ count: number | null; error: { message: string } | null }>): Promise<number> {
  const { count, error } = await q
  if (error) throw new Error(error.message)
  return count ?? 0
}

/** Gathers everything the week-ahead email needs. */
export async function collectWeekAhead(db: SupabaseClient, forecast: WxDay[]): Promise<WeekAheadData> {
  const from = todaySAST()
  const to = addDaysSAST(6)
  const now = Date.now()

  const { data: jobRows, error: jobError } = await db
    .from('jobs')
    .select('id,title,description,status,scheduled_date,client_id')
    .in('status', ['scheduled', 'in_progress', 'on_hold'])
    .gte('scheduled_date', from)
    .lte('scheduled_date', to)
    .order('scheduled_date', { ascending: true })
    .limit(60)
  if (jobError) throw new Error(jobError.message)
  const clientIds = Array.from(new Set((jobRows ?? []).map((j) => j.client_id).filter(Boolean))) as string[]
  const { data: clients } = clientIds.length ? await db.from('clients').select('id,name,suburb').in('id', clientIds) : { data: [] }
  const clientById = new Map((clients ?? []).map((c) => [c.id, c]))
  const jobs: WeekJob[] = (jobRows ?? []).map((j) => {
    const c = j.client_id ? clientById.get(j.client_id) : undefined
    return {
      id: j.id,
      title: j.title,
      date: j.scheduled_date,
      client_name: c?.name ?? null,
      suburb: c?.suburb ?? null,
      status: j.status,
      warning: jobWeather(`${j.title ?? ''} ${j.description ?? ''}`, j.scheduled_date, forecast)?.note ?? null,
    }
  })

  const [year, week] = await Promise.all([summaryOf(db, 365), summaryOf(db, 7)])
  const open = '(won,lost)'
  const [leadsNew, leadsCold, followups] = await Promise.all([
    countOf(db.from('leads').select('id', { count: 'exact', head: true }).gte('created_at', new Date(now - 7 * 86400000).toISOString())),
    countOf(db.from('leads').select('id', { count: 'exact', head: true }).not('status', 'in', open).lt('updated_at', new Date(now - 3 * 86400000).toISOString())),
    countOf(db.from('leads').select('id', { count: 'exact', head: true }).not('status', 'in', open).not('follow_up_at', 'is', null).lte('follow_up_at', to)),
  ])

  const overdue = year.invoices_overdue ?? []
  return {
    from,
    to,
    jobs,
    owed_total: year.invoices_outstanding_total ?? 0,
    owed_count: year.invoices_outstanding_count ?? 0,
    overdue_total: year.invoices_overdue_total ?? 0,
    overdue_count: overdue.length,
    overdue_top: overdue.slice(0, 3),
    quotes_sent_count: year.quotes_by_status?.sent?.count ?? 0,
    quotes_sent_value: year.quotes_by_status?.sent?.value ?? 0,
    quotes_expiring: (year.quotes_expiring ?? []).slice(0, 5),
    leads_new: leadsNew,
    leads_cold: leadsCold,
    followups_due: followups,
    recap_jobs: week.completed_jobs ?? 0,
    recap_revenue: week.completed_revenue_ex_vat ?? 0,
    recap_profit: week.completed_gross_profit ?? 0,
  }
}

/** Subject, HTML and plain text for the week-ahead email. */
export function buildWeekAheadEmail(d: WeekAheadData, siteUrl: string): { subject: string; html: string; text: string } {
  const jobWord = `${d.jobs.length} job${d.jobs.length === 1 ? '' : 's'}`
  const subject = `Week ahead: ${jobWord} · ${R(d.owed_total)} owed`
  const range = `${niceDay(d.from)} to ${niceDay(d.to)}`

  const h = (t: string) => `<p style="margin:18px 0 6px;font-size:16px"><strong>${t}</strong></p>`
  const line = (t: string, warn = false) => `<div style="margin:3px 0;${warn ? 'color:#b91c1c;font-weight:bold' : ''}">${t}</div>`
  const link = (href: string, label: string) => `<a href="${href}">${esc(label)}</a>`

  const jobLines = d.jobs.map(
    (j) =>
      line(`<strong>${esc(niceDay(j.date))}</strong> · ${link(`${siteUrl}/admin/jobs/${j.id}`, j.title ?? 'Job')} · ${esc(j.client_name ?? 'client not set')}${j.suburb ? `, ${esc(j.suburb)}` : ''}`) +
      (j.warning ? line(`⚠ ${esc(j.warning)}`, true) : ''),
  )

  const html = `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5;max-width:600px">
<p style="margin:0 0 4px;font-size:18px"><strong>Your week ahead</strong></p>
<div style="color:#555">${esc(range)}</div>
${h(`This week's jobs (${d.jobs.length})`)}
${jobLines.length ? jobLines.join('') : line('Nothing booked yet this week.')}
${h('Money')}
${line(`Owed to you: <strong>${R(d.owed_total)}</strong> across ${d.owed_count} invoice${d.owed_count === 1 ? '' : 's'}`)}
${line(`Overdue: <strong>${R(d.overdue_total)}</strong> (${d.overdue_count})`, d.overdue_total > 0)}
${d.overdue_top.map((i) => line(`&nbsp;&nbsp;${link(`${siteUrl}/admin/invoices/${i.id}`, i.invoice_number)} · ${esc(i.client ?? 'client not set')} · ${R(i.balance)} · ${i.days_overdue}d overdue`)).join('')}
${line(`Quotes waiting for an answer: <strong>${d.quotes_sent_count}</strong> (${R(d.quotes_sent_value)})`)}
${d.quotes_expiring.map((q) => line(`&nbsp;&nbsp;${link(`${siteUrl}/admin/quotes/${q.id}`, q.quote_number)} · ${esc(q.client ?? 'client not set')} · valid until ${esc(q.valid_until ?? '')}`)).join('')}
${h('Leads')}
${line(`New in the last 7 days: <strong>${d.leads_new}</strong>`)}
${line(`Untouched for 3+ days: <strong>${d.leads_cold}</strong>`, d.leads_cold > 0)}
${line(`Follow-ups due this week: <strong>${d.followups_due}</strong>`)}
${h('Last 7 days')}
${line(`Jobs completed: <strong>${d.recap_jobs}</strong> · Revenue ex VAT: ${R(d.recap_revenue)} · Profit: ${R(d.recap_profit)}`)}
<div style="color:#777;font-size:12px;margin-top:2px">Profit only counts the costs you have logged against each job.</div>
<p style="font-size:12px;color:#777;margin-top:18px">Quotes shown as expiring include any already past their valid date. These figures match your admin dashboard.</p>
</div>`

  const text = [
    `Your week ahead (${range})`,
    '',
    `This week's jobs (${d.jobs.length}):`,
    ...(d.jobs.length
      ? d.jobs.flatMap((j) => [`- ${niceDay(j.date)} · ${j.title ?? 'Job'} · ${j.client_name ?? 'client not set'}${j.suburb ? `, ${j.suburb}` : ''}`, ...(j.warning ? [`  WARNING: ${j.warning}`] : [])])
      : ['Nothing booked yet this week.']),
    '',
    'Money:',
    `- Owed to you: ${R(d.owed_total)} across ${d.owed_count} invoice${d.owed_count === 1 ? '' : 's'}`,
    `- Overdue: ${R(d.overdue_total)} (${d.overdue_count})`,
    ...d.overdue_top.map((i) => `    ${i.invoice_number} · ${i.client ?? 'client not set'} · ${R(i.balance)} · ${i.days_overdue}d overdue`),
    `- Quotes waiting for an answer: ${d.quotes_sent_count} (${R(d.quotes_sent_value)})`,
    ...d.quotes_expiring.map((q) => `    ${q.quote_number} · ${q.client ?? 'client not set'} · valid until ${q.valid_until ?? ''}`),
    '',
    'Leads:',
    `- New in the last 7 days: ${d.leads_new}`,
    `- Untouched for 3+ days: ${d.leads_cold}`,
    `- Follow-ups due this week: ${d.followups_due}`,
    '',
    `Last 7 days: ${d.recap_jobs} job${d.recap_jobs === 1 ? '' : 's'} completed · revenue ex VAT ${R(d.recap_revenue)} · profit ${R(d.recap_profit)} (counts only the costs you have logged)`,
  ].join('\n')

  return { subject, html, text }
}

/** Collects the week's numbers and emails them to the owner. Throws on failure. */
export async function sendWeekAheadEmail(db: SupabaseClient): Promise<{ jobs: number }> {
  const forecast = (await getWeather())?.days ?? [] // empty if the forecast is down: jobs still listed
  const data = await collectWeekAhead(db, forecast)
  const { subject, html, text } = buildWeekAheadEmail(data, site.url)
  const { error } = await new Resend(process.env.RESEND_API_KEY).emails.send({ from: REPLY_FROM, to: NOTIFY_TO, subject, html, text })
  if (error) throw new Error(error.message)
  return { jobs: data.jobs.length }
}
