// Shared types/helpers for the admin Leads UI (app/admin/leads/*).
// Deliberately separate from the NGSMS Leads MCP connector
// (app/api/mcp/[key]/route.ts) so editing the admin UI never touches the
// live Claude connector — both just read/write the same `leads` table.

export const STATUSES = ['new', 'contacted', 'site_visit', 'quoted', 'won', 'lost'] as const
export const SOURCES = ['website', 'phone', 'whatsapp', 'referral', 'bc-outreach', 'facebook', 'other'] as const
export type LeadStatus = (typeof STATUSES)[number]
export type LeadSource = (typeof SOURCES)[number]

export const LEAD_COLUMNS = 'id,name,phone,email,suburb,service,service_slug,message,status,source,notes,photo_url,follow_up_at,created_at,updated_at'

export type Lead = {
  id: string
  name: string
  phone: string
  email: string | null
  suburb: string | null
  service: string | null
  service_slug: string | null
  message: string | null
  status: LeadStatus
  source: LeadSource
  notes: string | null
  photo_url: string | null
  follow_up_at: string | null
  created_at: string
  updated_at: string
}

export const STATUS_LABEL: Record<LeadStatus, string> = {
  new: 'New',
  contacted: 'Contacted',
  site_visit: 'Site visit',
  quoted: 'Quoted',
  won: 'Won',
  lost: 'Lost',
}

export function sast(iso: string): string {
  return new Date(iso).toLocaleString('en-ZA', {
    timeZone: 'Africa/Johannesburg',
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

export function daysAgo(iso: string): number {
  return Math.floor((Date.now() - Date.parse(iso)) / 86400000)
}

export function normalisePhone(raw: string): string {
  const digits = raw.replace(/[^\d+]/g, '')
  if (/^0\d{9}$/.test(digits)) return '+27' + digits.slice(1)
  if (/^27\d{9}$/.test(digits)) return '+' + digits
  return digits || raw
}

export function waLink(phone: string): string | null {
  const d = normalisePhone(phone).replace(/\D/g, '')
  return /^27\d{9}$/.test(d) ? `https://wa.me/${d}` : null
}

/** Append a timestamped note, same format the MCP Leads connector uses. */
export function appendNote(existing: string | null, note: string, moveNote?: string): string {
  const entry = `[${sast(new Date().toISOString())}]${moveNote ? ` (${moveNote})` : ''} ${note}`.trim()
  return existing ? `${existing}\n${entry}` : entry
}

/** Preferred date (YYYY-MM-DD) captured by the website quote form, stored inside the lead message. */
export function preferredDateOf(message: string | null): string | null {
  return message?.match(/Preferred date:\s*(\d{4}-\d{2}-\d{2})/)?.[1] ?? null
}

/** Today's date (YYYY-MM-DD) in South Africa, which is what follow-up dates are measured in. */
export function todaySAST(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Johannesburg' })
}

/** YYYY-MM-DD that is n days after today (SAST). */
export function addDaysSAST(n: number): string {
  const d = new Date(`${todaySAST()}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

/** Readable label for a follow-up date, and whether it is due (today or overdue). */
export function followUpInfo(date: string | null | undefined): { label: string; due: boolean } | null {
  if (!date) return null
  const diff = Math.round((Date.parse(`${date}T00:00:00Z`) - Date.parse(`${todaySAST()}T00:00:00Z`)) / 86400000)
  if (diff < 0) return { label: `Follow-up ${-diff}d overdue`, due: true }
  if (diff === 0) return { label: 'Follow-up due today', due: true }
  const nice = new Date(`${date}T12:00:00Z`).toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })
  return { label: `Follow-up ${nice}`, due: false }
}
