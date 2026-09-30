import { ask, errorResponse, HttpError, requireStaff } from '@/lib/ai/claude'
import type { QuoteDraft } from '@/lib/ai/client'
import { CALLOUT_FEE, RATE_CARD } from '@/lib/rate-card'

// Turns rough job notes into quote lines + scope notes for /admin/quotes/new.
// Returns a draft only; the owner checks every line before saving.

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 180

const SLUGS = [...RATE_CARD.map((g) => g.slug), 'other']

const SCHEMA = {
  type: 'object',
  properties: {
    lines: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          description: { type: 'string' },
          quantity: { type: 'number' },
          unit: { type: 'string' },
          unit_price: { type: 'number' },
          service_slug: { type: 'string', enum: SLUGS },
        },
        required: ['description', 'quantity', 'unit', 'unit_price', 'service_slug'],
        additionalProperties: false,
      },
    },
    scope_notes: { type: 'string' },
    questions: { type: 'array', items: { type: 'string' } },
  },
  required: ['lines', 'scope_notes', 'questions'],
  additionalProperties: false,
}

const RATES = RATE_CARD.map(
  (g) => `${g.group} [${g.slug}]\n${g.items.map((i) => `  - ${i.label}: R${i.price}/${i.unit}`).join('\n')}`,
).join('\n')

export async function POST(request: Request) {
  try {
    await requireStaff(request)
    const body = (await request.json().catch(() => ({}))) as { notes?: unknown; suburb?: unknown }
    const notes = typeof body.notes === 'string' ? body.notes.trim().slice(0, 6000) : ''
    const suburb = typeof body.suburb === 'string' ? body.suburb.trim().slice(0, 100) : ''
    if (notes.length < 10) throw new HttpError(400, 'Add a few words about the job first.')

    const prompt = `Turn my site notes into quote lines for an NGMS quote.

Site notes:
${notes}

Suburb: ${suburb || 'not given'}

NGMS rate card (ZAR ex VAT; use these prices, adjust only where the notes clearly justify it):
${RATES}
Callout outside the Helderberg Basin: R${CALLOUT_FEE}/job (add it only if the suburb is outside the basin).

Rules:
- One line per distinct piece of work, with a client-friendly description (what's done, method/material, e.g. "2 coats Plascon Wall & All").
- quantity × unit_price must match the rate card unit (m², m, hour, job, panel…). If a measurement is missing, use your best estimate from the notes and list the question.
- Solar: up to 10 panels R550, 11–20 R950, 21–30 R1350, 31–40 R1700 (unit "job", qty 1); 41+ is R50/panel.
- Handyman has a 2-hour minimum.
- Work not on the rate card: service_slug "other", price at Helderberg market rates incl. Builders Warehouse materials.
- scope_notes: 3–6 short plain-text lines for the quote: what's included, what's excluded, access/prep, and weather dependence for painting/waterproofing/paving. No prices.
- questions: what I still need to confirm with the client before sending (empty if nothing).`

    const text = await ask({ prompt, maxTokens: 16000, effort: 'medium', schema: SCHEMA })
    let draft: QuoteDraft
    try {
      draft = JSON.parse(text) as QuoteDraft
    } catch {
      throw new HttpError(502, 'Could not read the draft. Try again.')
    }
    return Response.json(draft)
  } catch (e) {
    return errorResponse(e)
  }
}
