import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

const PROJECT_ID = 'prj_uZi3UeS4lSYKga9Dxcm7jshzN4B0'
const TEAM_ID = 'team_Tvuw1gszfpVvlqQVCxguGZit'
const API = 'https://api.vercel.com/v1/query/web-analytics/visits'

type Row = { timestamp?: string; visitors?: number; pageviews?: number; requestPath?: string; referrerHostname?: string; deviceType?: string }

async function query(path: string, params: Record<string, string>) {
  const token = process.env.VERCEL_ANALYTICS_TOKEN
  if (!token) throw new Error('VERCEL_ANALYTICS_TOKEN is not configured')
  const url = new URL(`${API}/${path}`)
  url.searchParams.set('projectId', PROJECT_ID)
  url.searchParams.set('teamId', TEAM_ID)
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value)
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`Vercel Analytics API returned ${res.status}`)
  return res.json() as Promise<{ data?: Row | Row[] }>
}

function rows(result: { data?: Row | Row[] }): Row[] {
  return Array.isArray(result.data) ? result.data : result.data ? [result.data] : []
}

export async function GET(request: Request) {
  const auth = request.headers.get('authorization')
  const accessToken = auth?.startsWith('Bearer ') ? auth.slice(7) : ''
  if (!accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { data: user, error } = await supabaseAdmin().auth.getUser(accessToken)
    if (error || !user.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const parsedDays = Number(searchParams.get('days') || '30')
  const days = Number.isFinite(parsedDays) ? Math.min(90, Math.max(7, Math.round(parsedDays))) : 30
  const until = new Date()
  const since = new Date(until.getTime() - days * 86400000)
  const sinceIso = since.toISOString()
  const untilIso = until.toISOString()
  const publicFilter = "not startswith(requestPath, '/admin') and referrerHostname ne 'vercel.com'"

  try {
    const [totals, daily, pages, sources, devices] = await Promise.all([
      query('count', { since: sinceIso, until: untilIso, filter: publicFilter }),
      query('aggregate', { since: sinceIso, until: untilIso, by: 'day', limit: '90', filter: publicFilter }),
      query('aggregate', { since: sinceIso, until: untilIso, by: 'requestPath', limit: '12', filter: "not startswith(requestPath, '/admin')" }),
      query('aggregate', { since: sinceIso, until: untilIso, by: 'referrerHostname', limit: '10', filter: publicFilter }),
      query('aggregate', { since: sinceIso, until: untilIso, by: 'deviceType', limit: '10', filter: publicFilter }),
    ])

    const total = rows(totals)[0] || {}
    const dayRows = rows(daily)
    const pageRows = rows(pages)
    const sourceRows = rows(sources)
    const deviceRows = rows(devices)

    return NextResponse.json({
      live: true,
      project: 'ngms-new',
      from: sinceIso.slice(0, 10),
      to: untilIso.slice(0, 10),
      pulledOn: new Date().toISOString(),
      totals: { visitors: total.visitors || 0, pageviews: total.pageviews || 0, quoteVisitors: 0, googleVisitors: 0 },
      daily: dayRows.map((r) => ({ date: (r.timestamp || '').slice(0, 10), visitors: r.visitors || 0, pageviews: r.pageviews || 0 })),
      pages: pageRows.map((r) => ({ label: r.requestPath || 'Other', path: r.requestPath, visitors: r.visitors || 0 })),
      sources: sourceRows.map((r) => ({ label: r.referrerHostname || 'Direct', visitors: r.visitors || 0 })),
      devices: {
        mobile: deviceRows.find((r) => (r.deviceType || '').toLowerCase() === 'mobile')?.visitors || 0,
        desktop: deviceRows.find((r) => (r.deviceType || '').toLowerCase() === 'desktop')?.visitors || 0,
      },
    })
  } catch (error) {
    console.error('[admin analytics] live query failed', error instanceof Error ? error.message : 'unknown error')
    return NextResponse.json({ error: 'Live analytics unavailable' }, { status: 503 })
  }
}
