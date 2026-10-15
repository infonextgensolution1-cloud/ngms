import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type PortalAccess = {
  client_id: string
  access_mode: 'permanent' | 'temporary' | 'one_time'
  expires_at: string | null
  revoked_at: string | null
  one_time_session_id: string | null
}

function sessionIdFromToken(token: string): string | null {
  try {
    const payload = token.split('.')[1]
    const claims = payload ? JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { session_id?: unknown } : {}
    return typeof claims.session_id === 'string' && claims.session_id ? claims.session_id : null
  } catch {
    return null
  }
}

async function getPortalClients(request: Request) {
  const token = request.headers.get('authorization')?.replace(/^Bearer\\s+/i, '').trim()
  if (!token) return { error: 'Sign in to the customer portal first.', status: 401 as const }

  let admin
  try {
    admin = supabaseAdmin()
  } catch {
    return { error: 'Portal service is not configured.', status: 500 as const }
  }

  const { data: auth, error: authError } = await admin.auth.getUser(token)
  const email = auth?.user?.email?.trim().toLowerCase()
  if (authError || !email || !auth.user.email_confirmed_at) {
    return { error: 'Your session has expired. Sign in again.', status: 401 as const }
  }

  const { data: rows, error: clientsError } = await admin.from('clients').select('id,email').ilike('email', email)
  if (clientsError) return { error: 'Could not verify your client records.', status: 500 as const }
  const clients = (rows ?? []).filter((client) => (client.email ?? '').trim().toLowerCase() === email)
  if (!clients.length) return { error: 'No client record is linked to this email.', status: 403 as const }

  const { data: accessRows, error: accessError } = await admin.from('client_portal_access')
    .select('client_id,access_mode,expires_at,revoked_at,one_time_session_id')
    .in('client_id', clients.map((client) => client.id))
  if (accessError) return { error: 'Could not verify portal access.', status: 500 as const }

  const sessionId = sessionIdFromToken(token)
  const accessByClient = new Map<string, PortalAccess>((accessRows ?? []).map((row) => [row.client_id, row as PortalAccess] as const))
  const accessibleClientIds = clients.filter((client) => {
    const access = accessByClient.get(client.id)
    if (!access || access.revoked_at) return false
    if (access.access_mode === 'temporary') {
      return !!access.expires_at && new Date(access.expires_at).getTime() > Date.now()
    }
    if (access.access_mode === 'one_time') {
      return !!sessionId && access.one_time_session_id === sessionId
    }
    return access.access_mode === 'permanent'
  }).map((client) => client.id)

  if (!accessibleClientIds.length) return { error: 'Portal access is inactive or expired.', status: 403 as const }
  return { admin, accessibleClientIds, status: 200 as const }
}

export async function GET(request: Request) {
  const result = await getPortalClients(request)
  if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.status })

  const { data, error } = await result.admin.from('client_documents')
    .select('id,client_id,quote_id,title,category,original_filename,content_type,file_size,location_label,created_at')
    .in('client_id', result.accessibleClientIds)
    .eq('is_visible_to_client', true)
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: 'Could not load your documents.' }, { status: 500 })

  // Do not expose internal ownership IDs to the browser.
  const documents = (data ?? []).map(({ client_id: _clientId, ...document }) => document)
  return NextResponse.json({ documents }, { headers: { 'Cache-Control': 'private, no-store' } })
}

export async function POST(request: Request) {
  const result = await getPortalClients(request)
  if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.status })

  const body = await request.json().catch(() => ({})) as { document_id?: string }
  if (!body.document_id) return NextResponse.json({ error: 'document_id is required.' }, { status: 400 })

  const { data: document, error } = await result.admin.from('client_documents')
    .select('id,client_id,storage_path,original_filename,content_type')
    .eq('id', body.document_id)
    .in('client_id', result.accessibleClientIds)
    .eq('is_visible_to_client', true)
    .maybeSingle()
  if (error) return NextResponse.json({ error: 'Could not load this document.' }, { status: 500 })
  if (!document) return NextResponse.json({ error: 'Document not found.' }, { status: 404 })

  const { data: file, error: fileError } = await result.admin.storage.from('client-documents').download(document.storage_path)
  if (fileError || !file) return NextResponse.json({ error: 'The document file is unavailable.' }, { status: 404 })

  const safeName = document.original_filename.replace(/[\\r\\n"]/g, '_').slice(0, 180)
  return new NextResponse(file as BodyInit, {
    headers: {
      'Content-Type': document.content_type,
      'Content-Disposition': `attachment; filename="${safeName}"`,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
