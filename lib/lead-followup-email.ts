import { followUpInfo, normalisePhone, waLink } from '@/lib/ngms-leads-ui'

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

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** Last line of the lead's note history, trimmed, so the email shows where things were left. */
function lastNote(notes: string | null): string {
  const line = (notes ?? '').trim().split('\n').pop() ?? ''
  return line.length > 160 ? `${line.slice(0, 157)}…` : line
}

/** Subject, HTML and plain text for the daily "leads to follow up today" email to the owner. */
export function buildFollowUpEmail(leads: DueLead[], siteUrl: string): { subject: string; html: string; text: string } {
  const subject = leads.length === 1 ? 'Lead follow-up due today: 1 lead' : `Lead follow-ups due: ${leads.length} leads`
  const rows = leads.map((l) => {
    const info = followUpInfo(l.follow_up_at)
    const wa = waLink(l.phone)
    const link = `${siteUrl}/admin/leads/${l.id}`
    return { l, info, wa, link, note: lastNote(l.notes) }
  })

  const html = `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5;max-width:600px">
<p><strong>${leads.length === 1 ? '1 lead needs' : `${leads.length} leads need`} a follow-up.</strong></p>
${rows
  .map(
    ({ l, info, wa, link, note }) => `<div style="border:1px solid #ddd;border-radius:8px;padding:12px 14px;margin:0 0 10px">
<div><strong>${esc(l.name)}</strong> · ${esc(l.service ?? l.service_slug ?? 'service not given')}${l.suburb ? ` · ${esc(l.suburb)}` : ''}</div>
<div style="color:#b45309;font-size:13px">${esc(info?.label ?? 'Follow-up due')} · stage: ${esc(l.status)}</div>
${note ? `<div style="color:#555;font-size:13px;margin-top:4px">Last note: ${esc(note)}</div>` : ''}
<div style="margin-top:8px"><a href="tel:${esc(normalisePhone(l.phone))}">Call ${esc(l.phone)}</a>${wa ? ` · <a href="${wa}">WhatsApp</a>` : ''} · <a href="${link}">Open lead</a></div>
</div>`,
  )
  .join('\n')}
<p style="font-size:12px;color:#777">To stop a reminder, open the lead and set a new date, clear it, or move it to Won or Lost.</p>
</div>`

  const text = [
    `${leads.length} lead${leads.length === 1 ? '' : 's'} need a follow-up:`,
    '',
    ...rows.map(({ l, info, link, note }) =>
      [`- ${l.name} · ${l.service ?? l.service_slug ?? 'service not given'}${l.suburb ? ` · ${l.suburb}` : ''}`, `  ${info?.label ?? 'Follow-up due'} · ${l.phone}`, note ? `  Last note: ${note}` : '', `  ${link}`]
        .filter(Boolean)
        .join('\n'),
    ),
    '',
    'To stop a reminder: set a new date, clear it, or move the lead to Won or Lost.',
  ].join('\n')

  return { subject, html, text }
}
