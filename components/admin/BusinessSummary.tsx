'use client'

import { useCallback, useEffect, useState } from 'react'
import { Loader2, RefreshCw, AlertTriangle, MessageCircle } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { handlersA } from '@/lib/ngms-ops/handlers-a'
import { rand } from '@/lib/ngms-ops/core'

/**
 * Business summary for the admin dashboard.
 * Uses the same logic as the NGSMS Ops connector (lib/ngms-ops) with the
 * signed-in admin's Supabase session, so the numbers always match what
 * Claude reports. Leads come straight from the leads table.
 */

type Lead = { id: string; name: string; phone: string; suburb: string | null; service: string | null; service_slug: string | null; status: string; source: string; created_at: string; updated_at: string }
type Summary = {
  quotes_by_status: Record<string, { count: number; value: number }>
  quote_win_rate_percent: number | null
  quotes_expiring: { id: string; quote_number: string; client: string | null; valid_until: string | null }[]
  invoices_outstanding_total: number
  invoices_outstanding_count: number
  invoices_overdue_total: number
  invoices_overdue: { id: string; invoice_number: string; client: string | null; balance: number; days_overdue: number }[]
  draft_invoices: number
  collected_in_window: number
  jobs_by_status: Record<string, number>
  jobs_next_14_days: { id: string; title: string | null; client: string | null; scheduled_date: string | null; status: string }[]
  completed_jobs: number
  completed_revenue_ex_vat: number
  completed_cost: number
  completed_gross_profit: number
}

const WINDOWS = [30, 90, 365] as const
const STALE_DAYS = 3

function waLink(phone: string): string | null {
  let d = phone.replace(/\D/g, '')
  if (/^0\d{9}$/.test(d)) d = '27' + d.slice(1)
  return /^27\d{9}$/.test(d) ? `https://wa.me/${d}` : null
}

function daysAgo(iso: string): number {
  return Math.floor((Date.now() - Date.parse(iso)) / 86400000)
}

function Tile({ label, value, sub, warn }: { label: string; value: string; sub?: string; warn?: boolean }) {
  return (
    <div className="bg-jet border border-darkgrey rounded-card p-3 sm:p-4 min-w-0">
      <p className="text-xs text-mist uppercase tracking-wide">{label}</p>
      <p className={`font-heading text-xl sm:text-2xl font-bold mt-1 whitespace-nowrap ${warn ? 'text-orange' : 'text-paper'}`}>{value}</p>
      {sub && <p className="text-xs text-mist mt-1">{sub}</p>}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-6">
      <h3 className="font-heading font-bold text-paper mb-2">{title}</h3>
      {children}
    </div>
  )
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-mist">{children}</p>
}

