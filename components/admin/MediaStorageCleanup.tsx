'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { RefreshCw, Trash2, ScanSearch, AlertTriangle } from 'lucide-react'

type RefRow = { table: string; id: string; url: string; label: string; bucket: string; path: string }
type Photo = { key: string; bucket: string; path: string; name: string; size: number; url: string; refs: RefRow[] }
const BUCKETS = ['hero-slides', 'gallery-photos', 'before-after-photos', 'site-media']
const PREFIX = '/storage/v1/object/public/'

function getPath(url: string, bucket: string): string | null {
  try {
    const pathname = new URL(url).pathname
    const marker = PREFIX + bucket + '/'
    const index = pathname.indexOf(marker)
    return index < 0 ? null : decodeURIComponent(pathname.slice(index + marker.length))
  } catch { return null }
}
function bytes(n: number) {
  if (n < 1024) return n + ' B'
  if (n < 1048576) return Math.round(n / 1024) + ' KB'
  return (n / 1048576).toFixed(2) + ' MB'
}
async function listObjects(bucket: string, folder: string): Promise<any[]> {
  const result = await supabase.storage.from(bucket).list(folder, { limit: 100, sortBy: { column: 'created_at', order: 'asc' } })
  if (result.error) throw new Error('Could not scan ' + bucket + '/' + folder + ': ' + result.error.message)
  const out: any[] = []
  for (const item of result.data ?? []) {
    if (!item.name || item.name.startsWith('.')) continue
    const path = folder ? folder + '/' + item.name : item.name
    if (item.id) out.push({ name: item.name, path, size: Number(item.metadata?.size ?? 0) })
    else out.push(...await listObjects(bucket, path))
  }
  return out
}
async function getRefs(): Promise<RefRow[]> {
  const refs: RefRow[] = []
  const results = await Promise.all([
    supabase.from('hero_slides').select('id,image_url,caption,alt_text'),
    supabase.from('gallery_photos').select('id,image_url,caption,slot'),
    supabase.from('before_after_photos').select('id,before_image_url,after_image_url,caption,location'),
    supabase.from('services').select('slug,name,hero_image')
  ])
  const names = ['hero_slides', 'gallery_photos', 'before_after_photos', 'services']
  for (let i = 0; i < results.length; i++) if (results[i].error) throw new Error('Reference scan failed for ' + names[i] + ': ' + results[i].error.message)
  for (const row of results[0].data ?? []) {
    const path = getPath(row.image_url, 'hero-slides')
    if (path) refs.push({ table: 'hero_slides', id: String(row.id), url: row.image_url, label: row.caption || row.alt_text || 'Hero slide', bucket: 'hero-slides', path })
  }
  for (const row of results[1].data ?? []) {
    const path = getPath(row.image_url, 'gallery-photos')
    if (path) refs.push({ table: 'gallery_photos', id: String(row.id), url: row.image_url, label: row.caption || row.slot || 'Gallery photo', bucket: 'gallery-photos', path })
  }
  for (const row of results[2].data ?? []) {
    for (const field of ['before_image_url', 'after_image_url'] as const) {
      const url = row[field]
      for (const bucket of BUCKETS) {
        const path = getPath(url, bucket)
        if (path) refs.push({ table: 'before_after_photos', id: String(row.id), url, label: (row.location || row.caption || 'Before/after') + ' — ' + field, bucket, path })
      }
    }
  }
  for (const row of results[3].data ?? []) {
    if (!row.hero_image) continue
    for (const bucket of BUCKETS) {
      const path = getPath(row.hero_image, bucket)
      if (path) refs.push({ table: 'services', id: String(row.slug), url: row.hero_image, label: (row.name || row.slug) + ' service image', bucket, path })
    }
  }
  return refs
}

