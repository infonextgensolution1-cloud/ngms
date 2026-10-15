'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, Loader2, LockKeyhole, Save, ShieldCheck } from 'lucide-react'
import StaffGate from '@/components/admin/StaffGate'
import { supabase } from '@/lib/supabaseClient'

type Draft = {
  id: string
  company_name: string
  contact_name: string
  email: string
  notes: string
  status: string
  created_at: string
}
const input = 'w-full rounded-lg border border-darkgrey bg-jet px-3 py-2.5 text-sm text-paper placeholder:text-mist focus:border-orange focus:outline-none'

function SubcontractorsPanel() {
  const [company, setCompany] = useState('Alpha Plumbing')
  const [contact, setContact] = useState('Anthony Mattews')
  const [email, setEmail] = useState('alphaomegaindustry@gmail.com')
  const [notes, setNotes] = useState('')
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const request = useCallback(async (method: 'GET' | 'POST', body?: object) => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) throw new Error('Your admin session has expired. Sign in again.')
    const response = await fetch('/api/admin/subcontractor-drafts', {
      method,
      headers: { Authorization: `Bearer ${session.access_token}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    })
    const result = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(result.error || 'Request failed.')
    return result
  }, [])

  const loadDrafts = useCallback(async () => {
    setLoading(true)
    try {
      const result = await request('GET')
      setDrafts(result.drafts ?? [])
      setError('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load drafts.')
    } finally { setLoading(false) }
  }, [request])

  useEffect(() => { void loadDrafts() }, [loadDrafts])

  async function saveDraft(event: React.FormEvent) {
    event.preventDefault()
    setBusy(true); setError(''); setMessage('')
    try {
      const result = await request('POST', { company_name: company, contact_name: contact, email, notes })
      setDrafts((current) => [result.draft, ...current])
      setMessage('Draft saved. No account was created and no invitation email was sent.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save draft.')
    } finally { setBusy(false) }
  }

  return (
    <main className="min-h-screen bg-jet px-4 py-6 text-paper sm:px-6">
      <div className="mx-auto max-w-5xl">
        <Link href="/admin" className="mb-5 inline-flex items-center gap-2 text-sm text-mist hover:text-paper"><ArrowLeft className="h-4 w-4" /> Admin dashboard</Link>
        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange">People & permissions</p>
          <h1 className="mt-2 font-heading text-3xl font-bold">Subcontractors</h1>
          <p className="mt-2 max-w-2xl text-sm text-mist">Prepare subcontractor access safely. Saving a draft never creates an account, grants portal access, or sends an email.</p>
        </div>
        <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-xl border border-darkgrey bg-cardgrey p-5">
            <h2 className="mb-4 font-heading text-xl font-bold">Invitation draft</h2>
            <form onSubmit={saveDraft} className="space-y-3">
              <label className="block text-sm text-mist">Company<input required maxLength={160} className={input} value={company} onChange={e=>setCompany(e.target.value)} /></label>
              <label className="block text-sm text-mist">Contact person<input required maxLength={160} className={input} value={contact} onChange={e=>setContact(e.target.value)} /></label>
              <label className="block text-sm text-mist">Email address<input required type="email" maxLength={254} className={input} value={email} onChange={e=>setEmail(e.target.value)} /></label>
              <label className="block text-sm text-mist">Internal notes (optional)<textarea maxLength={2000} rows={3} className={input} value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Add onboarding notes…" /></label>
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button disabled={busy} className="inline-flex items-center gap-2 rounded-lg bg-orange px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"><Save className="h-4 w-4" />{busy ? 'Saving…' : 'Save draft'}</button>
                <span className="text-xs text-mist">Draft only · no email · no account</span>
              </div>
            </form>
            {message && <p role="status" className="mt-4 flex gap-2 text-sm text-emerald-400"><CheckCircle2 className="h-5 w-5 shrink-0" />{message}</p>}
            {error && <p role="alert" className="mt-4 rounded-lg border border-red-900 bg-red-950/40 p-3 text-sm text-red-200">{error}</p>}
          </section>
          <section className="rounded-xl border border-darkgrey bg-cardgrey p-5">
            <h2 className="mb-4 font-heading text-xl font-bold">Proposed access rules</h2>
            <div className="space-y-3">
              {[
                ['Read quotations', 'Can view assigned/approved quote documents only.'],
                ['Read invoices', 'Can view invoice documents only; no payment changes.'],
                ['Assigned jobs only', 'No access to unassigned jobs or other subcontractors.'],
                ['Inspection & completion reports', 'Can submit reports for assigned jobs.'],
                ['Job photographs', 'Can upload evidence against assigned jobs.'],
              ].map(([title, detail]) => <div key={title} className="flex gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-orange"/><div><p className="text-sm font-semibold">{title}</p><p className="text-xs leading-5 text-mist">{detail}</p></div></div>)}
              <div className="mt-4 rounded-lg border border-darkgrey bg-jet p-3"><p className="flex items-center gap-2 text-sm font-semibold"><LockKeyhole className="h-4 w-4 text-orange"/> Explicitly denied</p><p className="mt-1 text-xs leading-5 text-mist">Editing quotations/invoices, viewing unassigned jobs, staff administration, and changing payment records.</p></div>
            </div>
          </section>
        </div>
        <section className="mt-6 rounded-xl border border-darkgrey bg-cardgrey p-5">
          <div className="mb-4 flex items-center justify-between gap-3"><h2 className="font-heading text-xl font-bold">Saved drafts</h2><button onClick={()=>void loadDrafts()} className="text-sm text-orange hover:underline">Refresh</button></div>
          {loading ? <p className="flex items-center gap-2 text-sm text-mist"><Loader2 className="h-4 w-4 animate-spin"/>Loading drafts…</p> : drafts.length === 0 ? <p className="text-sm text-mist">No saved drafts yet.</p> : <div className="space-y-3">{drafts.map(draft=><div key={draft.id} className="rounded-lg border border-darkgrey p-3"><div className="flex flex-wrap items-start justify-between gap-2"><div><p className="font-semibold">{draft.company_name}</p><p className="text-sm text-mist">{draft.contact_name} · {draft.email}</p></div><span className="rounded border border-darkgrey px-2 py-1 text-xs uppercase text-orange">{draft.status}</span></div><p className="mt-2 text-xs text-mist">Saved {new Date(draft.created_at).toLocaleString()}</p></div>)}</div>}
        </section>
        <p className="mt-5 text-xs text-mist">Activation is intentionally separate and is not enabled here. Access must be enforced server-side before any subcontractor account is created.</p>
      </div>
    </main>
  )
}

export default function SubcontractorsPage() {
  return <StaffGate title="Subcontractors"><SubcontractorsPanel /></StaffGate>
}
