import { NextResponse } from 'next/server'
import { jwtAal, MFA_REQUIRED_MESSAGE } from '@/lib/jwt-aal'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const BUCKET = 'ngms-job-documents'
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const MAX_BYTES = 20 * 1024 * 1024
const MIME_TYPES = new Set([
  'application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'text/csv',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel',
])

async function authorize(request: Request) {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim()
  if (!token) return { error: NextResponse.json({ error: 'Sign in to /admin first.' }, { status: 401 }) }
  let db
  try { db = supabaseAdmin() } catch {
    return { error: NextResponse.json({ error: 'Server is not configured.' }, { status: 500 }) }
  }
  const { data: auth, error } = await db.auth.getUser(token)
  if (error || !auth.user) return { error: NextResponse.json({ error: 'Session expired. Sign in again.' }, { status: 401 }) }
  if (jwtAal(token) !== 'aal2') return { error: NextResponse.json({ error: MFA_REQUIRED_MESSAGE }, { status: 403 }) }
  const { data: staff } = await db.from('prompt_users').select('user_id').eq('user_id', auth.user.id).eq('active', true).maybeSingle()
  if (!staff) return { error: NextResponse.json({ error: 'Staff only.' }, { status: 403 }) }
  return { db, userId: auth.user.id }
}

export async function GET(request: Request) {
  const auth = await authorize(request)
  if ('error' in auth) return auth.error
  const url = new URL(request.url)
  const downloadId = url.searchParams.get('download')
  if (downloadId) {
    if (!UUID.test(downloadId)) return NextResponse.json({ error: 'Invalid document.' }, { status: 400 })
    const { data: doc, error } = await auth.db.from('job_documents').select('storage_path,original_filename').eq('id', downloadId).maybeSingle()
    if (error || !doc) return NextResponse.json({ error: 'Document not found.' }, { status: 404 })
    const { data, error: signedError } = await auth.db.storage.from(BUCKET).createSignedUrl(doc.storage_path, 60, { download: doc.original_filename })
    if (signedError || !data?.signedUrl) return NextResponse.json({ error: 'Could not create secure download link.' }, { status: 503 })
    return NextResponse.json({ url: data.signedUrl })
  }
  const [{ data: drafts, error: draftError }, { data: docs, error: docsError }, { data: settlements, error: settlementError }, { data: jobs, error: jobsError }] = await Promise.all([
    auth.db.from('admin_workspace_drafts').select('id,draft_key,title,payload,saved_at,updated_at').eq('owner_user_id', auth.userId).order('updated_at', { ascending: false }).limit(30),
    auth.db.from('job_documents').select('id,job_id,document_type,linked_record_type,linked_record_id,original_filename,content_type,byte_size,review_status,notes,created_at,updated_at').order('created_at', { ascending: false }).limit(100),
    auth.db.from('subcontractor_labour_settlements').select('id,job_id,subcontractor_draft_id,labour_amount_ex_vat,vat_rate,split_percent,payable_ex_vat,payable_inc_vat,status,completion_marked_at,paid_at,payment_reference,created_at,jobs(title,status),subcontractor_invitation_drafts(company_name)').order('updated_at', { ascending: false }).limit(100),
    auth.db.from('jobs').select('id,title,status,completed_date').order('created_at', { ascending: false }).limit(200),
  ])
  if (draftError || docsError || settlementError || jobsError) {
    console.error('operations control read failed', draftError?.message, docsError?.message, settlementError?.message, jobsError?.message)
    return NextResponse.json({ error: 'Operations storage is not ready. Apply the operations-control migration to the preview database first.' }, { status: 503 })
  }
  return NextResponse.json({ drafts: drafts ?? [], documents: docs ?? [], settlements: settlements ?? [], jobs: jobs ?? [] })
}

