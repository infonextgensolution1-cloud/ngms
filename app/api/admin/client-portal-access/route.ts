import { NextResponse } from 'next/server'
import { jwtAal, MFA_REQUIRED_MESSAGE } from '@/lib/jwt-aal'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type AccessMode = 'one_time' | 'temporary' | 'permanent'
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

async function staffDb(request: Request) {
  const token = request.headers.get('authorization')?.replace(/^Bearer\\s+/i, '').trim()
  if (!token) return { error: NextResponse.json({ error: 'Sign in to the admin dashboard first.' }, { status: 401 }) }
  let db
  try { db = supabaseAdmin() } catch { return { error: NextResponse.json({ error: 'Portal access service is not configured.' }, { status: 500 }) }
  const { data: auth, error } = await db.auth.getUser(token)
  if (error || !auth.user) return { error: NextResponse.json({ error: 'Your session has expired. Sign in again.' }, { status: 401 }) }
  if (jwtAal(token) !== 'aal2') return { error: NextResponse.json({ error: MFA_REQUIRED_MESSAGE }, { status: 403 }) }
  const { data: staff } = await db.from('prompt_users').select('user_id').eq('user_id', auth.user.id).eq('active', true).maybeSingle()
  if (!staff) return { error: NextResponse.json({ error: 'Staff only.' }, { status: 403 }) }
  return { db, userId: auth.user.id }
}

export async function GET(request: Request) {
  const auth = await staffDb(request)
  if ('error' in auth) return auth.error
  const clientId = new URL(request.url).searchParams.get('clientId') ?? ''
  if (!UUID.test(clientId)) return NextResponse.json({ error: 'A valid client is required.' }, { status: 400 })
  const { data, error } = await auth.db.from('client_portal_access').select('client_id,access_mode,expires_at,revoked_at,updated_at').eq('client_id', clientId).maybeSingle()
  if (error) return NextResponse.json({ error: 'Could not load portal access settings.' }, { status: 500 })
  return NextResponse.json({ access: data ?? null }, { headers: { 'Cache-Control': 'no-store' } })
}

export async function POST(request: Request) {
  const auth = await staffDb(request)
  if ('error' in auth) return auth.error
  const body = await request.json().catch(() => ({})) as { clientId?: unknown; action?: unknown; accessMode?: unknown; expiresAt?: unknown }
  const clientId = typeof body.clientId === 'string' ? body.clientId : ''
  if (!UUID.test(clientId)) return NextResponse.json({ error: 'A valid client is required.' }, { status: 400 })

  const { data: client, error: clientError } = await auth.db.from('clients').select('id').eq('id', clientId).maybeSingle()
  if (clientError || !client) return NextResponse.json({ error: 'Client not found.' }, { status: 404 })

  if (body.action === 'revoke') {
    const { data: existing } = await auth.db.from('client_portal_access').select('access_mode').eq('client_id', clientId).maybeSingle()
    const mode: AccessMode = existing?.access_mode ?? 'permanent'
    const { error } = await auth.db.from('client_portal_access').upsert({
      client_id: clientId, access_mode: mode,
      expires_at: mode === 'temporary' ? new Date(0).toISOString() : null,
      revoked_at: new Date().toISOString(), one_time_session_id: null, updated_by: auth.userId, updated_at: new Date().toISOString(),
    }, { onConflict: 'client_id' })
    if (error) return NextResponse.json({ error: 'Could not revoke portal access.' }, { status: 500 })
    return NextResponse.json({ ok: true, revoked: true })
  }

  const mode = body.accessMode as AccessMode
  if (!['one_time', 'temporary', 'permanent'].includes(mode)) return NextResponse.json({ error: 'Choose a valid access mode.' }, { status: 400 })
  let expiresAt: string | null = null
  if (mode === 'temporary') {
    if (typeof body.expiresAt !== 'string' || !body.expiresAt.trim()) return NextResponse.json({ error: 'Set an expiry date and time for temporary access.' }, { status: 400 })
    const parsed = new Date(body.expiresAt)
    if (!Number.isFinite(parsed.getTime()) || parsed.getTime() <= Date.now()) return NextResponse.json({ error: 'Expiry must be in the future.' }, { status: 400 })
    expiresAt = parsed.toISOString()
  }

  const { error } = await auth.db.from('client_portal_access').upsert({
    client_id: clientId, access_mode: mode, expires_at: expiresAt, revoked_at: null,
    one_time_session_id: null, updated_by: auth.userId, updated_at: new Date().toISOString(),
  }, { onConflict: 'client_id' })
  if (error) return NextResponse.json({ error: 'Could not save portal access settings.' }, { status: 500 })
  return NextResponse.json({ ok: true, access: { client_id: clientId, access_mode: mode, expires_at: expiresAt, revoked_at: null } })
}
