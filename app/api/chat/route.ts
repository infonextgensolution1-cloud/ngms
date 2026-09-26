import Anthropic from '@anthropic-ai/sdk'
import { claude, FALLBACK_BETA, HttpError, MODEL } from '@/lib/ai/claude'
import { CHAT_SYSTEM, SERVICE_NAMES } from '@/lib/ai/chat-knowledge'
import { sendLeadEmail } from '@/lib/lead-email'
import { normalisePhone } from '@/lib/ngms-leads-ui'
import { supabase } from '@/lib/ngms-public-supabase'
import { services } from '@/lib/services'
import { SITE } from '@/lib/site'

// Public website chat assistant: answers FAQs and takes booking requests.
// A booking lands in the `leads` table (same as the quote form) and emails Jacques.
//
// Vercel env vars:
//   ANTHROPIC_API_KEY  required (shared with the admin AI tools)
//   CHAT_MODEL         optional, overrides CLAUDE_MODEL for this public chat only
//   ZAPIER_BOOKING_WEBHOOK_URL  optional, a Zapier "Catch Hook" URL. Every chat booking is
//                      POSTed there as JSON so a Zap can add it to Calendar, WhatsApp, Sheets etc.

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60

const CHAT_MODEL = process.env.CHAT_MODEL || MODEL
const MAX_HISTORY = 30
const MAX_CHARS = 1500
const MAX_TOOL_ROUNDS = 3

type Turn = { role: 'user' | 'assistant'; text: string }
type Booking = { ref: string }

// Best-effort abuse limits. Per server instance (serverless resets them), which is
// enough to stop one visitor hammering the API or flooding the leads table.
const hits = new Map<string, number[]>()
function full(key: string, max: number, windowMs: number): boolean {
  const now = Date.now()
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs)
  hits.set(key, recent)
  return recent.length >= max
}
function record(key: string) {
  if (hits.size > 5000) hits.clear()
  hits.set(key, [...(hits.get(key) ?? []), Date.now()])
}
function limited(key: string, max: number, windowMs: number): boolean {
  if (full(key, max, windowMs)) return true
  record(key)
  return false
}
const BOOKINGS_PER_DAY = 3
const DAY_MS = 24 * 60 * 60 * 1000

const BOOKING_TOOL: Anthropic.Beta.BetaTool = {
  name: 'request_booking',
  description:
    "Send the customer's booking request to Jacques (the owner) once they have confirmed the details. Creates a lead and alerts him; he then confirms date and price with the customer. Returns a reference number, or an error describing what to fix.",
  strict: true,
  input_schema: {
    type: 'object',
    additionalProperties: false,
    required: ['name', 'phone', 'email', 'suburb', 'service', 'details', 'preferred_date', 'preferred_time', 'contact_pref'],
    properties: {
      name: { type: 'string', description: 'Customer full name' },
      phone: { type: 'string', description: 'South African phone/WhatsApp number as given' },
      email: { type: ['string', 'null'], description: 'Email if given, else null' },
      suburb: { type: 'string', description: "Suburb or town, e.g. Gordon's Bay" },
      service: { type: 'string', enum: SERVICE_NAMES },
      details: { type: 'string', description: 'Job description: size (panels, m²), condition, access, anything else relevant' },
      preferred_date: { type: 'string', description: 'Preferred date, YYYY-MM-DD' },
      preferred_time: { type: 'string', enum: ['morning', 'afternoon', 'any'] },
      contact_pref: { type: 'string', enum: ['WhatsApp', 'Phone call', 'Email'] },
    },
  },
}

type BookingInput = {
  name: string
  phone: string
  email: string | null
  suburb: string
  service: string
  details: string
  preferred_date: string
  preferred_time: string
  contact_pref: string
}

function sastToday(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Johannesburg' })
}

