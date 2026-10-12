import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { jobPhotoStoragePath } from '@/lib/job-photo-path'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function sessionIdFromJwt(token: string): string | null {
  try {
    const payload = token.split('.')[1]
    if (!payload) return null
    const claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { session_id?: unknown }
    return typeof claims.session_id === 'string' ? claims.session_id : null
  } catch { return null }
}

export async function GET(request: Request) {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim()
  if (!token) return NextResponse.json({ error: 'Sign in to the customer portal first.' }, { status: 401 })
  let db
  try { db = supabaseAdmin() } catch { return NextResponse.json({ error: 'Portal service is not configured.' }, { status: 500 }) }
  const { data: auth, error: authError } = await db.auth.getUser(token)
  const email = auth?.user?.email?.trim().toLowerCase()
  if (authError || !email || !auth.user.email_confirmed_at) return NextResponse.json({ error: 'Your session has expired. Sign in again.' }, { status: 401 })
  const sessionId = sessionIdFromJwt(token)
  if (!sessionId) return NextResponse.json({ error: 'Could not verify sign-in session.' }, { status: 401 })

  const { data: clients, error: clientsError } = await db.from('clients').select('id,email').ilike('email', email)
  if (clientsError) return NextResponse.json({ error: 'Could not verify access.' }, { status: 500 })
  const own = (clients ?? []).filter((c) => (c.email ?? '').trim().toLowerCase() === email)
  if (!own.length) return NextResponse.json({ error: 'No client record is linked to this email.' }, { status: 403 })
  const { data: accessRows, error: accessError } = await db.from('client_portal_access')
    .select('client_id,access_mode,expires_at,revoked_at,one_time_session_id').in('client_id', own.map((c) => c.id))
  if (accessError) return NextResponse.json({ error: 'Could not verify portal access.' }, { status: 500 })
  for (const client of own) {
    const access = (accessRows ?? []).find((row) => row.client_id === client.id)
    if (!access || access.revoked_at ||
      (access.access_mode === 'temporary' && (!access.expires_at || new Date(access.expires_at).getTime() <= Date.now())) ||
      (access.access_mode === 'one_time' && access.one_time_session_id !== sessionId)) {
      return NextResponse.json({ error: 'Portal access is inactive or expired.' }, { status: 403 })
    }
  }

  const { data: jobs, error: jobsError } = await db.from('jobs').select('id').in('client_id', own.map((c) => c.id))
  if (jobsError) return NextResponse.json({ error: 'Could not load assigned jobs.' }, { status: 500 })
  const jobIds = (jobs ?? []).map((job) => job.id)
  if (!jobIds.length) return NextResponse.json({ photos: [] })
  const { data: photos, error: photosError } = await db.from('job_photos')
    .select('id,job_id,photo_url,type,caption,sort_order').in('job_id', jobIds).order('sort_order', { ascending: true })
  if (photosError) return NextResponse.json({ error: 'Could not load job photos.' }, { status: 500 })

  const signed = await Promise.all((photos ?? []).map(async (photo) => {
    const path = jobPhotoStoragePath(photo.photo_url)
    if (!path) return null
    const { data, error } = await db.storage.from('job-photos').createSignedUrl(path, 300)
    if (error || !data?.signedUrl) return null
    return { ...photo, photo_url: data.signedUrl }
  }))
  return NextResponse.json({ photos: signed.filter(Boolean) }, { headers: { 'Cache-Control': 'private, no-store' } })
}
