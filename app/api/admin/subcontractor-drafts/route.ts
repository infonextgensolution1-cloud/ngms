import { NextResponse } from 'next/server'
import { jwtAal, MFA_REQUIRED_MESSAGE } from '@/lib/jwt-aal'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const PERMISSIONS = {
  quotes_read: true,
  invoices_read: true,
  assigned_jobs_only: true,
  submit_inspection_reports: true,
  submit_completion_reports: true,
  upload_job_photos: true,
  quotes_edit: false,
  invoices_edit: false,
} as const

async function authorize(request: Request) {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim()
  if (!token) return { error: NextResponse.json({ error: 'Sign in to /admin first.' }, { status: 401 }) }
  let db
  try { db = supabaseAdmin() } catch {
    return { error: NextResponse.json({ error: 'Server is not configured.' }, { status: 500 }) }
  }
  const { data: auth, error } = await db.auth.getUser(token)
  if (error || !auth.user) return { error: NextResponse.json({ error: 'Session expired. Sign in again.' }, { status: 401 }) }
  if (jwtAal(token) !== 'aal2') return { error: NextResponse.json({ error: MFA_REQUIRED_MESSAGE }, { status: 403 }) }
  const { data: staff } = await db.from('prompt_users').select('user_id').eq('user_id', auth.user.id).eq('active', true).maybeSingle()
  if (!staff) return { error: NextResponse.json({ error: 'Staff only.' }, { status: 403 }) }
  return { db, userId: auth.user.id }
}

export async function GET(request: Request) {
  const auth = await authorize(request)
  if ('error' in auth) return auth.error
  const { data, error } = await auth.db.from('subcontractor_invitation_drafts')
    .select('id,company_name,contact_name,email,notes,permissions,status,created_at,updated_at')
    .order('updated_at', { ascending: false }).limit(100)
  if (error) {
    console.error('subcontractor drafts list failed', error.message)
    return NextResponse.json({ error: 'Draft storage is not ready. Apply the subcontractor migration first.' }, { status: 503 })
  }
  return NextResponse.json({ drafts: data ?? [] })
}

export async function POST(request: Request) {
  const auth = await authorize(request)
  if ('error' in auth) return auth.error
  const body = await request.json().catch(() => ({})) as Record<string, unknown>
  const companyName = typeof body.company_name === 'string' ? body.company_name.trim() : ''
  const contactName = typeof body.contact_name === 'string' ? body.contact_name.trim() : ''
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const notes = typeof body.notes === 'string' ? body.notes.trim().slice(0, 2000) : ''
  if (!companyName || !contactName || !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Company, contact and a valid email are required.' }, { status: 400 })
  }
  // Draft-only endpoint: never creates an auth user, login link, portal role, or email.
  const { data, error } = await auth.db.from('subcontractor_invitation_drafts').insert({
    company_name: companyName,
    contact_name: contactName,
    email,
    notes,
    permissions: PERMISSIONS,
    status: 'draft',
    created_by: auth.userId,
  }).select('id,company_name,contact_name,email,notes,permissions,status,created_at').single()
  if (error) {
    console.error('subcontractor draft save failed', error.message)
    return NextResponse.json({ error: 'Could not save draft. Confirm the database migration is applied.' }, { status: 503 })
  }
  return NextResponse.json({ draft: data }, { status: 201 })
}