/** Returns a problem for Claude to relay to the customer, or null when the booking is valid. */
function checkBooking(b: BookingInput): string | null {
  if (!b.name?.trim()) return 'Name is missing.'
  if (!/^\+27\d{9}$/.test(normalisePhone(b.phone ?? ''))) return 'Phone number is not a valid South African number (10 digits, e.g. 082 123 4567).'
  if (!b.suburb?.trim()) return 'Suburb is missing.'
  if (!SERVICE_NAMES.includes(b.service)) return 'Unknown service.'
  if (!/^\d{4}-\d{2}-\d{2}$/.test(b.preferred_date ?? '')) return 'Preferred date must be a real date.'
  const date = new Date(`${b.preferred_date}T12:00:00+02:00`)
  // JS rolls impossible dates over (31 Nov → 1 Dec), so check the date survives the round trip.
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== b.preferred_date) {
    return `${b.preferred_date} is not a real date. Ask for the date again.`
  }
  if (b.preferred_date <= sastToday()) return 'Preferred date must be from tomorrow onwards.'
  if (date.getTime() - Date.now() > 120 * 86400000) return 'Preferred date is more than 4 months away; ask for a nearer date.'
  if (date.getUTCDay() === 0) return 'We do not work on Sundays. Ask for a Monday–Saturday date.'
  return null
}

async function saveBooking(b: BookingInput): Promise<Booking> {
  const phone = normalisePhone(b.phone)
  const svc = services.find((s) => s.name === b.service)
  const when = `${b.preferred_date} (${b.preferred_time})`
  const ref = `WEB-${b.preferred_date.replace(/-/g, '').slice(2)}-${phone.slice(-4)}`
  const message = [
    `[Website chat booking request] Ref: ${ref}`,
    `Preferred date: ${when}`,
    `Preferred contact: ${b.contact_pref}`,
    `Details: ${b.details}`,
  ].join('\n')

  const { error } = await supabase.from('leads').insert({
    name: b.name.trim(),
    phone,
    email: b.email?.trim() || null,
    suburb: b.suburb.trim(),
    service: b.service,
    service_slug: svc?.slug ?? null,
    message,
    status: 'new',
  })
  if (error) {
    console.error('Chat booking insert failed', error.message)
    throw new Error('insert')
  }

  // The lead is already saved; a failed email or Zap must not fail the booking.
  const [email, zap] = await Promise.allSettled([
    sendLeadEmail(
      `Chat booking — ${b.service} (${b.suburb}) for ${when}`,
      [
        'New booking request from the website chat assistant:',
        '',
        `Ref: ${ref}`,
        `Name: ${b.name}`,
        `Phone: ${phone}`,
        b.email ? `Email: ${b.email}` : null,
        `Suburb: ${b.suburb}`,
        `Service: ${b.service}`,
        `Preferred: ${when}`,
        `Contact via: ${b.contact_pref}`,
        `Details: ${b.details}`,
        '',
        'The customer was told you will confirm the date and price. Saved in Leads as "new".',
      ].filter((l): l is string => l !== null),
      b.email,
    ),
    sendToZapier({
      ref,
      name: b.name.trim(),
      phone,
      email: b.email?.trim() || null,
      suburb: b.suburb.trim(),
      service: b.service,
      service_slug: svc?.slug ?? null,
      details: b.details,
      preferred_date: b.preferred_date,
      preferred_time: b.preferred_time,
      contact_pref: b.contact_pref,
      whatsapp_link: `https://wa.me/${phone.replace(/\D/g, '')}`,
      source: 'website-chat',
      created_at: new Date().toISOString(),
    }),
  ])
  if (email.status === 'rejected') console.error('Chat booking email failed', email.reason)
  if (zap.status === 'rejected') console.error('Chat booking Zapier webhook failed', zap.reason)
  return { ref }
}

async function sendToZapier(payload: Record<string, unknown>): Promise<void> {
  const url = process.env.ZAPIER_BOOKING_WEBHOOK_URL
  if (!url) return
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(8000),
  })
  if (!res.ok) throw new Error(`Zapier responded ${res.status}`)
}

