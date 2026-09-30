import { NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { rateLimit, clientIp, isEmail } from '@/lib/rate-limit'
import { RECURRING_PACKAGES } from '@/lib/packages'
import { sendLeadEmail } from '@/lib/lead-email'

const intervalFor = (frequency: string) => Number(frequency.match(/(\d+)\s*months?/i)?.[1] ?? 0)

export async function POST(req: Request) {
  let b: Record<string, unknown>
  try {
    b = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request' }, { status: 400 })
  }
  if (b.website) return NextResponse.json({ ok: true }) // honeypot
  if (!rateLimit(`plan:${clientIp(req)}`, 4)) return NextResponse.json({ ok: false, error: 'Too many requests' }, { status: 429 })

  const name = String(b.name ?? '').trim().slice(0, 120)
  const phone = String(b.phone ?? '').trim().slice(0, 40)
  const email = String(b.email ?? '').trim().toLowerCase()
  const suburb = String(b.suburb ?? '').trim().slice(0, 80) || null
  const pkg = RECURRING_PACKAGES.find((p) => p.name === b.plan)
  const interval = pkg ? intervalFor(pkg.frequency) : 0
  if (!name || !phone || !isEmail(email) || !pkg || !interval) {
    return NextResponse.json({ ok: false, error: 'Please complete all fields.' }, { status: 400 })
  }
  if (b.consent !== true) return NextResponse.json({ ok: false, error: 'Consent is required.' }, { status: 400 })

  const next = new Date()
  next.setMonth(next.getMonth() + interval)
  try {
    const { error } = await supabaseAdmin().from('plan_signups').insert({
      name,
      phone,
      email,
      suburb,
      plan_name: pkg.name,
      interval_months: interval,
      next_reminder_date: next.toISOString().slice(0, 10),
      consent_at: new Date().toISOString(),
      unsubscribe_token: randomBytes(24).toString('hex'),
    })
    if (error) throw error
  } catch (err) {
    console.error('plan-signup failed:', err)
    return NextResponse.json({ ok: false, error: 'Could not save your sign-up.' }, { status: 500 })
  }
  try {
    await sendLeadEmail(`New plan sign-up — ${pkg.name} (${suburb ?? 'unknown area'})`, [
      `Plan: ${pkg.name} (${pkg.frequency})`,
      `Name: ${name}`,
      `Phone: ${phone}`,
      `Email: ${email}`,
      `Suburb: ${suburb ?? '—'}`,
      'Consent to reminders recorded.',
    ], email)
  } catch (err) {
    console.error('plan-signup notify failed:', err)
  }
  return NextResponse.json({ ok: true })
}
