'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { supabase } from '@/lib/supabaseClient'
import { services } from '@/lib/services'
import { Trash2, Upload, Loader2, ArrowLeft } from 'lucide-react'

type Tab = 'hero' | 'homepage' | 'beforeafter' | 'gallery' | 'services'

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

// --- Landing slides ------------------------------------------------------------
// The slideshow at the top of the homepage. 12 active slides max (the database
// enforces this too). Hidden slides stay here but don't show on the site.

const MAX_SLIDES = 12

function HeroSlides() {
  const [rows, setRows] = useState<any[]>([])
  const [files, setFiles] = useState<FileList | null>(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  const load = async () => {
    const { data, error } = await supabase
      .from('hero_slides')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })
    if (error) setMsg(error.message)
    setRows(data ?? [])
  }
  useEffect(() => {
    load()
  }, [])

  const active = rows.filter((r) => r.is_active)
  const free = MAX_SLIDES - active.length

  const add = async () => {
    if (!files || files.length === 0) return setMsg('Choose one or more photos first.')
    const list = Array.from(files).slice(0, Math.max(free, 0))
    if (list.length === 0) return setMsg('Slideshow is full (12 of 12). Hide or delete a slide first.')
    setBusy(true)
    setMsg('')
    let done = 0
    try {
      const nextOrder = rows.reduce((m, r) => Math.max(m, r.sort_order ?? 0), -1) + 1
      for (const f of list) {
        setMsg(`Uploading ${done + 1} of ${list.length}...`)
        const url = await uploadToBucket('hero-slides', f)
        const name = f.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ')
        const { error } = await supabase.from('hero_slides').insert({
          image_url: url,
          alt_text: name || 'NextGen job',
          caption: null,
          sort_order: nextOrder + done,
          is_active: true,
        })
        if (error) throw error
        done++
      }
      const skipped = files.length - list.length
      setMsg(`${done} slide${done === 1 ? '' : 's'} added${skipped ? ` — ${skipped} skipped, slideshow is full` : ''}. Add captions below.`)
      setFiles(null)
    } catch (e: any) {
      setMsg(e.message ?? 'Upload failed.')
    } finally {
      setBusy(false)
      load()
    }
  }

  const update = async (id: string, patch: Record<string, any>) => {
    const { error } = await supabase.from('hero_slides').update(patch).eq('id', id)
    if (error) setMsg(error.message)
    load()
  }

  // Swap with the neighbour above/below, then renumber everything 0..n.
  const move = async (i: number, dir: -1 | 1) => {
    const j = i + dir
    if (j < 0 || j >= rows.length) return
    const next = [...rows]
    ;[next[i], next[j]] = [next[j], next[i]]
    setRows(next)
    await Promise.all(
      next.map((r, n) => (r.sort_order === n ? null : supabase.from('hero_slides').update({ sort_order: n }).eq('id', r.id))),
    )
    load()
  }

  const remove = async (id: string) => {
    if (!confirm('Delete this slide?')) return
    await supabase.from('hero_slides').delete().eq('id', id)
    load()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-gray-300">
          <span className="font-bold text-white">{active.length} of 12</span> slides live on the homepage
        </p>
        <a href="/" target="_blank" rel="noreferrer" className="text-xs text-orange font-semibold">
          View site &rarr;
        </a>
      </div>
      <div className="grid grid-cols-12 gap-1 mb-5" aria-hidden>
        {Array.from({ length: MAX_SLIDES }).map((_, i) => (
          <span key={i} className={`h-1.5 rounded-full ${i < active.length ? 'bg-[#8B1BF5]' : 'bg-gray-800'}`} />
        ))}
      </div>

      <div className="border border-gray-700 rounded-xl p-4 mb-6 bg-graphite">
        <Field label={`Add photos (you can pick several — ${Math.max(free, 0)} spot${free === 1 ? '' : 's'} left)`}>
          <input
            type="file"
            accept="image/*"
            multiple
            disabled={free <= 0}
            onChange={(e) => setFiles(e.target.files)}
            className="text-sm text-gray-300"
          />
        </Field>
        <p className="text-xs text-gray-500 mb-3">
          Landscape photos work best (wide, at least 1600px). Bright, full-colour job shots — solar arrays, finished
          paint, paving.
        </p>
        <button
          onClick={add}
          disabled={busy || free <= 0}
          className="bg-[#8B1BF5] text-white font-semibold px-5 py-2 rounded-full text-sm inline-flex items-center gap-2 disabled:opacity-50"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          Add to slideshow
        </button>
        {msg && <p className="text-sm mt-3 text-gray-300">{msg}</p>}
      </div>

      <div className="space-y-2">
        {rows.map((r, i) => (
          <div
            key={r.id}
            className={`flex items-start gap-3 border rounded-lg p-2 bg-graphite ${
              r.is_active ? 'border-gray-800' : 'border-gray-800 opacity-50'
            }`}
          >
            <div className="flex flex-col items-center gap-1 pt-1">
              <button onClick={() => move(i, -1)} disabled={i === 0} className="text-gray-400 disabled:opacity-20 text-xs px-1" aria-label="Move up">
                ▲
              </button>
              <span className="text-xs font-bold text-white w-5 text-center">{i + 1}</span>
              <button onClick={() => move(i, 1)} disabled={i === rows.length - 1} className="text-gray-400 disabled:opacity-20 text-xs px-1" aria-label="Move down">
                ▼
              </button>
            </div>
            <img src={r.image_url} alt="" className="w-24 h-16 object-cover rounded shrink-0" />
            <div className="flex-1 min-w-0 space-y-1">
              <input
                defaultValue={r.caption ?? ''}
                placeholder="Caption on the slide, e.g. 24-panel clean — Strand"
                onBlur={(e) => e.target.value !== (r.caption ?? '') && update(r.id, { caption: e.target.value.trim() || null })}
                className="w-full bg-jet border border-gray-700 rounded px-2 py-1 text-sm text-white"
              />
              <input
                defaultValue={r.alt_text ?? ''}
                placeholder="Alt text (SEO)"
                onBlur={(e) => e.target.value !== (r.alt_text ?? '') && update(r.id, { alt_text: e.target.value.trim() || 'NextGen job' })}
                className="w-full bg-jet border border-gray-800 rounded px-2 py-1 text-xs text-gray-400"
              />
            </div>
            <div className="flex flex-col items-end gap-1">
              <button
                onClick={() => update(r.id, { is_active: !r.is_active })}
                disabled={!r.is_active && free <= 0}
                className={`text-[11px] font-bold px-2 py-1 rounded-full disabled:opacity-40 ${
                  r.is_active ? 'bg-[#8B1BF5] text-white' : 'bg-gray-800 text-gray-300'
                }`}
              >
                {r.is_active ? 'Live' : 'Hidden'}
              </button>
              <button onClick={() => remove(r.id)} className="text-red-400 p-1" aria-label="Delete slide">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// --- Homepage photos (fixed spots) --------------------------------------------
// Each slot pins one photo to a fixed spot on the homepage. Stored in
// gallery_photos.slot; uploading a new photo retires the old one.

const SLOTS: { key: string; label: string; hint: string }[] = [
  { key: 'hero_solar', label: 'Orange solar tile', hint: 'Top of the page, next to “Purified-water soft wash”. Use a solar job photo.' },
  { key: 'hero_feature', label: 'Photo tile beside “One call. Twelve trades.”', hint: 'Shown in full colour. Portrait or square works best.' },
  { key: 'mission_left', label: 'Mission section — big photo', hint: 'Under “Your roof should earn, not rust.”' },
  { key: 'mission_right', label: 'Mission section — small photo', hint: 'Right-hand tile in the Mission section.' },
]

function HomepagePhotos() {
  const [current, setCurrent] = useState<Record<string, any>>({})
  const [captions, setCaptions] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState<string | null>(null)
  const [msg, setMsg] = useState('')

  const load = async () => {
    const { data } = await supabase
      .from('gallery_photos')
      .select('*')
      .eq('is_active', true)
      .in('slot', SLOTS.map((s) => s.key))
    const map: Record<string, any> = {}
    for (const r of data ?? []) map[r.slot] = r
    setCurrent(map)
  }
  useEffect(() => {
    load()
  }, [])

  const upload = async (slot: string, file: File) => {
    setBusy(slot)
    setMsg('')
    try {
      const url = await uploadToBucket('gallery-photos', file)
      // Retire the photo currently in this spot (only one live photo per slot).
      await supabase.from('gallery_photos').update({ is_active: false }).eq('slot', slot).eq('is_active', true)
      const { error } = await supabase.from('gallery_photos').insert({
        image_url: url,
        caption: captions[slot]?.trim() || null,
        service_slug: slot === 'hero_solar' ? 'solar-panel-cleaning' : null,
        slot,
        sort_order: 0,
        is_active: true,
      })
      if (error) throw error
      setCaptions((c) => ({ ...c, [slot]: '' }))
      setMsg('Photo is live on the homepage.')
      load()
    } catch (e: any) {
      setMsg(e.message ?? 'Upload failed.')
    } finally {
      setBusy(null)
    }
  }

  const saveCaption = async (row: any, caption: string) => {
    await supabase.from('gallery_photos').update({ caption: caption.trim() || null }).eq('id', row.id)
    load()
  }

  const clear = async (slot: string) => {
    setBusy(slot)
    await supabase.from('gallery_photos').update({ is_active: false }).eq('slot', slot).eq('is_active', true)
    setBusy(null)
    setMsg('Removed — that spot goes back to an auto-picked photo.')
    load()
  }

  return (
    <div>
      <p className="text-sm text-gray-400 mb-4">
        Pin your own photo to each spot. Empty spots use an auto-picked job photo.
      </p>
      {msg && <p className="text-sm mb-4 text-gray-300">{msg}</p>}
      <div className="grid sm:grid-cols-2 gap-3">
        {SLOTS.map((s) => {
          const row = current[s.key]
          const isBusy = busy === s.key
          return (
            <div key={s.key} className="border border-gray-800 rounded-xl p-3 bg-graphite flex flex-col gap-2">
              <p className="text-sm font-bold text-white">{s.label}</p>
              <p className="text-xs text-gray-500 -mt-1">{s.hint}</p>
              {row ? (
                <img src={row.image_url} alt="" className="w-full h-36 object-cover rounded" />
              ) : (
                <div className="w-full h-36 rounded bg-jet border border-dashed border-gray-700 flex items-center justify-center text-xs text-gray-500">
                  Auto-picked (no photo pinned)
                </div>
              )}
              {row ? (
                <input
                  defaultValue={row.caption ?? ''}
                  placeholder="Caption (optional)"
                  onBlur={(e) => e.target.value !== (row.caption ?? '') && saveCaption(row, e.target.value)}
                  className={inputCls}
                />
              ) : (
                <input
                  value={captions[s.key] ?? ''}
                  onChange={(e) => setCaptions((c) => ({ ...c, [s.key]: e.target.value }))}
                  placeholder="Caption (optional), e.g. Solar clean — Somerset West"
                  className={inputCls}
                />
              )}
              <div className="flex items-center gap-2">
                <label
                  className={`flex-1 bg-[#8B1BF5] text-white font-semibold px-3 py-2 rounded-full text-xs inline-flex items-center justify-center gap-1 cursor-pointer ${
                    isBusy ? 'opacity-50 pointer-events-none' : ''
                  }`}
                >
                  {isBusy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                  {row ? 'Replace photo' : 'Upload photo'}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      e.target.value = ''
                      if (f) upload(s.key, f)
                    }}
                  />
                </label>
                {row && (
                  <button onClick={() => clear(s.key)} disabled={isBusy} className="text-red-400 p-2" aria-label="Remove photo">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )
        })}
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
      .is('slot', null)
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
    { key: 'hero', label: 'Landing slides' },
    { key: 'homepage', label: 'Homepage photos' },
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
      {tab === 'homepage' && <HomepagePhotos />}
      {tab === 'beforeafter' && <BeforeAfter />}
      {tab === 'gallery' && <Gallery />}
      {tab === 'services' && <ServiceImages />}
    </main>
  )
}
