import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
const MAX_BYTES = 8 * 1024 * 1024
const MIME_EXT: Record<string,string> = { 'image/jpeg':'jpg', 'image/png':'png', 'image/webp':'webp' }

async function authorize(request: Request) {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim()
  if (!token) return { error: NextResponse.json({ error: 'Sign in to the subcontractor portal first.' }, { status: 401 }) }
  let db
  try { db = supabaseAdmin() } catch { return { error: NextResponse.json({ error: 'Portal service is not configured.' }, { status: 500 }) } }
  const { data: auth, error } = await db.auth.getUser(token)
  const email = auth?.user?.email?.trim().toLowerCase()
  if (error || !auth.user?.email_confirmed_at || !email) return { error: NextResponse.json({ error: 'Use a verified sign-in link to continue.' }, { status: 401 }) }
  const { data: subcontractor } = await db.from('subcontractor_invitation_drafts').select('id,email,permissions').eq('email', email).maybeSingle()
  if (!subcontractor) return { error: NextResponse.json({ error: 'Subcontractor access is not configured for this email.' }, { status: 403 }) }
  return { db, email, subcontractor }
}

export async function POST(request: Request) {
  const auth = await authorize(request)
  if ('error' in auth) return auth.error
  const form = await request.formData()
  const jobId = String(form.get('job_id') ?? '')
  const type = String(form.get('type') ?? '')
  const caption = String(form.get('caption') ?? '').trim().slice(0,500)
  const file = form.get('file')
  if (!/^[0-9a-f-]{36}$/i.test(jobId) || !['before','progress','after'].includes(type) || !(file instanceof File)) {
    return NextResponse.json({ error: 'Choose an assigned job, photo stage and image.' }, { status: 400 })
  }
  if (!MIME_EXT[file.type] || file.size < 1 || file.size > MAX_BYTES) return NextResponse.json({ error: 'Use a JPG, PNG or WebP image up to 8 MB.' }, { status: 400 })
  const { data: assignment } = await auth.db.from('job_subcontractor_assignments').select('job_id')
    .eq('job_id', jobId).eq('subcontractor_draft_id', auth.subcontractor.id).maybeSingle()
  if (!assignment) return NextResponse.json({ error: 'You can only upload photos to jobs assigned to your company.' }, { status: 403 })
  const path = `${jobId}/subcontractor/${crypto.randomUUID()}.${MIME_EXT[file.type]}`
  const { error: uploadError } = await auth.db.storage.from('job-photos').upload(path, Buffer.from(await file.arrayBuffer()), { contentType: file.type, upsert: false })
  if (uploadError) {
    console.error('subcontractor photo upload failed', uploadError.message)
    return NextResponse.json({ error: 'Photo upload failed. Check the job-photos storage bucket.' }, { status: 503 })
  }
  const { data, error } = await auth.db.from('job_photos').insert({
    job_id: jobId, photo_url: path, type, caption: caption || null,
  }).select('id,job_id,type,caption,created_at').single()
  if (error) {
    await auth.db.storage.from('job-photos').remove([path])
    console.error('subcontractor photo record failed', error.message)
    return NextResponse.json({ error: 'Could not save photo record.' }, { status: 500 })
  }
  return NextResponse.json({ photo: data }, { status: 201 })
}
