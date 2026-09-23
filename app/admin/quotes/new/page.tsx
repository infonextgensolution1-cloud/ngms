'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Loader2, Plus, Trash2, ArrowLeft, AlertTriangle, Sun, Search, Check } from 'lucide-react'
import StaffGate from '@/components/admin/StaffGate'
import { supabase } from '@/lib/supabaseClient'
import { handlersA } from '@/lib/ngms-ops/handlers-a'
import { rand, OVERBERG, DEFAULT_DEPOSIT_PERCENT } from '@/lib/ngms-ops/core'
import { RATE_CARD, CALLOUT_FEE, solarPrice } from '@/lib/rate-card'

type Line = { key: number; description: string; quantity: string; unit: string; unit_price: string; service_slug?: string }
type ClientRow = { id: string; name: string; phone: string | null; suburb: string | null }
type LeadRow = { id: string; name: string; phone: string | null; suburb: string | null; service: string | null; service_slug: string | null; status: string; message: string | null }
type Mode = 'new' | 'existing' | 'lead'

const input = 'w-full bg-jet border border-darkgrey text-paper rounded-btn px-3 py-2.5 text-sm focus:outline-none focus:border-blue'
let lineKey = 1

function toNum(v: string): number {
  const n = parseFloat(v.replace(',', '.'))
  return Number.isFinite(n) ? n : 0
}

