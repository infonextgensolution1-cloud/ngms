import { NextResponse } from 'next/server'
import { sendLeadEmail } from '@/lib/lead-email'

// RESEND_API_KEY must be added in Vercel → Project Settings → Environment
// Variables (never commit it to the repo).

type LeadPayload = {
  name?: string
  phone?: string
  email?: string
  suburb?: string
  service?: string
  sizeDetails?: string
  preferredContact?: string
  firstBookingDiscount?: boolean
  message?: string
}

export async function POST(request: Request) {
  let body: LeadPayload

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 })
  }

  const { name, phone, email, suburb, service, sizeDetails, preferredContact, firstBookingDiscount, message } = body

  if (!name || !phone) {
    return NextResponse.json({ ok: false, error: 'Missing name or phone' }, { status: 400 })
  }

  const lines = [
    `New quote request from the website:`,
    ``,
    `Name: ${name}`,
    `Phone: ${phone}`,
    email ? `Email: ${email}` : null,
    `Suburb: ${suburb ?? '—'}`,
    `Service: ${service ?? '—'}`,
    sizeDetails ? `Size / panels / m²: ${sizeDetails}` : null,
    preferredContact ? `Preferred contact: ${preferredContact}` : null,
    firstBookingDiscount ? '10% first-booking discount requested' : null,
    message ? `Details: ${message}` : null,
    ``,
    `A WhatsApp tab was also opened on the customer's device with these details —`,
    `they still need to press send on their side, so don't rely on that alone.`,
  ].filter(Boolean) as string[]

  try {
    await sendLeadEmail(`New lead — ${service ?? 'quote request'} (${suburb ?? 'unknown area'})`, lines, email)
  } catch (err) {
    // Best-effort: a failed notification email should never break the
    // customer's quote submission flow. Log it so it's visible in
    // Vercel's runtime logs, but return 200 either way.
    console.error('Failed to send lead notification email:', err)
    return NextResponse.json({ ok: false, error: 'Email send failed' }, { status: 200 })
  }

  return NextResponse.json({ ok: true })

  // TODO: once the WhatsApp Cloud API webhook (separate Render project) is
  // live, add an outbound call here to (a) send the customer an automatic
  // confirmation message and (b) ping Jacques on WhatsApp too, so the alert
  // doesn't depend on email alone.
}