export default function BusinessSummary() {
  const [windowDays, setWindowDays] = useState<(typeof WINDOWS)[number]>(90)
  const [summary, setSummary] = useState<Summary | null>(null)
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const since = new Date(Date.now() - windowDays * 86400000).toISOString()
      const [res, leadRes] = await Promise.all([
        handlersA.ngms_business_summary(supabase, { since_days: windowDays }),
        supabase
          .from('leads')
          .select('id,name,phone,suburb,service,service_slug,status,source,created_at,updated_at')
          .gte('created_at', since)
          .order('created_at', { ascending: false })
          .limit(2000),
      ])
      if (res.isError) throw new Error(res.content[0]?.text ?? 'Could not load summary')
      if (leadRes.error) throw new Error(leadRes.error.message)
      setSummary(res.structuredContent as unknown as Summary)
      setLeads((leadRes.data ?? []) as Lead[])
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [windowDays])

  useEffect(() => {
    load()
  }, [load])

  const openLeads = leads.filter((l) => !['won', 'lost'].includes(l.status))
  const newWeek = leads.filter((l) => daysAgo(l.created_at) < 7).length
  const stale = openLeads
    .filter((l) => daysAgo(l.updated_at) >= STALE_DAYS)
    .sort((a, b) => Date.parse(a.updated_at) - Date.parse(b.updated_at))
  const won = leads.filter((l) => l.status === 'won').length
  const lost = leads.filter((l) => l.status === 'lost').length
  const leadWinRate = won + lost ? Math.round((won / (won + lost)) * 100) : null

  const q = summary?.quotes_by_status ?? {}
  const openQuoteValue = (q.draft?.value ?? 0) + (q.sent?.value ?? 0)
  const openQuoteCount = (q.draft?.count ?? 0) + (q.sent?.count ?? 0)
  const rev = summary?.completed_revenue_ex_vat ?? 0
  const margin = rev > 0 ? Math.round(((summary?.completed_gross_profit ?? 0) / rev) * 100) : null

  return (
    <div className="bg-cardgrey border border-darkgrey rounded-card p-4 sm:p-6 mb-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="font-heading text-xl font-bold text-paper">Business summary</h2>
          <p className="text-xs text-mist">Prices ex VAT · same numbers as the NGSMS Ops connector</p>
        </div>
        <div className="flex items-center gap-2">
          {WINDOWS.map((w) => (
            <button
              key={w}
              onClick={() => setWindowDays(w)}
              className={`text-xs px-3 py-1.5 rounded-btn border ${w === windowDays ? 'border-orange text-orange' : 'border-darkgrey text-mist hover:text-paper'}`}
            >
              {w === 365 ? '12 mo' : `${w} days`}
            </button>
          ))}
          <button onClick={load} aria-label="Refresh" className="text-mist hover:text-paper p-1.5">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <p className="text-sm text-orange flex items-center gap-2 mb-4">
          <AlertTriangle className="w-4 h-4" /> {error}
        </p>
      )}

      {loading && !summary ? (
        <div className="py-10 flex justify-center">
          <Loader2 className="w-5 h-5 text-mist animate-spin" />
        </div>
      ) : summary ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Tile label="New leads (7 days)" value={String(newWeek)} sub={`${openLeads.length} open · ${leads.length} in window`} />
            <Tile label="Open quotes" value={rand(openQuoteValue)} sub={`${openQuoteCount} draft/sent${summary.quote_win_rate_percent !== null ? ` · ${summary.quote_win_rate_percent}% win rate` : ''}`} />
            <Tile label="Owed to you" value={rand(summary.invoices_outstanding_total)} sub={`${summary.invoices_outstanding_count} invoice(s)${summary.draft_invoices ? ` · ${summary.draft_invoices} draft` : ''}`} />
            <Tile label="Overdue" value={rand(summary.invoices_overdue_total)} sub={`${summary.invoices_overdue.length} invoice(s)`} warn={summary.invoices_overdue_total > 0} />
            <Tile label="Collected" value={rand(summary.collected_in_window)} sub="on invoices issued in window" />
            <Tile label="Jobs next 14 days" value={String(summary.jobs_next_14_days.length)} sub={`${summary.jobs_by_status.in_progress ?? 0} in progress · ${summary.jobs_by_status.on_hold ?? 0} on hold`} />
            <Tile label="Completed-job profit" value={rand(summary.completed_gross_profit)} sub={`${summary.completed_jobs} job(s)${margin !== null ? ` · ${margin}% margin` : ''}`} warn={margin !== null && margin < 25} />
            <Tile label="Lead win rate" value={leadWinRate !== null ? `${leadWinRate}%` : '—'} sub={`${won} won · ${lost} lost`} />
          </div>

          <Section title={`Follow up — open leads untouched ${STALE_DAYS}+ days`}>
            {stale.length ? (
              <ul className="divide-y divide-darkgrey">
                {stale.slice(0, 10).map((l) => {
                  const wa = waLink(l.phone)
                  return (
                    <li key={l.id} className="py-2 flex items-center justify-between gap-3 text-sm">
                      <div className="min-w-0">
                        <p className="text-paper truncate">{l.name} · {l.service ?? l.service_slug ?? 'service not given'}</p>
                        <p className="text-xs text-mist truncate">{l.suburb ?? 'area not given'} · {l.status} · {daysAgo(l.updated_at)} days since last touch</p>
                      </div>
                      {wa && (
                        <a href={wa} target="_blank" rel="noreferrer" className="shrink-0 inline-flex items-center gap-1 text-xs text-whatsapp hover:text-whatsapp-dark">
                          <MessageCircle className="w-4 h-4" /> WhatsApp
                        </a>
                      )}
                    </li>
                  )
                })}
              </ul>
            ) : (
              <Empty>No open leads waiting. 👍</Empty>
            )}
          </Section>

          <Section title="Overdue invoices">
            {summary.invoices_overdue.length ? (
              <ul className="divide-y divide-darkgrey">
                {summary.invoices_overdue.slice(0, 10).map((i) => (
                  <li key={i.id} className="py-2 flex justify-between gap-3 text-sm">
                    <span className="text-paper">{i.invoice_number} · {i.client ?? '—'}</span>
                    <span className="text-orange shrink-0">{rand(i.balance)} · {i.days_overdue}d</span>
                  </li>
                ))}
              </ul>
            ) : (
              <Empty>Nothing overdue.</Empty>
            )}
          </Section>

          <Section title="Booked — next 14 days">
            {summary.jobs_next_14_days.length ? (
              <ul className="divide-y divide-darkgrey">
                {summary.jobs_next_14_days.map((j) => (
                  <li key={j.id} className="py-2 flex justify-between gap-3 text-sm">
                    <span className="text-paper truncate">{j.title ?? 'Untitled'} · {j.client ?? '—'}</span>
                    <span className="text-mist shrink-0">{j.scheduled_date} · {j.status.replace('_', ' ')}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <Empty>Nothing booked in the next 14 days.</Empty>
            )}
          </Section>

          {summary.quotes_expiring.length > 0 && (
            <Section title="Sent quotes expiring within 7 days">
              <ul className="divide-y divide-darkgrey">
                {summary.quotes_expiring.map((x) => (
                  <li key={x.id} className="py-2 flex justify-between gap-3 text-sm">
                    <span className="text-paper">{x.quote_number} · {x.client ?? '—'}</span>
                    <span className="text-mist shrink-0">valid until {x.valid_until}</span>
                  </li>
                ))}
              </ul>
            </Section>
          )}
        </>
      ) : null}
    </div>
  )
}
