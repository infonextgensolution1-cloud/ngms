// WhatsApp links and pre-written messages for the admin screens.
// Messages are friendly, short and in rand; the owner can edit before sending.

import { normalisePhone } from '@/lib/ngms-leads-ui'

const BUSINESS = 'NextGen Solar Clean & Maintenance Solutions'

const r = (n: number) => `R${(Math.round(n * 100) / 100).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

/** wa.me link to a SA number with a pre-filled message, or null if the number isn't usable. */
export function waTo(phone: string | null | undefined, text: string): string | null {
  if (!phone) return null
  const d = normalisePhone(phone).replace(/\D/g, '')
  if (!/^27\d{9}$/.test(d)) return null
  return `https://wa.me/${d}?text=${encodeURIComponent(text)}`
}

const first = (name: string | null | undefined) => (name ?? '').trim().split(/\s+/)[0] || 'there'

export function quoteMessage(o: { client: string | null; number: string; total: number; deposit: number; depositPct: number; validUntil: string | null }) {
  return [
    `Hi ${first(o.client)}, thanks for the chance to quote.`,
    ``,
    `Your quote ${o.number} comes to ${r(o.total)}.`,
    o.deposit > 0 ? `A ${o.depositPct}% deposit of ${r(o.deposit)} secures your booking.` : null,
    o.validUntil ? `The quote is valid until ${o.validUntil}.` : null,
    ``,
    `I'll send the PDF with the full breakdown and banking details. Any questions, just reply here.`,
    ``,
    `${BUSINESS}`,
  ]
    .filter((l) => l !== null)
    .join('\n')
}

export function invoiceMessage(o: { client: string | null; number: string; balance: number; dueDate: string | null; bank: string | null }) {
  return [
    `Hi ${first(o.client)}, here's invoice ${o.number}.`,
    ``,
    `Amount due: ${r(o.balance)}${o.dueDate ? `, due ${o.dueDate}` : ''}.`,
    o.bank ? `\nBanking details:\n${o.bank}` : null,
    `Please use ${o.number} as the payment reference.`,
    ``,
    `Thank you for your business.`,
    `${BUSINESS}`,
  ]
    .filter((l) => l !== null)
    .join('\n')
}

export function reminderMessage(o: { client: string | null; number: string; balance: number; daysOverdue: number; bank: string | null }) {
  return [
    `Hi ${first(o.client)}, a friendly reminder that invoice ${o.number} for ${r(o.balance)} is ${o.daysOverdue} day${o.daysOverdue === 1 ? '' : 's'} past due.`,
    ``,
    `If you've already paid, thank you, please send the proof of payment and I'll update my records.`,
    o.bank ? `\nIf not, here are the banking details:\n${o.bank}\nReference: ${o.number}` : `Reference: ${o.number}`,
    ``,
    `${BUSINESS}`,
  ].join('\n')
}
