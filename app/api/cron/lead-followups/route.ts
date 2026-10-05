import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { REPLY_FROM, NOTIFY_TO } from '@/lib/lead-email'
import { buildFollowUpEmail, type DueInvoice, type DueLead, type DueQuote, type UpcomingJob } from '@/lib/lead-followup-email'
import { getWeather } from '@/lib/helderberg'
import { jobWeather } from '@/lib/job-weather-core'
import { balanceOwed, invoiceChaseDay } from '@/lib/invoice-followup'
import { quoteRemindersDue, sastDateOf } from '@/lib/quote-followup'
import { addDaysSAST, todaySAST } from '@/lib/ngms-leads-ui'
import { site } from '@/lib/site'

export const dynamic = 'force-dynamic'

// Daily cron (vercel.json, 06:00 UTC = 08:00 SAST). Emails the owner one digest of:
//  - jobs scheduled for today and tomorrow, with a rain/wind warning from the forecast
//  - open leads whose follow-up date is today or earlier
//  - sent quotes hitting a reminder day (3 and 7 days after sending, 2 days before expiry)
//  - unpaid invoices on a chase day (3, 7, 14 days overdue, then every 14 days)
// Sends nothing when none are due.
// Requires CRON_SECRET (same as plan-reminders); Vercel sends it as a bearer token.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  const db = supabaseAdmin()
  const { data, error } = await db
    .from('leads')
    .select('id,name,phone,service,service_slug,suburb,status,notes,follow_up_at')
    .not('status', 'in', '(won,lost)')
    .not('follow_up_at', 'is', null)
    .lte('follow_up_at', todaySAST())
    .order('follow_up_at', { ascending: true })
    .limit(50)
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })

  const due = (data ?? []) as DueLead[]

  // Quotes still awaiting an answer. "Sent" date = latest sent version, else the quote's last update.
  const today = todaySAST()
  const dueQuotes: DueQuote[] = []
  const { data: sentQuotes, error: quoteError } = await db
    .from('quotes')
    .select('id,quote_number,client_id,total_amount,valid_until,updated_at')
    .eq('status', 'sent')
    .limit(200)
  if (quoteError) return NextResponse.json({ ok: false, error: quoteError.message }, { status: 500 })
  if (sentQuotes?.length) {
    const ids = sentQuotes.map((q) => q.id)
    const { data: versions } = await db
      .from('quote_versions')
      .select('quote_id,version_number,sent_at')
      .in('quote_id', ids)
      .eq('version_status', 'sent')
      .not('sent_at', 'is', null)
      .order('version_number', { ascending: false })
    const sentAt = new Map<string, string>()
    for (const v of versions ?? []) if (!sentAt.has(v.quote_id) && v.sent_at) sentAt.set(v.quote_id, v.sent_at)

    const clientIds = Array.from(new Set(sentQuotes.map((q) => q.client_id).filter(Boolean))) as string[]
    const { data: clients } = clientIds.length ? await db.from('clients').select('id,name,phone').in('id', clientIds) : { data: [] }
    const byId = new Map((clients ?? []).map((c) => [c.id, c]))

    for (const q of sentQuotes) {
      const sent = sentAt.get(q.id) ?? q.updated_at
      if (!sent) continue
      const reminders = quoteRemindersDue(sastDateOf(sent), q.valid_until, today)
      if (!reminders.length) continue
      const c = q.client_id ? byId.get(q.client_id) : undefined
      dueQuotes.push({
        id: q.id,
        quote_number: q.quote_number,
        client_name: c?.name ?? null,
        client_phone: c?.phone ?? null,
        total_amount: q.total_amount == null ? null : Number(q.total_amount),
        valid_until: q.valid_until,
        reminders,
      })
    }
  }

  // Unpaid invoices past their due date, on a chase day.
  const dueInvoices: DueInvoice[] = []
  const { data: openInvoices, error: invoiceError } = await db
    .from('invoices')
    .select('id,invoice_number,client_id,total_amount,paid_amount,due_date')
    .not('status', 'in', '(paid,void,draft)')
    .not('due_date', 'is', null)
    .lt('due_date', today)
    .limit(200)
  if (invoiceError) return NextResponse.json({ ok: false, error: invoiceError.message }, { status: 500 })
  const chase = (openInvoices ?? [])
    .map((inv) => ({ inv, day: invoiceChaseDay(inv.due_date, today), balance: balanceOwed(inv.total_amount, inv.paid_amount) }))
    .filter((x) => x.day !== null && x.balance > 0)
  if (chase.length) {
    const ids = Array.from(new Set(chase.map((x) => x.inv.client_id).filter(Boolean))) as string[]
    const { data: invClients } = ids.length ? await db.from('clients').select('id,name,phone').in('id', ids) : { data: [] }
    const byClient = new Map((invClients ?? []).map((c) => [c.id, c]))
    for (const { inv, day, balance } of chase) {
      const c = inv.client_id ? byClient.get(inv.client_id) : undefined
      dueInvoices.push({
        id: inv.id,
        invoice_number: inv.invoice_number,
        client_name: c?.name ?? null,
        client_phone: c?.phone ?? null,
        total_amount: Number(inv.total_amount) || 0,
        paid_amount: Number(inv.paid_amount) || 0,
        balance,
        days_overdue: day as number,
      })
    }
  }

  // Jobs today and tomorrow, with a forecast warning where the weather says hold.
  const tomorrow = addDaysSAST(1)
  const upcomingJobs: UpcomingJob[] = []
  const { data: jobRows, error: jobError } = await db
    .from('jobs')
    .select('id,title,description,status,scheduled_date,client_id,created_at')
    .in('scheduled_date', [today, tomorrow])
    .not('status', 'in', '(completed,cancelled)')
    .order('scheduled_date', { ascending: true })
    .order('created_at', { ascending: true })
    .limit(50)
  if (jobError) return NextResponse.json({ ok: false, error: jobError.message }, { status: 500 })
  if (jobRows?.length) {
    const forecast = (await getWeather())?.days ?? [] // empty if the forecast is down: jobs still listed
    const jobClientIds = Array.from(new Set(jobRows.map((j) => j.client_id).filter(Boolean))) as string[]
    const { data: jobClients } = jobClientIds.length ? await db.from('clients').select('id,name,phone,suburb,address').in('id', jobClientIds) : { data: [] }
    const jobClient = new Map((jobClients ?? []).map((c) => [c.id, c]))
    for (const j of jobRows) {
      const c = j.client_id ? jobClient.get(j.client_id) : undefined
      upcomingJobs.push({
        id: j.id,
        title: j.title,
        when: j.scheduled_date === today ? 'today' : 'tomorrow',
        status: j.status,
        client_name: c?.name ?? null,
        client_phone: c?.phone ?? null,
        suburb: c?.suburb ?? null,
        address: c?.address ?? null,
        warning: jobWeather(`${j.title ?? ''} ${j.description ?? ''}`, j.scheduled_date, forecast)?.note ?? null,
      })
    }
  }

  if (!due.length && !dueQuotes.length && !dueInvoices.length && !upcomingJobs.length) return NextResponse.json({ ok: true, due: 0, quotes: 0, invoices: 0, jobs: 0, sent: false })

  const { subject, html, text } = buildFollowUpEmail(due, site.url, dueQuotes, dueInvoices, upcomingJobs)
  const { error: sendError } = await new Resend(process.env.RESEND_API_KEY).emails.send({
    from: REPLY_FROM,
    to: NOTIFY_TO,
    subject,
    html,
    text,
  })
  if (sendError) {
    console.error('lead follow-up email failed', sendError.message)
    return NextResponse.json({ ok: false, due: due.length, quotes: dueQuotes.length, invoices: dueInvoices.length, jobs: upcomingJobs.length, error: sendError.message }, { status: 502 })
  }
  return NextResponse.json({ ok: true, due: due.length, quotes: dueQuotes.length, invoices: dueInvoices.length, jobs: upcomingJobs.length, sent: true })
}
