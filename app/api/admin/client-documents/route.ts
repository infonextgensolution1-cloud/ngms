import { NextResponse } from 'next/server'
import { requireStaff, errorResponse } from '@/lib/ai/openai'
import { db } from '@/lib/ngms-ops/core'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX_BYTES = 15 * 1024 * 1024
const ALLOWED_TYPES = new Set([
  'application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
])
const safePart = (value: string) => value.normalize('NFKD').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'Document'
const initials = (name: string) => name.trim().split(/\s+/).filter(Boolean).map(part => part[0]).join('').toUpperCase().slice(0, 5) || 'CL'
const dateStamp = (value: string) => (value || new Date().toISOString()).slice(0, 10).replace(/-/g, '')

export async function GET(request: Request) {
  try {
    await requireStaff(request)
    const url = new URL(request.url)
    const clientId = url.searchParams.get('client_id')
    if (!clientId) return NextResponse.json({ error: 'client_id is required.' }, { status: 400 })
    const admin = db()
    const { data, error } = await admin.from('client_documents')
      .select('id,client_id,quote_id,title,category,original_filename,content_type,file_size,location_label,created_at,is_visible_to_client')
      .eq('client_id', clientId).order('created_at', { ascending: false })
    if (error) throw error
    return NextResponse.json({ documents: data ?? [] }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (e) { return errorResponse(e) }
}

export async function POST(request: Request) {
  try {
    await requireStaff(request)
    const form = await request.formData()
    const clientId = String(form.get('client_id') || '')
    const quoteIdValue = String(form.get('quote_id') || '').trim()
    const title = String(form.get('title') || '').trim()
    const category = String(form.get('category') || 'materials')
    const locationLabel = String(form.get('location_label') || "Gordon's Bay").trim().slice(0, 100)
    const file = form.get('file')
    if (!clientId || !title || !(file instanceof File)) return NextResponse.json({ error: 'Client, document title and file are required.' }, { status: 400 })
    if (title.length > 180) return NextResponse.json({ error: 'Document title must be 180 characters or fewer.' }, { status: 400 })
    if (file.size < 1 || file.size > MAX_BYTES) return NextResponse.json({ error: 'Files must be smaller than 15 MB.' }, { status: 413 })
    if (!ALLOWED_TYPES.has(file.type)) return NextResponse.json({ error: 'Unsupported file type. Upload PDF, image, Word, Excel or text documents.' }, { status: 415 })
    if (!['materials','quotation','invoice','receipt','report','warranty','other'].includes(category)) return NextResponse.json({ error: 'Invalid document category.' }, { status: 400 })

    const admin = db()
    const { data: client, error: clientError } = await admin.from('clients').select('id,name').eq('id', clientId).maybeSingle()
    if (clientError) throw clientError
    if (!client) return NextResponse.json({ error: 'Client not found.' }, { status: 404 })
    let quoteId: string | null = quoteIdValue || null
    if (quoteId) {
      const { data: quote, error: quoteError } = await admin.from('quotes').select('id,client_id,quote_number').eq('id', quoteId).maybeSingle()
      if (quoteError) throw quoteError
      if (!quote || quote.client_id !== clientId) return NextResponse.json({ error: 'The selected quote does not belong to this client.' }, { status: 400 })
    }
    const now = new Date().toISOString()
    const ext = (file.name.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8) || 'bin'
    const namePart = safePart(client.name)
    const quotePart = quoteId ? safePart((await admin.from('quotes').select('quote_number').eq('id', quoteId).maybeSingle()).data?.quote_number || 'Quote') : 'CLIENT'
    const fileName = `${quotePart}_${initials(client.name)}_${namePart}_${safePart(locationLabel)}_${dateStamp(now)}_${crypto.randomUUID().slice(0, 8)}.${ext}`
    const storagePath = `${clientId}/${fileName}`
    const upload = await admin.storage.from('client-documents').upload(storagePath, new Uint8Array(await file.arrayBuffer()), { contentType: file.type, upsert: false })
    if (upload.error) throw upload.error
    const { data: authData } = await admin.auth.getUser((request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '').trim())
    const { data: document, error } = await admin.from('client_documents').insert({
      client_id: clientId, quote_id: quoteId, title, category, original_filename: file.name,
      storage_path: storagePath, content_type: file.type, file_size: file.size,
      location_label: locationLabel || "Gordon's Bay", uploaded_by: authData.user?.email ?? null,
      is_visible_to_client: true,
    }).select('id,client_id,quote_id,title,category,original_filename,content_type,file_size,location_label,created_at,is_visible_to_client').single()
    if (error) {
      await admin.storage.from('client-documents').remove([storagePath])
      throw error
    }
    return NextResponse.json({ document }, { status: 201, headers: { 'Cache-Control': 'no-store' } })
  } catch (e) { return errorResponse(e) }
}
