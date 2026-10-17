import { NextResponse } from 'next/server'
import { requireStaff, errorResponse } from '@/lib/ai/openai'
import { db } from '@/lib/ngms-ops/core'
import { monthReport } from '@/lib/admin-report'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

function csvCell(value: unknown): string {
  let text = value === null || value === undefined ? '' : String(value)
  if (/^[=+@-]/.test(text)) text = `'${text}`
  return `"${text.replace(/"/g, '""')}"`
}

function reportCsv(month: string, generatedAt: string, sheets: Awaited<ReturnType<typeof monthReport>>['sheets']) {
  const rows: unknown[][] = [
    ['NGMS FINANCIAL AND OPERATIONS REPORT'],
    ['Reporting period', month],
    ['Generated at', generatedAt],
    ['Currency', 'ZAR'],
    ['Calculation note', 'Payments currently derive from timestamped invoice-note entries; reconcile with bank records before formal accounting use.'],
    [],
  ]
  for (const sheet of sheets) {
    rows.push([sheet.title])
    rows.push(sheet.headers)
    rows.push(...sheet.rows)
    rows.push([])
  }
  return '\uFEFF' + rows.map((row) => row.map(csvCell).join(',')).join('\r\n')
}

export async function POST(request: Request) {
  let storagePath: string | null = null
  try {
    await requireStaff(request)
    const body = await request.json() as { month?: string }
    const month = String(body.month || '')
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
      return NextResponse.json({ error: 'Month must use YYYY-MM format.' }, { status: 400 })
    }
    const now = new Date()
    const currentMonth = now.toLocaleDateString('en-CA', { timeZone: 'Africa/Johannesburg' }).slice(0, 7)
    if (month > currentMonth) return NextResponse.json({ error: 'Future months cannot be archived.' }, { status: 400 })

    const admin = db()
    const report = await monthReport(admin, month)
    const generatedAt = now.toISOString()
    const csv = reportCsv(month, generatedAt, report.sheets)
    const bytes = Buffer.from(csv, 'utf8')
    const id = crypto.randomUUID()
    const dateStamp = now.toLocaleDateString('en-CA', { timeZone: 'Africa/Johannesburg' }).replace(/-/g, '')
    const documentNumber = `NGMS-RPT-${month.replace('-', '')}-${id.slice(0, 8).toUpperCase()}`
    const storageBucket = 'ngms-admin-documents'
    storagePath = `reports/${month.slice(0, 4)}/${month.slice(5, 7)}/${id}-NGMS-Management-Report-${month}.csv`

    const upload = await admin.storage.from(storageBucket).upload(storagePath, bytes, {
      contentType: 'text/csv',
      upsert: false,
    })
    if (upload.error) throw new Error(`Report storage failed: ${upload.error.message}`)

    const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim()
    const { data: auth } = token ? await admin.auth.getUser(token) : { data: { user: null } }
    const actor = auth.user?.email || auth.user?.id || null

    const { data: document, error: insertError } = await admin.from('ngms_document_records').insert({
      id,
      document_number: documentNumber,
      document_type: 'management_report',
      title: `Financial and management report — ${month}`,
      issued_on: `${month}-01`,
      storage_bucket: storageBucket,
      storage_path: storagePath,
      original_filename: `NGMS-Management-Report-${month}.csv`,
      content_type: 'text/csv',
      byte_size: bytes.byteLength,
      processing_status: 'complete',
      review_status: 'not_required',
      is_visible_to_customer: false,
      metadata: { reportMonth: month, generatedAt, format: 'CSV', currency: 'ZAR' },
      created_by: actor,
    }).select('id,document_number,title,document_type,created_at').single()
    if (insertError) throw insertError

    const { error: queueError } = await admin.from('ngms_drive_sync_queue').upsert({
      document_id: id, provider: 'google_drive', status: 'pending', attempts: 0,
    }, { onConflict: 'document_id,provider', ignoreDuplicates: true })
    await admin.from('ngms_audit_events').insert({
      actor,
      action: 'report.archived',
      entity_type: 'ngms_document_records',
      entity_id: id,
      details: { month, format: 'CSV', archive_queue_created: !queueError },
    })

    return NextResponse.json({
      document,
      archive_sync: queueError ? 'queue_failed' : 'pending',
      warning: queueError ? 'Report is saved in Supabase, but the Google Drive sync queue could not be created.' : null,
    }, { status: 201, headers: { 'Cache-Control': 'no-store' } })
  } catch (e) {
    if (storagePath) {
      try { await db().storage.from('ngms-admin-documents').remove([storagePath]) } catch { /* retain original error */ }
    }
    return errorResponse(e)
  }
}
