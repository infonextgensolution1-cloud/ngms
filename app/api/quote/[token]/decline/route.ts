import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { touchLead } from '@/lib/ngms-ops/core'

export const dynamic = 'force-dynamic'

export async function POST(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const db = supabaseAdmin()
  const { data: version } = await db
    .from('quote_versions')
    .select('id,quote_id,version_status')
    .eq('public_token', token)
    .maybeSingle()
  if (!version) return NextResponse.json({ error: 'Quote link not found.' }, { status: 404 })
  if (version.version_status === 'accepted') return NextResponse.json({ error: 'An accepted quote cannot be declined.' }, { status: 409 })
  if (version.version_status !== 'sent') return NextResponse.json({ error: 'This quote version is no longer available.' }, { status: 409 })

  const { data: quote } = await db.from('quotes').select('id,quote_number,status,lead_id').eq('id', version.quote_id).maybeSingle()
  if (!quote) return NextResponse.json({ error: 'Quote not found.' }, { status: 404 })

  const now = new Date().toISOString()
  await db.from('quotes').update({ status: 'declined', updated_at: now }).eq('id', quote.id)
  await db.from('quote_versions').update({ version_status: 'declined' }).eq('id', version.id)
  await touchLead(db, quote.lead_id, 'lost', `Quote ${quote.quote_number} declined by customer`)

  return NextResponse.redirect(new URL(`/quote/${token}?declined=1`, _req.url), 303)
}