export async function POST(request: Request) {
  const auth = await authorize(request)
  if ('error' in auth) return auth.error
  const contentType = request.headers.get('content-type') ?? ''

  if (contentType.includes('multipart/form-data')) {
    const form = await request.formData()
    const file = form.get('file')
    const jobId = String(form.get('jobId') ?? '')
    const documentType = String(form.get('documentType') ?? 'other')
    const linkedRecordType = String(form.get('linkedRecordType') ?? '')
    const linkedRecordId = String(form.get('linkedRecordId') ?? '')
    const notes = String(form.get('notes') ?? '').slice(0, 2000)
    if (!(file instanceof File) || file.size < 1 || file.size > MAX_BYTES || !MIME_TYPES.has(file.type)) {
      return NextResponse.json({ error: 'Choose a PDF, image, CSV or Excel file up to 20 MB.' }, { status: 400 })
    }
    if (jobId && !UUID.test(jobId)) return NextResponse.json({ error: 'Invalid job.' }, { status: 400 })
    const types = ['invoice','supplier_receipt','materials_bulk_upload','quote','completion_report','contract','other']
    const links = ['job','quote','invoice','purchase','client','supplier','subcontractor']
    if (!types.includes(documentType)) return NextResponse.json({ error: 'Invalid document type.' }, { status: 400 })
    if (linkedRecordType && !links.includes(linkedRecordType)) return NextResponse.json({ error: 'Invalid linked record type.' }, { status: 400 })
    if (linkedRecordId && !UUID.test(linkedRecordId)) return NextResponse.json({ error: 'Invalid linked record.' }, { status: 400 })
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-120) || 'document'
    const path = `staff/${auth.userId}/${crypto.randomUUID()}-${safeName}`
    const { error: uploadError } = await auth.db.storage.from(BUCKET).upload(path, file, { contentType: file.type, upsert: false })
    if (uploadError) {
      console.error('operations document upload failed', uploadError.message)
      return NextResponse.json({ error: 'Upload failed. Confirm the operations-control migration and private storage bucket are available.' }, { status: 503 })
    }
    const { data: doc, error } = await auth.db.from('job_documents').insert({
      job_id: jobId || null, document_type: documentType,
      linked_record_type: linkedRecordType || (jobId ? 'job' : null),
      linked_record_id: linkedRecordId || (linkedRecordType === 'job' ? jobId : '') || null,
      original_filename: file.name.slice(0, 240), storage_path: path,
      content_type: file.type, byte_size: file.size, notes, uploaded_by: auth.userId,
    }).select('id,job_id,document_type,linked_record_type,linked_record_id,original_filename,content_type,byte_size,review_status,notes,created_at,updated_at').single()
    if (error || !doc) {
      await auth.db.storage.from(BUCKET).remove([path])
      console.error('operations document record failed', error?.message)
      return NextResponse.json({ error: 'File uploaded but its record could not be saved; the temporary file was removed.' }, { status: 503 })
    }
    return NextResponse.json({ ok: true, document: doc })
  }

  const body = await request.json().catch(() => ({})) as Record<string, unknown>
  const action = String(body.action ?? '')
  if (action === 'save-draft') {
    const draftKey = typeof body.draftKey === 'string' ? body.draftKey.slice(0, 100) : ''
    const title = typeof body.title === 'string' ? body.title.slice(0, 180) : ''
    const payload = body.payload && typeof body.payload === 'object' && !Array.isArray(body.payload) ? body.payload : {}
    if (!draftKey) return NextResponse.json({ error: 'Draft key is required.' }, { status: 400 })
    const { data, error } = await auth.db.from('admin_workspace_drafts').upsert({
      owner_user_id: auth.userId, draft_key: draftKey, title, payload, saved_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    }, { onConflict: 'owner_user_id,draft_key' }).select('id,draft_key,title,payload,saved_at,updated_at').single()
    if (error) return NextResponse.json({ error: 'Could not save draft. Apply the operations-control migration first.' }, { status: 503 })
    return NextResponse.json({ ok: true, draft: data })
  }

  if (action === 'review-document') {
    const id = typeof body.id === 'string' ? body.id : ''
    const status = typeof body.status === 'string' ? body.status : ''
    const notes = typeof body.notes === 'string' ? body.notes.slice(0, 2000) : ''
    if (!UUID.test(id) || !['reviewed','approved','rejected'].includes(status)) return NextResponse.json({ error: 'Choose a valid document and review status.' }, { status: 400 })
    const { error } = await auth.db.from('job_documents').update({ review_status: status, notes, reviewed_by: auth.userId, reviewed_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', id)
    if (error) return NextResponse.json({ error: 'Could not update document review.' }, { status: 503 })
    return NextResponse.json({ ok: true })
  }

  if (action === 'save-settlement') {
    const jobId = typeof body.jobId === 'string' ? body.jobId : ''
    const labour = Number(body.labourAmountExVat)
    const vatRate = Number(body.vatRate ?? 0)
    if (!UUID.test(jobId) || !Number.isFinite(labour) || labour < 0 || labour > 100000000 || !Number.isFinite(vatRate) || vatRate < 0 || vatRate > 1) {
      return NextResponse.json({ error: 'Enter a valid job, labour-only amount (ex VAT) and VAT rate.' }, { status: 400 })
    }
    const [{ data: job }, { data: assignment }] = await Promise.all([
      auth.db.from('jobs').select('id,status').eq('id', jobId).maybeSingle(),
      auth.db.from('job_subcontractor_assignments').select('subcontractor_draft_id').eq('job_id', jobId).maybeSingle(),
    ])
    if (!job) return NextResponse.json({ error: 'Job not found.' }, { status: 404 })
    const { data: existingSettlement } = await auth.db.from('subcontractor_labour_settlements').select('id,status').eq('job_id', jobId).maybeSingle()
    if (existingSettlement?.status === 'paid') return NextResponse.json({ error: 'This settlement is already recorded as paid. Use an adjustment workflow instead of overwriting payment history.' }, { status: 409 })
    const payableEx = Math.round(labour * 0.5 * 100) / 100
    const payableInc = Math.round(payableEx * (1 + vatRate) * 100) / 100
    const status = job.status === 'completed' ? 'payable' : 'pending_completion'
    const { error } = await auth.db.from('subcontractor_labour_settlements').upsert({
      job_id: jobId, subcontractor_draft_id: assignment?.subcontractor_draft_id ?? null,
      labour_amount_ex_vat: labour, vat_rate: vatRate, split_percent: 50,
      payable_ex_vat: payableEx, payable_inc_vat: payableInc, status,
      completion_marked_at: job.status === 'completed' ? new Date().toISOString() : null,
      created_by: auth.userId, updated_at: new Date().toISOString(),
    }, { onConflict: 'job_id' })
    if (error) return NextResponse.json({ error: 'Could not save settlement. Apply the operations-control migration first.' }, { status: 503 })
    return NextResponse.json({ ok: true, status, payableEx, payableInc, message: status === 'payable' ? 'Marked payable because the job is complete. No bank transfer was initiated.' : 'Saved. It becomes payable automatically when the job is marked completed.' })
  }

  if (action === 'mark-paid') {
    const id = typeof body.id === 'string' ? body.id : ''
    const reference = typeof body.reference === 'string' ? body.reference.slice(0, 180) : ''
    if (!UUID.test(id) || !reference.trim()) return NextResponse.json({ error: 'A payment reference is required.' }, { status: 400 })
    const { error } = await auth.db.from('subcontractor_labour_settlements').update({ status: 'paid', paid_at: new Date().toISOString(), payment_reference: reference.trim(), updated_at: new Date().toISOString() }).eq('id', id).eq('status', 'payable')
    if (error) return NextResponse.json({ error: 'Could not record payment.' }, { status: 503 })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Unknown operation.' }, { status: 400 })
}
