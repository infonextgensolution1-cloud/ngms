'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Loader2, Plus, RefreshCw, AlertTriangle, ArrowLeft, Search, Pencil, Check } from 'lucide-react'
import StaffGate from '@/components/admin/StaffGate'
import { supabase } from '@/lib/supabaseClient'
import { handlersB } from '@/lib/ngms-ops/handlers-b'
import { rand } from '@/lib/ngms-ops/core'
import { services } from '@/lib/services'

type Material = { id: string; description: string; supplier: string | null; sku: string | null; unit: string | null; last_price: number | null; last_checked: string | null; category: string | null }

const input = 'w-full bg-jet border border-darkgrey text-paper rounded-btn px-3 py-2.5 text-sm focus:outline-none focus:border-blue'

function categoryLabel(slug: string | null): string {
  if (!slug) return 'Uncategorised'
  return services.find((s) => s.slug === slug)?.name ?? slug
}

function EditPrice({ m, onSaved }: { m: Material; onSaved: () => void }) {
  const [editing, setEditing] = useState(false)
  const [price, setPrice] = useState(String(m.last_price ?? ''))
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    await handlersB.ngms_save_material(supabase, { material_id: m.id, last_price: Number(price) || 0 })
    setSaving(false)
    setEditing(false)
    onSaved()
  }

  if (!editing) {
    return (
      <button onClick={() => setEditing(true)} className="inline-flex items-center gap-1 text-paper text-sm hover:text-orange">
        {m.last_price !== null ? rand(m.last_price) : 'no price'} <Pencil className="w-3 h-3 text-mist" />
      </button>
    )
  }
  return (
    <div className="flex items-center gap-1">
      <input autoFocus type="number" className="w-20 bg-jet border border-darkgrey text-paper rounded px-2 py-1 text-sm" value={price} onChange={(e) => setPrice(e.target.value)} />
      <button onClick={save} disabled={saving} className="text-whatsapp">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
      </button>
    </div>
  )
}

function NewMaterialForm({ onSaved }: { onSaved: () => void }) {
  const [open, setOpen] = useState(false)
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState(services[0].slug)
  const [unit, setUnit] = useState('')
  const [price, setPrice] = useState('')
  const [supplier, setSupplier] = useState('Builders Warehouse')
  const [saving, setSaving] = useState(false)

  async function save() {
    if (!description.trim()) return
    setSaving(true)
    await handlersB.ngms_save_material(supabase, { description: description.trim(), category, unit: unit.trim() || undefined, last_price: price ? Number(price) : undefined, supplier: supplier.trim() || undefined })
    setSaving(false)
    setDescription('')
    setUnit('')
    setPrice('')
    setOpen(false)
    onSaved()
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 bg-orange text-white font-heading font-semibold px-4 py-2.5 rounded-btn">
        <Plus className="w-4 h-4" /> Add material
      </button>
    )
  }
  return (
    <div className="bg-cardgrey border border-darkgrey rounded-card p-4 mb-4">
      <p className="font-heading font-bold text-paper mb-3">New material</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <input className={`${input} sm:col-span-2`} placeholder="Description, e.g. Plascon PVA Interior White 20L" value={description} onChange={(e) => setDescription(e.target.value)} />
        <select className={input} value={category} onChange={(e) => setCategory(e.target.value)}>
          {services.map((s) => (
            <option key={s.slug} value={s.slug}>
              {s.name}
            </option>
          ))}
        </select>
        <input className={input} placeholder="Unit, e.g. tin, m², each" value={unit} onChange={(e) => setUnit(e.target.value)} />
        <input className={input} type="number" placeholder="Price (R)" value={price} onChange={(e) => setPrice(e.target.value)} />
        <input className={input} placeholder="Supplier" value={supplier} onChange={(e) => setSupplier(e.target.value)} />
      </div>
      <div className="flex items-center gap-3 mt-3">
        <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 bg-blue-fill hover:bg-blue-dark text-white font-heading font-semibold px-4 py-2.5 rounded-btn disabled:opacity-50">
          {saving && <Loader2 className="w-4 h-4 animate-spin" />} Save
        </button>
        <button onClick={() => setOpen(false)} className="text-sm text-mist hover:text-paper">
          Cancel
        </button>
      </div>
    </div>
  )
}

