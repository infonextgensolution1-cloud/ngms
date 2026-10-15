import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { handlersB } from '@/lib/ngms-ops/handlers-b'
import { touchLead, todaySast } from '@/lib/ngms-ops/core'

export const dynamic = 'force-dynamic'

export async function POST(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const db = supabaseAdmin()
  const { data: version, error: versionError } = await db
    .from('quote_versions')
    .select('id,quote_id,version_number,version_status,public_token,snapshot')
    .eq('public_token', token)
    .maybeSingle()
  if (versionError || !version) return NextResponse.json({ error: 'Quote link not found.' }, { status: 404 })

  const snapshot = (version.snapshot ?? {}) as { quote?: { quote_number?: string; valid_until?: string | null } }
  if (version.version_status === 'accepted') return NextResponse.redirect(new URL(`/quote/${token}`, _req.url), 303)
  if (version.version_status !== 'sent') return NextResponse.json({ error: 'This quote version is no longer available for acceptance.' }, { status: 409 })
  if (snapshot.quote?.valid_until && snapshot.quote.valid_until < todaySast()) {
    await db.from('quote_versions').update({ version_status: 'superseded' }).eq('id', version.id)
    return NextResponse.json({ error: 'This quote has expired. Please request an updated quote.' }, { status: 410 })
  }

  const { data: quote } = await db.from('quotes').select('id,quote_number,status,lead_id').eq('id', version.quote_id).maybeSingle()
  if (!quote) return NextResponse.json({ error: 'Quote not found.' }, { status: 404 })
  if (quote.status === 'accepted') return NextResponse.json({ error: 'Another version of this quote has already been accepted.' }, { status: 409 })
  if (['declined','expired'].includes(quote.status)) return NextResponse.json({ error: `This quote is ${quote.status}.` }, { status: 409 })

  const now = new Date().toISOString()
  const { error: updateError } = await db.from('quotes').update({ status: 'accepted', updated_at: now }).eq('id', quote.id)
  if (updateError) return NextResponse.json({ error: 'Could not accept the quote.' }, { status: 500 })

  await db.from('quote_versions').update({ version_status: 'superseded' }).eq('quote_id', quote.id).neq('id', version.id)
  const { error: acceptVersionError } = await db.from('quote_versions').update({ version_status: 'accepted', accepted_at: now, sent_at: now }).eq('id', version.id)
  if (acceptVersionError) return NextResponse.json({ error: 'Quote accepted, but version history needs attention.' }, { status: 500 })

  await touchLead(db, quote.lead_id, 'won', `Quote ${quote.quote_number} accepted by customer`)

  const { data: existingJobs } = await db.from('jobs').select('id').eq('quote_id', quote.id).neq('status', 'cancelled').limit(1)
  let jobCreated = false
  if (!existingJobs?.length) {
    const job = await handlersB.ngms_create_job(db, { quote_id: quote.id })
    if (!job.isError) jobCreated = true
  }

  const { data: existingInvoices } = await db.from('invoices').select('id').eq('quote_id', quote.id).neq('status', 'void').limit(1)
  let depositInvoiceCreated = false
  const dep = Number((version.snapshot as { quote?: { deposit_amount?: number } })?.quote?.deposit_amount ?? 0)
  if (dep > 0 && !existingInvoices?.length) {
    const invoice = await handlersB.ngms_create_invoice(db, { quote_id: quote.id, kind: 'deposit' })
    if (!invoice.isError) depositInvoiceCreated = true
  }

  return NextResponse.redirect(new URL(`/quote/${token}?accepted=1&job=${jobCreated ? '1' : '0'}&invoice=${depositInvoiceCreated ? '1' : '0'}`, _req.url), 303)
}
