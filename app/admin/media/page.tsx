'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { supabase } from '@/lib/supabaseClient'
import { services } from '@/lib/services'
import { Trash2, Upload, Loader2, ArrowLeft } from 'lucide-react'

type Tab = 'hero' | 'beforeafter' | 'gallery' | 'services'

// --- helpers ---------------------------------------------------------------

async function uploadToBucket(bucket: string, file: File) {
  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  })
  if (error) throw error
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <label className="block mb-3">
      <span className="block text-xs font-semibold text-gray-400 mb-1">{label}</span>
      {children}
    </label>
  )
}

const inputCls =
  'w-full bg-jet border border-gray-700 rounded-lg px-3 py-2 text-sm text-white'

// --- Hero slides -------------------------------------------------------------

function HeroSlides() {
  const [rows, setRows] = useState<any[]>([])
  const [file, setFile] = useState<File | null>(null)
  const [alt, setAlt] = useState('')
  const [caption, setCaption] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  const load = async () => {
    const { data } = await supabase
      .from('hero_slides')
      .select('*')
      .order('sort_order', { ascending: true })
    setRows(data ?? [])
  }
  useEffect(() => {
    load()
  }, [])

  const add = async () => {
    if (!file) return setMsg('Choose an image first.')
    setBusy(true)
    setMsg('')
    try {
      const url = await uploadToBucket('hero-slides', file)
      const { error } = await supabase.from('hero_slides').insert({
        image_url: url,
        alt_text: alt || 'NGSMS',
        caption: caption || null,
        sort_order: rows.length,
      })
      if (error) throw error
      setFile(null)
      setAlt('')
      setCaption('')
      setMsg('Slide added.')
      load()
    } catch (e: any) {
      setMsg(e.message ?? 'Upload failed.')
    } finally {
      setBusy(false)
    }
  }

  const remove = async (id: string) => {
    await supabase.from('hero_slides').delete().eq('id', id)
    load()
  }

  return (
    <div>
      <p className="text-sm text-gray-400 mb-4">
        {rows.length} of 12 slides. Order is set by the number in each row.
      </p>

      <div className="border border-gray-700 rounded-xl p-4 mb-6 bg-graphite">
        <Field label="Image">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="text-sm text-gray-300"
          />
        </Field>
        <Field label="Alt text (for accessibility & SEO)">
          <input
            className={inputCls}
            value={alt}
            onChange={(e) => setAlt(e.target.value)}
            placeholder="Solar panel clean in Strand"
          />
        </Field>
        <Field label="Caption (optional, shows on the slide)">
          <input
            className={inputCls}
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
          />
        </Field>
        <button
          onClick={add}
          disabled={busy}
          className="bg-orange text-white font-semibold px-5 py-2 rounded-full text-sm inline-flex items-center gap-2 disabled:opacity-50"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          Add slide
        </button>
        {msg && <p className="text-sm mt-3 text-gray-300">{msg}</p>}
      </div>

      <div className="space-y-2">
        {rows.map((r) => (
          <div
            key={r.id}
            className="flex items-center gap-3 border border-gray-800 rounded-lg p-2 bg-graphite"
          >
            <img src={r.image_url} alt="" className="w-20 h-14 object-cover rounded" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white truncate">{r.alt_text}</p>
              <p className="text-xs text-gray-500 truncate">{r.caption}</p>
            </div>
            <input
              type="number"
              defaultValue={r.sort_order}
              onBlur={async (e) => {
                await supabase
                  .from('hero_slides')
                  .update({ sort_order: Number(e.target.value) })
                  .eq('id', r.id)
                load()
              }}
              className="w-14 bg-jet border border-gray-700 rounded px-2 py-1 text-sm text-white"
            />
            <button onClick={() => remove(r.id)} className="text-red-400 p-2">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

// --- Before / After ----------------------------------------------------------

function BeforeAfter() {
  const [rows, setRows] = useState<any[]>([])
  const [before, setBefore] = useState<File | null>(null)
  const [after, setAfter] = useState<File | null>(null)
  const [location, setLocation] = useState('')
  const [slug, setSlug] = useState('solar-panel-cleaning')
  const [caption, setCaption] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  const load = async () => {
    const { data } = await supabase
      .from('before_after_photos')
      .select('*')
      .order('created_at', { ascending: false })
    setRows(data ?? [])
  }
  useEffect(() => {
    load()
  }, [])

  const add = async () => {
    if (!before || !after) return setMsg('Both a before and an after photo are required.')
    if (!location.trim()) return setMsg('Location is required.')
    setBusy(true)
    setMsg('')
    try {
      const [bUrl, aUrl] = await Promise.all([
        uploadToBucket('before-after-photos', before),
        uploadToBucket('before-after-photos', after),
      ])
      const { error } = await supabase.from('before_after_photos').insert({
        before_image_url: bUrl,
        after_image_url: aUrl,
        location: location.trim(),
        service_slug: slug,
        caption: caption || null,
        sort_order: rows.length,
      })
      if (error) throw error
      setBefore(null)
      setAfter(null)
      setLocation('')
      setCaption('')
      setMsg('Before/after pair added.')
      load()
    } catch (e: any) {
      setMsg(e.message ?? 'Upload failed.')
    } finally {
      setBusy(false)
    }
  }

  const remove = async (id: string) => {
    await supabase.from('before_after_photos').delete().eq('id', id)
    load()
  }

  return (
    <div>
      <div className="border border-gray-700 rounded-xl p-4 mb-6 bg-graphite">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Before photo">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setBefore(e.target.files?.[0] ?? null)}
              className="text-sm text-gray-300"
            />
          </Field>
          <Field label="After photo">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setAfter(e.target.files?.[0] ?? null)}
              className="text-sm text-gray-300"
            />
          </Field>
        </div>
        <Field label="Location (required)">
          <input
            className={inputCls}
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Somerset West"
          />
        </Field>
        <Field label="Service">
          <select
            className={inputCls}
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
          >
            {services.map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Description">
          <textarea
            className={inputCls}
            rows={2}
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="24-panel system, heavy salt build-up removed"
          />
        </Field>
        <button
          onClick={add}
          disabled={busy}
          className="bg-orange text-white font-semibold px-5 py-2 rounded-full text-sm inline-flex items-center gap-2 disabled:opacity-50"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          Add pair
        </button>
        {msg && <p className="text-sm mt-3 text-gray-300">{msg}</p>}
      </div>

      <div className="space-y-2">
        {rows.map((r) => (
          <div
            key={r.id}
            className="flex items-center gap-3 border border-gray-800 rounded-lg p-2 bg-graphite"
          >
            <div className="flex gap-1">
              <img src={r.before_image_url} alt="" className="w-16 h-12 object-cover rounded" />
              <img src={r.after_image_url} alt="" className="w-16 h-12 object-cover rounded" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white truncate">{r.location}</p>
              <p className="text-xs text-gray-500 truncate">{r.caption}</p>
            </div>
            <button onClick={() => remove(r.id)} className="text-red-400 p-2">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

// --- Gallery bulk import -------------------------------------------------------

function Gallery() {
  const [rows, setRows] = useState<any[]>([])
  const [files, setFiles] = useState<FileList | null>(null)
  const [slug, setSlug] = useState('')
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState('')

  const load = async () => {
    const { data } = await supabase
      .from('gallery_photos')
      .select('*')
      .order('created_at', { ascending: false })
    setRows(data ?? [])
  }
  useEffect(() => {
    load()
  }, [])

  const bulkAdd = async () => {
    if (!files || files.length === 0) return setProgress('Choose some images first.')
    setBusy(true)
    const list = Array.from(files)
    let done = 0
    let failed = 0

    for (const f of list) {
      setProgress(`Uploading ${done + failed + 1} of ${list.length}...`)
      try {
        const url = await uploadToBucket('gallery-photos', f)
        const { error } = await supabase.from('gallery_photos').insert({
          image_url: url,
          caption: f.name.replace(/\.[^.]+$/, ''),
          service_slug: slug || null,
          sort_order: rows.length + done,
        })
        if (error) throw error
        done++
      } catch {
        failed++
      }
    }

    setProgress(`Done — ${done} uploaded${failed ? `, ${failed} failed` : ''}.`)
    setFiles(null)
    setBusy(false)
    load()
  }

  const remove = async (id: string) => {
    await supabase.from('gallery_photos').delete().eq('id', id)
    load()
  }

  return (
    <div>
      <div className="border border-gray-700 rounded-xl p-4 mb-6 bg-graphite">
        <Field label="Select multiple images">
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => setFiles(e.target.files)}
            className="text-sm text-gray-300"
          />
        </Field>
        <Field label="Tag all with a service (optional)">
          <select className={inputCls} value={slug} onChange={(e) => setSlug(e.target.value)}>
            <option value="">No service tag</option>
            {services.map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.name}
              </option>
            ))}
          </select>
        </Field>
        <p className="text-xs text-gray-500 mb-3">
          Captions default to the filename — rename files before uploading for tidy captions,
          or edit them afterwards.
        </p>
        <button
          onClick={bulkAdd}
          disabled={busy}
          className="bg-orange text-white font-semibold px-5 py-2 rounded-full text-sm inline-flex items-center gap-2 disabled:opacity-50"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          Import {files?.length ? `${files.length} photos` : 'photos'}
        </button>
        {progress && <p className="text-sm mt-3 text-gray-300">{progress}</p>}
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {rows.map((r) => (
          <div key={r.id} className="relative group">
            <img src={r.image_url} alt="" className="w-full h-24 object-cover rounded" />
            <button
              onClick={() => remove(r.id)}
              className="absolute top-1 right-1 bg-black/70 text-red-400 p-1 rounded"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

// --- Service images ------------------------------------------------------------
// One photo per service card on /services. Stored in services.hero_image.

function ServiceImages() {
  const [images, setImages] = useState<Record<string, string | null>>({})
  const [busySlug, setBusySlug] = useState<string | null>(null)
  const [msg, setMsg] = useState('')

  const load = async () => {
    const { data } = await supabase.from('services').select('slug, hero_image')
    const map: Record<string, string | null> = {}
    for (const r of data ?? []) map[r.slug] = r.hero_image
    setImages(map)
  }
  useEffect(() => {
    load()
  }, [])

  const setImage = async (slug: string, url: string | null) => {
    const { data, error } = await supabase
      .from('services')
      .update({ hero_image: url })
      .eq('slug', slug)
      .select('slug')
    if (error) throw error
    if (!data || data.length === 0) throw new Error(`Service "${slug}" not found in the database.`)
  }

  const upload = async (slug: string, file: File) => {
    setBusySlug(slug)
    setMsg('')
    try {
      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `services/${slug}-${Date.now()}.${ext}`
      const { error } = await supabase.storage
        .from('site-media')
        .upload(path, file, { cacheControl: '3600', upsert: false })
      if (error) throw error
      const { data } = supabase.storage.from('site-media').getPublicUrl(path)
      await setImage(slug, data.publicUrl)
      setMsg('Image updated — live on the Services page within a minute.')
      load()
    } catch (e: any) {
      setMsg(e.message ?? 'Upload failed.')
    } finally {
      setBusySlug(null)
    }
  }

  const clear = async (slug: string) => {
    setBusySlug(slug)
    setMsg('')
    try {
      await setImage(slug, null)
      setMsg('Image removed.')
      load()
    } catch (e: any) {
      setMsg(e.message ?? 'Could not remove image.')
    } finally {
      setBusySlug(null)
    }
  }

  return (
    <div>
      <p className="text-sm text-gray-400 mb-4">
        The photo on each service card on the Services page. Landscape photos work best
        (they&apos;re cropped to 16:10).
      </p>
      {msg && <p className="text-sm mb-4 text-gray-300">{msg}</p>}

      <div className="space-y-2">
        {services.map((s) => {
          const url = images[s.slug]
          const busy = busySlug === s.slug
          return (
            <div
              key={s.slug}
              className="flex items-center gap-3 border border-gray-800 rounded-lg p-2 bg-graphite"
            >
              {url ? (
                <img src={url} alt="" className="w-24 h-16 object-cover rounded" />
              ) : (
                <div className="w-24 h-16 rounded bg-jet border border-dashed border-gray-700 flex items-center justify-center text-[10px] text-gray-500">
                  No image
                </div>
              )}
              <p className="flex-1 min-w-0 text-sm text-white truncate">{s.name}</p>
              <label
                className={`bg-orange text-white font-semibold px-3 py-1.5 rounded-full text-xs inline-flex items-center gap-1 cursor-pointer ${
                  busy ? 'opacity-50 pointer-events-none' : ''
                }`}
              >
                {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                {url ? 'Replace' : 'Upload'}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    e.target.value = ''
                    if (f) upload(s.slug, f)
                  }}
                />
              </label>
              {url && (
                <button
                  onClick={() => clear(s.slug)}
                  disabled={busy}
                  className="text-red-400 p-2 disabled:opacity-50"
                  aria-label={`Remove ${s.name} image`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// --- Page --------------------------------------------------------------------

export default function AdminMediaPage() {
  const { session, checking } = useAdminAuth()
  const [tab, setTab] = useState<Tab>('hero')

  if (checking) {
    return (
      <main className="min-h-[60vh] flex items-center justify-center bg-jet">
        <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
      </main>
    )
  }

  if (!session) {
    return (
      <main className="min-h-[60vh] flex flex-col items-center justify-center bg-jet px-4 text-center">
        <p className="text-white font-bold mb-2">Staff sign-in required</p>
        <Link href="/admin" className="text-orange font-semibold">
          Go to login &rarr;
        </Link>
      </main>
    )
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'hero', label: 'Hero slides' },
    { key: 'beforeafter', label: 'Before / After' },
    { key: 'gallery', label: 'Gallery' },
    { key: 'services', label: 'Service images' },
  ]

  return (
    <main className="max-w-3xl mx-auto px-4 py-8 bg-jet min-h-screen">
      <Link
        href="/admin"
        className="text-sm text-gray-400 hover:text-white inline-flex items-center gap-1 mb-4"
      >
        <ArrowLeft className="w-4 h-4" /> Dashboard
      </Link>

      <h1 className="text-2xl font-black mb-6 text-white">Media</h1>

      <div className="flex gap-2 mb-6 border-b border-gray-800 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px transition whitespace-nowrap ${
              tab === t.key
                ? 'border-orange text-orange'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'hero' && <HeroSlides />}
      {tab === 'beforeafter' && <BeforeAfter />}
      {tab === 'gallery' && <Gallery />}
      {tab === 'services' && <ServiceImages />}
    </main>
  )
}
