import { tradeConditions, type WxDay } from '@/lib/helderberg'

// Forecast-based warnings for booked jobs: flags the job if the trade it's for
// is a "Hold" on its scheduled day (same rules as the homepage outdoor-work card).
// Browser-free, so both the admin screens and the 08:00 email job can use it.

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

/** Is this a workable day for every weather-sensitive trade named in the job text? */
export function isGoDay(text: string, day: WxDay): boolean {
  const calls = tradeConditions(day)
  return TRADES.filter((t) => t.match.test(text))
    .map((t) => calls.find((c) => c.trade === t.trade))
    .filter((c): c is NonNullable<typeof c> => !!c)
    .every((c) => c.go)
}

/** The next `count` workable days after `afterDate` in the forecast (Sundays skipped when asked). */
export function nextGoDays(text: string, afterDate: string, days: WxDay[], count: number, skipSundays: boolean): WxDay[] {
  return days
    .filter((d) => d.date > afterDate)
    .filter((d) => !skipSundays || new Date(`${d.date}T12:00:00Z`).getUTCDay() !== 0)
    .filter((d) => isGoDay(text, d))
    .slice(0, count)
}
