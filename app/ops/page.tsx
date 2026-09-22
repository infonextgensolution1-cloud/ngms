'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Loader2,
  RefreshCw,
  AlertTriangle,
  MessageCircle,
  Phone,
  CloudRain,
  Sun,
  Cloud,
  Play,
  Pause,
  CheckCircle2,
  LayoutDashboard,
} from 'lucide-react'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { supabase } from '@/lib/supabaseClient'
import { handlersA } from '@/lib/ngms-ops/handlers-a'
import { handlersB } from '@/lib/ngms-ops/handlers-b'
import { rand, type ToolResult } from '@/lib/ngms-ops/core'

/**
 * /ops — mobile-first daily ops screen for NGSMS.
 * Runs the same handlers as the NGSMS Ops connector (lib/ngms-ops) with the
 * signed-in admin's Supabase session, so the numbers match what Claude reports.
 *
 * Shows: 5-day Strand weather (Open-Meteo, no API key), today's and next-7-day
 * jobs with one-tap Start / Hold / Done, rain warnings for paint, waterproofing
 * and paving jobs, new leads waiting for a reply, unpaid invoices, open quotes.
 */

type AnyRec = Record<string, unknown>
type Job = { id: string; title: string | null; status: string; scheduled_date: string | null; client: string | null; suburb: string | null; phone: string | null }
type Invoice = { id: string; invoice_number: string; client: string | null; balance: number; due_date: string | null; overdue: boolean }
type Quote = { id: string; quote_number: string; client: string | null; total: number; status: string; expired: boolean }
type Lead = { id: string; name: string; phone: string | null; suburb: string | null; service: string | null; service_slug: string | null; created_at: string }
type Day = { date: string; rainProb: number; code: number; tMax: number }

const STRAND = { lat: -34.11, lon: 18.83 }
const RAIN_HOLD_PROB = 60 // % chance of rain that flags a weather hold
const RAIN_SENSITIVE = /paint|waterproof|pav|seal|roof|lining/i

function sastDate(offsetDays = 0): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Johannesburg' }).format(new Date(Date.now() + offsetDays * 86400000))
}

function fmtDay(iso: string): string {
  const d = iso.slice(0, 10)
  if (d === sastDate()) return 'Today'
  if (d === sastDate(1)) return 'Tomorrow'
  if (d === sastDate(-1)) return 'Yesterday'
  return new Date(d + 'T12:00:00').toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short' })
}

function waLink(phone: string | null | undefined): string | null {
  if (!phone) return null
  let d = phone.replace(/\D/g, '')
  if (/^0\d{9}$/.test(d)) d = '27' + d.slice(1)
  return /^27\d{9}$/.test(d) ? `https://wa.me/${d}` : null
}

function num(v: unknown): number {
  const n = typeof v === 'number' ? v : parseFloat(String(v ?? 0))
  return Number.isFinite(n) ? n : 0
}

function rows(res: ToolResult, key: string): AnyRec[] {
  if (res.isError) throw new Error(res.content?.[0]?.text ?? `Could not load ${key}`)
  return ((res.structuredContent ?? {})[key] as AnyRec[]) ?? []
}

function WeatherIcon({ code, prob }: { code: number; prob: number }) {
  if (prob >= RAIN_HOLD_PROB || (code >= 51 && code <= 99)) return <CloudRain className="w-5 h-5 text-blue" />
  if (code >= 2) return <Cloud className="w-5 h-5 text-mist" />
  return <Sun className="w-5 h-5 text-orange" />
}

function Card({ title, right, children }: { title: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="bg-cardgrey border border-darkgrey rounded-card p-4 mb-4">
      <div className="flex items-center justify-between gap-3 mb-3">
        <h2 className="font-heading font-bold text-paper text-lg">{title}</h2>
        {right}
      </div>
      {children}
    </section>
  )
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-mist">{children}</p>
}

const STATUS_STYLE: Record<string, string> = {
  scheduled: 'text-mist border-darkgrey',
  in_progress: 'text-orange border-orange',
  on_hold: 'text-blue border-blue',
}

