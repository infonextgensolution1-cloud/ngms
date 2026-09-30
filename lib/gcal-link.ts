// "Add to Google Calendar" link for one job (all-day event). Browser-safe.

const ymd = (d: string) => d.replace(/-/g, '')

function nextDay(d: string): string {
  const t = new Date(`${d}T12:00:00Z`)
  t.setUTCDate(t.getUTCDate() + 1)
  return t.toISOString().slice(0, 10)
}

export function googleCalendarLink(o: { title: string; date: string; details: string; location: string }): string {
  const p = new URLSearchParams({
    action: 'TEMPLATE',
    text: o.title,
    dates: `${ymd(o.date)}/${ymd(nextDay(o.date))}`,
    details: o.details,
    location: o.location,
    ctz: 'Africa/Johannesburg',
  })
  return `https://calendar.google.com/calendar/render?${p.toString()}`
}
