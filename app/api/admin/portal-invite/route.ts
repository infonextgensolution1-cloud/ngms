import { NextResponse } from 'next/server'
import { jwtAal, MFA_REQUIRED_MESSAGE } from '@/lib/jwt-aal'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { sendPortalInvite } from '@/lib/lead-email'
import { isEmail } from '@/lib/rate-limit'
import { SITE } from '@/lib/site'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Staff action: email a client a one-tap sign-in link to the customer portal.
//
// Supabase sign-ups are off, so a customer can only log in once an auth account exists
// for their email. This creates that account (admin API, no password) and emails the
// link ourselves via Resend. The link is NEVER returned to the browser: it is a login
// for that client, so it only ever goes to the email address on their client record.
//
// Authorisation: the caller must be an ACTIVE row in public.prompt_users — the same
// check the database policies use (private.is_ngms_prompt_user()). A signed-in portal
// customer is not staff and gets 403.
export async function POST(request: Request) {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim()
  if (!token) return NextResponse.json({ error: 'Sign in to /admin first.' }, { status: 401 })

  let db
  try {
    db = supabaseAdmin()
  } catch {
    return NextResponse.json({ error: 'Server is not configured for invites.' }, { status: 500 })
  }

  const { data: auth, error: authError } = await db.auth.getUser(token)
  if (authError || !auth.user) return NextResponse.json({ error: 'Your session has expired. Sign in again.' }, { status: 401 })

  if (jwtAal(token) !== 'aal2') return NextResponse.json({ error: MFA_REQUIRED_MESSAGE }, { status: 403 })

  const { data: staff } = await db.from('prompt_users').select('user_id').eq('user_id', auth.user.id).eq('active', true).maybeSingle()
  if (!staff) return NextResponse.json({ error: 'Staff only.' }, { status: 403 })

  const body = (await request.json().catch(() => ({}))) as { clientId?: unknown }
  const clientId = typeof body.clientId === 'string' ? body.clientId : ''
  if (!/^[0-9a-f-]{36}$/i.test(clientId)) return NextResponse.json({ error: 'Missing client.' }, { status: 400 })

  const { data: client } = await db.from('clients').select('id,name,email').eq('id', clientId).maybeSingle()
  if (!client) return NextResponse.json({ error: 'Client not found.' }, { status: 404 })
  const email = (client.email ?? '').trim().toLowerCase()
  if (!isEmail(email)) return NextResponse.json({ error: 'Add a valid email address to this client first.' }, { status: 400 })

  const { data: access, error: accessError } = await db.from('client_portal_access')
    .select('access_mode,expires_at,revoked_at').eq('client_id', clientId).maybeSingle()
  if (accessError) return NextResponse.json({ error: 'Could not verify portal access settings.' }, { status: 500 })
  if (!access || access.revoked_at) return NextResponse.json({ error: 'Configure active portal access before sending an invite.' }, { status: 403 })
  if (access.access_mode === 'temporary' && (!access.expires_at || new Date(access.expires_at).getTime() <= Date.now())) {
    return NextResponse.json({ error: 'This customer portal access has expired. Update the expiry before inviting.' }, { status: 403 })
  }
  // Reissuing a one-time invite invalidates the previous session and allows the new link to claim access.
  if (access.access_mode === 'one_time') {
    const { error: resetError } = await db.from('client_portal_access')
      .update({ one_time_session_id: null, updated_at: new Date().toISOString() })
      .eq('client_id', clientId).is('revoked_at', null)
    if (resetError) return NextResponse.json({ error: 'Could not reset one-time access for a fresh invite.' }, { status: 500 })
  }

  const redirectTo = \`\${SITE.url}/portal\`

  // First invite creates the account ("invite"). If it already exists, send a fresh sign-in link instead.
  let firstInvite = true
  let { data: link, error: linkError } = await db.auth.admin.generateLink({ type: 'invite', email, options: { redirectTo } })
  if (linkError && (linkError.code === 'email_exists' || /already (been )?registered|already exists/i.test(linkError.message))) {
    firstInvite = false
    ;({ data: link, error: linkError } = await db.auth.admin.generateLink({ type: 'magiclink', email, options: { redirectTo } }))
  }
  const actionLink = link?.properties?.action_link
  if (linkError || !actionLink) {
    console.error('portal invite: generateLink failed', linkError?.message)
    return NextResponse.json({ error: 'Could not create the sign-in link.' }, { status: 500 })
  }

  try {
    await sendPortalInvite({ to: email, name: client.name, link: actionLink })
  } catch (err) {
    console.error('portal invite: email failed', err)
    return NextResponse.json({ error: 'The invite was created but the email could not be sent. Try again.' }, { status: 502 })
  }

  return NextResponse.json({ ok: true, sentTo: email, firstInvite })
}
