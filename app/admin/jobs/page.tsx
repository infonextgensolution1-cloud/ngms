'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Loader2, Plus, RefreshCw, AlertTriangle, ArrowLeft, ChevronRight, Search } from 'lucide-react'
import StaffGate from '@/components/admin/StaffGate'
import ExportButtons from '@/components/admin/ExportButtons'
import { exportJobs } from '@/lib/admin-export'
import { supabase } from '@/lib/supabaseClient'
import { handlersA } from '@/lib/ngms-ops/handlers-a'
import { handlersB } from '@/lib/ngms-ops/handlers-b'
import { JOB_STATUSES } from '@/lib/ngms-ops/core'

type ClientRow = { id: string; name: string; phone: string | null; suburb: string | null }
type JobRow = { id: string; title: string | null; status: string; scheduled_date: string | null; client_name: string | null; client_suburb: string | null }

const FILTERS = [{ key: 'open_only', label: 'Open' }, { key: 'all', label: 'All' }, ...JOB_STATUSES.map((s) => ({ key: s, label: s.replace('_', ' ') }))] as const

const STATUS_STYLE: Record<string, string> = {
  scheduled: 'text-blue border-blue',
  in_progress: 'text-orange border-orange',
  on_hold: 'text-mist border-darkgrey',
  completed: 'text-whatsapp border-whatsapp',
  cancelled: 'text-mist border-darkgrey line-through',
}

const input = 'w-full bg-jet border border-darkgrey text-paper rounded-btn px-3 py-2.5 text-sm focus:outline-none focus:border-blue'

