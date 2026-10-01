'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { CalendarDays, Camera, CheckCircle2, Loader2, MapPin, Play, RefreshCw, ArrowRight } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { handlersB } from '@/lib/ngms-ops/handlers-b'
import { handlersC } from '@/lib/ngms-ops/handlers-c'
import { PHOTO_TYPES } from '@/lib/ngms-ops/core'

type FieldJob = {
  id: string; title: string | null; description: string | null; status: string
  scheduled_date: string | null; completed_date: string | null; quote_id: string | null
  client_name: string | null; client_suburb: string | null; client_phone: string | null
}
type Photo = { id: string; photo_url: string; type: string; caption: string | null }

const statusMeta: Record<string, { label: string; icon: typeof Play }> = {
  scheduled: { label: 'Start job', icon: Play },
  in_progress: { label: 'Complete job', icon: CheckCircle2 },
  on_hold: { label: 'Resume job', icon: Play },
}

function todaySast() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Johannesburg' }).format(new Date())
}
function prettyDate(value: string) {
  return new Intl.DateTimeFormat('en-ZA', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Africa/Johannesburg' }).format(new Date(value + 'T12:00:00'))
}

function FieldPhoto({ jobId, type, onSaved }: { jobId: string; type: (typeof PHOTO_TYPES)[number]; onSaved: () => void }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function upload(file: File) {
    setBusy(true); setError('')
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const path = `${jobId}/${type}-${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage.from('job-photos').upload(path, file, { cacheControl: '3600', upsert: false })
      if (uploadError) throw uploadError
      const { data } = supabase.storage.from('job-photos').getPublicUrl(path)
      const result = await handlersC.ngms_save_job_photo(supabase, { job_id: jobId, photo_url: data.publicUrl, type })
      if (result.isError) throw new Error(result.content[0]?.text ?? 'Could not save photo')
      onSaved()
    } catch (e) { setError((e as Error).message) }
    finally { setBusy(false) }
  }
  return (
    <label className="flex min-h-24 flex-1 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-darkgrey bg-jet px-3 py-3 text-center text-xs text-mist hover:border-blue hover:text-paper">
      {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />}
      <span>{busy ? 'Uploading…' : type === 'before' ? 'Before' : type === 'progress' ? 'Progress' : 'After'}</span>
      <input type="file" accept="image/*" capture="environment" className="hidden" disabled={busy} onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
      {error && <span className="text-orange">{error}</span>}
    </label>
  )
}

export default function FieldOperationsPage() {
  const [jobs, setJobs] = useState<FieldJob[]>([])
  const [photos, setPhotos] = useState<Record<string, Photo[]>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [error, setError] = useState('')
  const today = useMemo(todaySast, [])

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const result = await handlersB.ngms_list_jobs(supabase, { open_only: true, from_date: today, to_date: today, limit: 50 })
      if (result.isError) throw new Error(result.content[0]?.text ?? 'Could not load field jobs')
      setJobs((result.structuredContent?.jobs as FieldJob[]) ?? [])
    } catch (e) { setError((e as Error).message) }
    finally { setLoading(false) }
  }, [today])

  useEffect(() => { void load() }, [load])

  async function changeStatus(job: FieldJob) {
    const next = job.status === 'scheduled' || job.status === 'on_hold' ? 'in_progress' : 'completed'
    setSaving(job.id)
    try {
      const result = await handlersB.ngms_update_job(supabase, { job_id: job.id, status: next })
      if (result.isError) throw new Error(result.content[0]?.text ?? 'Could not update job')
      await load()
    } catch (e) { setError((e as Error).message) }
    finally { setSaving(null) }
  }

  async function loadPhotos(jobId: string) {
    const result = await handlersC.ngms_list_job_photos(supabase, { job_id: jobId })
    if (!result.isError) setPhotos((current) => ({ ...current, [jobId]: (result.structuredContent?.photos as Photo[]) ?? [] }))
  }

  useEffect(() => { jobs.forEach((job) => { void loadPhotos(job.id) }) }, [jobs])

  return (
    <main className="min-h-screen bg-jet px-4 py-6 pb-24">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-blue">NGMS FIELD OPERATIONS</p>
            <h1 className="mt-1 font-heading text-3xl font-bold text-paper">Today’s jobs</h1>
            <p className="mt-1 text-sm text-mist">{prettyDate(today)} · {jobs.length} active job{jobs.length === 1 ? '' : 's'}</p>
          </div>
          <button onClick={load} disabled={loading} className="rounded-btn border border-darkgrey p-2.5 text-mist hover:border-blue hover:text-paper" aria-label="Refresh jobs">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {error && <div className="mb-4 rounded-card border border-orange bg-cardgrey p-3 text-sm text-orange">{error}</div>}

        {loading && jobs.length === 0 ? (
          <div className="flex min-h-48 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-mist" /></div>
        ) : jobs.length === 0 ? (
          <div className="rounded-card border border-darkgrey bg-cardgrey p-8 text-center">
            <CalendarDays className="mx-auto h-8 w-8 text-mist" />
            <h2 className="mt-3 font-heading font-bold text-paper">No jobs scheduled today</h2>
            <p className="mt-1 text-sm text-mist">Use the job calendar to schedule the next site visit.</p>
            <Link href="/admin/calendar" className="mt-4 inline-flex items-center gap-2 text-sm text-blue">Open calendar <ArrowRight className="h-4 w-4" /></Link>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => {
              const meta = statusMeta[job.status]; const ActionIcon = meta?.icon ?? Play; const jobPhotos = photos[job.id] ?? []
              return (
                <article key={job.id} className="overflow-hidden rounded-card border border-darkgrey bg-cardgrey">
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-mist">{job.status.replace('_', ' ')}</p>
                        <h2 className="mt-1 font-heading text-xl font-bold text-paper">{job.title ?? 'Untitled job'}</h2>
                        <p className="mt-1 text-sm text-mist">{job.client_name ?? 'No client'}{job.client_suburb ? ` · ${job.client_suburb}` : ''}</p>
                      </div>
                      <Link href={`/admin/jobs/${job.id}`} className="shrink-0 text-xs text-blue">Full job</Link>
                    </div>
                    {job.description && <p className="mt-3 whitespace-pre-line rounded-xl bg-jet p-3 text-sm text-paper">{job.description}</p>}
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <a href={job.client_phone ? `tel:${job.client_phone}` : undefined} className="rounded-xl border border-darkgrey px-3 py-2 text-center text-xs text-mist hover:border-blue hover:text-paper">Call client</a>
                      <Link href={`/admin/jobs/${job.id}`} className="rounded-xl border border-darkgrey px-3 py-2 text-center text-xs text-mist hover:border-blue hover:text-paper">Site notes</Link>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <FieldPhoto jobId={job.id} type="before" onSaved={() => loadPhotos(job.id)} />
                      <FieldPhoto jobId={job.id} type="progress" onSaved={() => loadPhotos(job.id)} />
                      <FieldPhoto jobId={job.id} type="after" onSaved={() => loadPhotos(job.id)} />
                    </div>
                    {jobPhotos.length > 0 && <div className="mt-3 flex gap-2 overflow-x-auto">{jobPhotos.slice(-6).map((photo) => <img key={photo.id} src={photo.photo_url} alt={photo.caption ?? `${photo.type} job photo`} className="h-16 w-16 shrink-0 rounded-lg object-cover border border-darkgrey" />)}</div>}
                    <button onClick={() => changeStatus(job)} disabled={saving === job.id || job.status === 'cancelled'} className={`mt-4 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 font-heading font-bold text-white disabled:opacity-50 ${job.status === 'in_progress' ? 'bg-whatsapp' : 'bg-blue'}`}>
                      {saving === job.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <ActionIcon className="h-4 w-4" />}
                      {saving === job.id ? 'Saving…' : meta?.label ?? 'Update job'}
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        )}

        <div className="mt-6 rounded-card border border-darkgrey bg-cardgrey p-4 text-xs text-mist">
          <div className="flex items-center gap-2 text-paper"><MapPin className="h-4 w-4 text-orange" /> Field mode</div>
          <p className="mt-1">Built for a phone on site: status, client contact, site notes and before/progress/after photos in one screen.</p>
        </div>
      </div>
    </main>
  )
}
