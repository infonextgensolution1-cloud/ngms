import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { sendPortalInvite } from '@/lib/lead-email'
import { clientIp, isEmail, rateLimit } from '@/lib/rate-limit'
import { SITE } from '@/lib/site'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const GENERIC_MESSAGE = 'If this email matches an active NGMS portal account, a secure sign-in link will be sent shortly. Check your inbox and spam folder.'

export async function POST(request: Request) {
  const ip = clientIp(request)
  if (!rateLimit(`portal-login-ip:${ip}`, 5, 10 * 60 * 1000)) {
    return NextResponse.json({ error: 'Too many requests. Please wait a few minutes and try again.' }, { status: 429 })
  }

  const body = (await request.json().catch(() => ({}))) as { email?: unknown }
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  if (!isEmail(email)) return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 })
  if (!rateLimit(`portal-login-email:${email}`, 3, 15 * 60 * 1000)) {
    return NextResponse.json({ error: 'Too many requests for this email. Please wait a few minutes and try again.' }, { status: 429 })
  }

  let db
  try {
    db = supabaseAdmin()
  } catch {
    console.error('portal login link: Supabase admin client is not configured')
    return NextResponse.json({ error: 'The portal sign-in service is temporarily unavailable. Please contact NGMS on WhatsApp 063 138 7945.' }, { status: 503 })
  }

  // Only issue a link for a real NGMS client with an active portal-access row.
  // This prevents public account creation from granting access to arbitrary emails.
  const { data: clients, error: clientsError } = await db
    .from('clients')
    .select('id,name,email')
    .ilike('email', email)
  if (clientsError) {
    console.error('portal login link: client lookup failed')
    return NextResponse.json({ error: 'The portal sign-in service is temporarily unavailable. Please try again later.' }, { status: 503 })
  }
  const ownClients = (clients ?? []).filter((client) => (client.email ?? '').trim().toLowerCase() === email)
  if (!ownClients.length) return NextResponse.json({ ok: true, message: GENERIC_MESSAGE })

  const { data: accessRows, error: accessError } = await db
    .from('client_portal_access')
    .select('client_id,access_mode,expires_at,revoked_at,one_time_session_id')
    .in('client_id', ownClients.map((client) => client.id))
  if (accessError) {
    console.error('portal login link: access lookup failed')
    return NextResponse.json({ error: 'The portal sign-in service is temporarily unavailable. Please try again later.' }, { status: 503 })
  }

  const now = Date.now()
  const activeAccess = (accessRows ?? []).filter((access) => {
    if (access.revoked_at) return false
    if (access.access_mode === 'temporary' && (!access.expires_at || new Date(access.expires_at).getTime() <= now)) return false
    // A claimed one-time link is deliberately not reissued from the public form.
    if (access.access_mode === 'one_time' && access.one_time_session_id) return false
    return true
  })
  if (!activeAccess.length) return NextResponse.json({ ok: true, message: GENERIC_MESSAGE })

  const client = ownClients.find((candidate) => activeAccess.some((access) => access.client_id === candidate.id))!
  const redirectTo = SITE.url + '/portal'

  // Use the existing Resend mail path, not Supabase's built-in SMTP sender.
  // Create the Auth account on first access; send a magic link for existing accounts.
  let { data: link, error: linkError } = await db.auth.admin.generateLink({
    type: 'invite',
    email,
    options: { redirectTo },
  })
  if (linkError && (linkError.code === 'email_exists' || /already (been )?registered|already exists/i.test(linkError.message))) {
    ;({ data: link, error: linkError } = await db.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: { redirectTo },
    }))
  }

  const actionLink = link?.properties?.action_link
  if (linkError || !actionLink) {
    console.error('portal login link: Auth link generation failed', linkError?.code || 'unknown')
    return NextResponse.json({ error: 'Could not create a sign-in link. Please contact NGMS on WhatsApp 063 138 7945.' }, { status: 503 })
  }

  try {
    await sendPortalInvite({ to: email, name: client.name || 'there', link: actionLink })
  } catch {
    console.error('portal login link: email delivery failed')
    return NextResponse.json({ error: 'The sign-in email could not be sent just now. Please try again shortly or contact NGMS on WhatsApp 063 138 7945.' }, { status: 502 })
  }

  return NextResponse.json({ ok: true, message: GENERIC_MESSAGE }, { headers: { 'Cache-Control': 'no-store' } })
}
