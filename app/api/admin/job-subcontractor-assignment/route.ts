import { NextResponse } from 'next/server'
import { jwtAal, MFA_REQUIRED_MESSAGE } from '@/lib/jwt-aal'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

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
  const { searchParams } = new URL(request.url)
  const jobId = searchParams.get('jobId') ?? ''
  if (!/^[0-9a-f-]{36}$/i.test(jobId)) return NextResponse.json({ error: 'A valid job is required.' }, { status: 400 })

  const [{ data: drafts, error: draftError }, { data: assignment, error: assignmentError }, { data: reports, error: reportError }] = await Promise.all([
    auth.db.from('subcontractor_invitation_drafts').select('id,company_name,contact_name,email,status').order('company_name').limit(100),
    auth.db.from('job_subcontractor_assignments').select('id,subcontractor_draft_id,subcontractor_invitation_drafts(id,company_name,contact_name,email,status)').eq('job_id', jobId),
    auth.db.from('subcontractor_job_reports').select('id,subcontractor_draft_id,report_type,work_summary,safety_notes,issues_found,materials_used,next_steps,submitted_by_email,submitted_at,status,subcontractor_invitation_drafts(company_name,contact_name)').eq('job_id', jobId).order('submitted_at', { ascending: false }),
  ])
  if (draftError || assignmentError || reportError) {
    console.error('job subcontractor assignment load failed', draftError?.message, assignmentError?.message, reportError?.message)
    return NextResponse.json({ error: 'Assignment storage is not ready. Apply the subcontractor job assignment migration first.' }, { status: 503 })
  }
  return NextResponse.json({ subcontractors: drafts ?? [], assignments: assignment ?? [], reports: reports ?? [] })
}

export async function POST(request: Request) {
  const auth = await authorize(request)
  if ('error' in auth) return auth.error
  const body = await request.json().catch(() => ({})) as { jobId?: unknown; subcontractorDraftId?: unknown }
  const jobId = typeof body.jobId === 'string' ? body.jobId : ''
  const draftId = typeof body.subcontractorDraftId === 'string' ? body.subcontractorDraftId : ''
  if (!/^[0-9a-f-]{36}$/i.test(jobId) || (draftId && !/^[0-9a-f-]{36}$/i.test(draftId))) {
    return NextResponse.json({ error: 'A valid job and subcontractor selection are required.' }, { status: 400 })
  }
  const { data: job } = await auth.db.from('jobs').select('id').eq('id', jobId).maybeSingle()
  if (!job) return NextResponse.json({ error: 'Job not found.' }, { status: 404 })

  if (!draftId) {
    const { error } = await auth.db.from('job_subcontractor_assignments').delete().eq('job_id', jobId)
    if (error) {
      console.error('job subcontractor unassign failed', error.message)
      return NextResponse.json({ error: 'Could not remove assignment. Confirm the assignment migration is applied.' }, { status: 503 })
    }
    return NextResponse.json({ ok: true, assigned: false })
  }

  const { data: draft } = await auth.db.from('subcontractor_invitation_drafts').select('id').eq('id', draftId).maybeSingle()
  if (!draft) return NextResponse.json({ error: 'Subcontractor draft not found.' }, { status: 404 })
  const { error } = await auth.db.from('job_subcontractor_assignments').upsert({
    job_id: jobId, subcontractor_draft_id: draftId, assigned_by: auth.userId, updated_at: new Date().toISOString(),
  }, { onConflict: 'job_id' })
  if (error) {
    console.error('job subcontractor assignment save failed', error.message)
    return NextResponse.json({ error: 'Could not save assignment. Confirm the assignment migration is applied.' }, { status: 503 })
  }
  // This records the admin assignment only. Drafts do not create portal accounts or send invitations.
  return NextResponse.json({ ok: true, assigned: true })
}
