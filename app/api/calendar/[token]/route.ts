import { db } from '@/lib/ngms-ops/core'
import { buildIcs, tokenOk, type FeedJob } from '@/lib/calendar-feed'

// NGMS jobs as an iCalendar feed for Google Calendar "From URL" subscriptions.
// Only answers with the right token (see lib/calendar-feed.ts); anything else is a 404.
export const dynamic = 'force-dynamic'

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  if (!tokenOk(token)) return new Response('Not found', { status: 404 })

  const since = new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10)
  const { data, error } = await db()
    .from('jobs')
    .select('id,title,status,scheduled_date,description,clients(name,phone,address,suburb)')
    .not('scheduled_date', 'is', null)
    .gte('scheduled_date', since)
    .neq('status', 'cancelled')
    .order('scheduled_date')
  if (error) return new Response('Calendar unavailable', { status: 503 })

  const jobs = (data ?? []).map((j) => ({ ...j, client: Array.isArray(j.clients) ? j.clients[0] ?? null : j.clients ?? null })) as unknown as FeedJob[]
  return new Response(buildIcs(jobs), {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'inline; filename="ngms-jobs.ics"',
      'Cache-Control': 'private, max-age=300',
      'X-Robots-Tag': 'noindex',
    },
  })
}
