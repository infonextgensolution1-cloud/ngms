import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export async function POST(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const db = supabaseAdmin()
  const { data: plan } = await db.from('maintenance_plans').select('id,status').eq('public_token', token).maybeSingle()

  if (!plan) return NextResponse.json({ error: 'Maintenance plan link not found.' }, { status: 404 })
  if (plan.status === 'active') return NextResponse.json({ error: 'An active plan cannot be declined from this offer link.' }, { status: 409 })
  if (!['offered', 'paused'].includes(plan.status)) return NextResponse.json({ error: 'This maintenance offer is no longer available.' }, { status: 409 })

  const { error } = await db.from('maintenance_plans').update({
    status: 'declined',
    updated_at: new Date().toISOString(),
    notes: 'Customer declined this maintenance plan offer.',
  }).eq('id', plan.id)

  if (error) return NextResponse.json({ error: 'Could not decline the maintenance offer.' }, { status: 500 })
  return NextResponse.redirect(new URL('/maintenance/' + token + '?declined=1', _req.url), 303)
}
