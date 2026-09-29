import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { site, whatsappLink } from '@/lib/site'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: 'Track your job',
  robots: { index: false, follow: false, nocache: true },
}

const STEPS = [
  { key: 'scheduled', label: 'Booked' },
  { key: 'in_progress', label: 'In progress' },
  { key: 'completed', label: 'Completed' },
]

type Photo = { id: string; photo_url: string; type: string | null; caption: string | null }

export default async function TrackPage({ params }: { params: { token: string } }) {
  const token = params.token
  if (!/^[a-f0-9]{32,80}$/i.test(token)) notFound()

  let job: { id: string; title: string | null; status: string | null; scheduled_date: string | null; completed_date: string | null } | null = null
  let photos: Photo[] = []
  try {
    const db = supabaseAdmin()
    // Only non-personal columns are selected — never client name/phone/address.
    const { data } = await db
      .from('jobs')
      .select('id,title,status,scheduled_date,completed_date')
      .eq('tracker_token', token)
      .maybeSingle()
    job = data
    if (job) {
      const { data: ph } = await db
        .from('job_photos')
        .select('id,photo_url,type,caption')
        .eq('job_id', job.id)
        .order('sort_order', { ascending: true })
      photos = (ph as Photo[]) ?? []
    }
  } catch {
    notFound()
  }
  if (!job) notFound()

  const status = (job.status ?? 'scheduled').toLowerCase().replace(/[\s-]/g, '_')
  const idx = Math.max(0, STEPS.findIndex((s) => s.key === status))
  const fmt = (d: string | null) =>
    d ? new Date(d + 'T12:00:00').toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long' }) : null

  return (
    <main className="mx-auto max-w-xl px-4 py-10">
      <p className="text-xs uppercase tracking-wide text-mist">{site.name}</p>
      <h1 className="text-2xl font-bold mt-1">{job.title ?? 'Your job'}</h1>
      {fmt(job.completed_date) ? (
        <p className="mt-1 text-mist">Completed {fmt(job.completed_date)}</p>
      ) : (
        fmt(job.scheduled_date) && <p className="mt-1 text-mist">Scheduled for {fmt(job.scheduled_date)}</p>
      )}

      <ol className="mt-6 flex gap-2" aria-label="Job progress">
        {STEPS.map((s, i) => (
          <li key={s.key} className={`flex-1 rounded-lg border px-3 py-2 text-center text-sm font-semibold ${i <= idx ? 'bg-orange text-white border-orange' : 'border-[#E2E2DE] text-mist'}`}>
            {s.label}
          </li>
        ))}
      </ol>

      {photos.length > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold mb-3">Photos</h2>
          <div className="grid grid-cols-2 gap-2">
            {photos.map((p) => (
              // eslint-disable-next-line @next/next/no-img-element
              <figure key={p.id}>
                <img src={p.photo_url} alt={p.caption ?? p.type ?? 'Job photo'} loading="lazy" className="rounded-lg w-full aspect-square object-cover" />
                <figcaption className="text-xs text-mist mt-1 capitalize">{p.caption ?? p.type}</figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      <a href={whatsappLink(`Hi NextGen, question about my job: ${job.title ?? ''}`)} className="btn btn-wa mt-8 inline-block" target="_blank" rel="noreferrer">
        Questions? WhatsApp us
      </a>
    </main>
  )
}
