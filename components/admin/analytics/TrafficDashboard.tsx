'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { trafficSnapshot as snap, type CountRow, type DailyTraffic } from '@/lib/site-analytics'

// Chart orange, stepped for the jet/cardgrey surface (passes the band and
// 3:1 contrast checks where the brighter #F57C1B sits too light).
const BAR = '#DE6A16'

const fmtDay = (iso: string, opts: Intl.DateTimeFormatOptions) =>
  new Date(iso + 'T00:00:00Z').toLocaleDateString('en-ZA', { ...opts, timeZone: 'UTC' })

function Tile({ label, value, ctx }: { label: string; value: number; ctx: string }) {
  return (
    <div className="bg-cardgrey border border-darkgrey rounded-card p-4">
      <p className="text-xs uppercase tracking-wider text-mist">{label}</p>
      <p className="font-heading text-4xl font-extrabold text-paper leading-none mt-1">{value}</p>
      <p className="text-sm text-mist mt-1">{ctx}</p>
    </div>
  )
}

function Panel({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <section className="bg-cardgrey border border-darkgrey rounded-card p-5 min-w-0">
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
        <h2 className="font-heading text-xl font-bold uppercase tracking-wide text-paper">{title}</h2>
        {note && <p className="text-xs text-mist">{note}</p>}
      </div>
      {children}
    </section>
  )
}

function DailyChart({ data }: { data: DailyTraffic[] }) {
  const boxRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(640)
  const [active, setActive] = useState<number | null>(null)

  useEffect(() => {
    const el = boxRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => setWidth(Math.max(280, Math.round(entry.contentRect.width))))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const W = width
  const H = W < 500 ? 220 : 260
  const m = { t: 18, r: 6, b: 28, l: 28 }
  const iw = W - m.l - m.r
  const ih = H - m.t - m.b
  const peak = Math.max(...data.map((d) => d.visitors))
  const max = Math.max(4, Math.ceil(peak / 4) * 4)
  const ticks = [0, max / 4, max / 2, (3 * max) / 4, max]
  const y = (v: number) => m.t + ih - (v / max) * ih
  const step = iw / data.length
  const bw = Math.max(8, Math.min(34, step - (step < 30 ? 6 : 10)))
  const base = m.t + ih

  const a = active !== null ? data[active] : null
  const tipLeft = active !== null ? Math.min(Math.max(m.l + step * active + step / 2, 95), W - 95) : 0

  return (
    <div ref={boxRef} className="relative" onMouseLeave={() => setActive(null)}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width={W}
        height={H}
        className="block max-w-full h-auto overflow-visible"
        role="img"
        aria-label={`Daily visitors from ${fmtDay(data[0].date, { day: 'numeric', month: 'short' })} to ${fmtDay(data[data.length - 1].date, { day: 'numeric', month: 'short' })}. Peak of ${peak}.`}
      >
        {ticks.map((t) => (
          <g key={t}>
            <line x1={m.l} x2={W - m.r} y1={y(t)} y2={y(t)} stroke={t === 0 ? '#2E3035' : '#1F2023'} strokeWidth={1} />
            <text x={m.l - 8} y={y(t) + 4} textAnchor="end" className="fill-mist text-[11px] tabular-nums">
              {t}
            </text>
          </g>
        ))}
        {data.map((d, i) => {
          const cx = m.l + step * i + step / 2
          const x = cx - bw / 2
          const top = y(d.visitors)
          const r = Math.min(4, base - top)
          const path = `M${x},${base} V${top + r} Q${x},${top} ${x + r},${top} H${x + bw - r} Q${x + bw},${top} ${x + bw},${top + r} V${base} Z`
          const showLabel = d.visitors === peak || i === data.length - 1
          return (
            <g key={d.date}>
              <path d={path} fill={BAR} opacity={active === null || active === i ? 1 : 0.45} />
              <text x={cx} y={H - 8} textAnchor="middle" className="fill-mist text-[11px] tabular-nums">
                {new Date(d.date + 'T00:00:00Z').getUTCDate()}
              </text>
              {showLabel && (
                <text x={cx} y={top - 6} textAnchor="middle" className="fill-paper text-[11px] font-medium tabular-nums">
                  {d.visitors}
                </text>
              )}
              <rect
                x={cx - step / 2}
                y={m.t}
                width={step}
                height={ih}
                fill="transparent"
                onMouseEnter={() => setActive(i)}
                onTouchStart={() => setActive(i)}
              />
            </g>
          )
        })}
      </svg>
      {a && active !== null && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-card bg-paper px-3 py-2 text-sm text-jet shadow"
          style={{ left: tipLeft * (boxRef.current ? boxRef.current.clientWidth / W : 1), top: y(a.visitors) - 10 }}
        >
          <p className="font-semibold">{fmtDay(a.date, { weekday: 'short', day: 'numeric', month: 'short' })}</p>
          <p>
            {a.visitors} visitor{a.visitors === 1 ? '' : 's'} · {a.pageviews} page view{a.pageviews === 1 ? '' : 's'}
          </p>
        </div>
      )}
    </div>
  )
}

