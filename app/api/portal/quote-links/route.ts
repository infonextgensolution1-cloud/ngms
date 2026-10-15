import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

// Customer portal: links to the public quote page (/quote/<token>) for the signed-in
// customer's quotes that are still awaiting an answer. Accepting on that page runs the
// full flow in app/api/quote/[token]/accept (validity check, version record, lead → won,
// job + deposit invoice), so the portal never changes quote status itself.
//
// Auth: the customer's Supabase access token (Authorization: Bearer …). The email is
// taken from the verified auth user, never from the request body.
export async function GET(request: Request) {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim()
  if (!token) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 })

  let db
  try {
    db = supabaseAdmin()
  } catch {
    return NextResponse.json({ error: 'Server not configured.' }, { status: 500 })
  }

  const { data: auth, error: authError } = await db.auth.getUser(token)
  const email = auth?.user?.email?.trim().toLowerCase()
  if (authError || !email || !auth.user.email_confirmed_at) {
    return NextResponse.json({ error: 'Not signed in.' }, { status: 401 })
  }
  let sessionId: string | null = null
  try {
    const payload = token.split('.')[1]
    const claims = payload ? JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { session_id?: unknown } : {}
    sessionId = typeof claims.session_id === 'string' ? claims.session_id : null
  } catch { sessionId = null }
  if (!sessionId) return NextResponse.json({ error: 'Could not verify sign-in session.' }, { status: 401 })

  const { data: clients, error: clientError } = await db.from('clients').select('id').ilike('email', email)
  if (clientError) return NextResponse.json({ error: 'Could not load quotes.' }, { status: 500 })
  // ilike treats _ and % as wildcards, so confirm an exact (case-insensitive) match.
  const clientIds = (clients ?? []).map((c) => c.id)
  if (!clientIds.length) return NextResponse.json({ links: {} })
  const { data: exact } = await db.from('clients').select('id,email').in('id', clientIds)
  const ownIds = (exact ?? []).filter((c) => (c.email ?? '').trim().toLowerCase() === email).map((c) => c.id)
  if (!ownIds.length) return NextResponse.json({ links: {} })

  const { data: accessRows, error: accessError } = await db.from('client_portal_access')
    .select('client_id,access_mode,expires_at,revoked_at,one_time_session_id').in('client_id', ownIds)
  if (accessError) return NextResponse.json({ error: 'Could not verify portal access.' }, { status: 500 })
  const accessibleClientIds = ownIds.filter((clientId) => {
    const access = (accessRows ?? []).find((row) => row.client_id === clientId)
    return !!access && !access.revoked_at &&
      !(access.access_mode === 'temporary' && (!access.expires_at || new Date(access.expires_at).getTime() <= Date.now())) &&
      !(access.access_mode === 'one_time' && access.one_time_session_id !== sessionId)
  })
  if (!accessibleClientIds.length) return NextResponse.json({ error: 'Portal access is inactive or expired.' }, { status: 403 })

  const { data: quotes, error: quoteError } = await db.from('quotes').select('id').in('client_id', accessibleClientIds).eq('status', 'sent')
  if (quoteError) return NextResponse.json({ error: 'Could not load quotes.' }, { status: 500 })
  const quoteIds = (quotes ?? []).map((q) => q.id)
  if (!quoteIds.length) return NextResponse.json({ links: {} })

  const { data: versions, error: versionError } = await db
    .from('quote_versions')
    .select('quote_id,version_number,public_token')
    .in('quote_id', quoteIds)
    .eq('version_status', 'sent')
    .not('public_token', 'is', null)
    .order('version_number', { ascending: false })
  if (versionError) return NextResponse.json({ error: 'Could not load quotes.' }, { status: 500 })

  // Latest sent version per quote (rows are ordered newest first).
  const links: Record<string, string> = {}
  for (const v of versions ?? []) {
    if (!links[v.quote_id] && v.public_token) links[v.quote_id] = `/quote/${v.public_token}`
  }
  return NextResponse.json({ links }, { headers: { 'Cache-Control': 'no-store' } })
}
