'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Loader2, Plus, RefreshCw, AlertTriangle, ArrowLeft, ChevronRight } from 'lucide-react'
import StaffGate from '@/components/admin/StaffGate'
import { supabase } from '@/lib/supabaseClient'
import { handlersC } from '@/lib/ngms-ops/handlers-c'
import { rand, WORKER_CATEGORIES } from '@/lib/ngms-ops/core'

type Row = { id: string; name: string; category: string; phone: string | null; daily_rate: number; status: string }

const FILTERS = [
  { key: 'active_only', label: 'Active' },
  { key: 'all', label: 'All' },
  { key: 'inactive', label: 'Inactive' },
] as const

const STATUS_STYLE: Record<string, string> = {
  active: 'text-whatsapp border-whatsapp',
  temp: 'text-orange border-orange',
  inactive: 'text-mist border-darkgrey',
}

const input = 'w-full bg-jet border border-darkgrey text-paper rounded-btn px-3 py-2.5 text-sm focus:outline-none focus:border-blue'

function NewWorkerForm({ onSaved }: { onSaved: () => void }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [category, setCategory] = useState<(typeof WORKER_CATEGORIES)[number]>('General Worker')
  const [phone, setPhone] = useState('')
  const [dailyRate, setDailyRate] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function save() {
    if (!name.trim()) {
      setError('Name is required.')
      return
    }
    setSaving(true)
    setError('')
    const res = await handlersC.ngms_save_worker(supabase, {
      name: name.trim(),
      category,
      phone: phone.trim() || undefined,
      daily_rate: dailyRate ? Number(dailyRate) : 0,
    })
    setSaving(false)
    if (res.isError) {
      setError(res.content[0]?.text ?? 'Could not add worker')
      return
    }
    setName('')
    setPhone('')
    setDailyRate('')
    setOpen(false)
    onSaved()
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 bg-orange text-white font-heading font-semibold px-4 py-2.5 rounded-btn">
        <Plus className="w-4 h-4" /> Add worker
      </button>
    )
  }

  return (
    <div className="bg-cardgrey border border-darkgrey rounded-card p-4 mb-4">
      <p className="font-heading font-bold text-paper mb-3">New worker</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <input className={input} placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} />
        <select className={input} value={category} onChange={(e) => setCategory(e.target.value as (typeof WORKER_CATEGORIES)[number])}>
          {WORKER_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <input className={input} placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <input className={input} type="number" placeholder="Daily rate (R)" value={dailyRate} onChange={(e) => setDailyRate(e.target.value)} />
      </div>
      {error && <p className="text-xs text-orange mt-2">{error}</p>}
      <div className="flex items-center gap-3 mt-3">
        <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 bg-blue hover:bg-blue-dark text-white font-heading font-semibold px-4 py-2.5 rounded-btn disabled:opacity-50">
          {saving && <Loader2 className="w-4 h-4 animate-spin" />} Save
        </button>
        <button onClick={() => setOpen(false)} className="text-sm text-mist hover:text-paper">
          Cancel
        </button>
      </div>
    </div>
  )
}

function WagesList() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['key']>('active_only')
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const args: Record<string, unknown> = { limit: 100 }
      if (filter === 'active_only') args.active_only = true
      if (filter === 'inactive') args.status = 'inactive'
      const res = await handlersC.ngms_list_workers(supabase, args)
      if (res.isError) throw new Error(res.content[0]?.text ?? 'Could not load workers')
      setRows(((res.structuredContent?.workers as Row[]) ?? []) as Row[])
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => {
    load()
  }, [load])

  return (
    <main className="min-h-[70vh] bg-jet px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Link href="/admin" className="text-xs text-mist hover:text-paper inline-flex items-center gap-1 mb-3">
          <ArrowLeft className="w-3.5 h-3.5" /> Admin
        </Link>
        <div className="flex items-center justify-between gap-3 mb-5">
          <h1 className="font-heading text-2xl font-bold text-paper">Wages &amp; Payroll</h1>
        </div>

        <NewWorkerForm onSaved={load} />

        <div className="flex items-center gap-2 mb-3">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`text-xs px-3 py-1.5 rounded-btn border ${f.key === filter ? 'border-orange text-orange' : 'border-darkgrey text-mist hover:text-paper'}`}
            >
              {f.label}
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
          {loading && !rows.length ? (
            <div className="py-10 flex justify-center">
              <Loader2 className="w-5 h-5 text-mist animate-spin" />
            </div>
          ) : rows.length ? (
            <ul className="divide-y divide-darkgrey">
              {rows.map((w) => (
                <li key={w.id}>
                  <Link href={`/admin/wages/${w.id}`} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-jet/40">
                    <div className="min-w-0">
                      <p className="text-paper font-semibold truncate">{w.name}</p>
                      <p className="text-xs text-mist truncate">
                        {w.category} · {w.phone ?? 'no phone on file'}
                      </p>
                    </div>
                    <div className="text-right shrink-0 flex items-center gap-2">
                      <div>
                        <p className="text-paper text-sm">{rand(w.daily_rate)}/day</p>
                        <span className={`inline-block mt-0.5 text-[10px] uppercase tracking-wider border rounded px-2 py-0.5 ${STATUS_STYLE[w.status] ?? 'text-mist border-darkgrey'}`}>{w.status}</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-mist" />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-10 text-center">
              <p className="text-sm text-mist">No workers here yet — add your first one above.</p>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}

export default function WagesPage() {
  return (
    <StaffGate title="Wages & Payroll">
      <WagesList />
    </StaffGate>
  )
}
