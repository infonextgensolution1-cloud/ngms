import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim()
  if (!token) return NextResponse.json({ error: 'Sign in to the customer portal first.' }, { status: 401 })

  let admin
  try {
    admin = supabaseAdmin()
  } catch {
    return NextResponse.json({ error: 'Portal service is not configured.' }, { status: 500 })
  }

  const { data: auth, error: authError } = await admin.auth.getUser(token)
  const email = auth?.user?.email?.trim().toLowerCase()
  if (authError || !email || !auth.user.email_confirmed_at) {
    return NextResponse.json({ error: 'Your session has expired. Sign in again.' }, { status: 401 })
  }

  const { id } = await params
  const { data: quote, error: quoteError } = await admin
    .from('quotes')
    .select('id,quote_number,client_id,pdf_path')
    .eq('id', id)
    .maybeSingle()

  if (quoteError) return NextResponse.json({ error: 'Could not load this quotation.' }, { status: 500 })
  if (!quote) return NextResponse.json({ error: 'Quotation not found.' }, { status: 404 })

  const { data: client, error: clientError } = await admin
    .from('clients')
    .select('id,email')
    .eq('id', quote.client_id)
    .maybeSingle()

  if (clientError) return NextResponse.json({ error: 'Could not verify quotation access.' }, { status: 500 })
  if (!client || (client.email ?? '').trim().toLowerCase() !== email) {
    return NextResponse.json({ error: 'You do not have access to this quotation.' }, { status: 403 })
  }
  if (!quote.pdf_path) return NextResponse.json({ error: 'No saved PDF is available for this quotation yet. Please contact NGMS.' }, { status: 404 })

  const { data: pdf, error: fileError } = await admin.storage.from('quotes').download(quote.pdf_path)
  if (fileError || !pdf) return NextResponse.json({ error: 'The quotation PDF could not be opened.' }, { status: 404 })

  const safeName = (quote.quote_number || 'NGMS-quotation').replace(/[^a-zA-Z0-9_-]/g, '_')
  return new NextResponse(pdf as BodyInit, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${safeName}.pdf"`,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
