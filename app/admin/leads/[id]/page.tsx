'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, AlertTriangle, MessageCircle, Receipt, Save, Mail, Phone as PhoneIcon } from 'lucide-react'
import StaffGate from '@/components/admin/StaffGate'
import LeadReplyDraft from '@/components/admin/LeadReplyDraft'
import { supabase } from '@/lib/supabaseClient'
import { LEAD_COLUMNS, STATUSES, STATUS_LABEL, appendNote, normalisePhone, sast, waLink, type Lead, type LeadStatus } from '@/lib/ngms-leads-ui'

const STATUS_STYLE: Record<string, string> = {
  new: 'text-blue border-blue',
  contacted: 'text-mist border-darkgrey',
  site_visit: 'text-mist border-darkgrey',
  quoted: 'text-orange border-orange',
  won: 'text-whatsapp border-whatsapp',
  lost: 'text-mist border-darkgrey',
}

function LeadView() {
  const params = useParams<{ id: string }>()
  const id = params.id

  const [lead, setLead] = useState<Lead | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [note, setNote] = useState('')

  const [editing, setEditing] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [suburb, setSuburb] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const { data, error } = await supabase.from('leads').select(LEAD_COLUMNS).eq('id', id).maybeSingle()
      if (error) throw new Error(error.message)
      if (!data) throw new Error('Lead not found.')
      const l = data as Lead
      setLead(l)
      setName(l.name)
      setPhone(l.phone)
      setEmail(l.email ?? '')
      setSuburb(l.suburb ?? '')
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  async function setStatus(status: LeadStatus) {
    if (!lead || status === lead.status) return
    setBusy(true)
    setMsg('')
    try {
      const patch = { status, notes: appendNote(lead.notes, `Stage updated.`, `${lead.status} → ${status}`), updated_at: new Date().toISOString() }
      const { error } = await supabase.from('leads').update(patch).eq('id', lead.id)
      if (error) throw new Error(error.message)
      setMsg(`Moved to ${STATUS_LABEL[status]}.`)
      await load()
    } catch (e) {
      setMsg((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function saveNote() {
    if (!lead || !note.trim()) return
    setBusy(true)
    setMsg('')
    try {
      const patch = { notes: appendNote(lead.notes, note.trim()), updated_at: new Date().toISOString() }
      const { error } = await supabase.from('leads').update(patch).eq('id', lead.id)
      if (error) throw new Error(error.message)
      setNote('')
      setMsg('Note added.')
      await load()
    } catch (e) {
      setMsg((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function saveContact() {
    if (!lead) return
    setBusy(true)
    setMsg('')
    try {
      const patch: Record<string, unknown> = {}
      if (name.trim() && name.trim() !== lead.name) patch.name = name.trim()
      const p = phone.trim() ? normalisePhone(phone.trim()) : lead.phone
      if (p !== lead.phone) patch.phone = p
      if (email.trim() !== (lead.email ?? '')) patch.email = email.trim() || null
      if (suburb.trim() !== (lead.suburb ?? '')) patch.suburb = suburb.trim() || null
      if (!Object.keys(patch).length) {
        setEditing(false)
        return
      }
      patch.updated_at = new Date().toISOString()
      const { error } = await supabase.from('leads').update(patch).eq('id', lead.id)
      if (error) throw new Error(error.message)
      setMsg('Contact details updated.')
      setEditing(false)
      await load()
    } catch (e) {
      setMsg((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  if (loading && !lead) {
    return (
      <main className="min-h-[60vh] flex items-center justify-center bg-jet">
        <Loader2 className="w-6 h-6 text-mist animate-spin" />
      </main>
    )
  }

  if (error && !lead) {
    return (
      <main className="min-h-[60vh] bg-jet px-4 py-16">
        <div className="max-w-md mx-auto text-center">
          <p className="text-orange flex items-center justify-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5" /> {error}
          </p>
          <Link href="/admin/leads" className="text-blue text-sm">
            Back to leads
          </Link>
        </div>
      </main>
    )
  }

  if (!lead) return null

  const wa = waLink(lead.phone)
  const input = 'w-full bg-jet border border-darkgrey text-paper rounded-btn px-3 py-2.5 text-sm focus:outline-none focus:border-blue'

  return (
    <main className="min-h-[70vh] bg-jet px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Link href="/admin/leads" className="text-xs text-mist hover:text-paper inline-flex items-center gap-1 mb-3">
          <ArrowLeft className="w-3.5 h-3.5" /> Leads
        </Link>

        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="min-w-0">
            <h1 className="font-heading text-2xl font-bold text-paper truncate">{lead.name}</h1>
            <p className="text-sm text-mist truncate">{lead.service ?? lead.service_slug ?? 'service not given'} · {lead.suburb ?? 'area not given'}</p>
          </div>
          <span className={`shrink-0 text-[10px] uppercase tracking-wider border rounded px-2 py-0.5 ${STATUS_STYLE[lead.status] ?? 'text-mist border-darkgrey'}`}>
            {STATUS_LABEL[lead.status]}
          </span>
        </div>

        {/* Pipeline stage */}
        <section className="bg-cardgrey border border-darkgrey rounded-card p-4 mb-4">
          <h2 className="font-heading font-bold text-paper mb-3">Pipeline stage</h2>
          <div className="flex flex-wrap gap-2">
            {STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                disabled={busy}
                className={`text-xs px-3 py-1.5 rounded-btn border disabled:opacity-50 ${s === lead.status ? 'border-orange text-orange' : 'border-darkgrey text-mist hover:text-paper'}`}
              >
                {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin inline" /> : STATUS_LABEL[s]}
              </button>
            ))}
          </div>
          {msg && <p className="text-xs text-mist mt-3">{msg}</p>}
        </section>

        {/* Contact */}
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
              <input className={input} placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
              <input className={input} placeholder="Phone" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
              <input className={input} placeholder="Email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              <input className={input} placeholder="Suburb" value={suburb} onChange={(e) => setSuburb(e.target.value)} />
              <div className="sm:col-span-2 flex items-center gap-3">
                <button onClick={saveContact} disabled={busy} className="inline-flex items-center gap-2 bg-blue hover:bg-blue-dark text-white font-heading font-semibold px-4 py-2.5 rounded-btn disabled:opacity-50">
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
                </button>
                <button onClick={() => setEditing(false)} className="text-xs text-mist">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="grid gap-1.5 text-sm">
              <p className="text-paper flex items-center gap-2">
                <PhoneIcon className="w-3.5 h-3.5 text-mist" /> {lead.phone}
                {wa && (
                  <a href={wa} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-whatsapp hover:text-whatsapp-dark text-xs ml-1">
                    <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                  </a>
                )}
              </p>
              {lead.email && (
                <p className="text-paper flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-mist" /> {lead.email}
                </p>
              )}
              <p className="text-mist">{lead.suburb ?? 'area not given'} · source: {lead.source}</p>
              <p className="text-mist text-xs mt-1">Received {sast(lead.created_at)} · last updated {sast(lead.updated_at)}</p>
            </div>
          )}
        </section>

        {/* Enquiry */}
        <section className="bg-cardgrey border border-darkgrey rounded-card p-4 mb-4">
          <h2 className="font-heading font-bold text-paper mb-2">Enquiry</h2>
          <p className="text-sm text-paper whitespace-pre-line">{lead.message || '(no message)'}</p>
        </section>

        {/* Notes */}
        <section className="bg-cardgrey border border-darkgrey rounded-card p-4 mb-4">
          <h2 className="font-heading font-bold text-paper mb-2">Notes</h2>
          <p className="text-sm text-mist whitespace-pre-line mb-3">{lead.notes || '(no notes yet)'}</p>
          <textarea
            className={`${input} min-h-[72px]`}
            placeholder="e.g. Called, site visit Thu 10:00"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <button onClick={saveNote} disabled={busy || !note.trim()} className="mt-2 inline-flex items-center gap-2 bg-blue hover:bg-blue-dark text-white font-heading font-semibold px-4 py-2.5 rounded-btn disabled:opacity-50">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Add note
          </button>
        </section>

        <LeadReplyDraft lead={lead} />

        <Link
          href={`/admin/quotes/new?lead=${lead.id}`}
          className="flex items-center justify-center gap-2 bg-orange hover:opacity-90 text-white font-heading font-semibold px-4 py-3 rounded-btn"
        >
          <Receipt className="w-4 h-4" /> Create quote from this lead
        </Link>
      </div>
    </main>
  )
}

export default function LeadDetailPage() {
  return (
    <StaffGate title="Lead">
      <LeadView />
    </StaffGate>
  )
}