function NewJobForm({ onCreated }: { onCreated: (id: string) => void }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [clients, setClients] = useState<ClientRow[]>([])
  const [client, setClient] = useState<ClientRow | null>(null)
  const [title, setTitle] = useState('')
  const [scheduled, setScheduled] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    const t = setTimeout(async () => {
      const res = await handlersA.ngms_list_clients(supabase, search.trim() ? { search: search.trim(), limit: 20 } : { limit: 20 })
      if (!res.isError) setClients(((res.structuredContent?.clients as ClientRow[]) ?? []) as ClientRow[])
    }, 300)
    return () => clearTimeout(t)
  }, [search, open])

  async function save() {
    if (!client) {
      setError('Pick a client first.')
      return
    }
    if (!title.trim()) {
      setError('Give the job a short title.')
      return
    }
    setSaving(true)
    setError('')
    const res = await handlersB.ngms_create_job(supabase, {
      client_id: client.id,
      title: title.trim(),
      scheduled_date: scheduled || undefined,
      description: description.trim() || undefined,
    })
    setSaving(false)
    if (res.isError) {
      setError(res.content[0]?.text ?? 'Could not create job')
      return
    }
    const job = res.structuredContent?.job as { id: string }
    setOpen(false)
    setTitle('')
    setDescription('')
    setScheduled('')
    setClient(null)
    onCreated(job.id)
  }

  if (!open)
    return (
      <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 bg-orange text-white font-heading font-semibold px-4 py-2.5 rounded-btn">
        <Plus className="w-4 h-4" /> New job
      </button>
    )

  return (
    <div className="bg-cardgrey border border-darkgrey rounded-card p-4 mb-4">
      <p className="font-heading font-bold text-paper mb-3">New job</p>

      {client ? (
        <div className="flex items-center justify-between bg-jet border border-darkgrey rounded-btn px-3 py-2.5 mb-3">
          <div>
            <p className="text-paper text-sm font-semibold">{client.name}</p>
            <p className="text-xs text-mist">
              {client.phone ?? '—'} {client.suburb ? `· ${client.suburb}` : ''}
            </p>
          </div>
          <button onClick={() => setClient(null)} className="text-xs text-blue hover:underline">
            Change
          </button>
        </div>
      ) : (
        <div className="relative mb-3">
          <Search className="w-4 h-4 text-mist absolute left-3 top-1/2 -translate-y-1/2" />
          <input className={`${input} pl-9`} placeholder="Search clients by name or phone…" value={search} onChange={(e) => setSearch(e.target.value)} />
          {clients.length > 0 && (
            <div className="absolute z-10 mt-1 w-full bg-cardgrey border border-darkgrey rounded-btn max-h-56 overflow-y-auto">
              {clients.map((c) => (
                <button key={c.id} onClick={() => { setClient(c); setClients([]) }} className="w-full text-left px-3 py-2 text-sm text-paper hover:bg-jet/60">
                  {c.name} <span className="text-mist text-xs">{c.suburb ? `· ${c.suburb}` : ''}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <input className={`${input} sm:col-span-2`} placeholder="Job title, e.g. Exterior repaint — Vergelegen Estate" value={title} onChange={(e) => setTitle(e.target.value)} />
        <input className={input} type="date" value={scheduled} onChange={(e) => setScheduled(e.target.value)} />
      </div>
      <textarea className={`${input} mt-3 min-h-[70px]`} placeholder="Scope / site notes (optional)" value={description} onChange={(e) => setDescription(e.target.value)} />

      {error && <p className="text-xs text-orange mt-2">{error}</p>}
      <div className="flex items-center gap-3 mt-3">
        <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 bg-blue hover:bg-blue-dark text-white font-heading font-semibold px-4 py-2.5 rounded-btn disabled:opacity-50">
          {saving && <Loader2 className="w-4 h-4 animate-spin" />} Create job
        </button>
        <button onClick={() => setOpen(false)} className="text-sm text-mist hover:text-paper">
          Cancel
        </button>
      </div>
    </div>
  )
}

function JobsList() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['key']>('open_only')
  const [rows, setRows] = useState<JobRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const args: Record<string, unknown> = { limit: 200 }
      if (filter === 'open_only') args.open_only = true
      else if (filter !== 'all') args.status = filter
      const res = await handlersB.ngms_list_jobs(supabase, args)
      if (res.isError) throw new Error(res.content[0]?.text ?? 'Could not load jobs')
      setRows(((res.structuredContent?.jobs as JobRow[]) ?? []) as JobRow[])
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
        <h1 className="font-heading text-2xl font-bold text-paper mb-5">Jobs &amp; Photo Reports</h1>

        <NewJobForm onCreated={(id) => router.push(`/admin/jobs/${id}`)} />

        <ExportButtons load={exportJobs} />

        <div className="flex flex-wrap items-center gap-2 mb-3">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`text-xs px-3 py-1.5 rounded-btn border capitalize ${f.key === filter ? 'border-orange text-orange' : 'border-darkgrey text-mist hover:text-paper'}`}
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
              {rows.map((j) => (
                <li key={j.id}>
                  <Link href={`/admin/jobs/${j.id}`} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-jet/40">
                    <div className="min-w-0">
                      <p className="text-paper font-semibold truncate">{j.title ?? 'Untitled'}</p>
                      <p className="text-xs text-mist truncate">
                        {j.client_name ?? '—'}{j.client_suburb ? `, ${j.client_suburb}` : ''} · {j.scheduled_date ?? 'no date'}
                      </p>
                    </div>
                    <div className="text-right shrink-0 flex items-center gap-2">
                      <span className={`inline-block text-[10px] uppercase tracking-wider border rounded px-2 py-0.5 ${STATUS_STYLE[j.status] ?? 'text-mist border-darkgrey'}`}>{j.status.replace('_', ' ')}</span>
                      <ChevronRight className="w-4 h-4 text-mist" />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-10 text-center">
              <p className="text-sm text-mist">No jobs here yet — create one above.</p>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}

export default function JobsPage() {
  return (
    <StaffGate title="Jobs & Photo Reports">
      <JobsList />
    </StaffGate>
  )
}
