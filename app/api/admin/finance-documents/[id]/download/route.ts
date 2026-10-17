import { NextResponse } from 'next/server'
import { requireStaff, errorResponse } from '@/lib/ai/openai'
import { db } from '@/lib/ngms-ops/core'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireStaff(request)
    const { id } = await context.params
    if (!UUID.test(id)) return NextResponse.json({ error: 'Invalid document ID.' }, { status: 400 })

    const admin = db()
    const { data: document, error } = await admin.from('ngms_document_records')
      .select('storage_bucket,storage_path,original_filename')
      .eq('id', id)
      .maybeSingle()
    if (error) throw error
    if (!document) return NextResponse.json({ error: 'Document not found.' }, { status: 404 })

    const { data, error: signedError } = await admin.storage
      .from(document.storage_bucket)
      .createSignedUrl(document.storage_path, 60, { download: document.original_filename })
    if (signedError || !data?.signedUrl) throw new Error('Could not create a temporary document link.')

    return NextResponse.json({ url: data.signedUrl, expires_in: 60 }, {
      headers: { 'Cache-Control': 'no-store, private' },
    })
  } catch (e) {
    return errorResponse(e)
  }
}
