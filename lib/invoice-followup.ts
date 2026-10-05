import { dayDiff } from '@/lib/quote-followup'

/**
 * Invoice chase rhythm. Stateless: a reminder fires on exactly one morning, so nothing is
 * stored. Days are counted from the due date: 3, 7 and 14 days overdue, then every 14 days
 * (28, 42, 56 ...) until the invoice is paid. It stops by itself once paid; void an invoice
 * to stop chasing one you have written off.
 */
export const INVOICE_CHASE_DAYS = [3, 7, 14] as const
export const INVOICE_REPEAT_EVERY = 14

/** Days overdue if this morning is a chase day for an unpaid invoice, otherwise null. */
export function invoiceChaseDay(dueDate: string | null, today: string): number | null {
  if (!dueDate) return null
  const overdue = dayDiff(dueDate, today)
  if (overdue < 1) return null
  const [, , last] = INVOICE_CHASE_DAYS
  if ((INVOICE_CHASE_DAYS as readonly number[]).includes(overdue)) return overdue
  if (overdue > last && (overdue - last) % INVOICE_REPEAT_EVERY === 0) return overdue
  return null
}

/** How firmly to word the chase. */
export function invoiceChaseText(daysOverdue: number): string {
  if (daysOverdue <= 3) return `${daysOverdue} days overdue: first nudge`
  if (daysOverdue <= 7) return `${daysOverdue} days overdue: second nudge`
  if (daysOverdue <= 14) return `${daysOverdue} days overdue: firm reminder`
  return `${daysOverdue} days overdue: still unpaid, time to follow up personally`
}

/** Balance still owed on an invoice (never negative). */
export function balanceOwed(total: number | null, paid: number | null): number {
  return Math.max(0, Math.round(((Number(total) || 0) - (Number(paid) || 0)) * 100) / 100)
}