function Builder() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('new')

  // new client
  const [cName, setCName] = useState('')
  const [cPhone, setCPhone] = useState('')
  const [cEmail, setCEmail] = useState('')
  const [cAddress, setCAddress] = useState('')
  const [cSuburb, setCSuburb] = useState('')

  // existing client
  const [search, setSearch] = useState('')
  const [clients, setClients] = useState<ClientRow[]>([])
  const [client, setClient] = useState<ClientRow | null>(null)

  // lead
  const [leads, setLeads] = useState<LeadRow[]>([])
  const [lead, setLead] = useState<LeadRow | null>(null)

  const [lines, setLines] = useState<Line[]>([])
  const [group, setGroup] = useState(RATE_CARD[0].slug)
  const [panels, setPanels] = useState('')
  const [depositPct, setDepositPct] = useState(String(DEFAULT_DEPOSIT_PERCENT))
  const [validDays, setValidDays] = useState('30')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Open leads for the "From lead" tab; ?lead=<id> preselects one.
  useEffect(() => {
    supabase
      .from('leads')
      .select('id,name,phone,suburb,service,service_slug,status,message')
      .not('status', 'in', '(won,lost)')
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }) => {
        const rows = (data ?? []) as LeadRow[]
        setLeads(rows)
        const wanted = new URLSearchParams(window.location.search).get('lead')
        const hit = wanted ? rows.find((l) => l.id === wanted) : undefined
        if (hit) {
          setMode('lead')
          setLead(hit)
        }
      })
  }, [])

  // Client search (debounced).
  useEffect(() => {
    if (mode !== 'existing') return
    const t = setTimeout(async () => {
      const res = await handlersA.ngms_list_clients(supabase, search.trim() ? { search: search.trim(), limit: 20 } : { limit: 20 })
      if (!res.isError) setClients(((res.structuredContent?.clients as ClientRow[]) ?? []) as ClientRow[])
    }, 300)
    return () => clearTimeout(t)
  }, [search, mode])

  const suburb = mode === 'new' ? cSuburb : mode === 'existing' ? client?.suburb ?? '' : lead?.suburb ?? ''
  const needsCallout = !!suburb && OVERBERG.test(suburb) && !lines.some((l) => /call.?out|travel/i.test(l.description))

  const subtotal = useMemo(() => lines.reduce((s, l) => s + Math.round(toNum(l.quantity) * toNum(l.unit_price) * 100) / 100, 0), [lines])
  const deposit = Math.round(((subtotal * Math.min(100, Math.max(0, toNum(depositPct)))) / 100) * 100) / 100

  function addLine(l: Omit<Line, 'key'>) {
    setLines((ls) => [...ls, { ...l, key: lineKey++ }])
  }
  function update(key: number, patch: Partial<Line>) {
    setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...patch } : l)))
  }
  function remove(key: number) {
    setLines((ls) => ls.filter((l) => l.key !== key))
  }
  function addSolar() {
    const n = Math.round(toNum(panels))
    if (n < 1) return
    const p = solarPrice(n)
    addLine({
      description: `Solar panel cleaning — ${n} panels (purified water, soft brush)`,
      quantity: String(p.quantity),
      unit: p.unit,
      unit_price: String(p.price),
      service_slug: 'solar-panel-cleaning',
    })
    setPanels('')
  }

  async function save(status: 'draft') {
    setError('')
    const items = lines
      .filter((l) => l.description.trim())
      .map((l) => ({
        description: l.description.trim(),
        quantity: toNum(l.quantity) || 1,
        unit: l.unit.trim() || 'item',
        unit_price: toNum(l.unit_price),
        ...(l.service_slug ? { service_slug: l.service_slug } : {}),
      }))
    if (!items.length) return setError('Add at least one line.')
    const args: Record<string, unknown> = {
      items,
      deposit_percent: Math.min(100, Math.max(0, toNum(depositPct))),
      valid_days: Math.max(1, Math.round(toNum(validDays)) || 30),
      status,
    }
    if (notes.trim()) args.notes = notes.trim()
    if (mode === 'new') {
      if (!cName.trim()) return setError('Add the client name.')
      args.client = Object.fromEntries(
        Object.entries({ name: cName.trim(), phone: cPhone.trim(), email: cEmail.trim(), address: cAddress.trim(), suburb: cSuburb.trim() }).filter(([, v]) => v),
      )
    } else if (mode === 'existing') {
      if (!client) return setError('Pick a client.')
      args.client_id = client.id
    } else {
      if (!lead) return setError('Pick a lead.')
      args.lead_id = lead.id
    }

    setSaving(true)
    try {
      const res = await handlersA.ngms_create_quote(supabase, args)
      if (res.isError) throw new Error(res.content[0]?.text ?? 'Could not save the quote')
      const q = res.structuredContent?.quote as { id: string } | undefined
      if (!q?.id) throw new Error('Saved, but no quote id came back. Check the quotes list.')
      router.push(`/admin/quotes/${q.id}`)
    } catch (e) {
      setError((e as Error).message)
      setSaving(false)
    }
  }

  const tab = (m: Mode, label: string) => (
    <button
      onClick={() => setMode(m)}
      className={`flex-1 text-xs py-2 rounded-btn border ${mode === m ? 'border-orange text-orange' : 'border-darkgrey text-mist'}`}
    >
      {label}
    </button>
  )
  const activeGroup = RATE_CARD.find((g) => g.slug === group) ?? RATE_CARD[0]

  return (
    <main className="min-h-[70vh] bg-jet px-4 py-8 pb-32">
      <div className="max-w-2xl mx-auto">
        <Link href="/admin/quotes" className="text-xs text-mist hover:text-paper inline-flex items-center gap-1 mb-3">
          <ArrowLeft className="w-3.5 h-3.5" /> Quotes
        </Link>
        <h1 className="font-heading text-2xl font-bold text-paper mb-5">New quote</h1>

        {/* Client */}
        <section className="bg-cardgrey border border-darkgrey rounded-card p-4 mb-4">
          <h2 className="font-heading font-bold text-paper mb-3">Client</h2>
          <div className="flex gap-2 mb-4">
            {tab('new', 'New client')}
            {tab('existing', 'Existing')}
            {tab('lead', `From lead${leads.length ? ` (${leads.length})` : ''}`)}
          </div>

          {mode === 'new' && (
            <div className="grid gap-3 sm:grid-cols-2">
              <input className={input} placeholder="Name or complex *" value={cName} onChange={(e) => setCName(e.target.value)} />
              <input className={input} placeholder="Phone" inputMode="tel" value={cPhone} onChange={(e) => setCPhone(e.target.value)} />
              <input className={input} placeholder="Email" inputMode="email" value={cEmail} onChange={(e) => setCEmail(e.target.value)} />
              <input className={input} placeholder="Suburb (e.g. Gordon's Bay)" value={cSuburb} onChange={(e) => setCSuburb(e.target.value)} />
              <input className={`${input} sm:col-span-2`} placeholder="Street address" value={cAddress} onChange={(e) => setCAddress(e.target.value)} />
              <p className="text-[11px] text-mist sm:col-span-2">If this phone number is already on file, the existing client is reused.</p>
            </div>
          )}

          {mode === 'existing' && (
            <div>
              <div className="relative mb-2">
                <Search className="w-4 h-4 text-mist absolute left-3 top-1/2 -translate-y-1/2" />
                <input className={`${input} pl-9`} placeholder="Search name, phone or area" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              {clients.length ? (
                <ul className="divide-y divide-darkgrey max-h-64 overflow-auto">
                  {clients.map((c) => (
                    <li key={c.id}>
                      <button onClick={() => setClient(c)} className="w-full flex items-center justify-between gap-3 py-2 text-left text-sm">
                        <span className="min-w-0">
                          <span className="text-paper block truncate">{c.name}</span>
                          <span className="text-xs text-mist block truncate">{[c.phone, c.suburb].filter(Boolean).join(' · ') || '—'}</span>
                        </span>
                        {client?.id === c.id && <Check className="w-4 h-4 text-whatsapp shrink-0" />}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-mist">No clients found. Use &quot;New client&quot; instead.</p>
              )}
            </div>
          )}

          {mode === 'lead' &&
            (leads.length ? (
              <ul className="divide-y divide-darkgrey max-h-72 overflow-auto">
                {leads.map((l) => (
                  <li key={l.id}>
                    <button onClick={() => setLead(l)} className="w-full flex items-center justify-between gap-3 py-2 text-left text-sm">
                      <span className="min-w-0">
                        <span className="text-paper block truncate">
                          {l.name} · {l.service ?? l.service_slug ?? 'service not given'}
                        </span>
                        <span className="text-xs text-mist block truncate">{[l.suburb, l.status, l.message].filter(Boolean).join(' · ')}</span>
                      </span>
                      {lead?.id === l.id && <Check className="w-4 h-4 text-whatsapp shrink-0" />}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-mist">No open leads.</p>
            ))}
        </section>

        {/* Lines */}
        <section className="bg-cardgrey border border-darkgrey rounded-card p-4 mb-4">
          <h2 className="font-heading font-bold text-paper mb-3">Work & prices (ex VAT)</h2>

          <div className="bg-jet border border-darkgrey rounded-card p-3 mb-3">
            <p className="text-xs text-mist mb-2 flex items-center gap-1">
              <Sun className="w-3.5 h-3.5 text-orange" /> Solar quick price
            </p>
            <div className="flex gap-2">
              <input className={input} inputMode="numeric" placeholder="Number of panels" value={panels} onChange={(e) => setPanels(e.target.value)} />
              <button onClick={addSolar} className="shrink-0 bg-orange text-white text-sm font-semibold px-4 rounded-btn">
                Add
              </button>
            </div>
            {toNum(panels) >= 1 && (
              <p className="text-[11px] text-mist mt-1.5">
                {(() => {
                  const p = solarPrice(Math.round(toNum(panels)))
                  return `${rand(p.price * p.quantity)}${p.unit === 'panel' ? ` (${p.quantity} × R50)` : ''}`
                })()}
              </p>
            )}
          </div>

          <div className="mb-3">
            <p className="text-xs text-mist mb-2">Rate card: tap to add</p>
            <div className="flex gap-1.5 overflow-x-auto pb-2 -mx-1 px-1">
              {RATE_CARD.map((g) => (
                <button
                  key={g.slug}
                  onClick={() => setGroup(g.slug)}
                  className={`shrink-0 text-xs px-3 py-1.5 rounded-btn border ${g.slug === group ? 'border-orange text-orange' : 'border-darkgrey text-mist'}`}
                >
                  {g.group}
                </button>
              ))}
            </div>
            <div className="grid gap-1.5">
              {activeGroup.items.map((it) => (
                <button
                  key={it.label}
                  onClick={() => addLine({ description: it.label, quantity: '1', unit: it.unit, unit_price: String(it.price), service_slug: activeGroup.slug })}
                  className="flex items-center justify-between gap-3 text-left text-sm bg-jet border border-darkgrey rounded-btn px-3 py-2 hover:border-orange"
                >
                  <span className="text-paper">{it.label}</span>
                  <span className="text-mist shrink-0 text-xs">
                    {rand(it.price)}/{it.unit}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {needsCallout && (
            <button
              onClick={() => addLine({ description: 'Callout fee (outside the Helderberg Basin)', quantity: '1', unit: 'job', unit_price: String(CALLOUT_FEE) })}
              className="w-full mb-3 text-xs text-orange border border-orange/60 rounded-btn px-3 py-2 flex items-center gap-2"
            >
              <AlertTriangle className="w-4 h-4" /> {suburb} is outside the basin. Tap to add the R350 callout.
            </button>
          )}

          {lines.length > 0 && (
            <ul className="grid gap-3 mt-4">
              {lines.map((l) => (
                <li key={l.key} className="bg-jet border border-darkgrey rounded-card p-3">
                  <div className="flex gap-2">
                    <textarea
                      className={`${input} min-h-[44px]`}
                      rows={2}
                      value={l.description}
                      onChange={(e) => update(l.key, { description: e.target.value })}
                    />
                    <button onClick={() => remove(l.key)} aria-label="Remove line" className="shrink-0 text-mist hover:text-orange p-2">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    <label className="text-[10px] text-mist uppercase">
                      Qty
                      <input className={`${input} mt-0.5`} inputMode="decimal" value={l.quantity} onChange={(e) => update(l.key, { quantity: e.target.value })} />
                    </label>
                    <label className="text-[10px] text-mist uppercase">
                      Unit
                      <input className={`${input} mt-0.5`} value={l.unit} onChange={(e) => update(l.key, { unit: e.target.value })} />
                    </label>
                    <label className="text-[10px] text-mist uppercase">
                      Price (R)
                      <input className={`${input} mt-0.5`} inputMode="decimal" value={l.unit_price} onChange={(e) => update(l.key, { unit_price: e.target.value })} />
                    </label>
                  </div>
                  <p className="text-right text-xs text-mist mt-1.5">{rand(toNum(l.quantity) * toNum(l.unit_price))}</p>
                </li>
              ))}
            </ul>
          )}

          <button
            onClick={() => addLine({ description: '', quantity: '1', unit: 'item', unit_price: '' })}
            className="mt-3 w-full inline-flex items-center justify-center gap-1.5 text-sm text-mist border border-dashed border-darkgrey rounded-btn py-2.5 hover:text-paper"
          >
            <Plus className="w-4 h-4" /> Custom line
          </button>
          <p className="text-[11px] text-mist mt-2">For a discount (e.g. NGX10), add a custom line with a negative price.</p>
        </section>

        {/* Terms */}
        <section className="bg-cardgrey border border-darkgrey rounded-card p-4 mb-4 grid gap-3">
          <h2 className="font-heading font-bold text-paper">Terms</h2>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs text-mist">
              Deposit %
              <input className={`${input} mt-1`} inputMode="numeric" value={depositPct} onChange={(e) => setDepositPct(e.target.value)} />
            </label>
            <label className="text-xs text-mist">
              Valid for (days)
              <input className={`${input} mt-1`} inputMode="numeric" value={validDays} onChange={(e) => setValidDays(e.target.value)} />
            </label>
          </div>
          <label className="text-xs text-mist">
            Scope notes (printed on the quote)
            <textarea
              className={`${input} mt-1 min-h-[88px]`}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What's included, what's excluded, access, paint brand, etc."
            />
          </label>
        </section>

        {error && (
          <p className="text-sm text-orange flex items-start gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" /> {error}
          </p>
        )}
      </div>

      {/* Sticky totals + save */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-jet/95 backdrop-blur border-t border-darkgrey px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="font-heading text-xl font-bold text-paper">{rand(subtotal)}</p>
            <p className="text-[11px] text-mist truncate">
              Deposit {toNum(depositPct)}% {rand(deposit)} · ex VAT
            </p>
          </div>
          <button
            onClick={() => save('draft')}
            disabled={saving}
            className="shrink-0 mr-16 inline-flex items-center gap-1.5 text-sm px-5 py-2.5 rounded-btn bg-orange text-white font-semibold disabled:opacity-50"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />} Save &amp; preview
          </button>
        </div>
      </div>
    </main>
  )
}

export default function NewQuotePage() {
  return (
    <StaffGate title="New quote">
      <Builder />
    </StaffGate>
  )
}
