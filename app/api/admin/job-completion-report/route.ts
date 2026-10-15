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
  const jobId = new URL(request.url).searchParams.get('jobId') ?? ''
  if (!/^[0-9a-f-]{36}$/i.test(jobId)) return NextResponse.json({ error: 'A valid job is required.' }, { status: 400 })

  const [{ data: saved, error: savedError }, { data: previous, error: previousError }] = await Promise.all([
    auth.db.from('job_completion_reports').select('id,job_id,completed_at,work_completed,completion_notes,outstanding_issues,warranty_notes,client_satisfaction,updated_at').eq('job_id', jobId).maybeSingle(),
    auth.db.from('subcontractor_job_reports').select('report_type,work_summary,safety_notes,issues_found,materials_used,next_steps,submitted_by_email,submitted_at,status,subcontractor_invitation_drafts(company_name,contact_name)').eq('job_id', jobId).order('submitted_at', { ascending: false }).limit(1).maybeSingle(),
  ])
  if (savedError || previousError) {
    console.error('completion report load failed', savedError?.message, previousError?.message)
    return NextResponse.json({ error: 'Could not load completion report data.' }, { status: 503 })
  }
  return NextResponse.json({ saved: saved ?? null, previous: previous ?? null })
}

export async function POST(request: Request) {
  const auth = await authorize(request)
  if ('error' in auth) return auth.error
  const body = await request.json().catch(() => ({})) as Record<string, unknown>
  const jobId = typeof body.jobId === 'string' ? body.jobId : ''
  const workCompleted = typeof body.workCompleted === 'string' ? body.workCompleted.trim() : ''
  const completionNotes = typeof body.completionNotes === 'string' ? body.completionNotes.trim() : ''
  const outstandingIssues = typeof body.outstandingIssues === 'string' ? body.outstandingIssues.trim() : ''
  const warrantyNotes = typeof body.warrantyNotes === 'string' ? body.warrantyNotes.trim() : ''
  const clientSatisfaction = typeof body.clientSatisfaction === 'string' ? body.clientSatisfaction.trim() : ''
  if (!/^[0-9a-f-]{36}$/i.test(jobId) || !workCompleted || workCompleted.length > 12000 ||
      completionNotes.length > 5000 || outstandingIssues.length > 5000 || warrantyNotes.length > 3000 || clientSatisfaction.length > 1000) {
    return NextResponse.json({ error: 'Enter a completion report and keep each field within its character limit.' }, { status: 400 })
  }
  const { data: job, error: jobError } = await auth.db.from('jobs').select('id').eq('id', jobId).maybeSingle()
  if (jobError || !job) return NextResponse.json({ error: 'Job not found.' }, { status: 404 })

  const { data, error } = await auth.db.from('job_completion_reports').upsert({
    job_id: jobId,
    work_completed: workCompleted,
    completion_notes: completionNotes || null,
    outstanding_issues: outstandingIssues || null,
    warranty_notes: warrantyNotes || null,
    client_satisfaction: clientSatisfaction || null,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'job_id' }).select('id,job_id,completed_at,work_completed,completion_notes,outstanding_issues,warranty_notes,client_satisfaction,updated_at').single()
  if (error) {
    console.error('completion report save failed', error.message)
    return NextResponse.json({ error: 'Could not save the completion report. Confirm the completion-report migration is applied.' }, { status: 503 })
  }
  return NextResponse.json({ ok: true, saved: data })
}
