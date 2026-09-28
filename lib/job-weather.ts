'use client'

import { useEffect, useState } from 'react'
import { tradeConditions, type WxDay } from '@/lib/helderberg'

// Forecast-based warnings for booked jobs: flags the job if the trade it's for
// is a "Hold" on its scheduled day (same rules as the homepage outdoor-work card).

export type JobWeather = { hold: boolean; note: string; day: WxDay }

const TRADES: { match: RegExp; trade: string }[] = [
  { match: /solar|panel/i, trade: 'Solar panel cleaning' },
  { match: /paint|roof coat|sealant/i, trade: 'Painting' },
  { match: /waterproof|torch|membrane|damp/i, trade: 'Waterproofing' },
  { match: /paving|pave/i, trade: 'Paving' },
]

export function jobWeather(text: string, date: string | null, days: WxDay[]): JobWeather | null {
  if (!date) return null
  const day = days.find((d) => d.date === date)
  if (!day) return null
  const calls = tradeConditions(day)
  const hits = TRADES.filter((t) => t.match.test(text))
    .map((t) => calls.find((c) => c.trade === t.trade))
    .filter((c): c is NonNullable<typeof c> => !!c)
  const bad = hits.filter((c) => !c.go)
  if (!bad.length) return null
  const rain = day.rainMm >= 1 ? `${Math.round(day.rainMm)} mm rain` : null
  const wind = day.windMax >= 40 ? `wind up to ${day.windMax} km/h` : null
  const why = [rain, wind].filter(Boolean).join(', ') || day.label.toLowerCase()
  return { hold: true, note: `${bad.map((c) => c.trade).join(' & ')}: ${bad[0].note.toLowerCase()} (${why} forecast). Consider moving it.`, day }
}

let cache: Promise<WxDay[]> | null = null

/** Forecast days from /api/forecast, fetched once per page load. Empty if offline or unavailable. */
export function useForecast(): WxDay[] {
  const [days, setDays] = useState<WxDay[]>([])
  useEffect(() => {
    cache ??= fetch('/api/forecast')
      .then((r) => (r.ok ? r.json() : { days: [] }))
      .then((j: { days?: WxDay[] }) => j.days ?? [])
      .catch(() => {
        cache = null
        return []
      })
    let alive = true
    cache.then((d) => alive && setDays(d))
    return () => {
      alive = false
    }
  }, [])
  return days
}
