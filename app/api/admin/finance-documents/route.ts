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
const DOCUMENT_TYPES = new Set([
  'supplier_invoice', 'customer_invoice', 'quote', 'receipt', 'job_report',
  'completion_report', 'job_photo', 'purchase_order', 'delivery_note',
  'contract', 'tax_document', 'correspondence', 'other',
])
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const safePart = (value: string) =>
  value.normalize('NFKD').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 100) || 'document'

function optionalUuid(value: FormDataEntryValue | null, label: string): string | null {
  const text = String(value ?? '').trim()
  if (!text) return null
  if (!UUID.test(text)) throw new Error(`${label} must be a valid ID.`)
  return text
}

async function actorFromRequest(request: Request, admin: ReturnType<typeof db>) {
  const token = request.headers.get('authorization')?.replace(/^Bearer\\s+/i, '').trim()
  if (!token) return null
  const { data, error } = await admin.auth.getUser(token)
  if (error || !data.user) throw new Error('Could not verify the staff identity for this document action.')
  return (data.user.email || data.user.id).slice(0, 200)
}

export async function GET(request: Request) {
  try {
    await requireStaff(request)
    const admin = db()
    const url = new URL(request.url)
    const type = url.searchParams.get('document_type')
    const customerId = url.searchParams.get('customer_id')
    const projectId = url.searchParams.get('project_id')
    const status = url.searchParams.get('review_status')
    const search = (url.searchParams.get('q') || '').trim().slice(0, 120)
    const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit') || 50) || 50))

    let query = admin.from('ngms_document_records')
      .select('id,document_number,document_type,title,issued_on,customer_id,project_id,quote_id,invoice_id,supplier_id,supplier_purchase_id,storage_bucket,storage_path,original_filename,content_type,byte_size,processing_status,review_status,is_visible_to_customer,metadata,created_by,reviewed_by,reviewed_at,created_at,updated_at')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (type && DOCUMENT_TYPES.has(type)) query = query.eq('document_type', type)
    if (customerId && UUID.test(customerId)) query = query.eq('customer_id', customerId)
    if (projectId && UUID.test(projectId)) query = query.eq('project_id', projectId)
    if (status && ['not_required', 'pending', 'approved', 'rejected'].includes(status)) query = query.eq('review_status', status)
    if (search) query = query.or(`title.ilike.%${search.replace(/[,%()]/g, ' ')}%,original_filename.ilike.%${search.replace(/[,%()]/g, ' ')}%,document_number.ilike.%${search.replace(/[,%()]/g, ' ')}%`)

    const { data, error } = await query
    if (error) throw error
    return NextResponse.json({ documents: data ?? [] }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (e) {
    return errorResponse(e)
  }
}

export async function POST(request: Request) {
  let uploadedPath: string | null = null
  try {
    await requireStaff(request)
    const form = await request.formData()
    const file = form.get('file')
    const title = String(form.get('title') || '').trim()
    const documentType = String(form.get('document_type') || 'other').trim()
    const issuedOn = String(form.get('issued_on') || '').trim() || null
    const customerId = optionalUuid(form.get('customer_id'), 'Customer')
    const projectId = optionalUuid(form.get('project_id'), 'Project')
    const quoteId = optionalUuid(form.get('quote_id'), 'Quote')
    const invoiceId = optionalUuid(form.get('invoice_id'), 'Invoice')
    let supplierId = optionalUuid(form.get('supplier_id'), 'Supplier')
    const supplierPurchaseId = optionalUuid(form.get('supplier_purchase_id'), 'Supplier purchase')
    const visibleToCustomer = form.get('is_visible_to_customer') === 'true'

    if (!(file instanceof File) || !title) {
      return NextResponse.json({ error: 'Document title and file are required.' }, { status: 400 })
    }
    if (title.length > 240) return NextResponse.json({ error: 'Title must be 240 characters or fewer.' }, { status: 400 })
    if (!DOCUMENT_TYPES.has(documentType)) return NextResponse.json({ error: 'Unsupported document type.' }, { status: 400 })
    if (file.size < 1 || file.size > MAX_BYTES) return NextResponse.json({ error: 'File must be between 1 byte and 15 MiB.' }, { status: 413 })
    if (!ALLOWED_TYPES.has(file.type)) return NextResponse.json({ error: 'Unsupported file type. Upload PDF, JPEG, PNG, WebP, text, Word or Excel.' }, { status: 415 })
    if (issuedOn && !/^\d{4}-\d{2}-\d{2}$/.test(issuedOn)) return NextResponse.json({ error: 'Issue date must use YYYY-MM-DD.' }, { status: 400 })
    if (visibleToCustomer && !customerId) return NextResponse.json({ error: 'A customer must be linked before a document can be visible in the customer portal.' }, { status: 400 })

    const admin = db()
    const actor = await actorFromRequest(request, admin)
    if (customerId) {
      const { data, error } = await admin.from('clients').select('id').eq('id', customerId).maybeSingle()
      if (error) throw error
      if (!data) return NextResponse.json({ error: 'Customer not found.' }, { status: 404 })
    }

    if (projectId) {
      const { data, error } = await admin.from('jobs').select('id,client_id').eq('id', projectId).maybeSingle()
      if (error) throw error
      if (!data) return NextResponse.json({ error: 'Project not found.' }, { status: 404 })
      if (customerId && data.client_id && data.client_id !== customerId) {
        return NextResponse.json({ error: 'The selected project does not belong to the selected customer.' }, { status: 400 })
      }
    }

    if (quoteId) {
      const { data, error } = await admin.from('quotes').select('id,client_id').eq('id', quoteId).maybeSingle()
      if (error) throw error
      if (!data) return NextResponse.json({ error: 'Quote not found.' }, { status: 404 })
      if (customerId && data.client_id && data.client_id !== customerId) return NextResponse.json({ error: 'The quote belongs to a different customer.' }, { status: 400 })
    }

    if (invoiceId) {
      const { data, error } = await admin.from('invoices').select('id,client_id').eq('id', invoiceId).maybeSingle()
      if (error) throw error
      if (!data) return NextResponse.json({ error: 'Invoice not found.' }, { status: 404 })
      if (customerId && data.client_id && data.client_id !== customerId) return NextResponse.json({ error: 'The invoice belongs to a different customer.' }, { status: 400 })
    }

    if (supplierPurchaseId) {
      const { data, error } = await admin.from('supplier_purchases').select('id,supplier_id,job_id').eq('id', supplierPurchaseId).maybeSingle()
      if (error) throw error
      if (!data) return NextResponse.json({ error: 'Supplier purchase not found.' }, { status: 404 })
      if (supplierId && data.supplier_id && supplierId !== data.supplier_id) return NextResponse.json({ error: 'The supplier does not match the selected purchase.' }, { status: 400 })
      supplierId = supplierId || data.supplier_id || null
    }

    const now = new Date()
    const date = now.toISOString().slice(0, 10).replace(/-/g, '')
    const id = crypto.randomUUID()
    const extension = (file.name.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8) || 'bin'
    const storagePath = `${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, '0')}/${id}-${safePart(file.name.replace(/\.[^.]+$/, ''))}.${extension}`
    const documentNumber = `NGMS-DOC-${date}-${id.slice(0, 8).toUpperCase()}`
    const bucket = 'ngms-admin-documents'

    const upload = await admin.storage.from(bucket).upload(storagePath, new Uint8Array(await file.arrayBuffer()), {
      contentType: file.type,
      upsert: false,
    })
    if (upload.error) throw new Error(`Storage upload failed: ${upload.error.message}`)
    uploadedPath = storagePath

    const { data: document, error: insertError } = await admin.from('ngms_document_records').insert({
      id,
      document_number: documentNumber,
      document_type: documentType,
      title,
      issued_on: issuedOn,
      customer_id: customerId,
      project_id: projectId,
      quote_id: quoteId,
      invoice_id: invoiceId,
      supplier_id: supplierId,
      supplier_purchase_id: supplierPurchaseId,
      storage_bucket: bucket,
      storage_path: storagePath,
      original_filename: file.name.slice(0, 240),
      content_type: file.type,
      byte_size: file.size,
      processing_status: 'queued',
      review_status: 'pending',
      is_visible_to_customer: visibleToCustomer,
      metadata: { uploadedAt: now.toISOString(), uploadChannel: 'admin' },
      created_by: actor,
    }).select('id,document_number,document_type,title,issued_on,customer_id,project_id,quote_id,invoice_id,supplier_id,supplier_purchase_id,storage_bucket,storage_path,original_filename,content_type,byte_size,processing_status,review_status,is_visible_to_customer,created_at').single()

    if (insertError) throw new Error(`Document record could not be saved: ${insertError.message}`)

    const { error: queueError } = await admin.from('ngms_drive_sync_queue').upsert({
      document_id: id,
      provider: 'google_drive',
      status: 'pending',
      attempts: 0,
    }, { onConflict: 'document_id,provider', ignoreDuplicates: true })

    await admin.from('ngms_audit_events').insert({
      actor,
      action: 'document.uploaded',
      entity_type: 'ngms_document_records',
      entity_id: id,
      details: { document_number: documentNumber, document_type: documentType, byte_size: file.size, archive_queue_created: !queueError },
    })

    return NextResponse.json({
      document,
      archive_sync: queueError ? 'queue_failed' : 'pending',
      warning: queueError ? 'Document is safely stored in Supabase, but the Drive archive queue could not be created. An administrator must retry synchronisation.' : null,
      extraction: 'pending_provider_configuration',
    }, { status: 201, headers: { 'Cache-Control': 'no-store' } })
  } catch (e) {
    if (uploadedPath) {
      try { await db().storage.from('ngms-admin-documents').remove([uploadedPath]) } catch { /* retain the original error */ }
    }
    return errorResponse(e)
  }
}
