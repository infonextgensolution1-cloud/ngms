import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function sessionIdFromJwt(token: string): string | null {
  try {
    const payload = token.split('.')[1]
    if (!payload) return null
    const claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { session_id?: unknown }
    return typeof claims.session_id === 'string' && claims.session_id ? claims.session_id : null
  } catch { return null }
}

export async function POST(request: Request) {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim()
  if (!token) return NextResponse.json({ error: 'Sign in to the customer portal first.' }, { status: 401 })
  let db
  try { db = supabaseAdmin() } catch { return NextResponse.json({ error: 'Portal service is not configured.' }, { status: 500 }) }
  const { data: auth, error: authError } = await db.auth.getUser(token)
  const email = auth?.user?.email?.trim().toLowerCase()
  if (authError || !email || !auth.user.email_confirmed_at) return NextResponse.json({ error: 'Your verified sign-in session is required.' }, { status: 401 })

  const sessionId = sessionIdFromJwt(token)
  if (!sessionId) return NextResponse.json({ error: 'Could not verify this sign-in session. Request a fresh email link.' }, { status: 401 })

  const { data: clients, error: clientsError } = await db.from('clients').select('id,email').ilike('email', email)
  if (clientsError) return NextResponse.json({ error: 'Could not verify portal access.' }, { status: 500 })
  const ownClients = (clients ?? []).filter((c) => (c.email ?? '').trim().toLowerCase() === email)
  if (!ownClients.length) return NextResponse.json({ error: 'No NGMS client record is linked to this email.' }, { status: 403 })

  const { data: accessRows, error: accessError } = await db.from('client_portal_access')
    .select('client_id,access_mode,expires_at,revoked_at,one_time_session_id')
    .in('client_id', ownClients.map((c) => c.id))
  if (accessError) return NextResponse.json({ error: 'Portal access is not configured yet. Contact NGMS.' }, { status: 500 })
  const accessByClient = new Map((accessRows ?? []).map((a) => [a.client_id, a]))

  for (const client of ownClients) {
    const access = accessByClient.get(client.id)
    if (!access || access.revoked_at) return NextResponse.json({ error: 'Portal access is disabled. Contact NGMS.' }, { status: 403 })
    if (access.access_mode === 'temporary' && (!access.expires_at || new Date(access.expires_at).getTime() <= Date.now())) {
      return NextResponse.json({ error: 'Your portal access has expired. Contact NGMS.' }, { status: 403 })
    }
    if (access.access_mode === 'one_time') {
      if (access.one_time_session_id && access.one_time_session_id !== sessionId) {
        return NextResponse.json({ error: 'This one-time access has already been used. Ask NGMS to issue a new link.' }, { status: 403 })
      }
      if (!access.one_time_session_id) {
        const { data: claimed, error } = await db.from('client_portal_access')
          .update({ one_time_session_id: sessionId, updated_at: new Date().toISOString() })
          .eq('client_id', client.id).is('one_time_session_id', null).is('revoked_at', null)
          .select('one_time_session_id').maybeSingle()
        if (error) return NextResponse.json({ error: 'Could not activate one-time access.' }, { status: 500 })
        if (!claimed || claimed.one_time_session_id !== sessionId) {
          const { data: latest } = await db.from('client_portal_access').select('one_time_session_id,revoked_at').eq('client_id', client.id).maybeSingle()
          if (latest?.one_time_session_id !== sessionId || latest.revoked_at) {
            return NextResponse.json({ error: 'This one-time access has already been used. Ask NGMS to issue a new link.' }, { status: 403 })
          }
        }
      }
    }
  }
  return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } })
}
