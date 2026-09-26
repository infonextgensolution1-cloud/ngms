'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Loader2, RefreshCw, AlertTriangle, ArrowLeft } from 'lucide-react'
import StaffGate from '@/components/admin/StaffGate'
import { supabase } from '@/lib/supabaseClient'
import { handlersB } from '@/lib/ngms-ops/handlers-b'
import { rand } from '@/lib/ngms-ops/core'

type Row = {
  id: string
  invoice_number: string
  client_name: string | null
  status: string
  total: number
  paid: number
  balance: number
  overdue: boolean
  days_overdue: number
  due_date: string | null
  created_at: string
}

const FILTERS = [
  { key: 'open', label: 'Open' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'paid', label: 'Paid' },
  { key: 'all', label: 'All' },
] as const

const STATUS_STYLE: Record<string, string> = {
  draft: 'text-mist border-darkgrey',
  sent: 'text-blue border-blue',
  partial: 'text-orange border-orange',
  paid: 'text-whatsapp border-whatsapp',
  void: 'text-mist border-darkgrey',
}

function InvoicesList() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['key']>('open')
  const [rows, setRows] = useState<Row[]>([])
  const [outstanding, setOutstanding] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const args: Record<string, unknown> = { limit: 100 }
      if (filter === 'open') args.unpaid_only = true
      if (filter === 'overdue') args.overdue_only = true
      if (filter === 'paid') args.status = 'paid'
      const res = await handlersB.ngms_list_invoices(supabase, args)
      if (res.isError) throw new Error(res.content[0]?.text ?? 'Could not load invoices')
      setRows(((res.structuredContent?.invoices as Row[]) ?? []) as Row[])
      setOutstanding((res.structuredContent?.outstanding_on_page as number) ?? 0)
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
          <h1 className="font-heading text-2xl font-bold text-paper">Invoices</h1>
        </div>
        <p className="text-xs text-mist mb-3">New invoices are raised from an accepted quote — open the quote and use &quot;Create invoice&quot;.</p>

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
            <>
              <ul className="divide-y divide-darkgrey">
                {rows.map((r) => (
                  <li key={r.id}>
                    <Link href={`/admin/invoices/${r.id}`} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-jet/40">
                      <div className="min-w-0">
                        <p className="text-paper font-semibold truncate">
                          {r.invoice_number} · {r.client_name ?? '—'}
                        </p>
                        <p className="text-xs text-mist truncate">
                          due {r.due_date ?? '—'} · {new Date(r.created_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', timeZone: 'Africa/Johannesburg' })}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-paper text-sm">{rand(r.balance)}</p>
                        <span className={`inline-block mt-0.5 text-[10px] uppercase tracking-wider border rounded px-2 py-0.5 ${STATUS_STYLE[r.status] ?? 'text-mist border-darkgrey'}`}>
                          {r.overdue ? `${r.days_overdue}d overdue` : r.status}
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
              <p className="px-4 py-3 text-xs text-mist border-t border-darkgrey">
                {rows.length} invoice{rows.length === 1 ? '' : 's'} · {rand(outstanding)} outstanding on this page
              </p>
            </>
          ) : (
            <div className="px-4 py-10 text-center">
              <p className="text-sm text-mist">No invoices here yet.</p>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}

export default function InvoicesPage() {
  return (
    <StaffGate title="Invoices">
      <InvoicesList />
    </StaffGate>
  )
}
