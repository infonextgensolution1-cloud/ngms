'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, AlertTriangle, FileText, HardHat, Loader2, MessageCircle, Phone as PhoneIcon, Mail, Plus, Receipt, Save, Send, ShieldCheck, Clock3, Ban } from 'lucide-react'
import StaffGate from '@/components/admin/StaffGate'
import { supabase } from '@/lib/supabaseClient'
import { handlersA } from '@/lib/ngms-ops/handlers-a'
import { CLIENT_COLS, rand } from '@/lib/ngms-ops/core'
import type { Client } from '@/lib/ngms-ops/core'
import { waTo } from '@/lib/admin-wa'

type QuoteRow = { id: string; quote_number: string; status: string; total_amount: number | null; created_at: string }
type InvoiceRow = { id: string; invoice_number: string; status: string; total_amount: number | null; paid_amount: number | null; due_date: string | null; created_at: string }
type JobRow = { id: string; title: string | null; status: string; scheduled_date: string | null }

const day = (iso: string) => new Date(iso).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Africa/Johannesburg' })

function ClientView() {
  const { id } = useParams<{ id: string }>()
  const [client, setClient] = useState<Client | null>(null)
  const [quotes, setQuotes] = useState<QuoteRow[]>([])
  const [invoices, setInvoices] = useState<InvoiceRow[]>([])
  const [jobs, setJobs] = useState<JobRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '', suburb: '', notes: '' })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [inviting, setInviting] = useState(false)
  const [inviteMsg, setInviteMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [portalAccessMode, setPortalAccessMode] = useState<'one_time' | 'temporary' | 'permanent'>('permanent')
  const [portalExpiry, setPortalExpiry] = useState('')
  const [portalRevoked, setPortalRevoked] = useState(false)
  const [portalAccessReady, setPortalAccessReady] = useState(false)
  const [portalAccessBusy, setPortalAccessBusy] = useState(false)
  const [portalAccessMsg, setPortalAccessMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [c, q, i, j] = await Promise.all([
        supabase.from('clients').select(CLIENT_COLS).eq('id', id).maybeSingle(),
        supabase.from('quotes').select('id,quote_number,status,total_amount,created_at').eq('client_id', id).order('created_at', { ascending: false }),
        supabase.from('invoices').select('id,invoice_number,status,total_amount,paid_amount,due_date,created_at').eq('client_id', id).order('created_at', { ascending: false }),
        supabase.from('jobs').select('id,title,status,scheduled_date').eq('client_id', id).order('scheduled_date', { ascending: false, nullsFirst: true }),
      ])
      if (c.error) throw new Error(c.error.message)
      if (!c.data) throw new Error('Client not found.')
      const cl = c.data as Client
      setClient(cl)
      setForm({ name: cl.name, phone: cl.phone ?? '', email: cl.email ?? '', address: cl.address ?? '', suburb: cl.suburb ?? '', notes: cl.notes ?? '' })
      setQuotes((q.data ?? []) as QuoteRow[])
      setInvoices((i.data ?? []) as InvoiceRow[])
      setJobs((j.data ?? []) as JobRow[])
      const token = (await supabase.auth.getSession()).data.session?.access_token
      if (token) {
        const accessRes = await fetch('/api/admin/client-portal-access?clientId=' + encodeURIComponent(id), { headers: { Authorization: 'Bearer ' + token }, cache: 'no-store' })
        const accessJson = await accessRes.json().catch(() => ({})) as { access?: { access_mode?: 'one_time' | 'temporary' | 'permanent'; expires_at?: string | null; revoked_at?: string | null } | null; error?: string }
        if (accessRes.ok) {
          const access = accessJson.access
          setPortalAccessMode(access?.access_mode ?? 'permanent')
          setPortalExpiry(access?.expires_at ? new Date(access.expires_at).toISOString().slice(0, 16) : '')
          setPortalRevoked(!access || !!access.revoked_at)
          setPortalAccessReady(true)
          setPortalAccessMsg(access ? null : { ok: false, text: 'Access is not configured yet. Save a mode before sending an invite.' })
        } else {
          setPortalAccessReady(false)
          setPortalAccessMsg({ ok: false, text: accessJson.error || 'Could not load portal access settings.' })
        }
      }
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  async function save() {
    setSaving(true)
    setMsg('')
    try {
      const res = await handlersA.ngms_save_client(supabase, { client_id: id, ...form })
      if (res.isError) throw new Error(res.content[0]?.text ?? 'Could not save')
      setEditing(false)
      setMsg('Saved.')
      await load()
    } catch (e) {
      setMsg((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  async function savePortalAccess() {
    setPortalAccessBusy(true)
    setPortalAccessMsg(null)
    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token
      if (!token) throw new Error('Admin session expired. Sign in again.')
      if (portalAccessMode === 'temporary' && (!portalExpiry || new Date(portalExpiry).getTime() <= Date.now())) {
        throw new Error('Temporary access must expire in the future.')
      }
      const response = await fetch('/api/admin/client-portal-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify({ clientId: id, accessMode: portalAccessMode, expiresAt: portalAccessMode === 'temporary' ? new Date(portalExpiry).toISOString() : null }),
      })
      const json = await response.json().catch(() => ({})) as { ok?: boolean; error?: string }
      if (!response.ok || !json.ok) throw new Error(json.error || 'Could not save portal access.')
      setPortalRevoked(false)
      setPortalAccessReady(true)
      setPortalAccessMsg({ ok: true, text: 'Portal access saved. Existing one-time sessions have been reset.' })
    } catch (e) {
      setPortalAccessMsg({ ok: false, text: (e as Error).message })
    } finally {
      setPortalAccessBusy(false)
    }
  }

  async function revokePortalAccess() {
    if (!window.confirm('Revoke customer portal access for ' + (client?.name ?? 'this client') + '? Existing portal sessions will no longer pass database access checks.')) return
    setPortalAccessBusy(true)
    setPortalAccessMsg(null)
    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token
      if (!token) throw new Error('Admin session expired. Sign in again.')
      const response = await fetch('/api/admin/client-portal-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify({ clientId: id, action: 'revoke' }),
      })
      const json = await response.json().catch(() => ({})) as { ok?: boolean; error?: string }
      if (!response.ok || !json.ok) throw new Error(json.error || 'Could not revoke portal access.')
      setPortalRevoked(true)
      setPortalAccessMsg({ ok: true, text: 'Portal access revoked.' })
    } catch (e) {
      setPortalAccessMsg({ ok: false, text: (e as Error).message })
    } finally {
      setPortalAccessBusy(false)
    }
  }

  async function invite() {
    if (!client?.email) return
    if (!portalAccessReady || portalRevoked || (portalAccessMode === 'temporary' && (!portalExpiry || new Date(portalExpiry).getTime() <= Date.now()))) {
      setInviteMsg({ ok: false, text: 'Configure active portal access first. Temporary access must expire in the future.' })
      return
    }
    if (!window.confirm('Email ' + client.name + ' (' + client.email + ') a secure sign-in link for ' + portalAccessMode.replace('_', ' ') + ' portal access?')) return
    setInviting(true)
    setInviteMsg(null)
    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token
      const res = await fetch('/api/admin/portal-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token ?? ''}` },
        body: JSON.stringify({ clientId: id }),
      })
      const json = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string; sentTo?: string; firstInvite?: boolean }
      if (!res.ok || !json.ok) throw new Error(json.error || 'Could not send the invite.')
      setInviteMsg({ ok: true, text: `${json.firstInvite ? 'Invite' : 'New sign-in link'} sent to ${json.sentTo}.` })
    } catch (e) {
      setInviteMsg({ ok: false, text: (e as Error).message })
    } finally {
      setInviting(false)
    }
  }

  if (loading && !client) {
    return (
      <main className="min-h-[60vh] flex items-center justify-center bg-jet">
        <Loader2 className="w-6 h-6 text-mist animate-spin" />
      </main>
    )
  }
  if (error || !client) {
    return (
      <main className="min-h-[60vh] bg-jet px-4 py-16 text-center">
        <p className="text-orange flex items-center justify-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5" /> {error || 'Not found'}
        </p>
        <Link href="/admin/clients" className="text-blue text-sm">
          Back to clients
        </Link>
      </main>
    )
  }

  const live = invoices.filter((i) => i.status !== 'void')
  const billed = live.reduce((s, i) => s + Number(i.total_amount ?? 0), 0)
  const paid = live.reduce((s, i) => s + Number(i.paid_amount ?? 0), 0)
  const owed = Math.max(0, billed - paid)
  const wa = waTo(client.phone, `Hi ${client.name.split(/\s+/)[0]}, `)
  const input = 'w-full bg-jet border border-darkgrey text-paper rounded-btn px-3 py-2.5 text-sm focus:outline-none focus:border-blue'

  return (
    <main className="min-h-[70vh] bg-jet px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Link href="/admin/clients" className="text-xs text-mist hover:text-paper inline-flex items-center gap-1 mb-3">
          <ArrowLeft className="w-3.5 h-3.5" /> Clients
        </Link>
        <h1 className="font-heading text-2xl font-bold text-paper">{client.name}</h1>
        <p className="text-sm text-mist mb-4">Client since {day(client.created_at)}</p>

        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            ['Billed', rand(billed)],
            ['Paid', rand(paid)],
            ['Owed', rand(owed)],
          ].map(([label, value]) => (
            <div key={label} className="bg-cardgrey border border-darkgrey rounded-card p-3">
              <p className="text-[11px] text-mist uppercase tracking-wide">{label}</p>
              <p className={`font-heading font-bold text-lg ${label === 'Owed' && owed > 0 ? 'text-orange' : 'text-paper'}`}>{value}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {wa && (
            <a href={wa} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 bg-whatsapp hover:opacity-90 text-white text-sm font-heading font-semibold px-3.5 py-2.5 rounded-btn">
              <MessageCircle className="w-4 h-4" /> WhatsApp
            </a>
          )}
          {client.phone && (
            <a href={`tel:${client.phone}`} className="inline-flex items-center gap-1.5 border border-darkgrey hover:border-blue text-paper text-sm font-heading font-semibold px-3.5 py-2.5 rounded-btn">
              <PhoneIcon className="w-4 h-4" /> Call
            </a>
          )}
          {client.email && (
            <button
              type="button"
              onClick={invite}
              disabled={inviting}
              className="inline-flex items-center gap-1.5 border border-darkgrey hover:border-blue text-paper text-sm font-heading font-semibold px-3.5 py-2.5 rounded-btn disabled:opacity-60"
            >
              {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Invite to portal
            </button>
          )}
          <Link href={`/admin/quotes/new?client=${client.id}`} className="inline-flex items-center gap-1.5 bg-orange hover:opacity-90 text-white text-sm font-heading font-semibold px-3.5 py-2.5 rounded-btn">
            <Plus className="w-4 h-4" /> New quote
          </Link>
        </div>
        {inviteMsg && (
          <p role="status" className={`text-sm mb-4 ${inviteMsg.ok ? 'text-whatsapp' : 'text-orange'}`}>
            {inviteMsg.text}
          </p>
        )}

        <section className="bg-cardgrey border border-darkgrey rounded-card p-4 mb-4">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <h2 className="font-heading font-bold text-paper flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-blue" /> Customer portal access</h2>
              <p className="mt-1 text-xs text-mist">Read-only quotations, invoices, job status and authorised photos. No financial-document editing.</p>
            </div>
            <span className={portalRevoked ? 'shrink-0 rounded border border-orange px-2 py-1 text-[10px] uppercase tracking-wide text-orange' : 'shrink-0 rounded border border-whatsapp px-2 py-1 text-[10px] uppercase tracking-wide text-whatsapp'}>{portalRevoked ? 'Disabled' : 'Active'}</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs text-mist">
              Access mode
              <select className={input + ' mt-1'} value={portalAccessMode} onChange={(e) => setPortalAccessMode(e.target.value as 'one_time' | 'temporary' | 'permanent')}>
                <option value="one_time">One-time session</option>
                <option value="temporary">Temporary — expiry set by admin</option>
                <option value="permanent">Permanent account</option>
              </select>
            </label>
            {portalAccessMode === 'temporary' ? (
              <label className="block text-xs text-mist">
                Access expires (South African local time)
                <input className={input + ' mt-1'} type="datetime-local" value={portalExpiry} onChange={(e) => setPortalExpiry(e.target.value)} />
              </label>
            ) : (
              <div className="rounded-btn border border-darkgrey bg-jet px-3 py-2.5 text-xs text-mist flex items-center gap-2">
                {portalAccessMode === 'one_time' ? <Clock3 className="w-4 h-4 text-blue" /> : <ShieldCheck className="w-4 h-4 text-blue" />}
                {portalAccessMode === 'one_time' ? 'Bound to one verified sign-in session. Save again to issue a fresh session.' : 'No access expiry. Secure email sign-in is still required.'}
              </div>
            )}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={savePortalAccess} disabled={portalAccessBusy} className="inline-flex items-center gap-2 rounded-btn bg-blue-fill px-3.5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
              {portalAccessBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save access settings
            </button>
            <button type="button" onClick={revokePortalAccess} disabled={portalAccessBusy} className="inline-flex items-center gap-2 rounded-btn border border-darkgrey px-3.5 py-2.5 text-sm font-semibold text-paper hover:border-orange hover:text-orange disabled:opacity-60">
              <Ban className="w-4 h-4" /> Revoke access
            </button>
          </div>
          {portalAccessMsg && <p role="status" className={portalAccessMsg.ok ? 'mt-3 text-xs text-whatsapp' : 'mt-3 text-xs text-orange'}>{portalAccessMsg.text}</p>}
        </section>

        <section className="bg-cardgrey border border-darkgrey rounded-card p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-heading font-bold text-paper">Contact</h2>
            {!editing && (
              <button onClick={() => setEditing(true)} className="text-xs text-blue">
                Edit
              </button>
            )}
          </div>
          {editing ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <input className={input} placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <input className={input} placeholder="Phone" inputMode="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              <input className={input} placeholder="Email" inputMode="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <input className={input} placeholder="Suburb" value={form.suburb} onChange={(e) => setForm({ ...form, suburb: e.target.value })} />
              <input className={`${input} sm:col-span-2`} placeholder="Address / complex and unit" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              <textarea className={`${input} sm:col-span-2 min-h-[72px]`} placeholder="Notes (gate code, roof type, dogs…)" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              <div className="sm:col-span-2 flex items-center gap-3">
                <button onClick={save} disabled={saving || !form.name.trim()} className="inline-flex items-center gap-2 bg-blue-fill hover:bg-blue-dark text-white font-heading font-semibold px-4 py-2.5 rounded-btn disabled:opacity-50">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
                </button>
                <button onClick={() => setEditing(false)} className="text-xs text-mist">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="grid gap-1.5 text-sm">
              <p className="text-paper flex items-center gap-2">
                <PhoneIcon className="w-3.5 h-3.5 text-mist" /> {client.phone ?? 'no phone'}
              </p>
              {client.email && (
                <p className="text-paper flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-mist" /> {client.email}
                </p>
              )}
              <p className="text-mist">{[client.address, client.suburb].filter(Boolean).join(', ') || 'no address'}</p>
              {client.notes && <p className="text-mist whitespace-pre-line mt-1">{client.notes}</p>}
            </div>
          )}
          {msg && <p className="text-xs text-mist mt-2">{msg}</p>}
        </section>

        <History title="Quotes" icon={FileText} empty="No quotes yet.">
          {quotes.map((q) => (
            <Row key={q.id} href={`/admin/quotes/${q.id}`} left={q.quote_number} sub={day(q.created_at)} right={rand(Number(q.total_amount ?? 0))} tag={q.status} />
          ))}
        </History>

        <History title="Jobs" icon={HardHat} empty="No jobs yet.">
          {jobs.map((j) => (
            <Row key={j.id} href={`/admin/jobs/${j.id}`} left={j.title ?? 'Untitled job'} sub={j.scheduled_date ?? 'no date set'} tag={j.status.replace('_', ' ')} />
          ))}
        </History>

        <History title="Invoices" icon={Receipt} empty="No invoices yet.">
          {invoices.map((i) => {
            const bal = Number(i.total_amount ?? 0) - Number(i.paid_amount ?? 0)
            return (
              <Row
                key={i.id}
                href={`/admin/invoices/${i.id}`}
                left={i.invoice_number}
                sub={`${day(i.created_at)}${i.status !== 'void' && bal > 0.004 ? ` · ${rand(bal)} owing` : ''}`}
                right={rand(Number(i.total_amount ?? 0))}
                tag={i.status}
              />
            )
          })}
        </History>
      </div>
    </main>
  )
}

function History({ title, icon: Icon, empty, children }: { title: string; icon: typeof FileText; empty: string; children: React.ReactNode[] }) {
  return (
    <section className="bg-cardgrey border border-darkgrey rounded-card mb-4">
      <h2 className="font-heading font-bold text-paper px-4 pt-4 pb-2 flex items-center gap-2">
        <Icon className="w-4 h-4 text-orange" /> {title}
        <span className="text-xs text-mist font-normal">({children.length})</span>
      </h2>
      {children.length ? <ul className="divide-y divide-darkgrey">{children}</ul> : <p className="px-4 pb-4 text-sm text-mist">{empty}</p>}
    </section>
  )
}

function Row({ href, left, sub, right, tag }: { href: string; left: string; sub: string; right?: string; tag: string }) {
  return (
    <li>
      <Link href={href} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-jet/40">
        <span className="min-w-0">
          <span className="block text-paper font-semibold truncate">{left}</span>
          <span className="block text-xs text-mist truncate">{sub}</span>
        </span>
        <span className="text-right shrink-0">
          {right && <span className="block text-sm text-paper">{right}</span>}
          <span className="inline-block mt-0.5 text-[10px] uppercase tracking-wider border border-darkgrey text-mist rounded px-2 py-0.5">{tag}</span>
        </span>
      </Link>
    </li>
  )
}

export default function ClientPage() {
  return (
    <StaffGate title="Client">
      <ClientView />
    </StaffGate>
  )
}
