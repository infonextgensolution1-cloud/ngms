import { NextResponse } from 'next/server'
import { getWeather } from '@/lib/helderberg'

// Daily Helderberg forecast for the admin job screens (rain warnings).
// MET Norway data, cached for 30 minutes inside getWeather.
// Dynamic so a failed fetch at build time never freezes an empty forecast;
// getWeather's own fetch cache still limits MET Norway calls to one per 30 min.
export const dynamic = 'force-dynamic'

export async function GET() {
  const w = await getWeather()
  return NextResponse.json(
    { days: w?.days ?? [] },
    { headers: { 'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600' } },
  )
}
