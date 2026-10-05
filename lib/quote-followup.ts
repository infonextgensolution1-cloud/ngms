import { todaySAST } from '@/lib/ngms-leads-ui'

/**
 * Quote follow-up rhythm. Stateless: a reminder fires on exactly one morning, so nothing has
 * to be stored and nothing needs clearing. It stops by itself when the quote is accepted,
 * declined or expired (the cron only looks at quotes still "sent" and not past valid_until).
 */
export const QUOTE_REMINDER_DAYS = [3, 7] as const
export const QUOTE_EXPIRY_WARNING_DAYS = 2

export type QuoteReminder = 'day3' | 'day7' | 'expiring'

/** Whole days from date a to date b (both YYYY-MM-DD). */
export function dayDiff(a: string, b: string): number {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86400000)
}

/** South African calendar date (YYYY-MM-DD) of a timestamp. */
export function sastDateOf(iso: string): string {
  return new Date(iso).toLocaleDateString('en-CA', { timeZone: 'Africa/Johannesburg' })
}

/**
 * Which reminders are due this morning for a quote that has been sent.
 * sentDate: when it was sent (YYYY-MM-DD, SAST). validUntil: quote expiry, if any.
 */
export function quoteRemindersDue(sentDate: string, validUntil: string | null, today: string = todaySAST()): QuoteReminder[] {
  if (validUntil && validUntil < today) return [] // expired
  const out: QuoteReminder[] = []
  const since = dayDiff(sentDate, today)
  if (since === QUOTE_REMINDER_DAYS[0]) out.push('day3')
  if (since === QUOTE_REMINDER_DAYS[1]) out.push('day7')
  if (validUntil && dayDiff(today, validUntil) === QUOTE_EXPIRY_WARNING_DAYS) out.push('expiring')
  return out
}

export const REMINDER_TEXT: Record<QuoteReminder, string> = {
  day3: 'Sent 3 days ago: has the customer had a look?',
  day7: 'Sent 7 days ago: last nudge before it goes cold',
  expiring: 'Expires in 2 days: chase before the price lapses',
}
