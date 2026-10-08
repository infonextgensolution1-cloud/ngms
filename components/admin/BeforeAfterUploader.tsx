'use client'

import { useEffect, useMemo, useState } from 'react'
import { Loader2, Trash2, Upload, Image as ImageIcon } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { services } from '@/lib/services'

type Row = {
  id: string
  service_slug: string | null
  location: string
  caption: string | null
  before_image_url: string
  after_image_url: string
  before_image_urls?: string[] | null
  after_image_urls?: string[] | null
}

const MAX = 4

function urls(row: Row, side: 'before' | 'after') {
  const list = side === 'before' ? row.before_image_urls : row.after_image_urls
  if (Array.isArray(list) && list.length) return list
  const legacy = side === 'before' ? row.before_image_url : row.after_image_url
  return legacy ? [legacy] : []
}

async function upload(file: File) {
  const ext = file.name.split('.').pop() || 'jpg'
  const path = `projects/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const { error } = await supabase.storage.from('before-after-photos').upload(path, file, {
    cacheControl: '31536000',
    upsert: false,
  })
  if (error) throw error
  return supabase.storage.from('before-after-photos').getPublicUrl(path).data.publicUrl
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block mb-3"><span className="block text-xs font-semibold text-gray-400 mb-1">{label}</span>{children}</label>
}

const input = 'w-full bg-jet border border-gray-700 rounded-lg px-3 py-2 text-sm text-white'

export default function BeforeAfterUploader() {
  const [rows, setRows] = useState<Row[]>([])
  const [before, setBefore] = useState<File[]>([])
  const [after, setAfter] = useState<File[]>([])
  const [location, setLocation] = useState('')
  const [slug, setSlug] = useState('solar-panel-cleaning')
  const [caption, setCaption] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  const serviceName = useMemo(() => services.find(s => s.slug === slug)?.name || 'Maintenance', [slug])

  async function load() {
    const { data, error } = await supabase.from('before_after_photos').select('*').order('sort_order', { ascending: true }).order('created_at', { ascending: false })
    if (error) setMsg(error.message)
    setRows((data as Row[]) || [])
  }

  useEffect(() => { void load() }, [])

  function choose(files: FileList | null, side: 'before' | 'after') {
    const list = Array.from(files || [])
    if (list.length !== MAX) {
      setMsg(`Select exactly 4 ${side.toUpperCase()} photos.`)
    } else {
      setMsg('')
    }
    ;(side === 'before' ? setBefore : setAfter)(list.slice(0, MAX))
  }

  async function add() {
    if (before.length !== MAX || after.length !== MAX) return setMsg('Select exactly 4 BEFORE and 4 AFTER photos.')
    if (!location.trim()) return setMsg('Location is required.')
    setBusy(true); setMsg('')
    try {
      const beforeUrls: string[] = []
      const afterUrls: string[] = []
      for (const file of before) beforeUrls.push(await upload(file))
      for (const file of after) afterUrls.push(await upload(file))

      const { error } = await supabase.from('before_after_photos').insert({
        before_image_url: beforeUrls[0],
        after_image_url: afterUrls[0],
        before_image_urls: beforeUrls,
        after_image_urls: afterUrls,
        location: location.trim(),
        service_slug: slug,
        caption: caption.trim() || null,
        sort_order: rows.length,
        is_active: true,
      })
      if (error) throw error
      setBefore([]); setAfter([]); setLocation(''); setCaption('')
      setMsg('Project uploaded successfully — 4 BEFORE + 4 AFTER.')
      await load()
    } catch (e: any) {
      setMsg(e?.message || 'Upload failed.')
    } finally {
      setBusy(false)
    }
  }

  async function remove(id: string) {
    if (!confirm('Delete this project?')) return
    const { error } = await supabase.from('before_after_photos').delete().eq('id', id)
    if (error) setMsg(error.message); else await load()
  }

  return <div>
    <div className="border border-gray-700 rounded-xl p-4 mb-6 bg-graphite">
      <div className="flex items-center gap-2 mb-4">
        <ImageIcon className="w-5 h-5 text-orange" />
        <div><h2 className="font-bold text-white">Before / After Project — 4 + 4</h2><p className="text-xs text-gray-500">Upload four BEFORE and four AFTER photos for one completed project.</p></div>
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        <Field label="4 BEFORE photos"><input type="file" accept="image/*" multiple onChange={e => choose(e.target.files, 'before')} className="text-sm text-gray-300" /><p className="text-xs text-gray-500 mt-1">{before.length}/4 selected</p></Field>
        <Field label="4 AFTER photos"><input type="file" accept="image/*" multiple onChange={e => choose(e.target.files, 'after')} className="text-sm text-gray-300" /><p className="text-xs text-gray-500 mt-1">{after.length}/4 selected</p></Field>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="Location"><input className={input} value={location} onChange={e => setLocation(e.target.value)} placeholder="Strand" /></Field>
        <Field label="Service"><select className={input} value={slug} onChange={e => setSlug(e.target.value)}>{services.map(s => <option key={s.slug} value={s.slug}>{s.name}</option>)}</select></Field>
      </div>
      <Field label="Project description"><textarea className={input} rows={2} value={caption} onChange={e => setCaption(e.target.value)} placeholder="Completed project description" /></Field>
      <button onClick={add} disabled={busy} className="bg-orange text-white font-semibold px-5 py-2 rounded-full text-sm inline-flex items-center gap-2 disabled:opacity-50">
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}{busy ? 'Uploading…' : 'Upload 4 + 4 Project'}
      </button>
      {msg && <p className="text-sm mt-3 text-gray-300">{msg}</p>}
    </div>

    <div className="space-y-4">{rows.map(row => {
      const b = urls(row, 'before'), a = urls(row, 'after')
      return <article key={row.id} className="border border-gray-800 rounded-xl p-3 bg-graphite">
        <div className="flex items-center justify-between mb-3"><div><p className="font-bold text-white">{row.caption || 'Completed Project'}</p><p className="text-xs text-gray-500">{row.location} · {row.service_slug?.replaceAll('-', ' ') || serviceName}</p></div><button onClick={() => void remove(row.id)} className="text-red-400 p-2"><Trash2 className="w-4 h-4" /></button></div>
        <div className="grid grid-cols-4 gap-1">{b.map((url, i) => <div key={url} className="relative aspect-video overflow-hidden rounded"><img src={url} alt={`Before ${i + 1}`} className="w-full h-full object-cover" /><span className="absolute top-1 left-1 bg-black/80 text-white text-[9px] px-1.5 py-0.5 rounded">BEFORE</span><span className="absolute bottom-1 right-1 bg-black/80 text-white text-[9px] px-1.5 py-0.5 rounded">NEXTGEN {serviceName.toUpperCase()}</span><img src="/logo.png" alt="" className="absolute bottom-1 left-1 w-10 h-10 object-contain" /></div>)}</div>
        <div className="grid grid-cols-4 gap-1 mt-1">{a.map((url, i) => <div key={url} className="relative aspect-video overflow-hidden rounded"><img src={url} alt={`After ${i + 1}`} className="w-full h-full object-cover" /><span className="absolute top-1 left-1 bg-orange text-white text-[9px] px-1.5 py-0.5 rounded">AFTER</span><span className="absolute bottom-1 right-1 bg-black/80 text-white text-[9px] px-1.5 py-0.5 rounded">NEXTGEN {serviceName.toUpperCase()}</span><img src="/logo.png" alt="" className="absolute bottom-1 left-1 w-10 h-10 object-contain" /></div>)}</div>
      </article>
    })}</div>
  </div>
}
