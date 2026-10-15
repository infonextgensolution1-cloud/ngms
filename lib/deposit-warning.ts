import { dayDiff } from '@/lib/quote-followup'
import { balanceOwed } from '@/lib/invoice-followup'

/**
 * Deposit warning: a job coming up whose quote needs a deposit that is not fully paid yet.
 * Invoices carry no "deposit" label, so every non-void invoice on the job's quote counts
 * toward the deposit (a paid balance invoice implies the deposit was paid too).
 */
export const DEPOSIT_WARNING_DAYS = 3

export type DepositInvoice = { id: string; invoice_number: string | null; status: string; paid_amount: number | null }

/** Whole days from today to the job date, if it falls inside the warning window; otherwise null. */
export function daysUntilJob(jobDate: string | null, today: string): number | null {
  if (!jobDate) return null
  const d = dayDiff(today, jobDate)
  return d >= 0 && d <= DEPOSIT_WARNING_DAYS ? d : null
}

/** What is wrong with the deposit, or null when it is fully paid or not required. */
export function depositIssue(depositAmount: number | null, invoices: DepositInvoice[]): { text: string; paid: number; deposit: number } | null {
  const deposit = Math.round((Number(depositAmount) || 0) * 100) / 100
  if (deposit <= 0) return null
  const live = invoices.filter((i) => i.status !== 'void')
  const paid = Math.round(live.reduce((sum, i) => sum + (Number(i.paid_amount) || 0), 0) * 100) / 100
  if (balanceOwed(deposit, paid) <= 0) return null

  const rand = (n: number) => `R${Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}`
  if (!live.length) return { text: `Deposit of ${rand(deposit)} not invoiced yet`, paid, deposit }
  const sent = live.filter((i) => i.status !== 'draft')
  if (!sent.length) return { text: `Deposit invoice ${live[0].invoice_number ?? ''} is still a draft (not sent). ${rand(deposit)} due`.replace('  ', ' '), paid, deposit }
  const ref = sent.length === 1 && sent[0].invoice_number ? ` (${sent[0].invoice_number})` : ''
  return { text: `Deposit ${rand(paid)} of ${rand(deposit)} paid${ref}`, paid, deposit }
}

/** "today", "tomorrow" or "Tue 13 Oct, in 3 days". */
export function jobDayLabel(jobDate: string, days: number): string {
  if (days === 0) return 'today'
  if (days === 1) return 'tomorrow'
  const nice = new Date(`${jobDate}T12:00:00Z`).toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })
  return `${nice}, in ${days} days`
}