export default function MediaStorageCleanup() {
  const { session } = useAdminAuth()
  const [photos, setPhotos] = useState<Photo[]>([])
  const [selected, setSelected] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const [message, setMessage] = useState('')

  async function scan() {
    if (!session) { setMessage('Staff sign-in required.'); return }
    setLoading(true); setMessage(''); setSelected([])
    try {
      const refs = await getRefs()
      const inventory: Photo[] = []
      for (const bucket of BUCKETS) {
        const objects = await listObjects(bucket, '')
        for (const object of objects) {
          const url = supabase.storage.from(bucket).getPublicUrl(object.path).data.publicUrl
          const linked = refs.filter((ref) => ref.bucket === bucket && ref.path === object.path)
          inventory.push({ key: bucket + ':' + object.path, bucket, path: object.path, name: object.name, size: object.size, url, refs: linked })
        }
      }
      setPhotos(inventory)
      const orphans = inventory.filter((photo) => photo.refs.length === 0).length
      setMessage('Scan complete: ' + inventory.length + ' objects; ' + orphans + ' unreferenced candidates. Review each photo before deletion.')
    } catch (error: any) { setMessage(error?.message || 'Storage scan failed.') }
    finally { setLoading(false) }
  }

  async function deleteSelected() {
    const chosen = photos.filter((photo) => selected.includes(photo.key))
    if (!chosen.length) { setMessage('Select photos to delete.'); return }
    if (!window.confirm('Permanently delete ' + chosen.length + ' selected image(s)? Linked website records will be detached first. This cannot be undone. Continue only after reviewing every preview.')) return
    setBusy(true); setMessage('')
    let deleted = 0
    const failures: string[] = []
    try {
      for (const photo of chosen) {
        for (const ref of photo.refs) {
          let error: any = null
          if (ref.table === 'hero_slides') {
            const result = await supabase.from('hero_slides').delete().eq('id', ref.id); error = result.error
          } else if (ref.table === 'gallery_photos') {
            const result = await supabase.from('gallery_photos').delete().eq('id', ref.id); error = result.error
          } else if (ref.table === 'services') {
            const result = await supabase.from('services').update({ hero_image: null }).eq('slug', ref.id); error = result.error
          } else if (ref.table === 'before_after_photos') {
            // Do not delete the whole comparison record: preserve the other side.
            const result = await supabase.from('before_after_photos').update({ is_active: false }).eq('id', ref.id); error = result.error
          }
          if (error) failures.push(photo.bucket + '/' + photo.path + ': could not detach ' + ref.table + ' (' + error.message + ')')
        }
      }
      const remaining = await getRefs()
      for (const photo of chosen) {
        if (failures.some((failure) => failure.startsWith(photo.bucket + '/' + photo.path + ':'))) continue
        if (remaining.some((ref) => ref.bucket === photo.bucket && ref.path === photo.path)) {
          failures.push(photo.bucket + '/' + photo.path + ': retained because a reference remains')
          continue
        }
        const result = await supabase.storage.from(photo.bucket).remove([photo.path])
        if (result.error) failures.push(photo.bucket + '/' + photo.path + ': storage delete failed (' + result.error.message + ')')
        else deleted++
      }
      setMessage('Deleted ' + deleted + ' file(s).' + (failures.length ? ' Items needing attention: ' + failures.slice(0, 5).join(' | ') : ''))
      await scan()
    } catch (error: any) { setMessage(error?.message || 'Cleanup stopped. Scan again before retrying.') }
    finally { setBusy(false) }
  }

  const visible = showAll ? photos : photos.filter((photo) => photo.refs.length === 0)
  const orphanBytes = photos.filter((photo) => photo.refs.length === 0).reduce((sum, photo) => sum + photo.size, 0)
  const totalBytes = photos.reduce((sum, photo) => sum + photo.size, 0)

  return (
    <section className="space-y-5">
      <div className="rounded-xl border border-orange/40 bg-graphite p-4">
        <h2 className="font-bold text-white">Storage cleanup — inspect before deletion</h2>
        <p className="mt-2 text-sm text-gray-300">Scans hero-slides, gallery-photos, before-after-photos and site-media. Checks references in hero_slides, gallery_photos, before_after_photos and services. It does not touch job evidence, quotes, receipts, worker documents or other private buckets.</p>
        <p className="mt-2 flex items-start gap-2 text-xs text-amber-200"><AlertTriangle className="h-4 w-4 shrink-0" /> Unreferenced means no link was found in these checked tables, not proof that a file is disposable. Review previews and keep a backup before permanent deletion.</p>
      </div>
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={scan} disabled={loading || busy} className="inline-flex items-center gap-2 rounded bg-orange px-4 py-2 text-sm font-bold text-white disabled:opacity-50">
          {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <ScanSearch className="h-4 w-4" />}{loading ? 'Scanning…' : 'Scan image storage'}
        </button>
        <button type="button" onClick={() => setShowAll(!showAll)} disabled={!photos.length} className="rounded border border-gray-600 px-3 py-2 text-sm text-white disabled:opacity-50">{showAll ? 'Show unreferenced only' : 'Show all stored images'}</button>
        <button type="button" onClick={deleteSelected} disabled={busy || !selected.length} className="inline-flex items-center gap-2 rounded bg-red-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">
          {busy ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}{busy ? 'Deleting…' : 'Permanently delete selected (' + selected.length + ')'}
        </button>
      </div>
      {message && <p role="status" className="rounded border border-gray-700 bg-graphite p-3 text-sm text-gray-200">{message}</p>}
      {photos.length > 0 && <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded border border-gray-700 bg-graphite p-3"><p className="text-xs text-gray-400">Objects scanned</p><p className="mt-1 text-xl font-black text-white">{photos.length}</p></div>
        <div className="rounded border border-gray-700 bg-graphite p-3"><p className="text-xs text-gray-400">Total size</p><p className="mt-1 text-xl font-black text-white">{bytes(totalBytes)}</p></div>
        <div className="rounded border border-gray-700 bg-graphite p-3"><p className="text-xs text-gray-400">Unreferenced</p><p className="mt-1 text-xl font-black text-white">{photos.filter((photo) => !photo.refs.length).length}</p></div>
        <div className="rounded border border-gray-700 bg-graphite p-3"><p className="text-xs text-gray-400">Candidate space</p><p className="mt-1 text-xl font-black text-white">{bytes(orphanBytes)}</p></div>
      </div>}
      <div className="grid gap-3 sm:grid-cols-2">
        {visible.map((photo) => <article key={photo.key} className="min-w-0 rounded-xl border border-gray-700 bg-graphite p-3">
          <label className="flex cursor-pointer items-start gap-2">
            <input type="checkbox" className="mt-1" checked={selected.includes(photo.key)} onChange={(event) => setSelected((old) => event.target.checked ? [...old, photo.key] : old.filter((key) => key !== photo.key))} />
            <span className="min-w-0 flex-1"><span className="block break-all text-xs font-bold text-white">{photo.name}</span><span className="mt-1 block text-xs text-gray-400">{photo.bucket} · {bytes(photo.size)}</span></span>
            <span className={photo.refs.length ? 'rounded bg-blue-900/60 px-2 py-1 text-[10px] font-bold text-blue-200' : 'rounded bg-amber-900/60 px-2 py-1 text-[10px] font-bold text-amber-200'}>{photo.refs.length ? photo.refs.length + ' reference(s)' : 'Unreferenced'}</span>
          </label>
          <img src={photo.url} alt="" loading="lazy" className="mt-3 h-44 w-full rounded bg-jet object-contain" />
          {photo.refs.length > 0 && <ul className="mt-2 space-y-1 text-xs text-gray-400">{photo.refs.map((ref, i) => <li key={ref.table + ':' + ref.id + ':' + i}>{ref.table} — {ref.label}</li>)}</ul>}
        </article>)}
      </div>
      {photos.length > 0 && visible.length === 0 && <p className="rounded border border-gray-700 p-4 text-sm text-gray-400">No unreferenced files found in the scanned buckets.</p>}
    </section>
  )
}
