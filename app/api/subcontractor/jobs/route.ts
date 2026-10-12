import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

async function authorize(request: Request) {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim()
  if (!token) return { error: NextResponse.json({ error: 'Sign in to the subcontractor portal first.' }, { status: 401 }) }
  let db
  try { db = supabaseAdmin() } catch { return { error: NextResponse.json({ error: 'Portal service is not configured.' }, { status: 500 }) } }
  const { data: auth, error } = await db.auth.getUser(token)
  const email = auth?.user?.email?.trim().toLowerCase()
  if (error || !auth.user?.email_confirmed_at || !email) return { error: NextResponse.json({ error: 'Use a verified sign-in link to continue.' }, { status: 401 }) }
  const { data: subcontractor, error: draftError } = await db.from('subcontractor_invitation_drafts')
    .select('id,company_name,contact_name,email,permissions').eq('email', email).maybeSingle()
  if (draftError) return { error: NextResponse.json({ error: 'Could not verify subcontractor access.' }, { status: 500 }) }
  if (!subcontractor) return { error: NextResponse.json({ error: 'This email is not linked to a subcontractor record. Contact NGMS.' }, { status: 403 }) }
  return { db, email, subcontractor }
}

export async function GET(request: Request) {
  const auth = await authorize(request)
  if ('error' in auth) return auth.error
  const { data: assignments, error: assignmentError } = await auth.db.from('job_subcontractor_assignments')
    .select('job_id,created_at,jobs(id,title,description,status,scheduled_date,completed_date,client_id,clients(name,suburb,address))')
    .eq('subcontractor_draft_id', auth.subcontractor.id).order('created_at', { ascending: false })
  if (assignmentError) {
    console.error('subcontractor assigned jobs load failed', assignmentError.message)
    return NextResponse.json({ error: 'Job assignments are not available yet. Contact NGMS.' }, { status: 503 })
  }
  const jobs = (assignments ?? []).map((a: any) => ({ ...a.jobs, assigned_at: a.created_at })).filter((j: any) => j?.id)
  const ids = jobs.map((j: any) => j.id)
  if (!ids.length) return NextResponse.json({ subcontractor: { company_name: auth.subcontractor.company_name, contact_name: auth.subcontractor.contact_name }, jobs: [], reports: [], photos: [] })
  const [{ data: reports, error: reportError }, { data: photos, error: photoError }] = await Promise.all([
    auth.db.from('subcontractor_job_reports').select('id,job_id,report_type,work_summary,safety_notes,issues_found,materials_used,next_steps,submitted_at,status').in('job_id', ids).eq('subcontractor_draft_id', auth.subcontractor.id).order('submitted_at', { ascending: false }),
    auth.db.from('job_photos').select('id,job_id,photo_url,type,caption,sort_order,created_at').in('job_id', ids).order('created_at', { ascending: false }),
  ])
  if (reportError || photoError) return NextResponse.json({ error: 'Could not load job reports or photos.' }, { status: 500 })
  const signedPhotos = await Promise.all((photos ?? []).map(async (p) => {
    const path = p.photo_url.replace(/^.*\/storage\/v1\/object\/(?:public|sign)\/job-photos\//, '').split('?')[0]
    const { data } = await auth.db.storage.from('job-photos').createSignedUrl(path, 300)
    return data?.signedUrl ? { ...p, photo_url: data.signedUrl } : null
  }))
  return NextResponse.json({
    subcontractor: { company_name: auth.subcontractor.company_name, contact_name: auth.subcontractor.contact_name },
    jobs, reports: reports ?? [], photos: signedPhotos.filter(Boolean),
  }, { headers: { 'Cache-Control': 'private, no-store' } })
}

export async function POST(request: Request) {
  const auth = await authorize(request)
  if ('error' in auth) return auth.error
  const body = await request.json().catch(() => ({})) as Record<string, unknown>
  const jobId = typeof body.job_id === 'string' ? body.job_id : ''
  const reportType = typeof body.report_type === 'string' ? body.report_type : ''
  const workSummary = typeof body.work_summary === 'string' ? body.work_summary.trim() : ''
  const safetyNotes = typeof body.safety_notes === 'string' ? body.safety_notes.trim().slice(0,3000) : ''
  const issuesFound = typeof body.issues_found === 'string' ? body.issues_found.trim().slice(0,3000) : ''
  const materialsUsed = typeof body.materials_used === 'string' ? body.materials_used.trim().slice(0,3000) : ''
  const nextSteps = typeof body.next_steps === 'string' ? body.next_steps.trim().slice(0,3000) : ''
  if (!/^[0-9a-f-]{36}$/i.test(jobId) || !['inspection','during_work','completion'].includes(reportType) || !workSummary || workSummary.length > 5000) {
    return NextResponse.json({ error: 'Select an assigned job, report stage and enter a work summary.' }, { status: 400 })
  }
  const { data: assignment, error: assignmentError } = await auth.db.from('job_subcontractor_assignments')
    .select('job_id').eq('job_id', jobId).eq('subcontractor_draft_id', auth.subcontractor.id).maybeSingle()
  if (assignmentError || !assignment) return NextResponse.json({ error: 'You can only report on jobs assigned to your company.' }, { status: 403 })
  const { data, error } = await auth.db.from('subcontractor_job_reports').insert({
    job_id: jobId, subcontractor_draft_id: auth.subcontractor.id, report_type: reportType,
    work_summary: workSummary, safety_notes: safetyNotes, issues_found: issuesFound,
    materials_used: materialsUsed, next_steps: nextSteps, submitted_by_email: auth.email,
  }).select('id,job_id,report_type,submitted_at,status').single()
  if (error) {
    console.error('subcontractor report submit failed', error.message)
    return NextResponse.json({ error: 'Could not save report. Confirm the subcontractor report migration is applied.' }, { status: 503 })
  }
  return NextResponse.json({ report: data }, { status: 201 })
}
