'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Loader2, Plus, RefreshCw, AlertTriangle, ChevronRight, ArrowLeft, Save } from 'lucide-react'
import StaffGate from '@/components/admin/StaffGate'
import { supabase } from '@/lib/supabaseClient'
import { handlersA } from '@/lib/ngms-ops/handlers-a'
import { rand } from '@/lib/ngms-ops/core'
import { PLACEHOLDER_ACC } from '@/lib/quote-terms'

type Row = { id: string; quote_number: string; client_name: string | null; client_suburb: string | null; total: number; status: string; past_valid_date: boolean; created_at: string }

const FILTERS = [
  { key: 'open', label: 'Open' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'all', label: 'All' },
] as const

const STATUS_STYLE: Record<string, string> = {
  draft: 'text-mist border-darkgrey',
  sent: 'text-blue border-blue',
  accepted: 'text-whatsapp border-whatsapp',
  declined: 'text-orange border-orange',
  expired: 'text-orange border-orange',
}

function BusinessSettings() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [bank, setBank] = useState('')
  const [address, setAddress] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    supabase
      .from('settings')
      .select('business_name,bank_details,address')
      .eq('id', 1)
      .maybeSingle()
      .then(({ data }) => {
        setName((data?.business_name as string) ?? '')
        setBank((data?.bank_details as string) ?? '')
        setAddress((data?.address as string) ?? '')
        if (!data?.bank_details || PLACEHOLDER_ACC.test(String(data.bank_details))) setOpen(true)
      })
  }, [])

  async function save() {
    setSaving(true)
    setMsg('')
    const { error } = await supabase
      .from('settings')
      .update({ business_name: name.trim() || null, bank_details: bank.trim() || null, address: address.trim() || null, updated_at: new Date().toISOString() })
      .eq('id', 1)
    setMsg(error ? error.message : 'Saved.')
    setSaving(false)
  }

  const placeholder = !bank || PLACEHOLDER_ACC.test(bank)
  const input = 'w-full bg-jet border border-darkgrey text-paper rounded-btn px-3 py-2.5 text-sm focus:outline-none focus:border-blue'

  return (
    <section className="bg-cardgrey border border-darkgrey rounded-card p-4 mb-4">
      <button onClick={() => setOpen((o) => !o)} className="w-full flex items-center justify-between gap-3 text-left">
        <div>
          <h2 className="font-heading font-bold text-paper">Business & banking on quotes</h2>
          {placeholder ? (
            <p className="text-xs text-orange flex items-center gap-1 mt-0.5">
              <AlertTriangle className="w-3.5 h-3.5" /> Capitec account number not set: quotes can&apos;t be downloaded yet
            </p>
          ) : (
            <p className="text-xs text-mist mt-0.5">{name || 'Business name not set'}</p>
          )}
        </div>
        <ChevronRight className={`w-5 h-5 text-mist transition-transform ${open ? 'rotate-90' : ''}`} />
      </button>
      {open && (
        <div className="grid gap-3 mt-4">
          <label className="text-xs text-mist">
            Business name
            <input className={`${input} mt-1`} value={name} onChange={(e) => setName(e.target.value)} placeholder="NextGen Solar Clean & Maintenance Solutions" />
          </label>
          <label className="text-xs text-mist">
            Address (optional)
            <input className={`${input} mt-1`} value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Strand, Western Cape" />
          </label>
          <label className="text-xs text-mist">
            Banking details (printed on every quote)
            <textarea
              className={`${input} mt-1 min-h-[96px]`}
              value={bank}
              onChange={(e) => setBank(e.target.value)}
              placeholder={'Capitec Bank · Entrepreneurs Savings Account\nAccount holder: JC Gordon\nAccount no: __________\nBranch code: 470010'}
            />
          </label>
          <p className="text-[11px] text-mist">Check the account number twice. It goes on every quote you send.</p>
          <div className="flex items-center gap-3">
            <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 bg-blue hover:bg-blue-dark text-white font-heading font-semibold px-4 py-2.5 rounded-btn disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
            </button>
            {msg && <span className="text-xs text-mist">{msg}</span>}
          </div>
        </div>
      )}
    </section>
  )
}

function QuotesList() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['key']>('open')
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const args: Record<string, unknown> = { limit: 100 }
      if (filter === 'open') args.open_only = true
      if (filter === 'accepted') args.status = 'accepted'
      const res = await handlersA.ngms_list_quotes(supabase, args)
      if (res.isError) throw new Error(res.content[0]?.text ?? 'Could not load quotes')
      setRows(((res.structuredContent?.quotes as Row[]) ?? []) as Row[])
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => {
    load()
  }, [load])

  const total = rows.reduce((s, r) => s + (r.total ?? 0), 0)

  return (
    <main className="min-h-[70vh] bg-jet px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Link href="/admin" className="text-xs text-mist hover:text-paper inline-flex items-center gap-1 mb-3">
          <ArrowLeft className="w-3.5 h-3.5" /> Admin
        </Link>
        <div className="flex items-center justify-between gap-3 mb-5">
          <h1 className="font-heading text-2xl font-bold text-paper">Quotes</h1>
          <Link href="/admin/quotes/new" className="inline-flex items-center gap-1.5 bg-orange text-white font-heading font-semibold px-4 py-2.5 rounded-btn">
            <Plus className="w-4 h-4" /> New quote
          </Link>
        </div>

        <BusinessSettings />

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
                    <Link href={`/admin/quotes/${r.id}`} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-jet/40">
                      <div className="min-w-0">
                        <p className="text-paper font-semibold truncate">
                          {r.quote_number} · {r.client_name ?? '—'}
                        </p>
                        <p className="text-xs text-mist truncate">
                          {r.client_suburb ?? 'area not given'} · {new Date(r.created_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', timeZone: 'Africa/Johannesburg' })}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-paper text-sm">{rand(r.total)}</p>
                        <span className={`inline-block mt-0.5 text-[10px] uppercase tracking-wider border rounded px-2 py-0.5 ${r.past_valid_date ? STATUS_STYLE.expired : STATUS_STYLE[r.status] ?? 'text-mist border-darkgrey'}`}>
                          {r.past_valid_date ? 'expired' : r.status}
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
              <p className="px-4 py-3 text-xs text-mist border-t border-darkgrey">
                {rows.length} quote{rows.length === 1 ? '' : 's'} · {rand(total)} ex VAT
              </p>
            </>
          ) : (
            <div className="px-4 py-10 text-center">
              <p className="text-sm text-mist mb-4">No quotes here yet.</p>
              <Link href="/admin/quotes/new" className="inline-flex items-center gap-1.5 text-orange font-semibold text-sm">
                <Plus className="w-4 h-4" /> Make your first quote
              </Link>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}

export default function QuotesPage() {
  return (
    <StaffGate title="Quotes">
      <QuotesList />
    </StaffGate>
  )
}