function MaterialsList() {
  const [all, setAll] = useState<Material[]>([])
  const [category, setCategory] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await handlersB.ngms_list_materials(supabase, { limit: 100 })
      if (res.isError) throw new Error(res.content[0]?.text ?? 'Could not load materials')
      setAll(((res.structuredContent?.materials as Material[]) ?? []) as Material[])
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const categories = useMemo(() => {
    const present = new Set(all.map((m) => m.category).filter(Boolean) as string[])
    return services.filter((s) => present.has(s.slug))
  }, [all])

  const rows = useMemo(() => {
    let r = all
    if (category !== 'all') r = r.filter((m) => m.category === category)
    if (search.trim()) {
      const s = search.toLowerCase()
      r = r.filter((m) => m.description.toLowerCase().includes(s) || m.sku?.toLowerCase().includes(s))
    }
    return r
  }, [all, category, search])

  return (
    <main className="min-h-[70vh] bg-jet px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Link href="/admin" className="text-xs text-mist hover:text-paper inline-flex items-center gap-1 mb-3">
          <ArrowLeft className="w-3.5 h-3.5" /> Admin
        </Link>
        <div className="flex items-center justify-between gap-3 mb-5">
          <h1 className="font-heading text-2xl font-bold text-paper">Materials Catalog</h1>
          <Link href="/admin/suppliers" className="text-xs text-blue hover:underline">
            Suppliers &amp; purchases →
          </Link>
        </div>

        <NewMaterialForm onSaved={load} />

        <div className="relative mb-3">
          <Search className="w-4 h-4 text-mist absolute left-3 top-1/2 -translate-y-1/2" />
          <input className={`${input} pl-9`} placeholder="Search materials or SKU…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-3">
          <button onClick={() => setCategory('all')} className={`text-xs px-3 py-1.5 rounded-btn border ${category === 'all' ? 'border-orange text-orange' : 'border-darkgrey text-mist hover:text-paper'}`}>
            All ({all.length})
          </button>
          {categories.map((s) => (
            <button
              key={s.slug}
              onClick={() => setCategory(s.slug)}
              className={`text-xs px-3 py-1.5 rounded-btn border ${category === s.slug ? 'border-orange text-orange' : 'border-darkgrey text-mist hover:text-paper'}`}
            >
              {s.name} ({all.filter((m) => m.category === s.slug).length})
            </button>
          ))}
          <button onClick={load} aria-label="Refresh" className="ml-auto text-mist hover:text-paper p-1.5">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {error && (
          <p className="text-sm text-orange flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4" /> {error}
          </p>
        )}

        <section className="bg-cardgrey border border-darkgrey rounded-card">
          {loading && !all.length ? (
            <div className="py-10 flex justify-center">
              <Loader2 className="w-5 h-5 text-mist animate-spin" />
            </div>
          ) : rows.length ? (
            <ul className="divide-y divide-darkgrey">
              {rows.map((m) => (
                <li key={m.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-paper text-sm truncate">{m.description}</p>
                    <p className="text-xs text-mist truncate">
                      {categoryLabel(m.category)} · {m.unit ?? '—'} · {m.supplier ?? '—'}
                      {m.last_checked ? ` · checked ${m.last_checked}` : ''}
                    </p>
                  </div>
                  <div className="shrink-0">
                    <EditPrice m={m} onSaved={load} />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-10 text-center">
              <p className="text-sm text-mist">No materials match.</p>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}

export default function MaterialsPage() {
  return (
    <StaffGate title="Materials Catalog">
      <MaterialsList />
    </StaffGate>
  )
}
