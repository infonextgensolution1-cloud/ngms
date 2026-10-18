'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { supabase } from '@/lib/supabaseClient'
import { services } from '@/lib/services'
import { Trash2, Upload, Loader2, ArrowLeft } from 'lucide-react'
import BeforeAfterUploader from '@/components/admin/BeforeAfterUploader'

type Tab = 'hero' | 'homepage' | 'beforeafter' | 'gallery' | 'services' | 'branded' | 'maintenance'

// --- helpers ---------------------------------------------------------------

async function uploadToBucket(bucket: string, file: File) {
  const { data: authData, error: authError } = await supabase.auth.getSession()
  if (authError || !authData.session) {
    throw new Error(`Staff session check failed: ${authError?.message ?? 'no authenticated session'}. Sign in again and retry.`)
  }
  const { data: staff, error: staffError } = await supabase
    .from('prompt_users')
    .select('user_id, active')
    .eq('user_id', authData.session.user.id)
    .eq('active', true)
    .maybeSingle()
  if (staffError) {
    throw new Error(`Could not verify this account in the NGMS staff registry: ${staffError.message} (code: ${staffError.code ?? 'unknown'}).`)
  }
  if (!staff) {
    throw new Error('This signed-in account is not listed as an active NGMS staff user. Ask an administrator to verify its prompt_users record before uploading.')
  }
  if (!file.type.startsWith('image/')) throw new Error(`"${file.name}" is not an image file.`)
  if (file.size > 15 * 1024 * 1024) throw new Error(`"${file.name}" exceeds the 15 MB upload limit.`)
  const rawExt = file.name.split('.').pop() ?? 'jpg'
  const ext = rawExt.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg'
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type,
  })
  if (error) throw new Error(`Storage upload failed (${bucket}): ${error.message}`)
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  if (!data.publicUrl) throw new Error(`Storage upload succeeded but no public URL was returned for ${path}.`)
  return { url: data.publicUrl, path }
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
  const [storedFiles, setStoredFiles] = useState<any[]>([])
  const [scanningStorage, setScanningStorage] = useState(false)
  const [recoveringPath, setRecoveringPath] = useState<string | null>(null)

  const load = async () => {
    const { data, error } = await supabase
      .from('hero_slides')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })
    if (error) {
      setMsg(`Could not load slideshow records: ${error.message} (code: ${error.code ?? 'unknown'}).`)
      return
    }
    setRows(data ?? [])
  }

  const scanStoredFiles = async () => {
    setScanningStorage(true)
    setMsg('')
    try {
      const { data, error } = await supabase.storage.from('hero-slides').list('', {
        limit: 100,
        sortBy: { column: 'created_at', order: 'desc' },
      })
      if (error) throw new Error(`Could not list hero-slides storage: ${error.message}`)
      const files = (data ?? []).filter((item) => item.id && item.name && !item.name.startsWith('.'))
      setStoredFiles(files)
      setMsg(`Storage scan complete: ${files.length} stored file(s) found. Files are not published automatically.`)
    } catch (e: any) {
      setMsg(e?.message ?? 'Storage scan failed.')
    } finally {
      setScanningStorage(false)
    }
  }

  const restoreAsHidden = async (file: any) => {
    setRecoveringPath(file.name)
    setMsg('')
    try {
      const publicUrl = supabase.storage.from('hero-slides').getPublicUrl(file.name).data.publicUrl
      if (!publicUrl) throw new Error('Supabase did not return a public URL for this stored file.')
      if (rows.some((row) => row.image_url === publicUrl)) throw new Error('This file is already linked to a slideshow record.')
      const name = file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ')
      const { error } = await supabase.from('hero_slides').insert({
        image_url: publicUrl,
        alt_text: name || 'Recovered NGMS job photo',
        caption: null,
        sort_order: rows.reduce((max, row) => Math.max(max, row.sort_order ?? 0), -1) + 1,
        is_active: false,
      })
      if (error) throw new Error(`File is stored, but its hidden slide record could not be created: ${error.message} (code: ${error.code ?? 'unknown'}).`)
      setMsg(`Recovered "${file.name}" as a hidden slide. Review it and choose Live when ready.`)
      await load()
    } catch (e: any) {
      setMsg(e?.message ?? 'Could not recover this stored photo.')
    } finally {
      setRecoveringPath(null)
    }
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
        const uploaded = await uploadToBucket('hero-slides', f)
        const name = f.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ')
        const { error } = await supabase.from('hero_slides').insert({
          image_url: uploaded.url,
          alt_text: name || 'NextGen job',
          caption: null,
          sort_order: nextOrder + done,
          is_active: true,
        })
        if (error) throw new Error(`Database insert failed for "${f.name}" after Storage upload (${uploaded.path}): ${error.message} (code: ${error.code ?? 'unknown'}). The stored file was retained for recovery.`)
        done++
      }
      const skipped = files.length - list.length
      setMsg(`${done} slide${done === 1 ? '' : 's'} added${skipped ? ` — ${skipped} skipped, slideshow is full` : ''}. Add captions below.`)
      setFiles(null)
    } catch (e: any) {
      setMsg(e?.message ?? 'Upload failed for an unknown reason.')
    } finally {
      setBusy(false)
      await load()
    }
  }

  const update = async (id: string, patch: Record<string, any>) => {
    const { error } = await supabase.from('hero_slides').update(patch).eq('id', id)
    if (error) setMsg(`Could not update slide: ${error.message} (code: ${error.code ?? 'unknown'}).`)
    else setMsg('Slide updated.')
    await load()
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
    const { error } = await supabase.from('hero_slides').delete().eq('id', id)
    if (error) setMsg(`Could not delete slide record: ${error.message} (code: ${error.code ?? 'unknown'}). The stored file was not deleted.`)
    else setMsg('Slide record deleted. The stored file was retained.')
    await load()
  }

  return (
    <div>
      <div className="mb-4 border-l-2 border-[#FF5A00] bg-[#202020] px-4 py-3">
        <p className="text-sm font-bold text-white">Main landing-page hero background</p>
        <p className="mt-1 text-xs leading-relaxed text-gray-300">Photos uploaded here appear only inside the framed image panel on the right side of the homepage hero. They do not become full-page backgrounds or populate other sections. Add up to 12 real NGMS project photos; active slides rotate inside that panel.</p>
      </div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-gray-300">
          <span className="font-bold text-white">{active.length} of 12</span> hero background slides live on the homepage
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

      <section className="mb-6 rounded-xl border border-gray-700 bg-graphite p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-bold text-white">Recover stored photos</h2>
            <p className="mt-1 text-xs text-gray-400">Scan the existing hero-slides bucket for files left after slide records were deleted. Recovered slides start hidden and are never published automatically.</p>
          </div>
          <button type="button" onClick={scanStoredFiles} disabled={scanningStorage} className="rounded bg-gray-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">
            {scanningStorage ? 'Scanning storage…' : 'Scan stored photos'}
          </button>
        </div>
        {storedFiles.length > 0 && (
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {storedFiles.map((file) => {
              const url = supabase.storage.from('hero-slides').getPublicUrl(file.name).data.publicUrl
              const linked = rows.some((row) => row.image_url === url)
              return (
                <article key={file.id ?? file.name} className="flex min-w-0 gap-3 rounded border border-gray-700 p-2">
                  <img src={url} alt="" loading="lazy" className="h-20 w-28 shrink-0 rounded object-cover bg-jet" />
                  <div className="min-w-0 flex-1">
                    <p className="break-all text-xs text-gray-200">{file.name}</p>
                    <p className="mt-1 text-xs text-gray-500">{file.metadata?.size ? `${Math.round(file.metadata.size / 1024)} KB` : 'Stored file'}</p>
                    <button type="button" disabled={linked || recoveringPath !== null} onClick={() => restoreAsHidden(file)} className="mt-2 rounded bg-gray-700 px-2 py-1 text-xs font-semibold text-white disabled:opacity-40">
                      {recoveringPath === file.name ? 'Restoring…' : linked ? 'Already linked' : 'Restore as hidden'}
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>

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
  { key: 'hero_solar', label: 'Homepage solar section photo', hint: 'Shown only in the solar feature section on the homepage. Landscape job photo recommended.' },
  { key: 'solar_service_feature', label: 'Solar service photo — right-hand feature block', hint: 'Upload the photo shown only in the right-hand block on Services → Solar Panel Cleaning. The page overlays “HELDERBERG BASIN / WESTERN CAPE” and “CLEAN ENERGY. CLEAR RESULTS.” on this photo. Use a sharp landscape image; this slot never feeds the homepage hero or general gallery.' },
  { key: 'hero_feature', label: 'Body corporate section photo', hint: 'Beside “One contractor for the whole complex”. Landscape (4:3) works best.' },
  { key: 'mission_left', label: 'Why NextGen photo', hint: 'Beside “Maintenance you don’t have to chase”. Portrait works best.' },
  { key: 'mission_right', label: 'Closing call-to-action background', hint: 'Behind “Tell us what needs doing” at the bottom of the homepage. Landscape; it is darkened.' },
]

function HomepagePhotos() {
  const [current, setCurrent] = useState<Record<string, any>>({})
  const [captions, setCaptions] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState<string | null>(null)
  const [msg, setMsg] = useState('')

  const load = async () => {
    const { data, error } = await supabase
      .from('gallery_photos')
      .select('*')
      .eq('is_active', true)
      .in('slot', SLOTS.map((s) => s.key))
    if (error) {
      setMsg(`Could not load homepage photo slots: ${error.message} (code: ${error.code ?? 'unknown'}).`)
      return
    }
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
      const uploaded = await uploadToBucket('gallery-photos', file)
      // Save the replacement first so a failed insert never deactivates the current photo.
      const { data: newRow, error } = await supabase.from('gallery_photos').insert({
        image_url: uploaded.url,
        caption: captions[slot]?.trim() || null,
        service_slug: slot === 'hero_solar' || slot === 'solar_service_feature' ? 'solar-panel-cleaning' : null,
        slot,
        sort_order: 0,
        is_active: true,
      }).select('id').single()
      if (error) throw new Error(`Storage upload succeeded (${uploaded.path}), but the homepage photo record could not be saved: ${error.message} (code: ${error.code ?? 'unknown'}). The file was retained for recovery.`)
      const retire = await supabase.from('gallery_photos').update({ is_active: false }).eq('slot', slot).eq('is_active', true).neq('id', newRow.id)
      setCaptions((c) => ({ ...c, [slot]: '' }))
      setMsg(retire.error
        ? `New photo saved and active, but an older photo could not be retired: ${retire.error.message} (code: ${retire.error.code ?? 'unknown'}).`
        : 'Photo saved to its designated section.')
      await load()
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
    setMsg('')
    try {
      const { error } = await supabase.from('gallery_photos').update({ is_active: false }).eq('slot', slot).eq('is_active', true)
      if (error) throw new Error(`Could not deactivate homepage photo: ${error.message} (code: ${error.code ?? 'unknown'}).`)
      setMsg('Photo deactivated. The stored file was retained.')
      await load()
    } catch (e: any) {
      setMsg(e?.message ?? 'Could not remove homepage photo.')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div>
      <p className="text-sm text-gray-400 mb-4">
        Assign one photo to each specific section. Empty slots stay empty; photos are never auto-borrowed from the general gallery or hero slideshow.
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
  return <BeforeAfterUploader />
}

// --- Gallery bulk import -------------------------------------------------------

function Gallery() {
  const [rows, setRows] = useState<any[]>([])
  const [files, setFiles] = useState<FileList | null>(null)
  const [slug, setSlug] = useState('')
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState('')

  const load = async () => {
    const { data, error } = await supabase
      .from('gallery_photos')
      .select('*')
      .is('slot', null)
      .order('created_at', { ascending: false })
    if (error) {
      setProgress(`Could not load gallery records: ${error.message} (code: ${error.code ?? 'unknown'}).`)
      return
    }
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
        const uploaded = await uploadToBucket('gallery-photos', f)
        const { error } = await supabase.from('gallery_photos').insert({
          image_url: uploaded.url,
          caption: f.name.replace(/\.[^.]+$/, ''),
          service_slug: slug || null,
          sort_order: rows.length + done,
        })
        if (error) throw error
        done++
      } catch (e: any) {
        failed++
        setProgress(`Upload ${done + failed} failed: ${e?.message ?? 'Unknown error'}`)
      }
    }

    setProgress(`Done — ${done} uploaded${failed ? `, ${failed} failed (see last error above)` : ''}.`)
    setFiles(null)
    setBusy(false)
    load()
  }

  const remove = async (id: string) => {
    const { error } = await supabase.from('gallery_photos').delete().eq('id', id)
    if (error) setProgress(`Could not delete gallery record: ${error.message} (code: ${error.code ?? 'unknown'}).`)
    else setProgress('Gallery record removed. Storage file retained.')
    await load()
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

// --- Branded project publisher --------------------------------------------------
// Creates a branded copy of the uploaded photo, then links it to the chosen service
// card and public gallery. The original local file is not modified.

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new window.Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Could not load the photo or NGMS logo for branding.'))
    image.src = src
  })
}

async function createBrandedPhoto(file: File, serviceName: string): Promise<File> {
  const sourceUrl = URL.createObjectURL(file)
  try {
    const [photo, logo] = await Promise.all([loadImage(sourceUrl), loadImage('/logo.png')])
    const canvas = document.createElement('canvas')
    const maxDimension = 2400
    const scale = Math.min(1, maxDimension / Math.max(photo.naturalWidth, photo.naturalHeight))
    canvas.width = Math.max(1, Math.round(photo.naturalWidth * scale))
    canvas.height = Math.max(1, Math.round(photo.naturalHeight * scale))
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Your browser could not prepare the branded photo.')
    ctx.drawImage(photo, 0, 0, canvas.width, canvas.height)

    const minSide = Math.min(canvas.width, canvas.height)
    const margin = Math.round(minSide * 0.035)
    const panelHeight = Math.round(minSide * 0.13)
    const logoWidth = Math.min(Math.round(canvas.width * 0.2), Math.round(panelHeight * 1.75))
    const logoHeight = Math.round(panelHeight * 0.78)
    const radius = Math.round(panelHeight * 0.18)

    ctx.save()
    ctx.fillStyle = 'rgba(12, 12, 12, 0.74)'
    ctx.beginPath()
    ctx.roundRect(margin, canvas.height - panelHeight - margin, logoWidth + margin, panelHeight, radius)
    ctx.fill()
    ctx.drawImage(
      logo,
      margin + Math.round(margin * 0.45),
      canvas.height - panelHeight - margin + Math.round((panelHeight - logoHeight) / 2),
      logoWidth,
      logoHeight,
    )
    ctx.restore()

    const label = ('NEXTGEN ' + serviceName).toLocaleUpperCase().slice(0, 48)
    const fontSize = Math.max(14, Math.round(minSide * 0.035))
    ctx.save()
    ctx.font = '700 ' + fontSize + 'px Arial, sans-serif'
    const textWidth = ctx.measureText(label).width
    const tagPadX = Math.round(fontSize * 0.75)
    const tagPadY = Math.round(fontSize * 0.55)
    const tagWidth = Math.min(canvas.width - margin * 2, textWidth + tagPadX * 2 + fontSize * 0.8)
    const tagHeight = fontSize + tagPadY * 2
    const tagX = canvas.width - margin - tagWidth
    const tagY = canvas.height - margin - tagHeight
    ctx.fillStyle = 'rgba(12, 12, 12, 0.76)'
    ctx.beginPath()
    ctx.roundRect(tagX, tagY, tagWidth, tagHeight, Math.round(fontSize * 0.25))
    ctx.fill()
    ctx.fillStyle = '#FF6A00'
    ctx.beginPath()
    ctx.arc(tagX + tagPadX + fontSize * 0.25, tagY + tagHeight / 2, Math.max(3, fontSize * 0.16), 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#FFFFFF'
    ctx.textBaseline = 'middle'
    const maxTextWidth = tagWidth - tagPadX * 2 - fontSize * 0.6
    let displayLabel = label
    while (ctx.measureText(displayLabel).width > maxTextWidth && displayLabel.length > 10) {
      displayLabel = displayLabel.slice(0, -4) + '…'
    }
    ctx.fillText(displayLabel, tagX + tagPadX + fontSize * 0.55, tagY + tagHeight / 2, maxTextWidth)
    ctx.restore()

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((value) => value ? resolve(value) : reject(new Error('Could not export the branded photo.')), 'image/jpeg', 0.9)
    })
    const baseName = file.name.replace(/\.[^.]+$/, '').replace(/[^a-z0-9-_]+/gi, '-').slice(0, 70) || 'ngms-project'
    return new File([blob], baseName + '-ngms-branded.jpg', { type: 'image/jpeg', lastModified: Date.now() })
  } finally {
    URL.revokeObjectURL(sourceUrl)
  }
}

function BrandedProjectPublisher() {
  const [slug, setSlug] = useState('plumbing')
  const [description, setDescription] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const selectedService = services.find((service) => service.slug === slug)

  useEffect(() => {
    if (!file) {
      setPreviewUrl('')
      return
    }
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const publish = async () => {
    if (!selectedService) return setMsg('Choose a service before publishing.')
    if (!file) return setMsg('Choose a project photo first.')
    if (!description.trim()) return setMsg('Add a short, accurate project description before publishing.')
    if (!file.type.startsWith('image/')) return setMsg('Choose a supported image file.')
    if (file.size > 15 * 1024 * 1024) return setMsg('The original photo must be 15 MB or smaller.')
    setBusy(true)
    setMsg('Preparing your branded project photo…')
    try {
      const brandedFile = await createBrandedPhoto(file, selectedService.name)
      const uploaded = await uploadToBucket('gallery-photos', brandedFile)
      const { data: serviceRows, error: serviceReadError } = await supabase
        .from('services').select('slug').eq('slug', selectedService.slug).limit(1)
      if (serviceReadError) throw new Error('Could not verify the service record: ' + serviceReadError.message)
      if (!serviceRows?.length) throw new Error('The service "' + selectedService.name + '" is not present in the services database. The branded photo was uploaded to Storage but has not been published; recover it from the gallery bucket.')

      const { data: galleryRow, error: galleryError } = await supabase
        .from('gallery_photos')
        .insert({
          image_url: uploaded.url,
          caption: description.trim(),
          service_slug: selectedService.slug,
          slot: null,
          is_active: true,
          sort_order: 0,
        })
        .select('id')
        .single()
      if (galleryError) throw new Error('Photo uploaded to Storage (' + uploaded.path + '), but the gallery record could not be created: ' + galleryError.message + '. The file was retained for recovery.')

      const { error: serviceUpdateError } = await supabase
        .from('services').update({ hero_image: uploaded.url }).eq('slug', selectedService.slug)
      if (serviceUpdateError) {
        setMsg('Gallery photo is published (record ' + galleryRow.id + '), but the service-card image could not be updated: ' + serviceUpdateError.message + '. Retry the Service images tab.')
        return
      }

      setMsg('Published: ' + selectedService.name + '. The branded photo is in the public gallery and is now the image for that service card. The description is saved as the photo caption.')
      setFile(null)
      setDescription('')
      const picker = document.getElementById('ngms-branded-project-file') as HTMLInputElement | null
      if (picker) picker.value = ''
    } catch (e: any) {
      setMsg(e?.message ?? 'Could not publish the branded project photo.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-lg font-black text-white">Publish a branded service photo</h2>
        <p className="mt-1 text-sm leading-relaxed text-gray-400">Upload a real NGMS project photo, choose the service, and add a short description. NGMS logo and service label are embedded into the published image in the style of your reference photo.</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <div className="space-y-4 rounded-xl border border-gray-700 bg-graphite p-4">
          <Field label="Service">
            <select value={slug} onChange={(e) => setSlug(e.target.value)} className={inputCls}>
              {services.map((service) => <option key={service.slug} value={service.slug}>{service.name}</option>)}
            </select>
          </Field>
          <Field label="Project description (shown on the website)">
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} maxLength={400} required placeholder="e.g. Downpipe and drainage maintenance completed at a Helderberg property." className={inputCls} />
          </Field>
          <Field label="Upload project photo">
            <input id="ngms-branded-project-file" type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="block w-full text-sm text-gray-300 file:mr-3 file:border-0 file:bg-orange file:px-3 file:py-2 file:font-bold file:text-white" />
          </Field>
          <p className="text-xs leading-relaxed text-gray-500">Original photo limit: 15 MB. A branded JPEG copy (max 2400px) is created for publishing. The original local file is not changed. Publishing updates the chosen service card image and adds the photo and description to the public gallery.</p>
          <button type="button" onClick={publish} disabled={busy || !file || !description.trim()} className="inline-flex items-center gap-2 bg-orange px-4 py-3 text-sm font-black uppercase text-white disabled:cursor-not-allowed disabled:opacity-50">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {busy ? 'Preparing & publishing…' : 'Brand & publish photo'}
          </button>
          {msg && <p role="status" aria-live="polite" className="text-sm leading-relaxed text-gray-200">{msg}</p>}
        </div>
        <div className="rounded-xl border border-gray-700 bg-graphite p-4">
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-400">Photo preview</p>
          {previewUrl ? (
            <div className="relative overflow-hidden bg-jet">
              <img src={previewUrl} alt={'Preview of ' + (selectedService?.name ?? 'service') + ' project photo'} className="block h-auto max-h-[480px] w-full object-contain" />
              <div className="absolute bottom-3 left-3 flex max-w-[42%] items-center rounded-lg bg-black/75 p-2">
                <img src="/logo.png" alt="NextGen Maintenance Solutions logo" className="max-h-12 max-w-full object-contain" />
              </div>
              <div className="absolute bottom-3 right-3 max-w-[54%] rounded bg-black/75 px-3 py-2 text-[10px] font-black uppercase text-white">
                <span className="mr-1 text-orange">●</span>NEXTGEN {selectedService?.name}
              </div>
            </div>
          ) : (
            <div className="flex min-h-64 items-center justify-center border border-dashed border-gray-700 text-sm text-gray-500">Choose a photo to preview the layout.</div>
          )}
          <p className="mt-3 text-xs text-gray-500">Preview shows the proposed corner placements. The published JPEG contains the logo and label, so the branding remains visible when downloaded or shared.</p>
        </div>
      </div>
    </section>
  )
}

// --- Maintenance page project photos -------------------------------------------
const MAINTENANCE_PHOTO_SLOTS = [
  { slot: 'maintenance_high_pressure', label: 'High-pressure cleaning', help: 'Communal walkways, entrances, parking and exterior cleaning.' },
  { slot: 'maintenance_painting', label: 'Painting & maintenance', help: 'Real completed painting, repairs and shared-property upkeep.' },
  { slot: 'maintenance_paving', label: 'Paving & repairs', help: 'Real paving, paths, entrances and outdoor repair projects.' },
]

function MaintenanceProjectPhotos() {
  const [rows, setRows] = useState<Record<string, any>>({})
  const [busySlot, setBusySlot] = useState<string | null>(null)
  const [msg, setMsg] = useState('')

  const load = async () => {
    const { data, error } = await supabase.from('gallery_photos').select('*').in('slot', MAINTENANCE_PHOTO_SLOTS.map((item) => item.slot))
    if (error) { setMsg(error.message); return }
    const next: Record<string, any> = {}
    for (const row of data ?? []) next[row.slot] = row
    setRows(next)
  }
  useEffect(() => { load() }, [])

  const upload = async (slot: string, file: File) => {
    setBusySlot(slot)
    setMsg('')
    try {
      const uploaded = await uploadToBucket('gallery-photos', file)
      const existing = rows[slot]
      const patch = {
        image_url: uploaded.url,
        caption: file.name.replace(/\\.[^.]+$/, '').replace(/[-_]+/g, ' '),
        service_slug: slot === 'maintenance_high_pressure' ? 'high-pressure-cleaning' : slot === 'maintenance_painting' ? 'painting' : 'paving',
        slot,
        is_active: true,
        sort_order: existing?.sort_order ?? 0,
      }
      const result = existing
        ? await supabase.from('gallery_photos').update(patch).eq('id', existing.id)
        : await supabase.from('gallery_photos').insert(patch)
      if (result.error) throw result.error
      setMsg('Project photo saved. The maintenance page uses this image slot.')
      await load()
    } catch (e: any) {
      setMsg(e.message ?? 'Upload failed.')
    } finally {
      setBusySlot(null)
    }
  }

  const remove = async (slot: string) => {
    const row = rows[slot]
    if (!row || !confirm('Remove this maintenance-page photo? The uploaded file remains in storage.')) return
    setBusySlot(slot)
    try {
      const { error } = await supabase.from('gallery_photos').delete().eq('id', row.id)
      if (error) throw error
      setMsg('Photo removed from the maintenance page.')
      await load()
    } catch (e: any) {
      setMsg(e.message ?? 'Could not remove photo.')
    } finally { setBusySlot(null) }
  }

  return (
    <div>
      <p className="mb-4 text-sm text-gray-300">Choose real completed NGMS project photos for the three image shapes on the Maintenance Packages page. Uploading a replacement updates that exact position; no stock photos are used.</p>
      {msg && <p role="status" className="mb-4 text-sm text-gray-200">{msg}</p>}
      <div className="space-y-4">
        {MAINTENANCE_PHOTO_SLOTS.map((item) => {
          const row = rows[item.slot]
          const busy = busySlot === item.slot
          return (
            <section key={item.slot} className="rounded-xl border border-gray-700 bg-graphite p-4">
              <div className="flex items-start gap-3">
                {row?.image_url ? <img src={row.image_url} alt={row.caption ?? item.label} className="h-24 w-32 shrink-0 rounded object-cover" /> : <div className="flex h-24 w-32 shrink-0 items-center justify-center rounded border border-dashed border-gray-600 bg-jet px-2 text-center text-xs text-gray-500">No project photo</div>}
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-white">{item.label}</h3>
                  <p className="mt-1 text-xs text-gray-400">{item.help}</p>
                  {row?.caption && <p className="mt-2 truncate text-xs text-gray-300">{row.caption}</p>}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded bg-orange px-3 py-2 text-xs font-bold text-white">
                      {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                      {row?.image_url ? 'Replace photo' : 'Upload project photo'}
                      <input type="file" accept="image/*" className="hidden" disabled={busy} onChange={(e) => { const file = e.target.files?.[0]; e.target.value = ''; if (file) upload(item.slot, file) }} />
                    </label>
                    {row?.image_url && <button type="button" onClick={() => remove(item.slot)} disabled={busy} className="inline-flex items-center gap-1 rounded border border-gray-600 px-3 py-2 text-xs font-semibold text-red-300 disabled:opacity-50"><Trash2 className="h-3 w-3" /> Remove</button>}
                  </div>
                </div>
              </div>
            </section>
          )
        })}
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
    { key: 'hero', label: 'Hero block photos (12 slides)' },
    { key: 'homepage', label: 'Homepage photos' },
    { key: 'beforeafter', label: 'Before / After' },
    { key: 'gallery', label: 'Gallery' },
    { key: 'services', label: 'Service images' },
    { key: 'branded', label: 'Branded project upload' },
    { key: 'maintenance', label: 'Maintenance projects' },
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
      {tab === 'branded' && <BrandedProjectPublisher />}
      {tab === 'maintenance' && <MaintenanceProjectPhotos />}
    </main>
  )
}
