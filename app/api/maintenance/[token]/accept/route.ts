import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export async function POST(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const db = supabaseAdmin()

  const { data: plan } = await db
    .from('maintenance_plans')
    .select('id,status,public_token,name,frequency_months,discount_percent')
    .eq('public_token', token)
    .maybeSingle()

  if (!plan) return NextResponse.json({ error: 'Maintenance plan link not found.' }, { status: 404 })

  if (plan.status === 'active') {
    return NextResponse.redirect(new URL('/maintenance/' + token + '?active=1', _req.url), 303)
  }

  if (!['offered', 'paused'].includes(plan.status)) {
    return NextResponse.json({ error: 'This maintenance offer is no longer available.' }, { status: 409 })
  }

  const { error } = await db
    .from('maintenance_plans')
    .update({
      status: 'active',
      updated_at: new Date().toISOString(),
      notes: 'Customer explicitly accepted this maintenance plan.',
    })
    .eq('id', plan.id)

  if (error) return NextResponse.json({ error: 'Could not activate the maintenance plan.' }, { status: 500 })

  return NextResponse.redirect(new URL('/maintenance/' + token + '?active=1', _req.url), 303)
}
