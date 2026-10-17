import { NextResponse } from 'next/server'
import { requireStaff, errorResponse } from '@/lib/ai/openai'
import { db } from '@/lib/ngms-ops/core'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

async function getActor(request: Request, admin: ReturnType<typeof db>) {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim()
  if (!token) return null
  const { data, error } = await admin.auth.getUser(token)
  if (error || !data.user) throw new Error('Could not verify staff identity.')
  return (data.user.email || data.user.id).slice(0, 200)
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireStaff(request)
    const { id } = await context.params
    if (!UUID.test(id)) return NextResponse.json({ error: 'Invalid document ID.' }, { status: 400 })
    const admin = db()
    const [document, extraction, posting] = await Promise.all([
      admin.from('ngms_document_records').select('id,document_number,document_type,title,issued_on,customer_id,project_id,supplier_id,processing_status,review_status,created_at').eq('id', id).maybeSingle(),
      admin.from('ngms_document_extractions').select('id,attempt_number,status,extracted_fields,confidence,validation_errors,reviewed_by,reviewed_at,created_at').eq('document_id', id).order('attempt_number', { ascending: false }).limit(1).maybeSingle(),
      admin.from('ngms_financial_posting_reviews').select('id,transaction_type,proposed_payload,amount,currency,status,reviewed_by,reviewed_at,posted_at,rejection_reason').eq('document_id', id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    ])
    for (const result of [document, extraction, posting]) if (result.error) throw result.error
    if (!document.data) return NextResponse.json({ error: 'Document not found.' }, { status: 404 })
    return NextResponse.json({ document: document.data, extraction: extraction.data, posting_review: posting.data }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (e) {
    return errorResponse(e)
  }
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireStaff(request)
    const { id } = await context.params
    if (!UUID.test(id)) return NextResponse.json({ error: 'Invalid document ID.' }, { status: 400 })
    const body = await request.json() as { action?: string; fields?: unknown; reason?: string }
    if (!['approve', 'reject'].includes(String(body.action))) {
      return NextResponse.json({ error: 'Action must be approve or reject.' }, { status: 400 })
    }

    const admin = db()
    const actor = await getActor(request, admin)
    const { data: document, error: docError } = await admin.from('ngms_document_records')
      .select('id,document_number,document_type,review_status')
      .eq('id', id).maybeSingle()
    if (docError) throw docError
    if (!document) return NextResponse.json({ error: 'Document not found.' }, { status: 404 })
    if (document.review_status === 'approved') return NextResponse.json({ error: 'This document has already been approved. Use a correction/reversal workflow for changes.' }, { status: 409 })

    const { data: extraction, error: extractionError } = await admin.from('ngms_document_extractions')
      .select('id,extracted_fields,validation_errors,attempt_number')
      .eq('document_id', id)
      .order('attempt_number', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (extractionError) throw extractionError

    const now = new Date().toISOString()
    if (body.action === 'reject') {
      const reason = String(body.reason || '').trim().slice(0, 1000)
      const { error: updateDocError } = await admin.from('ngms_document_records').update({
        review_status: 'rejected', reviewed_by: actor, reviewed_at: now, updated_at: now,
      }).eq('id', id)
      if (updateDocError) throw updateDocError
      const { error: updatePostingError } = await admin.from('ngms_financial_posting_reviews').update({
        status: 'rejected', reviewed_by: actor, reviewed_at: now, rejection_reason: reason || 'Rejected during document review.', updated_at: now,
      }).eq('document_id', id).eq('status', 'pending')
      if (updatePostingError) throw updatePostingError
      await admin.from('ngms_audit_events').insert({
        actor, action: 'document.review_rejected', entity_type: 'ngms_document_records', entity_id: id,
        details: { reason },
      })
      return NextResponse.json({ ok: true, review_status: 'rejected', posted: false })
    }

    if (!extraction) return NextResponse.json({ error: 'Run extraction or attach verified fields before approval.' }, { status: 409 })
    const fields = body.fields && typeof body.fields === 'object' && !Array.isArray(body.fields)
      ? body.fields as Record<string, unknown>
      : extraction.extracted_fields as Record<string, unknown>
    if (document.document_type === 'supplier_invoice') {
      const amount = fields.total_amount
      if (typeof amount !== 'number' || !Number.isFinite(amount) || amount < 0) return NextResponse.json({ error: 'A verified non-negative total amount is required.' }, { status: 400 })
      if (fields.currency !== 'ZAR') return NextResponse.json({ error: 'Confirm that the invoice is in ZAR before approving it.' }, { status: 400 })
      if (typeof fields.supplier_name !== 'string' || !fields.supplier_name.trim()) return NextResponse.json({ error: 'A verified supplier name is required.' }, { status: 400 })
      if (typeof fields.invoice_number !== 'string' || !fields.invoice_number.trim()) return NextResponse.json({ error: 'A verified supplier invoice number is required.' }, { status: 400 })
      const { error: postingError } = await admin.from('ngms_financial_posting_reviews').upsert({
        document_id: id,
        transaction_type: 'supplier_invoice',
        proposed_payload: fields,
        amount,
        currency: 'ZAR',
        status: 'approved',
        idempotency_key: `document:${id}:supplier-invoice`,
        reviewed_by: actor,
        reviewed_at: now,
        updated_at: now,
      }, { onConflict: 'idempotency_key' })
      if (postingError) throw postingError
    }

    if (extraction.id) {
      const { error: updateExtractionError } = await admin.from('ngms_document_extractions').update({
        extracted_fields: fields, status: 'succeeded', validation_errors: [], reviewed_by: actor, reviewed_at: now,
      }).eq('id', extraction.id)
      if (updateExtractionError) throw updateExtractionError
    }
    const { error: updateDocumentError } = await admin.from('ngms_document_records').update({
      review_status: 'approved', reviewed_by: actor, reviewed_at: now, processing_status: 'complete', updated_at: now,
    }).eq('id', id)
    if (updateDocumentError) throw updateDocumentError
    await admin.from('ngms_audit_events').insert({
      actor, action: 'document.review_approved', entity_type: 'ngms_document_records', entity_id: id,
      details: { document_number: document.document_number, document_type: document.document_type, financial_posting_approved: document.document_type === 'supplier_invoice', financial_posted: false },
    })
    return NextResponse.json({
      ok: true,
      review_status: 'approved',
      posting_status: document.document_type === 'supplier_invoice' ? 'approved_not_posted' : 'not_applicable',
      posted: false,
      message: 'Review approved. No financial transaction or stock movement has been posted by this action.',
    })
  } catch (e) {
    return errorResponse(e)
  }
}
