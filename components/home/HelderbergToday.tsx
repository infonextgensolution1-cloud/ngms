import type { ReactNode } from 'react'
import {
  getNews,
  getWeather,
  tradeConditions,
  NEWS_HOME,
  type NewsItem,
  type Weather,
  type WxKind,
} from '@/lib/helderberg'

// Homepage panel: live Helderberg weather (with what it means for outdoor work)
// next to the latest local headlines. Server-rendered; data is cached for 30 min
// and each panel hides itself if its source is unavailable.

const ICONS: Record<WxKind, ReactNode> = {
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>
  ),
  moon: <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />,
  partly: (
    <>
      <circle cx="8" cy="8" r="3" />
      <path d="M8 2v1M2 8h1M3.8 3.8l.7.7M12.2 3.8l-.7.7" />
      <path d="M17.5 20H10a3.5 3.5 0 0 1-.4-6.98 5 5 0 0 1 9.6 1.1A3 3 0 0 1 17.5 20z" />
    </>
  ),
  cloud: <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />,
  fog: <path d="M3 8h18M5 12h14M3 16h18M7 20h10" />,
  rain: (
    <>
      <path d="M16 13v8M8 13v8M12 15v8" />
      <path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25" />
    </>
  ),
  storm: (
    <>
      <path d="M19 16.9A5 5 0 0 0 18 7h-1.26a8 8 0 1 0-11.62 9" />
      <path d="M13 11l-4 6h6l-4 6" />
    </>
  ),
}

function WxIcon({ kind, className }: { kind: WxKind; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {ICONS[kind]}
    </svg>
  )
}

function dayName(date: string): string {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString('en-ZA', { weekday: 'short', timeZone: 'UTC' })
}

function newsDate(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', timeZone: 'Africa/Johannesburg' })
}

function WeatherCard({ weather }: { weather: Weather }) {
  const { now, workDay, workDayIsToday, next } = weather
  const calls = tradeConditions(workDay)

  return (
    <div className="rounded-card border border-darkgrey bg-cardgrey p-6">
      <p className="kicker">Right now in the Helderberg</p>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-heading text-6xl font-bold leading-none text-paper">{now.temp}&deg;</p>
          <p className="mt-2 text-sm text-mist">
            {now.label} &middot; Wind {now.wind} km/h &middot; Humidity {now.humidity}%
          </p>
        </div>
        <div className="shrink-0 text-orange">
          <WxIcon kind={now.kind} className="h-16 w-16" />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-3">
        {next.map((d) => (
          <div key={d.date} className="rounded-card border border-darkgrey bg-graphite p-3 text-center">
            <p className="font-heading text-sm font-bold uppercase tracking-wide text-paper">{dayName(d.date)}</p>
            <div className="my-2 flex justify-center text-orange">
              <WxIcon kind={d.kind} className="h-7 w-7" />
            </div>
            <p className="text-sm text-paper">
              {d.max}&deg; <span className="text-mist">/ {d.min}&deg;</span>
            </p>
            <p className="mt-1 text-xs text-mist">{d.rainMm >= 1 ? `Rain ${Math.round(d.rainMm)} mm` : 'Dry'}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 border-t border-darkgrey pt-5">
        <p className="font-heading text-sm font-bold uppercase tracking-wide text-paper">
          Outdoor work {workDayIsToday ? 'today' : 'tomorrow'}
        </p>
        <ul className="mt-3 grid gap-2">
          {calls.map((c) => (
            <li key={c.trade} className="flex items-center justify-between gap-3 text-sm">
              <span className="text-paper">{c.trade}</span>
              <span className="flex shrink-0 items-center gap-2">
                <span className="text-xs text-mist">{c.note}</span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide ${
                    c.go ? 'bg-orange text-jet' : 'border border-darkgrey text-mist'
                  }`}
                >
                  {c.go ? 'Go' : 'Hold'}
                </span>
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs leading-relaxed text-mist">
          A guide only. We confirm your booking with you and reschedule around rain and wind.
        </p>
      </div>

      <p className="mt-4 text-xs text-mist">
        Forecast data:{' '}
        <a href="https://www.met.no/en" target="_blank" rel="noopener noreferrer" className="underline hover:text-orange">
          MET Norway
        </a>
      </p>
    </div>
  )
}

function NewsCard({ news }: { news: NewsItem[] }) {
  return (
    <div className="rounded-card border border-darkgrey bg-cardgrey p-6">
      <p className="kicker">Local news</p>
      {news.length > 0 ? (
        <ul className="divide-y divide-darkgrey">
          {news.map((n) => (
            <li key={n.url}>
              <a href={n.url} target="_blank" rel="noopener noreferrer" className="group block py-4 first:pt-2">
                {n.date && <span className="block text-xs text-mist">{newsDate(n.date)}</span>}
                <span className="mt-1 block font-heading text-lg font-bold leading-snug text-paper transition group-hover:text-orange">
                  {n.title}
                </span>
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <p className="py-4 text-mist">Catch up on what&rsquo;s happening around Somerset West, Strand and Gordon&rsquo;s Bay.</p>
      )}
      <p className="mt-2 text-xs text-mist">
        Headlines from{' '}
        <a href={NEWS_HOME} target="_blank" rel="noopener noreferrer" className="underline hover:text-orange">
          DistrictMail &amp; Helderberg Gazette
        </a>
        . Tap a story to read it there.
      </p>
    </div>
  )
}

export function HelderbergTodayView({ weather, news }: { weather: Weather | null; news: NewsItem[] }) {
  return (
    <section className="border-y border-darkgrey bg-graphite px-4 py-16" aria-labelledby="helderberg-today">
      <div className="wrap">
        <div className="mb-12 text-center">
          <p className="kicker">Helderberg today</p>
          <h2 id="helderberg-today" className="text-3xl md:text-4xl">
            Weather &amp; Local News
          </h2>
        </div>
        <div className={`grid gap-8 ${weather ? 'lg:grid-cols-2' : 'mx-auto max-w-2xl'}`}>
          {weather && <WeatherCard weather={weather} />}
          <NewsCard news={news} />
        </div>
      </div>
    </section>
  )
}

export default async function HelderbergToday() {
  const [weather, news] = await Promise.all([getWeather(), getNews(4)])
  return <HelderbergTodayView weather={weather} news={news} />
}
