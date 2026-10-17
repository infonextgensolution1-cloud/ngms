import { NextResponse } from 'next/server'
import { sendLeadEmail, sendCustomerAutoReply } from '@/lib/lead-email'
import { rateLimit, clientIp, isEmail } from '@/lib/rate-limit'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { quotePhotoPath, signQuotePhoto } from '@/lib/quote-photo'

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
  website?: string // honeypot — real users leave this empty
  consent?: boolean
  estimate?: string
  photoUrl?: string
  preferredDate?: string
  leadScore?: number
  notSaved?: boolean // the browser could not save the lead to Supabase; this email is the only copy
}

export async function POST(request: Request) {
  let body: LeadPayload

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 })
  }

  const { name, phone, email, suburb, service, sizeDetails, preferredContact, firstBookingDiscount, message, website, estimate, photoUrl, preferredDate, leadScore, notSaved } = body

  // Honeypot: pretend success so bots don't retry.
  if (website) return NextResponse.json({ ok: true })
  if (!rateLimit(`notify:${clientIp(request)}`)) {
    return NextResponse.json({ ok: false, error: 'Too many requests' }, { status: 429 })
  }

  if (typeof name !== 'string' || typeof phone !== 'string' || !name.trim() || !phone.trim()) {
    return NextResponse.json({ ok: false, error: 'Missing name or phone' }, { status: 400 })
  }
  const phoneDigits = phone.replace(/\D/g, '')
  if (phone.length > 20 || phoneDigits.length < 9 || phoneDigits.length > 13) {
    return NextResponse.json({ ok: false, error: 'Invalid phone number' }, { status: 400 })
  }
  // Cap free-text fields so the endpoint can't be used to relay large payloads by email.
  const tooLong = [name, email, suburb, service, sizeDetails, preferredContact, estimate, photoUrl, preferredDate]
    .some((v) => typeof v === 'string' && v.length > 300)
  if (tooLong || (typeof message === 'string' && message.length > 4000)) {
    return NextResponse.json({ ok: false, error: 'Field too long' }, { status: 400 })
  }

  // Photos are in a private bucket: email a 7-day signed link (the lead in Admin
  // always has the photo). Only quote-photos/ paths are ever signed.
  let photoLine: string | null = null
  if (photoUrl && quotePhotoPath(photoUrl)) {
    let signed: string | null = null
    try {
      signed = await signQuotePhoto(supabaseAdmin(), photoUrl, 7 * 24 * 60 * 60)
    } catch (err) {
      console.error('Could not sign quote photo for email:', err)
    }
    photoLine = signed ? `Photo (link valid 7 days): ${signed}` : 'Photo: attached to the lead in Admin → Leads'
  }

  const lines = [
    notSaved ? `⚠ NOT SAVED IN ADMIN — the website could not reach the database. Add this lead manually.` : null,
    notSaved ? `` : null,
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
    preferredDate ? `Preferred date: ${preferredDate}` : null,
    typeof leadScore === 'number' ? `Lead readiness score: ${Math.max(0, Math.min(100, Math.round(leadScore)))} / 100` : null,
    estimate ? `Instant estimate shown: ${estimate}` : null,
    photoLine,
    message ? `Details: ${message}` : null,
  ].filter((l) => l !== null) as string[]

  try {
    await sendLeadEmail(`${notSaved ? '[NOT SAVED] ' : ''}New lead — ${service ?? 'quote request'} (${suburb ?? 'unknown area'})`, lines, isEmail(email) ? email : null)
  } catch (err) {
    // Best-effort: a failed notification email should never break the
    // customer's quote submission flow. Log it so it's visible in
    // Vercel's runtime logs, but return 200 either way.
    console.error('Failed to send lead notification email:', err)
    return NextResponse.json({ ok: false, error: 'Email send failed' }, { status: 200 })
  }

  // Customer auto-reply (best-effort, only with a valid email).
  if (isEmail(email)) {
    try {
      await sendCustomerAutoReply({ to: email, name, service, suburb, estimateLine: estimate })
    } catch (err) {
      console.error('Failed to send customer auto-reply:', err)
    }
  }

  return NextResponse.json({ ok: true })

  // TODO: once the WhatsApp Cloud API webhook (separate Render project) is
  // live, add an outbound call here to (a) send the customer an automatic
  // confirmation message and (b) ping Jacques on WhatsApp too, so the alert
  // doesn't depend on email alone.
}
