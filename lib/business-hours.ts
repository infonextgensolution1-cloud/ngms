// lib/business-hours.ts — business hours come from the Supabase `settings` table
// (via the public get_business_hours() function). Falls back to the defaults below.
import { unstable_cache } from 'next/cache'
import { supabase } from './ngms-public-supabase'

export type BusinessHours = { days: string; open: string; close: string }

export const DEFAULT_HOURS: BusinessHours = { days: 'Mon–Sat', open: '07:00', close: '19:00' }

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const ABBR = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']

export const getBusinessHours = unstable_cache(
  async (): Promise<BusinessHours> => {
    try {
      const { data, error } = await supabase.rpc('get_business_hours')
      if (error || !data) return DEFAULT_HOURS
      const d = data as Partial<BusinessHours>
      return {
        days: d.days || DEFAULT_HOURS.days,
        open: d.open || DEFAULT_HOURS.open,
        close: d.close || DEFAULT_HOURS.close,
      }
    } catch {
      return DEFAULT_HOURS
    }
  },
  ['business-hours'],
  { revalidate: 300 },
)

/** "07:00–19:00" */
export const hoursRange = (h: BusinessHours) => `${h.open}–${h.close}`

/** "Mon–Sat 07:00–19:00" */
export const hoursLabel = (h: BusinessHours) => `${h.days} ${hoursRange(h)}`

/** Full day names for schema.org, parsed from "Mon–Sat" / "Mon–Fri" / "Mon, Wed, Fri" / "Every day". */
export function hoursDayNames(days: string): string[] {
  const s = days.toLowerCase()
  if (/every|daily|7/.test(s)) return DAY_NAMES
  const range = s.match(/(mon|tue|wed|thu|fri|sat|sun)\w*\s*[-–—]\s*(mon|tue|wed|thu|fri|sat|sun)/)
  if (range) {
    const a = ABBR.indexOf(range[1])
    const b = ABBR.indexOf(range[2])
    return a <= b ? DAY_NAMES.slice(a, b + 1) : [...DAY_NAMES.slice(a), ...DAY_NAMES.slice(0, b + 1)]
  }
  const list = DAY_NAMES.filter((_, i) => s.includes(ABBR[i]))
  return list.length ? list : DAY_NAMES.slice(0, 6)
}
