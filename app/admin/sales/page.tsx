'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { MessageCircle, RefreshCw, ArrowLeft, FileText, Briefcase, UserPlus } from 'lucide-react'
import StaffGate from '@/components/admin/StaffGate'
import { supabase } from '@/lib/supabaseClient'

type Lead = { id: string; name: string; phone: string | null; service: string | null; status: string; updated_at: string }
type Quote = { id: string; quote_number: string; client_name: string | null; total: number; status: string; valid_until: string | null }
type Job = { id: string; title: string | null; status: string; scheduled_date: string | null; client_name: string | null }
type Plan = { id: string; name: string; service_scope: string | null; status: string; next_due_date: string | null; discount_percent: number }

const stages = [
  ['new', 'Lead'],
  ['contacted', 'Qualified'],
  ['site_visit', 'Site Assessment'],
  ['quoted', 'Quote / Follow-up'],
  ['won', 'Won'],
  ['lost', 'Lost'],
] as const

function wa(phone: string | null, text: string) {
  if (!phone) return null
  const digits = phone.replace(/\D/g, '')
  return 'https://wa.me/' + (digits.startsWith('0') ? '27' + digits.slice(1) : digits) + '?text=' + encodeURIComponent(text)
}

function draftForLead(l: Lead) {
  const first = l.name.split(/\s+/)[0]
  if (l.status === 'new') return `Hi ${first}, thanks for contacting NextGen. We’ve received your ${l.service ?? 'maintenance'} request. I’ll confirm the details and next step shortly. — NextGen`
  if (l.status === 'contacted') return `Hi ${first}, just following up on your ${l.service ?? 'maintenance'} request. Would you like us to arrange a site assessment?`
  if (l.status === 'site_visit') return `Hi ${first}, we’re ready to arrange the site assessment for your ${l.service ?? 'maintenance'} job. Please let us know a suitable time.`
  if (l.status === 'quoted') return `Hi ${first}, just checking that you received your NextGen quotation. Please let us know if you have any questions or would like us to revise anything.`
  if (l.status === 'won') return `Hi ${first}, thank you for accepting the NextGen quotation. We’ll coordinate the next job-scheduling step with you.`
  return `Hi ${first}, thank you for considering NextGen. If the project becomes active again, we’d be happy to assist.`
}