function parseHistory(body: unknown): Anthropic.Beta.BetaMessageParam[] {
  const raw = (body as { messages?: unknown })?.messages
  if (!Array.isArray(raw)) throw new HttpError(400, 'Missing messages.')
  const turns = raw
    .filter((m): m is Turn => (m?.role === 'user' || m?.role === 'assistant') && typeof m?.text === 'string')
    .slice(-MAX_HISTORY)
    .map((m) => ({ role: m.role, content: m.text.trim().slice(0, MAX_CHARS) || '…' }))
  while (turns.length && turns[0].role !== 'user') turns.shift()
  if (!turns.length || turns[turns.length - 1].role !== 'user') throw new HttpError(400, 'The last message must be from you.')
  return turns
}

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const fallbackReply = `Sorry, I can't answer right now. Please WhatsApp or call Jacques on ${SITE.phoneDisplay} and he'll help you straight away.`

  try {
    if (limited(`msg:${ip}`, 40, 10 * 60 * 1000)) {
      throw new HttpError(429, `You're sending messages quickly. Give it a minute, or WhatsApp us on ${SITE.phoneDisplay}.`)
    }
    const messages = parseHistory(await request.json().catch(() => null))
    let booking: Booking | undefined

    for (let round = 0; round <= MAX_TOOL_ROUNDS; round++) {
      const msg = await claude().beta.messages.create({
        model: CHAT_MODEL,
        max_tokens: 4000,
        betas: [FALLBACK_BETA],
        fallbacks: 'default',
        thinking: { type: 'adaptive' },
        output_config: { effort: 'low' },
        system: [
          { type: 'text', text: CHAT_SYSTEM, cache_control: { type: 'ephemeral' } },
          { type: 'text', text: `Today is ${new Date().toLocaleDateString('en-ZA', { timeZone: 'Africa/Johannesburg', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} (${sastToday()}).` },
        ],
        tools: [BOOKING_TOOL],
        messages,
      })

      if (msg.stop_reason === 'refusal') {
        return Response.json({ reply: `Sorry, I can't help with that one. For anything about your property, WhatsApp Jacques on ${SITE.phoneDisplay}.`, booking })
      }

      const toolUses = msg.content.filter((b): b is Anthropic.Beta.BetaToolUseBlock => b.type === 'tool_use')
      if (msg.stop_reason !== 'tool_use' || !toolUses.length || round === MAX_TOOL_ROUNDS) {
        const reply = msg.content
          .map((b) => (b.type === 'text' ? b.text : ''))
          .join('')
          .trim()
        return Response.json({ reply: reply || fallbackReply, booking })
      }

      messages.push({ role: 'assistant', content: msg.content })
      const results: Anthropic.Beta.BetaToolResultBlockParam[] = []
      for (const use of toolUses) {
        let content: string
        let isError = false
        if (use.name !== BOOKING_TOOL.name) {
          content = 'Unknown tool.'
          isError = true
        } else if (booking) {
          content = `Already sent in this chat (ref ${booking.ref}). Don't send it again.`
        } else if (full(`book:${ip}`, BOOKINGS_PER_DAY, DAY_MS)) {
          content = `Booking limit reached for today. Ask the customer to WhatsApp ${SITE.phoneDisplay} instead.`
          isError = true
        } else {
          const input = use.input as BookingInput
          const problem = checkBooking(input)
          if (problem) {
            content = problem
            isError = true
          } else {
            try {
              booking = await saveBooking(input)
              record(`book:${ip}`)
              content = `Booking request sent. Reference: ${booking.ref}.`
            } catch {
              content = `Saving failed on our side. Ask the customer to WhatsApp the details to ${SITE.phoneDisplay} instead.`
              isError = true
            }
          }
        }
        results.push({ type: 'tool_result', tool_use_id: use.id, content, is_error: isError })
      }
      messages.push({ role: 'user', content: results })
    }
    return Response.json({ reply: fallbackReply, booking })
  } catch (e) {
    // 400/429 messages are written for the visitor; anything else (e.g. a missing API key) is not.
    if (e instanceof HttpError && e.status < 500) return Response.json({ error: e.message }, { status: e.status })
    if (e instanceof Anthropic.APIError) console.error('Chat Claude API error', e.status, e.message)
    else console.error('Chat route error', e instanceof Error ? e.message : e)
    return Response.json({ error: fallbackReply }, { status: 502 })
  }
}
