'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, CalendarDays, ChevronLeft, ChevronRight, CloudRain, Copy, Check, Loader2 } from 'lucide-react'
import StaffGate from '@/components/admin/StaffGate'
import { supabase } from '@/lib/supabaseClient'
import { jobWeather, useForecast } from '@/lib/job-weather'

type Job = { id: string; title: string | null; status: string; scheduled_date: string; clients: { name: string | null; suburb: string | null } | { name: string | null; suburb: string | null }[] | null }

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const DOT: Record<string, string> = { scheduled: 'bg-paper', in_progress: 'bg-orange', completed: 'bg-whatsapp', on_hold: 'bg-mist' }

const pad = (n: number) => String(n).padStart(2, '0')
const iso = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`
const todayIso = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Johannesburg' })
const client = (j: Job) => (Array.isArray(j.clients) ? j.clients[0] : j.clients)

function CalendarView() {
  const now = todayIso()
  const [year, setYear] = useState(Number(now.slice(0, 4)))
  const [month, setMonth] = useState(Number(now.slice(5, 7)) - 1)
  const [selected, setSelected] = useState(now)
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const forecast = useForecast()

  const load = useCallback(async () => {
    setLoading(true)
    const last = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
    const { data } = await supabase
      .from('jobs')
      .select('id,title,status,scheduled_date,clients(name,suburb)')
      .gte('scheduled_date', iso(year, month, 1))
      .lte('scheduled_date', iso(year, month, last))
      .neq('status', 'cancelled')
      .order('scheduled_date')
    setJobs((data ?? []) as Job[])
    setLoading(false)
  }, [year, month])

  useEffect(() => {
    load()
  }, [load])

  const byDay = useMemo(() => {
    const m: Record<string, Job[]> = {}
    for (const j of jobs) (m[j.scheduled_date] ??= []).push(j)
    return m
  }, [jobs])

  const first = new Date(Date.UTC(year, month, 1))
  const lead = (first.getUTCDay() + 6) % 7 // Monday-first grid
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
  const cells = [...Array(lead).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]
  const monthName = first.toLocaleDateString('en-ZA', { month: 'long', year: 'numeric', timeZone: 'UTC' })
  const rainy = new Set(forecast.filter((d) => d.rainMm >= 1 || d.kind === 'storm').map((d) => d.date))

  function shift(delta: number) {
    const d = new Date(Date.UTC(year, month + delta, 1))
    setYear(d.getUTCFullYear())
    setMonth(d.getUTCMonth())
  }

  const dayJobs = byDay[selected] ?? []

  return (
    <main className="min-h-[70vh] bg-jet px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Link href="/admin" className="text-xs text-mist hover:text-paper inline-flex items-center gap-1 mb-3">
          <ArrowLeft className="w-3.5 h-3.5" /> Admin
        </Link>
        <h1 className="font-heading text-2xl font-bold text-paper mb-4">Job calendar</h1>

        <section className="bg-cardgrey border border-darkgrey rounded-card p-3 mb-4">
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => shift(-1)} aria-label="Previous month" className="p-2 text-mist hover:text-paper">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <p className="font-heading font-bold text-paper flex items-center gap-2">
              {monthName} {loading && <Loader2 className="w-4 h-4 animate-spin text-mist" />}
            </p>
            <button onClick={() => shift(1)} aria-label="Next month" className="p-2 text-mist hover:text-paper">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center">
            {WEEKDAYS.map((d) => (
              <p key={d} className="text-[10px] uppercase tracking-wide text-mist pb-1">
                {d}
              </p>
            ))}
            {cells.map((d, i) => {
              if (d === null) return <span key={`x${i}`} />
              const key = iso(year, month, d)
              const list = byDay[key] ?? []
              return (
                <button
                  key={key}
                  onClick={() => setSelected(key)}
                  className={`min-h-[52px] rounded-btn border p-1 flex flex-col items-center ${key === selected ? 'border-orange' : 'border-darkgrey'} ${key === now ? 'bg-jet' : ''}`}
                >
                  <span className={`text-sm ${key === now ? 'text-orange font-bold' : 'text-paper'}`}>{d}</span>
                  <span className="flex flex-wrap justify-center gap-0.5 mt-1">
                    {list.slice(0, 4).map((j) => (
                      <span key={j.id} className={`h-1.5 w-1.5 rounded-full ${DOT[j.status] ?? 'bg-mist'}`} />
                    ))}
                  </span>
                  {rainy.has(key) && <CloudRain className="w-3 h-3 text-mist mt-auto" />}
                </button>
              )
            })}
          </div>
          <p className="text-[11px] text-mist mt-3 flex flex-wrap gap-x-3 gap-y-1">
            <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-paper" /> scheduled</span>
            <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-orange" /> in progress</span>
            <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-whatsapp" /> done</span>
            <span className="inline-flex items-center gap-1"><CloudRain className="w-3 h-3" /> rain forecast</span>
          </p>
        </section>

        <section className="bg-cardgrey border border-darkgrey rounded-card mb-6">
          <h2 className="font-heading font-bold text-paper px-4 pt-4 pb-2">
            {new Date(`${selected}T12:00:00Z`).toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' })}
          </h2>
          {dayJobs.length ? (
            <ul className="divide-y divide-darkgrey">
              {dayJobs.map((j) => {
                const w = ['scheduled', 'in_progress'].includes(j.status) ? jobWeather(j.title ?? '', j.scheduled_date, forecast) : null
                const c = client(j)
                return (
                  <li key={j.id}>
                    <Link href={`/admin/jobs/${j.id}`} className="block px-4 py-3 hover:bg-jet/40">
                      <p className="text-paper font-semibold">{j.title ?? 'Untitled job'}</p>
                      <p className="text-xs text-mist">
                        {[c?.name, c?.suburb].filter(Boolean).join(', ') || '—'} · {j.status.replace('_', ' ')}
                      </p>
                      {w && (
                        <p className="text-xs text-orange flex items-center gap-1 mt-0.5">
                          <CloudRain className="w-3.5 h-3.5 shrink-0" /> {w.note}
                        </p>
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="px-4 pb-4 text-sm text-mist">Nothing booked.</p>
          )}
        </section>

        <GoogleSync />
      </div>
    </main>
  )
}

function GoogleSync() {
  const [url, setUrl] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  async function getLink() {
    setBusy(true)
    setError('')
    try {
      const { data } = await supabase.auth.getSession()
      const res = await fetch('/api/calendar/link', { headers: { Authorization: `Bearer ${data.session?.access_token ?? ''}` } })
      const j = await res.json()
      if (!res.ok) throw new Error(j.error ?? 'Could not get the link')
      setUrl(j.url)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function copy() {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <section className="bg-cardgrey border border-darkgrey rounded-card p-4">
      <h2 className="font-heading font-bold text-paper flex items-center gap-2 mb-1">
        <CalendarDays className="w-4 h-4 text-orange" /> Show jobs in Google Calendar
      </h2>
      <p className="text-sm text-mist mb-3">
        Subscribe once and every booked job appears in your Google Calendar as an all-day event, with the client, phone and address. Google refreshes it every few hours.
      </p>
      {!url ? (
        <button onClick={getLink} disabled={busy} className="inline-flex items-center gap-2 bg-blue hover:bg-blue-dark text-white font-heading font-semibold px-4 py-2.5 rounded-btn disabled:opacity-50">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarDays className="w-4 h-4" />} Get my calendar link
        </button>
      ) : (
        <>
          <div className="flex gap-2 mb-3">
            <input readOnly value={url} className="flex-1 min-w-0 bg-jet border border-darkgrey text-paper rounded-btn px-3 py-2 text-xs" onFocus={(e) => e.target.select()} />
            <button onClick={copy} className="shrink-0 inline-flex items-center gap-1.5 border border-darkgrey hover:border-blue text-paper text-xs font-semibold px-3 rounded-btn">
              {copied ? <Check className="w-4 h-4 text-whatsapp" /> : <Copy className="w-4 h-4" />} {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <ol className="text-sm text-mist list-decimal pl-5 space-y-1">
            <li>On a computer, open calendar.google.com.</li>
            <li>Next to &ldquo;Other calendars&rdquo;, click + and choose &ldquo;From URL&rdquo;.</li>
            <li>Paste the link and click &ldquo;Add calendar&rdquo;. It then shows on your phone too.</li>
          </ol>
          <p className="text-[11px] text-orange mt-3">Keep this link private: anyone with it can see your job list.</p>
        </>
      )}
      {error && <p className="text-xs text-orange mt-2">{error}</p>}
    </section>
  )
}

export default function CalendarPage() {
  return (
    <StaffGate title="Job calendar">
      <CalendarView />
    </StaffGate>
  )
}