function SalesDashboard() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [jobs, setJobs] = useState<Job[]>([])
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [versioningReady, setVersioningReady] = useState<boolean | null>(null)

  async function load() {
    setLoading(true)
    const [l, q, j, v, p] = await Promise.all([
      supabase.from('leads').select('id,name,phone,service,status,updated_at').order('updated_at', { ascending: false }).limit(100),
      supabase.from('quotes').select('id,quote_number,client_id,total_amount,status,valid_until').order('created_at', { ascending: false }).limit(100),
      supabase.from('jobs').select('id,title,status,scheduled_date,client_id').order('created_at', { ascending: false }).limit(100),
      supabase.from('quote_versions').select('id').limit(1),
      supabase.from('maintenance_plans').select('id,name,service_scope,status,next_due_date,discount_percent').order('next_due_date', { ascending: true }).limit(50),
    ])
    setLeads((l.data ?? []) as Lead[])
    setVersioningReady(!v.error)
    setQuotes(((q.data ?? []) as any[]).map(x => ({ id:x.id, quote_number:x.quote_number, client_name:x.client_id ? 'Client record' : null, total:Number(x.total_amount ?? 0), status:x.status, valid_until:x.valid_until })))
    setJobs(((j.data ?? []) as any[]).map(x => ({ id:x.id, title:x.title, status:x.status, scheduled_date:x.scheduled_date, client_name:x.client_id ? 'Client record' : null })))
    setPlans((p.data ?? []) as Plan[])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const counts = useMemo(() => Object.fromEntries(stages.map(([s]) => [s, leads.filter(l => l.status === s).length])), [leads])
  const followups = leads.filter(l => !['won','lost'].includes(l.status)).sort((a,b) => Date.parse(a.updated_at)-Date.parse(b.updated_at)).slice(0,8)
  const expiring = quotes.filter(q => q.status === 'sent' && q.valid_until && q.valid_until <= new Date(Date.now()+7*86400000).toISOString().slice(0,10))

  return (
    <main className="min-h-[70vh] bg-jet px-4 py-8">
      <div className="max-w-5xl mx-auto">
        <Link href="/admin" className="text-xs text-mist hover:text-paper inline-flex items-center gap-1 mb-3"><ArrowLeft className="w-3.5 h-3.5" /> Admin</Link>
        <div className="flex items-center justify-between gap-3 mb-6">
          <div><p className="kicker">Sales Engine</p><h1 className="font-heading text-2xl md:text-3xl font-bold text-paper">NGMS Sales Control</h1><p className="text-sm text-mist mt-1">Lead → Qualified → Assessment → Quote → Follow-up → Won/Lost → Job → Repeat Maintenance</p></div>
          <button onClick={load} className="text-mist hover:text-paper p-2" aria-label="Refresh"><RefreshCw className={loading ? 'w-4 h-4 animate-spin' : 'w-4 h-4'} /></button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-2 mb-6">
          {stages.map(([key,label]) => <div key={key} className="bg-cardgrey border border-darkgrey rounded-card p-3"><p className="text-[10px] uppercase tracking-wider text-mist">{label}</p><p className="text-2xl font-heading font-bold text-paper mt-1">{counts[key] ?? 0}</p></div>)}
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <section className="bg-cardgrey border border-darkgrey rounded-card p-4">
            <div className="flex items-center gap-2 mb-3"><UserPlus className="w-4 h-4 text-orange"/><h2 className="font-heading font-bold text-paper">WhatsApp follow-ups</h2></div>
            <div className="space-y-2">
              {followups.length ? followups.map(l => { const link=wa(l.phone,draftForLead(l)); return <div key={l.id} className="border-b border-darkgrey pb-2"><div className="flex justify-between gap-2"><Link href={`/admin/leads/${l.id}`} className="text-sm text-paper hover:text-blue">{l.name}</Link><span className="text-[10px] uppercase text-mist">{l.status}</span></div><p className="text-xs text-mist mt-1">{draftForLead(l)}</p>{link && <a href={link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-whatsapp mt-1"><MessageCircle className="w-3.5 h-3.5"/> Open draft in WhatsApp</a>}</div>}) : <p className="text-sm text-mist">No open follow-ups.</p>}
            </div>
          </section>

          <section className="bg-cardgrey border border-darkgrey rounded-card p-4">
            <div className="flex items-center gap-2 mb-3"><FileText className="w-4 h-4 text-blue"/><h2 className="font-heading font-bold text-paper">Quote control</h2></div>
            <p className="text-xs text-mist mb-3">{expiring.length} sent quote{expiring.length === 1 ? '' : 's'} expire within 7 days.</p>
            <div className="space-y-2">{expiring.map(q => <Link key={q.id} href={`/admin/quotes/${q.id}`} className="block border-b border-darkgrey pb-2"><p className="text-sm text-paper">{q.quote_number}</p><p className="text-xs text-mist">R{q.total.toFixed(2)} · valid until {q.valid_until}</p></Link>)}{!expiring.length && <p className="text-sm text-mist">No expiring sent quotes.</p>}</div>
            <div className={`mt-4 text-xs rounded-btn px-3 py-2 ${versioningReady ? 'bg-whatsapp/10 text-whatsapp' : 'bg-orange/10 text-orange'}`}>{versioningReady ? 'Quote versioning database is ready.' : 'Quote versioning migration is not deployed yet.'}</div>
          </section>

          <section className="bg-cardgrey border border-darkgrey rounded-card p-4">
            <div className="flex items-center gap-2 mb-3"><RefreshCw className="w-4 h-4 text-whatsapp"/><h2 className="font-heading font-bold text-paper">Maintenance pipeline</h2></div>
            <p className="text-xs text-mist mb-3">Offers are created after completed jobs; activation remains customer-controlled.</p>
            <div className="space-y-2">
              {plans.slice(0,6).map(p => <div key={p.id} className="border-b border-darkgrey pb-2"><div className="flex justify-between gap-2"><p className="text-sm text-paper">{p.name}</p><span className="text-[10px] uppercase text-mist">{p.status}</span></div><p className="text-xs text-mist mt-1">{p.service_scope ?? 'Property maintenance'} · next due {p.next_due_date ?? '—'}{Number(p.discount_percent) ? ` · ${p.discount_percent}% discount` : ''}</p></div>)}
              {!plans.length && <p className="text-sm text-mist">No maintenance offers yet.</p>}
            </div>
          </section>

          <section className="bg-cardgrey border border-darkgrey rounded-card p-4 md:col-span-2">
            <div className="flex items-center gap-2 mb-3"><Briefcase className="w-4 h-4 text-orange"/><h2 className="font-heading font-bold text-paper">Jobs</h2></div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">{jobs.slice(0,9).map(j => <Link key={j.id} href={`/admin/jobs/${j.id}`} className="border border-darkgrey rounded-btn p-3 hover:border-blue"><p className="text-sm text-paper">{j.title ?? 'Job'}</p><p className="text-xs text-mist">{j.status} · {j.scheduled_date ?? 'No date'}</p></Link>)}{!jobs.length && <p className="text-sm text-mist">No jobs found.</p>}</div>
          </section>
        </div>
      </div>
    </main>
  )
}

export default function SalesPage() { return <StaffGate title="Sales"><SalesDashboard /></StaffGate> }
