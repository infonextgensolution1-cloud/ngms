import { NextResponse } from 'next/server'
import { jwtAal, MFA_REQUIRED_MESSAGE } from '@/lib/jwt-aal'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { sendWeekAheadEmail } from '@/lib/week-ahead'

export const dynamic = 'force-dynamic'

// Admin dashboard button: emails the owner the "week ahead" summary right now, so it can be
// previewed on any day. Same rules as /api/admin/portal-invite: caller must be an active staff
// member who has entered their two-step code. It only ever emails the business inbox.
export async function POST(request: Request) {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim()
  if (!token) return NextResponse.json({ error: 'Sign in to /admin first.' }, { status: 401 })

  let db
  try {
    db = supabaseAdmin()
  } catch {
    return NextResponse.json({ error: 'Server is not configured.' }, { status: 500 })
  }

  const { data: auth, error: authError } = await db.auth.getUser(token)
  if (authError || !auth.user) return NextResponse.json({ error: 'Your session has expired. Sign in again.' }, { status: 401 })
  if (jwtAal(token) !== 'aal2') return NextResponse.json({ error: MFA_REQUIRED_MESSAGE }, { status: 403 })
  const { data: staff } = await db.from('prompt_users').select('user_id').eq('user_id', auth.user.id).eq('active', true).maybeSingle()
  if (!staff) return NextResponse.json({ error: 'Staff only.' }, { status: 403 })

  try {
    const { jobs } = await sendWeekAheadEmail(db)
    return NextResponse.json({ ok: true, jobs })
  } catch (e) {
    console.error('week-ahead email failed', (e as Error).message)
    return NextResponse.json({ error: 'Could not send the week-ahead email. Try again in a minute.' }, { status: 502 })
  }
}