function HBars({ rows }: { rows: CountRow[] }) {
  const max = Math.max(...rows.map((r) => r.visitors))
  return (
    <ul className="space-y-1.5">
      {rows.map((r) => (
        <li
          key={r.label}
          title={`${r.label}${r.path ? ` (${r.path})` : ''}: ${r.visitors} visitors`}
          className="grid grid-cols-[minmax(0,9rem)_minmax(0,1fr)_2.25rem] sm:grid-cols-[minmax(0,11rem)_minmax(0,1fr)_2.5rem] items-center gap-3 rounded-card px-1 py-0.5 text-sm hover:bg-graphite"
        >
          <span className={`truncate ${r.highlight ? 'font-semibold text-paper' : 'text-paper/90'}`}>{r.label}</span>
          <span className="block h-3">
            <span className="block h-3 rounded-r" style={{ width: `${(r.visitors / max) * 100}%`, minWidth: 2, background: BAR }} />
          </span>
          <span className={`text-right tabular-nums ${r.highlight ? 'text-paper font-medium' : 'text-mist'}`}>{r.visitors}</span>
        </li>
      ))}
    </ul>
  )
}

export default function TrafficDashboard() {
  const t = snap.totals
  const days = snap.daily.length
  const deviceTotal = snap.devices.mobile + snap.devices.desktop
  const mobilePct = Math.round((snap.devices.mobile / deviceTotal) * 100)
  const range = `${fmtDay(snap.from, { day: 'numeric', month: 'short' })} – ${fmtDay(snap.to, { day: 'numeric', month: 'short', year: 'numeric' })}`

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 space-y-5">
      <header className="space-y-2">
        <Link href="/admin" className="text-sm text-mist hover:text-orange inline-flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Admin
        </Link>
        <p className="text-xs uppercase tracking-widest text-orange">Vercel Web Analytics</p>
        <h1 className="font-heading text-4xl sm:text-5xl font-extrabold uppercase text-paper leading-none">Site Traffic</h1>
        <p className="text-mist max-w-2xl">
          {range}, {days} days. Public pages only: your /admin visits and clicks from the Vercel dashboard are taken out, so
          these numbers are closer to real clients.
        </p>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Tile label="Visitors" value={t.visitors} ctx={`about ${Math.round(t.visitors / days)} a day`} />
        <Tile label="Page views" value={t.pageviews} ctx={`${(t.pageviews / t.visitors).toFixed(1)} per visitor`} />
        <Tile label="Opened /quote" value={t.quoteVisitors} ctx={`${Math.round((t.quoteVisitors / t.visitors) * 100)}% of visitors`} />
        <Tile label="Found you on Google" value={t.googleVisitors} ctx={`${Math.round((t.googleVisitors / t.visitors) * 100)}% of visitors`} />
      </div>

      <Panel title="Visitors per day" note="Hover or tap a day for page views">
        <DailyChart data={snap.daily} />
        <details className="mt-3 text-sm">
          <summary className="cursor-pointer text-mist">Show as table</summary>
          <div className="overflow-x-auto mt-2">
            <table className="w-full tabular-nums">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-mist">
                  <th className="text-left font-medium py-1.5 pr-3">Day</th>
                  <th className="text-right font-medium py-1.5 px-3">Visitors</th>
                  <th className="text-right font-medium py-1.5 px-3">Page views</th>
                  <th className="text-right font-medium py-1.5 pl-3">Pages per visitor</th>
                </tr>
              </thead>
              <tbody>
                {snap.daily.map((d) => (
                  <tr key={d.date} className="border-t border-darkgrey text-paper/90">
                    <td className="py-1.5 pr-3">{fmtDay(d.date, { weekday: 'short', day: 'numeric', month: 'short' })}</td>
                    <td className="text-right py-1.5 px-3">{d.visitors}</td>
                    <td className="text-right py-1.5 px-3">{d.pageviews}</td>
                    <td className="text-right py-1.5 pl-3">{(d.pageviews / d.visitors).toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </Panel>

      <div className="grid gap-5 md:grid-cols-[1.35fr_1fr]">
        <Panel title="Top pages" note="Visitors per page">
          <HBars rows={snap.pages} />
        </Panel>
        <div className="space-y-5 min-w-0">
          <Panel title="Where they came from" note="Visitors">
            <HBars rows={snap.sources} />
            <p className="text-xs text-mist mt-3">
              Direct covers typed or saved links and most taps from the WhatsApp app, which hides where it came from.
            </p>
          </Panel>
          <Panel title="Phone or computer">
            <div className="flex h-7 gap-0.5" role="img" aria-label={`${snap.devices.mobile} visitors on mobile, ${snap.devices.desktop} on desktop`}>
              <div className="rounded-sm" style={{ flex: snap.devices.mobile, background: BAR }} />
              <div className="rounded-sm bg-mist/50" style={{ flex: snap.devices.desktop }} />
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-paper mt-3">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ background: BAR }} /> Mobile <b>{snap.devices.mobile}</b> · {mobilePct}%
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-mist/50" /> Desktop <b>{snap.devices.desktop}</b> · {100 - mobilePct}%
              </span>
            </div>
            <p className="text-xs text-mist mt-3">Check every site change on a phone first.</p>
          </Panel>
        </div>
      </div>

      <div className="text-xs text-mist space-y-1 max-w-3xl">
        <p>
          Days run midnight to midnight UTC (2am SAST), so a visit after 10pm lands on the next day. A visitor is counted once
          per day and once per page, so the page rows don&apos;t add up to the total.
        </p>
        <p>
          Snapshot from Vercel project &quot;{snap.project}&quot;, pulled {fmtDay(snap.pulledOn, { day: 'numeric', month: 'short', year: 'numeric' })}.
          Vercel doesn&apos;t let the site read its own analytics, so ask Claude to &quot;update the site analytics snapshot&quot; to refresh it.
        </p>
      </div>
    </div>
  )
}
