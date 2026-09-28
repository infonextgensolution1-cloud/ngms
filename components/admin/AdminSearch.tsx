'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Loader2, Search, User, Users, FileText, Receipt, HardHat } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

type Hit = { key: string; href: string; icon: LucideIcon; title: string; sub: string }

// Characters that would break a PostgREST or() filter or act as wildcards.
const clean = (q: string) => q.replace(/[%*,()"'\\]/g, ' ').trim()

/** Phone digits without the leading 0 or 27, so "063 138 7945" finds "+27631387945". */
function phoneDigits(q: string): string | null {
  const d = q.replace(/\D/g, '').replace(/^(27|0)/, '')
  return d.length >= 4 ? d : null
}

async function search(raw: string): Promise<Hit[]> {
  const q = clean(raw)
  if (q.length < 2) return []
  const like = `*${q}*`
  const digits = phoneDigits(q)
  const who = (col: string) => [`${col}.ilike.${like}`, ...(digits ? [`phone.ilike.*${digits}*`] : [])].join(',')

  const [clients, leads, quotes, invoices, jobs] = await Promise.all([
    supabase.from('clients').select('id,name,phone,suburb').or(who('name')).limit(6),
    supabase.from('leads').select('id,name,phone,suburb,status,service').or(who('name')).order('created_at', { ascending: false }).limit(6),
    supabase.from('quotes').select('id,quote_number,status,total_amount,clients(name)').ilike('quote_number', like).limit(5),
    supabase.from('invoices').select('id,invoice_number,status,total_amount,clients(name)').ilike('invoice_number', like).limit(5),
    supabase.from('jobs').select('id,title,status,scheduled_date').ilike('title', like).order('created_at', { ascending: false }).limit(5),
  ])

  const name = (c: unknown) => (Array.isArray(c) ? c[0]?.name : (c as { name?: string } | null)?.name) ?? '—'
  const rand = (n: number | null) => `R${Math.round(Number(n ?? 0)).toLocaleString('en-ZA')}`

  return [
    ...(clients.data ?? []).map((c) => ({ key: `c${c.id}`, href: `/admin/clients/${c.id}`, icon: User, title: c.name ?? 'Client', sub: `Client · ${[c.phone, c.suburb].filter(Boolean).join(' · ')}` })),
    ...(leads.data ?? []).map((l) => ({ key: `l${l.id}`, href: `/admin/leads/${l.id}`, icon: Users, title: l.name, sub: `Lead · ${l.status} · ${[l.service, l.suburb].filter(Boolean).join(' · ')}` })),
    ...(quotes.data ?? []).map((x) => ({ key: `q${x.id}`, href: `/admin/quotes/${x.id}`, icon: FileText, title: x.quote_number, sub: `Quote · ${name(x.clients)} · ${x.status} · ${rand(x.total_amount)}` })),
    ...(invoices.data ?? []).map((x) => ({ key: `i${x.id}`, href: `/admin/invoices/${x.id}`, icon: Receipt, title: x.invoice_number, sub: `Invoice · ${name(x.clients)} · ${x.status} · ${rand(x.total_amount)}` })),
    ...(jobs.data ?? []).map((j) => ({ key: `j${j.id}`, href: `/admin/jobs/${j.id}`, icon: HardHat, title: j.title ?? 'Job', sub: `Job · ${j.status.replace('_', ' ')} · ${j.scheduled_date ?? 'no date'}` })),
  ]
}

/** One box that finds any client, lead, quote, invoice or job by name, phone or number. */
export default function AdminSearch() {
  const [q, setQ] = useState('')
  const [hits, setHits] = useState<Hit[]>([])
  const [busy, setBusy] = useState(false)
  const seq = useRef(0)

  useEffect(() => {
    const run = ++seq.current
    if (clean(q).length < 2) {
      setHits([])
      setBusy(false)
      return
    }
    setBusy(true)
    const t = setTimeout(async () => {
      const res = await search(q).catch(() => [])
      if (run === seq.current) {
        setHits(res)
        setBusy(false)
      }
    }, 300)
    return () => clearTimeout(t)
  }, [q])

  return (
    <div className="mb-6">
      <label className="relative block">
        <Search className="w-5 h-5 text-mist absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search clients, phone, quote or invoice number"
          className="w-full bg-cardgrey border border-darkgrey text-paper rounded-card pl-11 pr-10 py-3.5 text-base focus:outline-none focus:border-blue"
        />
        {busy && <Loader2 className="w-4 h-4 text-mist animate-spin absolute right-3.5 top-1/2 -translate-y-1/2" />}
      </label>
      {clean(q).length >= 2 && !busy && (
        <div className="mt-2 bg-cardgrey border border-darkgrey rounded-card overflow-hidden">
          {hits.length ? (
            <ul className="divide-y divide-darkgrey">
              {hits.map(({ key, href, icon: Icon, title, sub }) => (
                <li key={key}>
                  <Link href={href} className="flex items-center gap-3 px-4 py-3 hover:bg-jet/40">
                    <Icon className="w-4 h-4 text-orange shrink-0" />
                    <span className="min-w-0">
                      <span className="block text-paper font-semibold truncate">{title}</span>
                      <span className="block text-xs text-mist truncate">{sub}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-4 py-3 text-sm text-mist">Nothing found for &ldquo;{q}&rdquo;.</p>
          )}
        </div>
      )}
    </div>
  )
}