export default function OpsPage() {
  const { session, checking } = useAdminAuth()
  const [jobs, setJobs] = useState<Job[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [leads, setLeads] = useState<Lead[]>([])
  const [days, setDays] = useState<Day[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [updatedAt, setUpdatedAt] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [jobRes, invRes, quoteRes, leadRes] = await Promise.all([
        handlersB.ngms_list_jobs(supabase, { open_only: true, limit: 100 }),
        handlersB.ngms_list_invoices(supabase, { unpaid_only: true, limit: 50 }),
        handlersA.ngms_list_quotes(supabase, { open_only: true, limit: 50 }),
        supabase
          .from('leads')
          .select('id,name,phone,suburb,service,service_slug,created_at')
          .eq('status', 'new')
          .order('created_at', { ascending: false })
          .limit(20),
      ])

      setJobs(
        rows(jobRes, 'jobs')
          .map((r) => ({
            id: String(r.id),
            title: (r.title as string) ?? null,
            status: String(r.status ?? 'scheduled'),
            scheduled_date: (r.scheduled_date as string) ?? null,
            client: (r.client_name as string) ?? null,
            suburb: (r.client_suburb as string) ?? null,
            phone: (r.client_phone as string) ?? null,
          }))
          .sort((a, b) => (a.scheduled_date ?? '9999').localeCompare(b.scheduled_date ?? '9999')),
      )
      setInvoices(
        rows(invRes, 'invoices')
          .filter((r) => r.status !== 'draft')
          .map((r) => ({
            id: String(r.id),
            invoice_number: String(r.invoice_number ?? ''),
            client: (r.client_name as string) ?? null,
            balance: num(r.balance),
            due_date: (r.due_date as string) ?? null,
            overdue: r.overdue === true,
          })),
      )
      setQuotes(
        rows(quoteRes, 'quotes').map((r) => ({
          id: String(r.id),
          quote_number: String(r.quote_number ?? ''),
          client: (r.client_name as string) ?? null,
          total: num(r.total),
          status: String(r.status ?? ''),
          expired: r.past_valid_date === true,
        })),
      )
      if (leadRes.error) throw new Error(leadRes.error.message)
      setLeads((leadRes.data ?? []) as Lead[])
      setUpdatedAt(new Date().toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Johannesburg' }))
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }

    // Weather is best-effort: the page still works if this fails.
    try {
      const url =
        `https://api.open-meteo.com/v1/forecast?latitude=${STRAND.lat}&longitude=${STRAND.lon}` +
        '&daily=weather_code,precipitation_probability_max,temperature_2m_max&timezone=Africa%2FJohannesburg&forecast_days=5'
      const w = await fetch(url).then((r) => r.json())
      const d = w?.daily
      if (Array.isArray(d?.time)) {
        setDays(
          d.time.map((t: string, i: number) => ({
            date: t,
            rainProb: num(d.precipitation_probability_max?.[i]),
            code: num(d.weather_code?.[i]),
            tMax: Math.round(num(d.temperature_2m_max?.[i])),
          })),
        )
      }
    } catch {
      /* ignore weather errors */
    }
  }, [])

  useEffect(() => {
    if (session) load()
  }, [session, load])

  async function setJobStatus(job: Job, status: 'in_progress' | 'on_hold' | 'completed') {
    if (status === 'completed' && !confirm(`Mark "${job.title ?? 'this job'}" as completed today?`)) return
    setBusy(job.id)
    try {
      const res = await handlersB.ngms_update_job(supabase, { job_id: job.id, status })
      if (res.isError) throw new Error(res.content?.[0]?.text ?? 'Update failed')
      await load()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(null)
    }
  }

  const today = sastDate()
  const weekOut = sastDate(7)
  const rainByDate = useMemo(() => Object.fromEntries(days.map((d) => [d.date, d])), [days])
  const isWetHold = (j: Job) => {
    if (!j.scheduled_date || !RAIN_SENSITIVE.test(j.title ?? '')) return false
    const d = rainByDate[j.scheduled_date]
    return !!d && d.rainProb >= RAIN_HOLD_PROB
  }

  const todayJobs = jobs.filter((j) => j.status === 'in_progress' || (j.scheduled_date !== null && j.scheduled_date <= today))
  const upcoming = jobs.filter((j) => !todayJobs.includes(j) && j.scheduled_date !== null && j.scheduled_date <= weekOut)
  const unscheduled = jobs.filter((j) => !j.scheduled_date && j.status !== 'in_progress')
  const holds = jobs.filter(isWetHold)
  const owed = invoices.reduce((s, i) => s + i.balance, 0)
  const overdue = invoices.filter((i) => i.overdue)
  const overdueTotal = overdue.reduce((s, i) => s + i.balance, 0)
  const openQuoteTotal = quotes.reduce((s, q) => s + q.total, 0)

  if (checking) {
    return (
      <main className="min-h-[60vh] flex items-center justify-center bg-jet">
        <Loader2 className="w-6 h-6 text-mist animate-spin" />
      </main>
    )
  }

  if (!session) {
    return (
      <main className="min-h-[60vh] flex items-center justify-center bg-jet px-4 py-16">
        <div className="w-full max-w-sm bg-cardgrey border border-darkgrey rounded-card p-8 text-center">
          <h1 className="font-heading text-2xl font-bold text-paper mb-2">Ops</h1>
          <p className="text-sm text-mist mb-6">Staff only. Sign in, then come back to /ops.</p>
          <Link href="/admin" className="inline-block bg-blue hover:bg-blue-dark text-white font-heading font-semibold px-6 py-3 rounded-btn">
            Staff login
          </Link>
        </div>
      </main>
    )
  }

  const renderJob = (j: Job) => {
    const wa = waLink(j.phone)
    const rain = j.scheduled_date ? rainByDate[j.scheduled_date] : undefined
    return (
      <li key={j.id} className="py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-paper font-semibold truncate">{j.title ?? 'Untitled job'}</p>
            <p className="text-xs text-mist truncate">
              {j.client ?? 'No client'}
              {j.suburb ? `, ${j.suburb}` : ''} · {j.scheduled_date ? fmtDay(j.scheduled_date) : 'not scheduled'}
            </p>
            {isWetHold(j) && rain && (
              <p className="text-xs text-blue mt-1 flex items-center gap-1">
                <CloudRain className="w-3.5 h-3.5" /> {rain.rainProb}% chance of rain: consider a weather hold
              </p>
            )}
          </div>
          <span className={`shrink-0 text-[10px] uppercase tracking-wider border rounded px-2 py-0.5 ${STATUS_STYLE[j.status] ?? 'text-mist border-darkgrey'}`}>
            {j.status.replace('_', ' ')}
          </span>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {j.status !== 'in_progress' && (
            <button disabled={busy === j.id} onClick={() => setJobStatus(j, 'in_progress')} className="inline-flex items-center gap-1 text-xs px-3 py-2 rounded-btn border border-orange text-orange disabled:opacity-50">
              <Play className="w-3.5 h-3.5" /> Start
            </button>
          )}
          {j.status !== 'on_hold' && (
            <button disabled={busy === j.id} onClick={() => setJobStatus(j, 'on_hold')} className="inline-flex items-center gap-1 text-xs px-3 py-2 rounded-btn border border-blue text-blue disabled:opacity-50">
              <Pause className="w-3.5 h-3.5" /> Hold
            </button>
          )}
          <button disabled={busy === j.id} onClick={() => setJobStatus(j, 'completed')} className="inline-flex items-center gap-1 text-xs px-3 py-2 rounded-btn border border-whatsapp text-whatsapp disabled:opacity-50">
            {busy === j.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />} Done
          </button>
          {wa && (
            <a href={wa} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs px-3 py-2 rounded-btn border border-darkgrey text-whatsapp">
              <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
            </a>
          )}
        </div>
      </li>
    )
  }

  return (
    <main className="min-h-[70vh] bg-jet px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="font-heading text-2xl font-bold text-paper">Ops</h1>
            <p className="text-xs text-mist">
              {new Date().toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Africa/Johannesburg' })}
              {updatedAt && ` · updated ${updatedAt}`}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <Link href="/admin" aria-label="Admin dashboard" className="text-mist hover:text-paper p-2">
              <LayoutDashboard className="w-5 h-5" />
            </Link>
            <button onClick={load} aria-label="Refresh" className="text-mist hover:text-paper p-2">
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {error && (
          <p className="text-sm text-orange flex items-start gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" /> {error}
          </p>
        )}

        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-cardgrey border border-darkgrey rounded-card p-3 min-w-0">
            <p className="text-[10px] text-mist uppercase tracking-wide">Today</p>
            <p className="font-heading text-xl font-bold text-paper">
              {todayJobs.length} job{todayJobs.length === 1 ? '' : 's'}
            </p>
          </div>
          <div className="bg-cardgrey border border-darkgrey rounded-card p-3 min-w-0">
            <p className="text-[10px] text-mist uppercase tracking-wide">Owed</p>
            <p className={`font-heading text-xl font-bold truncate ${overdueTotal > 0 ? 'text-orange' : 'text-paper'}`}>{rand(owed)}</p>
          </div>
          <div className="bg-cardgrey border border-darkgrey rounded-card p-3 min-w-0">
            <p className="text-[10px] text-mist uppercase tracking-wide">New leads</p>
            <p className={`font-heading text-xl font-bold ${leads.length ? 'text-orange' : 'text-paper'}`}>{leads.length}</p>
          </div>
        </div>

        {days.length > 0 && (
          <Card title="Weather: Strand">
            <div className="grid grid-cols-5 gap-1 text-center">
              {days.map((d) => (
                <div key={d.date} className={`rounded-btn py-2 ${d.rainProb >= RAIN_HOLD_PROB ? 'bg-blue/10 border border-blue/40' : ''}`}>
                  <p className="text-[11px] text-mist">{d.date === today ? 'Today' : new Date(d.date + 'T12:00:00').toLocaleDateString('en-ZA', { weekday: 'short' })}</p>
                  <div className="flex justify-center my-1">
                    <WeatherIcon code={d.code} prob={d.rainProb} />
                  </div>
                  <p className="text-xs text-paper">{d.tMax}°</p>
                  <p className={`text-[11px] ${d.rainProb >= RAIN_HOLD_PROB ? 'text-blue font-semibold' : 'text-mist'}`}>{d.rainProb}%</p>
                </div>
              ))}
            </div>
            {holds.length > 0 && (
              <p className="text-xs text-blue mt-3">
                {holds.length} painting, waterproofing or paving job{holds.length === 1 ? ' is' : 's are'} booked on a wet day. See below.
              </p>
            )}
          </Card>
        )}

        <Card title="Today & in progress">
          {loading && !jobs.length ? (
            <Loader2 className="w-5 h-5 text-mist animate-spin" />
          ) : todayJobs.length ? (
            <ul className="divide-y divide-darkgrey">{todayJobs.map(renderJob)}</ul>
          ) : (
            <Empty>Nothing booked for today.</Empty>
          )}
        </Card>

        <Card title="Next 7 days">
          {upcoming.length ? <ul className="divide-y divide-darkgrey">{upcoming.map(renderJob)}</ul> : <Empty>Nothing booked in the next 7 days.</Empty>}
          {unscheduled.length > 0 && <p className="text-xs text-mist mt-3">{unscheduled.length} open job(s) still need a date.</p>}
        </Card>

        <Card title="New leads: reply first">
          {leads.length ? (
            <ul className="divide-y divide-darkgrey">
              {leads.map((l) => {
                const wa = waLink(l.phone)
                return (
                  <li key={l.id} className="py-2 flex items-center justify-between gap-3 text-sm">
                    <div className="min-w-0">
                      <p className="text-paper truncate">
                        {l.name} · {l.service ?? l.service_slug ?? 'service not given'}
                      </p>
                      <p className="text-xs text-mist truncate">
                        {l.suburb ?? 'area not given'} · {fmtDay(new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Johannesburg' }).format(new Date(l.created_at)))}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      {l.phone && (
                        <a href={`tel:${l.phone}`} aria-label={`Call ${l.name}`} className="text-mist hover:text-paper p-1">
                          <Phone className="w-4 h-4" />
                        </a>
                      )}
                      {wa && (
                        <a href={wa} target="_blank" rel="noreferrer" aria-label={`WhatsApp ${l.name}`} className="text-whatsapp p-1">
                          <MessageCircle className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          ) : (
            <Empty>No new leads waiting. 👍</Empty>
          )}
        </Card>

        <Card title="Unpaid invoices" right={overdue.length ? <span className="text-xs text-orange">{overdue.length} overdue · {rand(overdueTotal)}</span> : undefined}>
          {invoices.length ? (
            <ul className="divide-y divide-darkgrey">
              {invoices.map((i) => (
                <li key={i.id} className="py-2 flex justify-between gap-3 text-sm">
                  <span className="text-paper truncate">
                    {i.invoice_number} · {i.client ?? '—'}
                  </span>
                  <span className={`shrink-0 ${i.overdue ? 'text-orange' : 'text-mist'}`}>
                    {rand(i.balance)}
                    {i.due_date ? ` · due ${fmtDay(i.due_date)}` : ''}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <Empty>Nothing outstanding.</Empty>
          )}
        </Card>

        <Card title="Open quotes" right={quotes.length ? <span className="text-xs text-mist">{rand(openQuoteTotal)}</span> : undefined}>
          {quotes.length ? (
            <ul className="divide-y divide-darkgrey">
              {quotes.map((q) => (
                <li key={q.id} className="py-2 flex justify-between gap-3 text-sm">
                  <span className="text-paper truncate">
                    {q.quote_number} · {q.client ?? '—'}
                  </span>
                  <span className={`shrink-0 ${q.expired ? 'text-orange' : 'text-mist'}`}>
                    {rand(q.total)} · {q.expired ? 'expired' : q.status}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <Empty>No draft or sent quotes.</Empty>
          )}
        </Card>

        <p className="text-[11px] text-mist text-center mt-6">
          Prices ex VAT · same data as the NGSMS Ops connector · rain flag at {RAIN_HOLD_PROB}%+ for paint, waterproofing &amp; paving
        </p>
      </div>
    </main>
  )
}
