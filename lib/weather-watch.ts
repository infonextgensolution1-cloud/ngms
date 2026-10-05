import type { WxDay } from '@/lib/helderberg'
import { jobWeather, nextGoDays } from '@/lib/job-weather-core'
import { dayDiff } from '@/lib/quote-followup'

/**
 * Weather watch: scheduled jobs 2 to 5 days out whose trade is a "hold" on its day, with the next
 * workable days (Sundays skipped) to offer the customer. Today and tomorrow are covered by the
 * "Jobs coming up" section, and the forecast gets unreliable beyond about 5 days. Stateless: it
 * repeats each morning while the job sits in the window with bad weather, and stops by itself
 * once the job is moved or the forecast improves.
 */
export const WATCH_FROM_DAYS = 2
export const WATCH_TO_DAYS = 5
export const WATCH_GOOD_DAYS = 2

export type WatchJob = { id: string; title: string | null; description: string | null; scheduled_date: string; client_name: string | null; client_phone: string | null }
export type WatchAlert = { job_id: string; title: string | null; client_name: string | null; client_phone: string | null; when: string; reason: string; good_days: string[] }

const niceDay = (date: string) => new Date(`${date}T12:00:00Z`).toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })

/** Which of these jobs are at risk, with replacement days. Empty if there is no forecast. */
export function weatherWatch(jobs: WatchJob[], forecast: WxDay[], today: string): WatchAlert[] {
  const out: WatchAlert[] = []
  for (const j of jobs) {
    const ahead = dayDiff(today, j.scheduled_date)
    if (ahead < WATCH_FROM_DAYS || ahead > WATCH_TO_DAYS) continue
    const text = `${j.title ?? ''} ${j.description ?? ''}`
    const w = jobWeather(text, j.scheduled_date, forecast)
    if (!w) continue
    out.push({
      job_id: j.id,
      title: j.title,
      client_name: j.client_name,
      client_phone: j.client_phone,
      when: `${niceDay(j.scheduled_date)}, in ${ahead} days`,
      reason: w.note.replace(/\s*Consider moving it\.$/, ''),
      good_days: nextGoDays(text, j.scheduled_date, forecast, WATCH_GOOD_DAYS, true).map((d) => niceDay(d.date)),
    })
  }
  return out
}
