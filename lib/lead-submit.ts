import { supabase } from '@/lib/ngms-public-supabase'

// Shared lead submission for the public quote and contact forms.
//
// A lead must never be silently lost:
//  1. Save to the `leads` table (anon insert-only RLS policy).
//  2. Saved → send the email ping in the background (keepalive) and report success.
//  3. Not saved (network drop, Supabase outage) → WAIT for the email ping as the
//     backup channel, flagged so the owner knows to add it to Admin by hand.
//  4. Both failed → the caller shows the customer a pre-filled WhatsApp message.

export type LeadRow = {
  name: string
  phone: string
  email: string | null
  suburb: string
  service: string
  service_slug: string | null
  message: string
  photo_url?: string | null
}

export type NotifyPayload = Record<string, unknown>

export type LeadResult = { ok: boolean; saved: boolean; emailed: boolean }

/** SA-friendly phone check: 9–13 digits, optional leading +, spaces/dashes/brackets allowed. */
export function isValidPhone(raw: string): boolean {
  const s = raw.trim()
  if (!/^\+?[\d\s()-]{9,20}$/.test(s)) return false
  const digits = s.replace(/\D/g, '')
  return digits.length >= 9 && digits.length <= 13
}

// For the HTML pattern attribute. Browsers compile it with the `v` regex flag, where
// ( ) and - must be escaped inside a character class or the whole pattern is ignored.
export const PHONE_PATTERN = '\\+?[0-9\\s\\(\\)\\-]{9,20}'

async function postNotify(body: NotifyPayload, background: boolean): Promise<boolean> {
  try {
    const res = await fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive: background,
      body: JSON.stringify(body),
    })
    const json = (await res.json().catch(() => ({}))) as { ok?: boolean }
    return res.ok && json.ok === true
  } catch {
    return false
  }
}

export async function submitLead(row: LeadRow, notify: NotifyPayload): Promise<LeadResult> {
  let saved = false
  try {
    const { error } = await supabase.from('leads').insert({ ...row, status: 'new' })
    saved = !error
    if (error) console.error('Lead insert failed', error.message)
  } catch (err) {
    console.error('Lead insert threw', err)
  }

  if (saved) {
    // The lead is safe in Admin; a failed email must never block the customer.
    void postNotify(notify, true)
    return { ok: true, saved: true, emailed: false }
  }

  const emailed = await postNotify({ ...notify, notSaved: true }, false)
  return { ok: emailed, saved: false, emailed }
}
