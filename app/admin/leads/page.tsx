'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Loader2, Plus, RefreshCw, AlertTriangle, MessageCircle, Search, ArrowLeft } from 'lucide-react'
import StaffGate from '@/components/admin/StaffGate'
import { supabase } from '@/lib/supabaseClient'
import { LEAD_COLUMNS, STATUS_LABEL, daysAgo, sast, waLink, type Lead } from '@/lib/ngms-leads-ui'

const STALE_DAYS = 3

const FILTERS = [
  { key: 'open', label: 'Open' },
  { key: 'followup', label: 'Follow up' },
  { key: 'won', label: 'Won' },
  { key: 'lost', label: 'Lost' },
  { key: 'all', label: 'All' },
] as const

const STATUS_STYLE: Record<string, string> = {
  new: 'text-blue border-blue',
  contacted: 'text-mist border-darkgrey',
  site_visit: 'text-mist border-darkgrey',
  quoted: 'text-orange border-orange',
  won: 'text-whatsapp border-whatsapp',
  lost: 'text-mist border-darkgrey',
}

function LeadsList() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['key']>('open')
  const [search, setSearch] = useState('')
  const [rows, setRows] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      let q = supabase.from('leads').select(LEAD_COLUMNS)
      if (filter === 'won') q = q.eq('status', 'won')
      else if (filter === 'lost') q = q.eq('status', 'lost')
      else if (filter === 'open' || filter === 'followup') q = q.not('status', 'in', '(won,lost)')
      const { data, error } = await q.order('created_at', { ascending: false }).limit(200)
      if (error) throw new Error(error.message)
      let leads = (data ?? []) as Lead[]
      if (filter === 'followup') leads = leads.filter((l) => daysAgo(l.updated_at) >= STALE_DAYS)
      if (search.trim()) {
        const s = search.trim().toLowerCase()
        leads = leads.filter((l) => [l.name, l.phone, l.email, l.suburb, l.service, l.message].filter(Boolean).some((v) => String(v).toLowerCase().includes(s)))
      }
      leads.sort((a, b) => (filter === 'followup' ? Date.parse(a.updated_at) - Date.parse(b.updated_at) : Date.parse(b.created_at) - Date.parse(a.created_at)))
      setRows(leads)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [filter, search])

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
          <h1 className="font-heading text-2xl font-bold text-paper">Leads</h1>
          <Link href="/admin/leads/new" className="inline-flex items-center gap-1.5 bg-orange text-white font-heading font-semibold px-4 py-2.5 rounded-btn">
            <Plus className="w-4 h-4" /> Add lead
          </Link>
        </div>

        <div className="relative mb-3">
          <Search className="w-4 h-4 text-mist absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            className="w-full bg-cardgrey border border-darkgrey text-paper rounded-btn pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-blue"
            placeholder="Search name, phone, area, service…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 mb-3 flex-wrap">
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
              {rows.map((l) => {
                const wa = waLink(l.phone)
                const stale = !['won', 'lost'].includes(l.status) && daysAgo(l.updated_at) >= STALE_DAYS
                return (
                  <li key={l.id} className="flex items-center gap-3 px-4 py-3">
                    <Link href={`/admin/leads/${l.id}`} className="min-w-0 flex-1 hover:opacity-90">
                      <p className="text-paper font-semibold truncate">
                        {l.name} · {l.service ?? l.service_slug ?? 'service not given'}
                      </p>
                      <p className="text-xs text-mist truncate">
                        {l.suburb ?? 'area not given'} · {l.source} · {sast(l.created_at)}
                        {stale && <span className="text-orange"> · {daysAgo(l.updated_at)}d since touch</span>}
                      </p>
                    </Link>
                    {wa && (
                      <a href={wa} target="_blank" rel="noreferrer" className="shrink-0 inline-flex items-center gap-1 text-xs text-whatsapp hover:text-whatsapp-dark" aria-label="WhatsApp">
                        <MessageCircle className="w-4 h-4" />
                      </a>
                    )}
                    <span className={`shrink-0 text-[10px] uppercase tracking-wider border rounded px-2 py-0.5 ${STATUS_STYLE[l.status] ?? 'text-mist border-darkgrey'}`}>
                      {STATUS_LABEL[l.status] ?? l.status}
                    </span>
                  </li>
                )
              })}
            </ul>
          ) : (
            <div className="px-4 py-10 text-center">
              <p className="text-sm text-mist mb-4">No leads here yet.</p>
              <Link href="/admin/leads/new" className="inline-flex items-center gap-1.5 text-orange font-semibold text-sm">
                <Plus className="w-4 h-4" /> Add your first lead
              </Link>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}

export default function LeadsPage() {
  return (
    <StaffGate title="Leads">
      <LeadsList />
    </StaffGate>
  )
}
