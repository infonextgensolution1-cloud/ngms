import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

function bearer(req: Request) {
  const value = req.headers.get('authorization') || ''
  return value.startsWith('Bearer ') ? value.slice(7) : ''
}

export async function POST(req: Request) {
  try {
    const token = bearer(req)
    if (!token) return NextResponse.json({ ok: false, error: 'Staff authentication required.' }, { status: 401 })
    const admin = supabaseAdmin()
    const { data: auth, error } = await admin.auth.getUser(token)
    if (error || !auth.user) return NextResponse.json({ ok: false, error: 'Staff authentication required.' }, { status: 401 })

    const { type, id } = await req.json()
    if (!['lead','client','quote','job'].includes(type) || !id) return NextResponse.json({ ok: false, error: 'Invalid record.' }, { status: 400 })

    const table = type === 'lead' ? 'leads' : type === 'client' ? 'clients' : type === 'quote' ? 'quotes' : 'jobs'
    const select = type === 'lead'
      ? 'id,name,phone,email,suburb,service,service_slug,status,source,message,follow_up_at,created_at,updated_at'
      : type === 'client'
        ? 'id,name,phone,email,address,suburb,created_at'
        : type === 'quote'
          ? 'id,quote_number,status,total_amount,created_at,valid_until,notes,client_id'
          : 'id,title,status,scheduled_date,description,client_id'

    const { data, error: queryError } = await admin.from(table).select(select).eq('id', id).maybeSingle()
    if (queryError) return NextResponse.json({ ok: false, error: queryError.message }, { status: 500 })
    if (!data) return NextResponse.json({ ok: false, error: 'Record not found.' }, { status: 404 })

    const safe = JSON.stringify(data, null, 2)
    const label = type === 'lead' ? `Lead: ${(data as any).name || id}`
      : type === 'client' ? `Client: ${(data as any).name || id}`
      : type === 'quote' ? `Quote: ${(data as any).quote_number || id}`
      : `Job: ${(data as any).title || id}`

    return NextResponse.json({ ok: true, label, context: `NGMS record type: ${type}\n${safe}\n\nUse this only as operational context. Do not invent missing details.` })
  } catch (e) {
    console.error('AI context error', e)
    return NextResponse.json({ ok: false, error: 'Unable to load record context.' }, { status: 500 })
  }
}
