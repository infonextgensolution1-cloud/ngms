import { ask, errorResponse, HttpError, requireStaff } from '@/lib/ai/claude'
import { LEAD_COLUMNS, type Lead } from '@/lib/ngms-leads-ui'
import { RATE_CARD } from '@/lib/rate-card'

// Drafts a follow-up message for a lead. The owner edits and sends it; nothing is sent from here.

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 120

type Channel = 'whatsapp' | 'email'

export async function POST(request: Request) {
  try {
    const sb = await requireStaff(request)
    const body = (await request.json().catch(() => ({}))) as { leadId?: unknown; channel?: unknown; extra?: unknown }
    const leadId = typeof body.leadId === 'string' ? body.leadId : ''
    const channel: Channel = body.channel === 'email' ? 'email' : 'whatsapp'
    const extra = typeof body.extra === 'string' ? body.extra.trim().slice(0, 1000) : ''
    if (!leadId) throw new HttpError(400, 'Missing lead.')

    const { data, error } = await sb.from('leads').select(LEAD_COLUMNS).eq('id', leadId).maybeSingle()
    if (error) throw new HttpError(500, error.message)
    if (!data) throw new HttpError(404, 'Lead not found.')
    const lead = data as Lead

    const rates = RATE_CARD.find((g) => g.slug === lead.service_slug)
    const rateLines = rates ? rates.items.map((i) => `- ${i.label}: from R${i.price}/${i.unit}`).join('\n') : '(no rate card match; do not quote a price)'

    const format =
      channel === 'whatsapp'
        ? 'A WhatsApp message: under 90 words, short lines, no markdown, at most one emoji. Sign off "Jacques, NGMS".'
        : 'An email: first line "Subject: …", then the body. Under 170 words, plain text, no markdown. Sign off "Jacques\nNext Gen Maintenance Solutions".'

    const prompt = `Draft a follow-up to this lead. The goal is to book a site visit or get the details needed to quote.

Lead:
- Name: ${lead.name}
- Service: ${lead.service ?? lead.service_slug ?? 'not given'}
- Area: ${lead.suburb ?? 'not given'}
- Pipeline stage: ${lead.status}
- Received: ${lead.created_at.slice(0, 10)} (today is ${new Date().toISOString().slice(0, 10)})
- Their message: ${lead.message || '(none)'}
- Our notes so far: ${lead.notes || '(none)'}

Rate card for this service (ex VAT, "from" prices):
${rateLines}

${extra ? `Owner's instructions for this message: ${extra}\n\n` : ''}Rules: ${format} Use their first name. Only mention a "from" price if it clearly fits what they asked for. Ask for exactly what we still need (e.g. panel count, m², photos, address, a good time). Output only the message.`

    const text = await ask({ prompt, maxTokens: 4000, effort: 'low' })
    return Response.json({ text })
  } catch (e) {
    return errorResponse(e)
  }
}
