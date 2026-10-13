import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

async function getPortalClient(request: Request) {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim()
  if (!token) return { error: 'Sign in to the customer portal first.', status: 401 as const }
  const admin = supabaseAdmin()
  const { data: auth, error } = await admin.auth.getUser(token)
  const email = auth?.user?.email?.trim().toLowerCase()
  if (error || !email || !auth.user.email_confirmed_at) return { error: 'Your session has expired. Sign in again.', status: 401 as const }
  const { data: client, error: clientError } = await admin.from('clients').select('id,email').ilike('email', email).maybeSingle()
  if (clientError) return { error: 'Could not verify your client record.', status: 500 as const }
  if (!client) return { error: 'No client record is linked to this email.', status: 403 as const }
  const payload = token.split('.')[1]
  let sessionId: string | null = null
  try { const claims = payload ? JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { session_id?: unknown } : {}; sessionId = typeof claims.session_id === 'string' ? claims.session_id : null } catch {}
  const { data: access, error: accessError } = await admin.from('client_portal_access').select('access_mode,expires_at,revoked_at,one_time_session_id').eq('client_id', client.id).maybeSingle()
  if (accessError) return { error: 'Could not verify portal access.', status: 500 as const }
  if (!access || access.revoked_at || (access.access_mode === 'temporary' && (!access.expires_at || new Date(access.expires_at).getTime() <= Date.now())) || (access.access_mode === 'one_time' && (!sessionId || access.one_time_session_id !== sessionId))) return { error: 'Portal access is inactive or expired.', status: 403 as const }
  return { admin, client, status: 200 as const }
}

export async function GET(request: Request) {
  try {
    const result = await getPortalClient(request)
    if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.status })
    const { data, error } = await result.admin.from('client_documents')
      .select('id,quote_id,title,category,original_filename,content_type,file_size,location_label,created_at')
      .eq('client_id', result.client.id).eq('is_visible_to_client', true).order('created_at', { ascending: false })
    if (error) return NextResponse.json({ error: 'Could not load your documents.' }, { status: 500 })
    return NextResponse.json({ documents: data ?? [] }, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch { return NextResponse.json({ error: 'Portal service is not configured.' }, { status: 500 }) }
}

export async function POST(request: Request) {
  try {
    const result = await getPortalClient(request)
    if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.status })
    const body = await request.json().catch(() => ({})) as { document_id?: string }
    if (!body.document_id) return NextResponse.json({ error: 'document_id is required.' }, { status: 400 })
    const { data: document, error } = await result.admin.from('client_documents').select('id,storage_path,original_filename,content_type')
      .eq('id', body.document_id).eq('client_id', result.client.id).eq('is_visible_to_client', true).maybeSingle()
    if (error) return NextResponse.json({ error: 'Could not load this document.' }, { status: 500 })
    if (!document) return NextResponse.json({ error: 'Document not found.' }, { status: 404 })
    const { data: file, error: fileError } = await result.admin.storage.from('client-documents').download(document.storage_path)
    if (fileError || !file) return NextResponse.json({ error: 'The document file is unavailable.' }, { status: 404 })
    const safeName = document.original_filename.replace(/[\r\n"]/g, '_').slice(0, 180)
    return new NextResponse(file as BodyInit, { headers: { 'Content-Type': document.content_type, 'Content-Disposition': `attachment; filename="${safeName}"`, 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' } })
  } catch { return NextResponse.json({ error: 'Portal service is not configured.' }, { status: 500 }) }
}
