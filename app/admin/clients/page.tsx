'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, AlertTriangle, Loader2, RefreshCw, Search } from 'lucide-react'
import StaffGate from '@/components/admin/StaffGate'
import { supabase } from '@/lib/supabaseClient'
import { handlersA } from '@/lib/ngms-ops/handlers-a'
import type { Client } from '@/lib/ngms-ops/core'

function ClientsList() {
  const [search, setSearch] = useState('')
  const [rows, setRows] = useState<Client[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async (term: string) => {
    setLoading(true)
    setError('')
    try {
      const res = await handlersA.ngms_list_clients(supabase, { limit: 100, ...(term.trim() ? { search: term.trim() } : {}) })
      if (res.isError) throw new Error(res.content[0]?.text ?? 'Could not load clients')
      setRows((res.structuredContent?.clients as Client[]) ?? [])
      setTotal((res.structuredContent?.total as number) ?? 0)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const t = setTimeout(() => load(search), 300)
    return () => clearTimeout(t)
  }, [search, load])

  return (
    <main className="min-h-[70vh] bg-jet px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Link href="/admin" className="text-xs text-mist hover:text-paper inline-flex items-center gap-1 mb-3">
          <ArrowLeft className="w-3.5 h-3.5" /> Admin
        </Link>
        <div className="flex items-center justify-between gap-3 mb-5">
          <h1 className="font-heading text-2xl font-bold text-paper">Clients</h1>
          <button onClick={() => load(search)} aria-label="Refresh" className="text-mist hover:text-paper p-1.5">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <p className="text-xs text-mist mb-3">Clients are added automatically when you quote someone new.</p>

        <label className="relative block mb-4">
          <Search className="w-4 h-4 text-mist absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Name, phone, email or address"
            className="w-full bg-cardgrey border border-darkgrey text-paper rounded-btn pl-9 pr-3 py-3 text-sm focus:outline-none focus:border-blue"
          />
        </label>

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
            <>
              <ul className="divide-y divide-darkgrey">
                {rows.map((c) => (
                  <li key={c.id}>
                    <Link href={`/admin/clients/${c.id}`} className="block px-4 py-3 hover:bg-jet/40">
                      <p className="text-paper font-semibold truncate">{c.name}</p>
                      <p className="text-xs text-mist truncate">{[c.phone, c.suburb, c.email].filter(Boolean).join(' · ') || 'no contact details'}</p>
                    </Link>
                  </li>
                ))}
              </ul>
              <p className="px-4 py-3 text-xs text-mist border-t border-darkgrey">
                {rows.length < total ? `Showing ${rows.length} of ${total}. Search to narrow it down.` : `${total} client${total === 1 ? '' : 's'}`}
              </p>
            </>
          ) : (
            <p className="px-4 py-10 text-center text-sm text-mist">{search ? 'No clients match.' : 'No clients yet.'}</p>
          )}
        </section>
      </div>
    </main>
  )
}

export default function ClientsPage() {
  return (
    <StaffGate title="Clients">
      <ClientsList />
    </StaffGate>
  )
}
