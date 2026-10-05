'use client'

import { useEffect, useState } from 'react'
import type { WxDay } from '@/lib/helderberg'

// The rain/wind rule itself lives in job-weather-core.ts so server code (the morning
// email) can use it too. Re-exported here so the admin imports are unchanged.
export { jobWeather, type JobWeather } from '@/lib/job-weather-core'

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
