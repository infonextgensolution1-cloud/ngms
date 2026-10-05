import { followUpInfo, normalisePhone, waLink } from '@/lib/ngms-leads-ui'
import { REMINDER_TEXT, type QuoteReminder } from '@/lib/quote-followup'
import { groupThousands } from '@/lib/solar-pricing'
import { invoiceChaseText } from '@/lib/invoice-followup'

export type DueLead = {
  id: string
  name: string
  phone: string
  service: string | null
  service_slug: string | null
  suburb: string | null
  status: string
  notes: string | null
  follow_up_at: string
}

export type DueQuote = {
  id: string
  quote_number: string | null
  client_name: string | null
  client_phone: string | null
  total_amount: number | null
  valid_until: string | null
  reminders: QuoteReminder[]
}

export type DueInvoice = {
  id: string
  invoice_number: string | null
  client_name: string | null
  client_phone: string | null
  total_amount: number
  paid_amount: number
  balance: number
  days_overdue: number
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** Last line of the lead's note history, trimmed, so the email shows where things were left. */
function lastNote(notes: string | null): string {
  const line = (notes ?? '').trim().split('\n').pop() ?? ''
  return line.length > 160 ? `${line.slice(0, 157)}…` : line
}

/** Subject, HTML and plain text for the daily follow-up email to the owner (leads and/or quotes). */
export function buildFollowUpEmail(leads: DueLead[], siteUrl: string, quotes: DueQuote[] = [], invoices: DueInvoice[] = []): { subject: string; html: string; text: string } {
  const parts: string[] = []
  if (leads.length) parts.push(`${leads.length} lead${leads.length === 1 ? '' : 's'}`)
  if (quotes.length) parts.push(`${quotes.length} quote${quotes.length === 1 ? '' : 's'}`)
  if (invoices.length) parts.push(`${invoices.length} invoice${invoices.length === 1 ? '' : 's'}`)
  const joined = parts.length > 1 ? `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}` : parts[0]
  const subject = `Follow-ups due: ${joined}`

  const leadRows = leads.map((l) => ({ l, info: followUpInfo(l.follow_up_at), wa: waLink(l.phone), link: `${siteUrl}/admin/leads/${l.id}`, note: lastNote(l.notes) }))
  const quoteRows = quotes.map((q) => ({ q, wa: q.client_phone ? waLink(q.client_phone) : null, link: `${siteUrl}/admin/quotes/${q.id}` }))

  const invoiceRows = invoices.map((i) => ({ i, wa: i.client_phone ? waLink(i.client_phone) : null, link: `${siteUrl}/admin/invoices/${i.id}` }))

  const card = (inner: string) => `<div style="border:1px solid #ddd;border-radius:8px;padding:12px 14px;margin:0 0 10px">${inner}</div>`
  const heading = (t: string) => `<p style="margin:16px 0 8px"><strong>${t}</strong></p>`

  const leadHtml = leadRows.length
    ? heading(`${leadRows.length === 1 ? '1 lead needs' : `${leadRows.length} leads need`} a follow-up`) +
      leadRows
        .map(({ l, info, wa, link, note }) =>
          card(`<div><strong>${esc(l.name)}</strong> · ${esc(l.service ?? l.service_slug ?? 'service not given')}${l.suburb ? ` · ${esc(l.suburb)}` : ''}</div>
<div style="color:#b45309;font-size:13px">${esc(info?.label ?? 'Follow-up due')} · stage: ${esc(l.status)}</div>
${note ? `<div style="color:#555;font-size:13px;margin-top:4px">Last note: ${esc(note)}</div>` : ''}
<div style="margin-top:8px"><a href="tel:${esc(normalisePhone(l.phone))}">Call ${esc(l.phone)}</a>${wa ? ` · <a href="${wa}">WhatsApp</a>` : ''} · <a href="${link}">Open lead</a></div>`),
        )
        .join('\n')
    : ''

  const quoteHtml = quoteRows.length
    ? heading('Quotes awaiting an answer') +
      quoteRows
        .map(({ q, wa, link }) =>
          card(`<div><strong>${esc(q.quote_number ?? 'Quote')}</strong> · ${esc(q.client_name ?? 'client not set')}${q.total_amount ? ` · R${groupThousands(q.total_amount)}` : ''}</div>
${q.reminders.map((r) => `<div style="color:#b45309;font-size:13px">${esc(REMINDER_TEXT[r])}</div>`).join('')}
${q.valid_until ? `<div style="color:#555;font-size:13px">Valid until ${esc(q.valid_until)}</div>` : ''}
<div style="margin-top:8px">${q.client_phone ? `<a href="tel:${esc(normalisePhone(q.client_phone))}">Call ${esc(q.client_phone)}</a>${wa ? ` · <a href="${wa}">WhatsApp</a>` : ''} · ` : ''}<a href="${link}">Open quote</a></div>`),
        )
        .join('\n')
    : ''

  const owed = (i: DueInvoice) => (i.paid_amount > 0 ? `R${groupThousands(i.balance)} of R${groupThousands(i.total_amount)} still owed` : `R${groupThousands(i.balance)} owed`)

  const invoiceHtml = invoiceRows.length
    ? heading('Invoices to chase') +
      invoiceRows
        .map(({ i, wa, link }) =>
          card(`<div><strong>${esc(i.invoice_number ?? 'Invoice')}</strong> · ${esc(i.client_name ?? 'client not set')} · ${esc(owed(i))}</div>
<div style="color:#b45309;font-size:13px">${esc(invoiceChaseText(i.days_overdue))}</div>
<div style="margin-top:8px">${i.client_phone ? `<a href="tel:${esc(normalisePhone(i.client_phone))}">Call ${esc(i.client_phone)}</a>${wa ? ` · <a href="${wa}">WhatsApp</a>` : ''} · ` : ''}<a href="${link}">Open invoice</a></div>`),
        )
        .join('\n')
    : ''

  const html = `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5;max-width:600px">
${leadHtml}${quoteHtml}${invoiceHtml}
<p style="font-size:12px;color:#777">Leads: to stop a reminder, open the lead and set a new date, clear it, or move it to Won or Lost. Quote reminders stop by themselves once the quote is accepted, declined or expired. Invoice reminders stop once the invoice is paid; void an invoice you have written off.</p>
</div>`

  const text = [
    ...(leadRows.length
      ? [
          `${leadRows.length} lead${leadRows.length === 1 ? '' : 's'} need a follow-up:`,
          '',
          ...leadRows.map(({ l, info, link, note }) =>
            [`- ${l.name} · ${l.service ?? l.service_slug ?? 'service not given'}${l.suburb ? ` · ${l.suburb}` : ''}`, `  ${info?.label ?? 'Follow-up due'} · ${l.phone}`, note ? `  Last note: ${note}` : '', `  ${link}`]
              .filter(Boolean)
              .join('\n'),
          ),
          '',
        ]
      : []),
    ...(quoteRows.length
      ? [
          'Quotes awaiting an answer:',
          '',
          ...quoteRows.map(({ q, link }) =>
            [`- ${q.quote_number ?? 'Quote'} · ${q.client_name ?? 'client not set'}${q.total_amount ? ` · R${groupThousands(q.total_amount)}` : ''}`, ...q.reminders.map((r) => `  ${REMINDER_TEXT[r]}`), q.client_phone ? `  ${q.client_phone}` : '', `  ${link}`]
              .filter(Boolean)
              .join('\n'),
          ),
          '',
        ]
      : []),
    ...(invoiceRows.length
      ? [
          'Invoices to chase:',
          '',
          ...invoiceRows.map(({ i, link }) =>
            [`- ${i.invoice_number ?? 'Invoice'} · ${i.client_name ?? 'client not set'} · ${owed(i)}`, `  ${invoiceChaseText(i.days_overdue)}`, i.client_phone ? `  ${i.client_phone}` : '', `  ${link}`]
              .filter(Boolean)
              .join('\n'),
          ),
          '',
        ]
      : []),
    'Leads: set a new date, clear it, or move to Won or Lost to stop a reminder. Quote reminders stop by themselves once the quote is accepted, declined or expired. Invoice reminders stop once the invoice is paid; void an invoice you have written off.',
  ].join('\n')

  return { subject, html, text }
}
