import { createHmac, timingSafeEqual } from 'crypto'
import { SITE } from '@/lib/site'

// Private calendar feed for Google Calendar ("Subscribe from URL").
// The link carries a token derived from the Supabase service key, so there's
// nothing extra to configure, and changing that key retires old links.

export function feedToken(): string | null {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!secret) return null
  return createHmac('sha256', secret).update('ngms-calendar-feed-v1').digest('hex').slice(0, 40)
}

export function tokenOk(given: string): boolean {
  const want = feedToken()
  if (!want) return false
  const a = Buffer.from(given)
  const b = Buffer.from(want)
  return a.length === b.length && timingSafeEqual(a, b)
}

export function feedUrl(): string | null {
  const t = feedToken()
  return t ? `${SITE.url}/api/calendar/${t}` : null
}

export type FeedJob = {
  id: string
  title: string | null
  status: string
  scheduled_date: string
  description: string | null
  client: { name: string | null; phone: string | null; address: string | null; suburb: string | null } | null
}

// RFC 5545 text escaping and 75-octet line folding.
const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n')
function fold(line: string): string {
  const out: string[] = []
  let rest = line
  while (Buffer.byteLength(rest) > 73) {
    let cut = 73
    while (Buffer.byteLength(rest.slice(0, cut)) > 73) cut--
    out.push(rest.slice(0, cut))
    rest = ' ' + rest.slice(cut)
  }
  out.push(rest)
  return out.join('\r\n')
}
const ymd = (d: string) => d.replace(/-/g, '')
function nextDay(d: string): string {
  const t = new Date(`${d}T12:00:00Z`)
  t.setUTCDate(t.getUTCDate() + 1)
  return t.toISOString().slice(0, 10)
}

export function buildIcs(jobs: FeedJob[]): string {
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z')
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//NGMS//Jobs//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:NGMS Jobs',
    'X-WR-TIMEZONE:Africa/Johannesburg',
    'REFRESH-INTERVAL;VALUE=DURATION:PT1H',
    'X-PUBLISHED-TTL:PT1H',
  ]
  for (const j of jobs) {
    const c = j.client
    const where = [c?.address, c?.suburb].filter(Boolean).join(', ')
    const details = [
      c?.name ? `Client: ${c.name}` : null,
      c?.phone ? `Phone: ${c.phone}` : null,
      `Status: ${j.status.replace('_', ' ')}`,
      j.description ? `\n${j.description}` : null,
      `\nOpen in admin: ${SITE.url}/admin/jobs/${j.id}`,
    ]
      .filter(Boolean)
      .join('\n')
    lines.push(
      'BEGIN:VEVENT',
      `UID:job-${j.id}@${SITE.domain}`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${ymd(j.scheduled_date)}`,
      `DTEND;VALUE=DATE:${ymd(nextDay(j.scheduled_date))}`,
      fold(`SUMMARY:${esc(`${j.status === 'completed' ? '✓ ' : ''}${j.title ?? 'Job'}`)}`),
      ...(where ? [fold(`LOCATION:${esc(where)}`)] : []),
      fold(`DESCRIPTION:${esc(details)}`),
      `STATUS:${j.status === 'cancelled' ? 'CANCELLED' : 'CONFIRMED'}`,
      'TRANSP:TRANSPARENT',
      'END:VEVENT',
    )
  }
  lines.push('END:VCALENDAR')
  return lines.join('\r\n') + '\r\n'
}
