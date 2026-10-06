import { NextResponse } from 'next/server'
import { requireStaff, errorResponse } from '@/lib/ai/openai'
import { db, getSettings, quoteMoney, todaySast, type Client, type Item, type Quote } from '@/lib/ngms-ops/core'
import { QUOTE_TERMS } from '@/lib/quote-terms'
import { buildQuotePdf } from '@/lib/ngms-ops/quote-pdf'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function load(id: string) {
  const admin = db()
  const { data: quote, error } = await admin.from('quotes').select('id,quote_number,client_id,lead_id,status,vat_included,deposit_amount,total_amount,notes,valid_until,created_at,updated_at,pdf_path').eq('id', id).maybeSingle()
  if (error) throw error
  if (!quote) throw new Error('Quote not found.')
  const { data: client } = await admin.from('clients').select('id,name,email,phone,address,suburb,notes,created_at').eq('id', quote.client_id).maybeSingle()
  const { data: items, error: itemError } = await admin.from('quote_items').select('id,description,quantity,unit,unit_price,service_id').eq('quote_id', id).order('created_at')
  if (itemError) throw itemError
  const settings = await getSettings(admin)
  const q = quote as Quote
  const money = quoteMoney(q, (items || []) as Item[], settings.vat_rate)
  return { admin, quote: q, client: client as Client | null, items: (items || []) as Item[], settings, money }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireStaff(request)
    const { id } = await params
    const { admin, quote, client, items, settings, money } = await load(id)
    const expired = quote.status === 'sent' && !!quote.valid_until && quote.valid_until < todaySast()
    const terms = QUOTE_TERMS.map(t => t.replace('{deposit}', String(money.deposit_percent)))
    const pdf = buildQuotePdf({ quote, client, items, settings, money, terms, expired })
    const path = 'pdf/' + quote.id + '/' + quote.quote_number + '.pdf'
    const upload = await admin.storage.from('quotes').upload(path, new Blob([pdf], { type: 'application/pdf' }), { contentType: 'application/pdf', upsert: true })
    if (upload.error) throw upload.error
    const { error: updateError } = await admin.from('quotes').update({ pdf_path: path, updated_at: new Date().toISOString() }).eq('id', quote.id)
    if (updateError) throw updateError
    return new NextResponse(pdf as BodyInit, { headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename="' + quote.quote_number + '.pdf"', 'Cache-Control': 'no-store', 'Content-Length': String(pdf.byteLength), 'X-NGMS-PDF-Saved': 'true' } })
  } catch (e) { return errorResponse(e) }
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireStaff(request)
    const { id } = await params
    const { admin, quote } = await load(id)
    if (!quote.pdf_path) return NextResponse.json({ error: 'No saved PDF exists yet. Generate it first.' }, { status: 404 })
    const { data, error } = await admin.storage.from('quotes').download(quote.pdf_path)
    if (error || !data) throw error || new Error('Saved PDF could not be downloaded.')
    return new NextResponse(data as BodyInit, { headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename="' + quote.quote_number + '.pdf"', 'Cache-Control': 'no-store' } })
  } catch (e) { return errorResponse(e) }
}
