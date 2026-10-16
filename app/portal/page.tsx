'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import { Loader2, LogOut, Mail, RefreshCw, FileText, Receipt, Camera, CheckCircle2, AlertTriangle, ArrowLeft } from 'lucide-react'

type Client = { id: string; name: string; email: string | null; phone: string | null; address: string | null; suburb: string | null }
type Quote = { id: string; quote_number: string | null; status: string | null; total_amount: number | null; valid_until: string | null; created_at: string }
type QuoteItem = { id: string; quote_id: string; description: string | null; quantity: number | null; unit: string | null; unit_price: number | null }
type Invoice = { id: string; invoice_number: string | null; status: string | null; total_amount: number | null; paid_amount: number | null; due_date: string | null; created_at: string }
type InvoiceItem = { id: string; invoice_id: string; description: string | null; quantity: number | null; unit: string | null; unit_price: number | null }
type Job = { id: string; title: string; description: string | null; status: string; scheduled_date: string | null; completed_date: string | null }
type Photo = { id: string; job_id: string; photo_url: string; type: 'before' | 'progress' | 'after'; caption: string | null; sort_order: number }
type PortalDocument = { id: string; quote_id: string | null; title: string; category: string; original_filename: string; content_type: string; file_size: number; location_label: string; created_at: string }

const money = (n: number | null | undefined) => 'R' + Number(n ?? 0).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const date = (v: string | null | undefined) => v ? new Date(v + 'T00:00:00').toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
const statusLabel = (v: string | null | undefined) => (v ?? 'unknown').replace(/_/g, ' ')
const paymentRequestHref = (invoice: Invoice, balance: number, clientName: string) => {
  const invoiceRef = invoice.invoice_number || invoice.id.slice(0, 8)
  const message = [
    'Hi NGMS,',
    '',
    `I would like to pay invoice ${invoiceRef}.`,
    `Customer: ${clientName}`,
    `Outstanding balance: ${money(balance)}`,
    '',
    'Please send me the secure payment link and payment instructions.'
  ].join('\\n')
  return `https://wa.me/27631387945?text=${encodeURIComponent(message)}`
}

function PortalLogin() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function sendLink(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError('')
    try {
      const response = await fetch('/api/portal/login-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
        cache: 'no-store',
      })
      const payload = await response.json().catch(() => ({})) as { error?: string }
      if (!response.ok) setError(payload.error || 'Could not send the sign-in link. Please try again.')
      else setSent(true)
    } catch {
      setError('Could not reach the sign-in service. Please try again or contact NGMS on WhatsApp 063 138 7945.')
    } finally {
      setBusy(false)
    }
  }
  return <main className="min-h-[75vh] bg-jet px-4 py-10 text-paper"><div className="max-w-md mx-auto"><Link href="/" className="text-xs text-mist hover:text-paper inline-flex items-center gap-1 mb-8"><ArrowLeft className="w-3.5 h-3.5" /> NGMS</Link><div className="bg-cardgrey border border-darkgrey rounded-card p-6 shadow-xl"><div className="w-11 h-11 rounded-full bg-blue/15 border border-blue/30 flex items-center justify-center mb-4"><Mail className="w-5 h-5 text-blue" /></div><p className="text-xs uppercase tracking-[0.2em] text-blue font-semibold">NGMS Customer Portal</p><h1 className="font-heading text-2xl font-bold mt-2">Your property. One place.</h1><p className="text-sm text-mist mt-2 mb-6">Enter the email address you gave NGMS. We’ll send a secure one-time sign-in link.</p>{sent ? <div className="rounded-btn border border-darkgrey bg-jet p-4 text-sm"><CheckCircle2 className="w-5 h-5 text-blue mb-2" /><p className="font-semibold">Check your email.</p><p className="text-mist mt-1">The sign-in link is one-time use. Check spam if needed.</p></div> : <form onSubmit={sendLink} className="space-y-3"><input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" className="w-full bg-jet border border-darkgrey text-paper rounded-btn px-3 py-3 text-sm outline-none focus:border-blue" />{error && <p className="text-sm text-orange flex gap-2"><AlertTriangle className="w-4 h-4 shrink-0" />{error}</p>}<button disabled={busy} className="w-full bg-blue-fill text-white rounded-btn py-3 text-sm font-semibold disabled:opacity-60">{busy ? 'Sending…' : 'Email me a secure link'}</button></form>}</div><p className="text-[11px] text-mist mt-4 text-center">Access is limited to records associated with your verified email address.</p></div></main>
}

function Section({ title, icon: Icon, children }: { title: string; icon: typeof FileText; children: React.ReactNode }) { return <section className="bg-cardgrey border border-darkgrey rounded-card overflow-hidden"><div className="px-4 py-3 border-b border-darkgrey flex items-center gap-2"><Icon className="w-4 h-4 text-blue" /><h2 className="font-semibold text-sm">{title}</h2></div>{children}</section> }

function PortalHome() {
  const [client, setClient] = useState<Client | null>(null); const [quotes, setQuotes] = useState<Quote[]>([]); const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([]); const [invoices, setInvoices] = useState<Invoice[]>([]); const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]); const [jobs, setJobs] = useState<Job[]>([]); const [photos, setPhotos] = useState<Photo[]>([]); const [documents, setDocuments] = useState<PortalDocument[]>([]); const [loading, setLoading] = useState(true); const [quoteLinks, setQuoteLinks] = useState<Record<string, string>>({}); const [error, setError] = useState('')
  async function openQuotePdf(quoteId: string) {
    setError('')
    const popup = window.open('about:blank', '_blank')
    try {
      const accessToken = (await supabase.auth.getSession()).data.session?.access_token
      if (!accessToken) throw new Error('Your session has expired. Please sign in again.')
      const response = await fetch(`/api/portal/quotes/${quoteId}/pdf`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: 'no-store',
      })
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload.error || 'Could not open this quotation.')
      }
      const blob = await response.blob()
      const objectUrl = URL.createObjectURL(blob)
      if (popup) popup.location.href = objectUrl
      else {
        const link = document.createElement('a')
        link.href = objectUrl
        link.target = '_blank'
        link.rel = 'noopener noreferrer'
        link.click()
      }
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000)
    } catch (err) {
      popup?.close()
      setError(err instanceof Error ? err.message : 'Could not open this quotation.')
    }
  }

  async function downloadDocument(documentId: string) {
    setError('')
    try {
      const accessToken = (await supabase.auth.getSession()).data.session?.access_token
      if (!accessToken) throw new Error('Your session has expired. Please sign in again.')
      const response = await fetch('/api/portal/documents', { method: 'POST', headers: { Authorization: 'Bearer ' + accessToken, 'Content-Type': 'application/json' }, body: JSON.stringify({ document_id: documentId }), cache: 'no-store' })
      if (!response.ok) { const payload = await response.json().catch(() => ({})); throw new Error(payload.error || 'Could not download this document.') }
      const blob = await response.blob(); const url = URL.createObjectURL(blob); const link = document.createElement('a')
      link.href = url; link.download = documents.find(item => item.id === documentId)?.original_filename || 'NGMS-document'; document.body.appendChild(link); link.click(); link.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 60000)
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not download this document.') }
  }
  async function load() {
    setLoading(true); setError('')
    const session = (await supabase.auth.getSession()).data.session
    const user = (await supabase.auth.getUser()).data.user
    if (!user?.email || !session?.access_token) { setLoading(false); return }
    try {
      const accessResponse = await fetch('/api/portal/access/activate', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + session.access_token },
        cache: 'no-store',
      })
      const accessJson = await accessResponse.json().catch(() => ({})) as { error?: string }
      if (!accessResponse.ok) throw new Error(accessJson.error || 'Portal access is inactive.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Portal access is inactive.')
      setLoading(false)
      return
    }
    const [c, q, qi, i, ii, j] = await Promise.all([
      supabase.from('clients').select('id,name,email,phone,address,suburb').limit(1).maybeSingle(),
      supabase.from('quotes').select('id,quote_number,status,total_amount,valid_until,created_at').order('created_at', { ascending: false }),
      supabase.from('quote_items').select('id,quote_id,description,quantity,unit,unit_price'),
      supabase.from('invoices').select('id,invoice_number,status,total_amount,paid_amount,due_date,created_at').order('created_at', { ascending: false }),
      supabase.from('invoice_items').select('id,invoice_id,description,quantity,unit,unit_price'),
      supabase.from('jobs').select('id,title,description,status,scheduled_date,completed_date').order('scheduled_date', { ascending: false }),
    ])
    const firstError = [c.error, q.error, qi.error, i.error, ii.error, j.error].find(Boolean)
    if (firstError) { setError(firstError!.message); setLoading(false); return }
    const foundClient = c.data as Client | null; setClient(foundClient); setQuotes((q.data ?? []) as Quote[]); setQuoteItems((qi.data ?? []) as QuoteItem[]); setInvoices((i.data ?? []) as Invoice[]); setInvoiceItems((ii.data ?? []) as InvoiceItem[]); setJobs((j.data ?? []) as Job[])
    if (foundClient && (j.data ?? []).length) {
      try {
        const photoResponse = await fetch('/api/portal/job-photos', {
          headers: { Authorization: 'Bearer ' + session.access_token },
          cache: 'no-store',
        })
        const photoJson = await photoResponse.json().catch(() => ({})) as { photos?: Photo[]; error?: string }
        if (!photoResponse.ok) throw new Error(photoJson.error || 'Could not load job photos.')
        setPhotos((photoJson.photos ?? []) as Photo[])
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not load job photos.')
        setPhotos([])
      }
    } else setPhotos([])
    try {
      const docsResponse = await fetch('/api/portal/documents', { headers: { Authorization: 'Bearer ' + session.access_token }, cache: 'no-store' })
      const docsJson = await docsResponse.json().catch(() => ({})) as { documents?: PortalDocument[]; error?: string }
      if (!docsResponse.ok) throw new Error(docsJson.error || 'Could not load your documents.')
      setDocuments(docsJson.documents ?? [])
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not load your documents.'); setDocuments([]) }
    // Links to the public quote page for quotes awaiting an answer. Accepting there creates the job and deposit invoice.
    try {
      const accessToken = (await supabase.auth.getSession()).data.session?.access_token
      if (accessToken) {
        const res = await fetch('/api/portal/quote-links', { headers: { Authorization: `Bearer ${accessToken}` }, cache: 'no-store' })
        const json = res.ok ? await res.json() : null
        setQuoteLinks((json?.links ?? {}) as Record<string, string>)
      }
    } catch { setQuoteLinks({}) }
    setLoading(false)
  }
  useEffect(() => { load() }, [])
  const outstanding = useMemo(() => invoices.reduce((sum, i) => sum + Math.max(0, Number(i.total_amount ?? 0) - Number(i.paid_amount ?? 0)), 0), [invoices])
  if (loading) return <main className="min-h-[75vh] bg-jet flex items-center justify-center"><Loader2 className="w-6 h-6 text-blue animate-spin" /></main>
  if (error) return <main className="min-h-[75vh] bg-jet px-4 py-10"><div className="max-w-2xl mx-auto bg-cardgrey border border-darkgrey rounded-card p-6"><AlertTriangle className="w-5 h-5 text-orange mb-2" /><p className="text-sm">{error}</p><button onClick={load} className="mt-4 text-xs text-blue">Try again</button></div></main>
  if (!client) return <main className="min-h-[75vh] bg-jet px-4 py-10"><div className="max-w-2xl mx-auto bg-cardgrey border border-darkgrey rounded-card p-6"><h1 className="font-heading text-xl font-bold">Portal access not linked</h1><p className="text-sm text-mist mt-2">This email is authenticated, but NGMS does not have a customer record with the same email address.</p></div></main>
  return <main className="min-h-[75vh] bg-jet px-4 py-8 text-paper"><div className="max-w-3xl mx-auto space-y-5"><header className="flex items-start justify-between gap-4"><div><p className="text-xs uppercase tracking-[0.2em] text-blue font-semibold">NGMS Customer Portal</p><h1 className="font-heading text-2xl font-bold mt-1">Hi, {client.name.split(' ')[0]}</h1><p className="text-xs text-mist mt-1">{client.suburb || client.address || 'Your property dashboard'}</p></div><div className="flex gap-2"><button onClick={load} aria-label="Refresh" className="p-2 text-mist hover:text-paper"><RefreshCw className="w-4 h-4" /></button><button onClick={() => supabase.auth.signOut()} className="p-2 text-mist hover:text-paper" aria-label="Sign out"><LogOut className="w-4 h-4" /></button></div></header><div className="grid grid-cols-2 gap-3"><div className="bg-cardgrey border border-darkgrey rounded-card p-4"><p className="text-xs text-mist">Outstanding</p><p className="text-xl font-bold mt-1">{money(outstanding)}</p></div><div className="bg-cardgrey border border-darkgrey rounded-card p-4"><p className="text-xs text-mist">Jobs</p><p className="text-xl font-bold mt-1">{jobs.length}</p></div></div><Section title="Quotes" icon={FileText}>{quotes.length ? quotes.map(q => <div key={q.id} className="px-4 py-4 border-b border-darkgrey last:border-0"><div className="flex justify-between gap-3"><div><p className="font-semibold text-sm">{q.quote_number || 'Quote'}</p><p className="text-xs text-mist capitalize mt-1">{statusLabel(q.status)}{q.valid_until ? ' · valid until ' + date(q.valid_until) : ''}</p></div><p className="font-semibold">{money(q.total_amount)}</p></div><div className="mt-3 space-y-1">{quoteItems.filter(x => x.quote_id === q.id).map(x => <p key={x.id} className="text-xs text-mist">{x.quantity ?? ''} {x.unit ?? ''} · {x.description || 'Item'} · {money(x.unit_price)}</p>)}</div><button type="button" onClick={() => openQuotePdf(q.id)} className="inline-flex mt-3 mr-2 items-center justify-center gap-2 rounded-btn border border-darkgrey px-4 py-2.5 text-xs font-semibold text-paper hover:border-blue hover:text-blue"><FileText className="w-3.5 h-3.5" /> Open full quotation PDF</button>{q.status === 'sent' && quoteLinks[q.id] && <a href={quoteLinks[q.id]} className="inline-flex mt-3 items-center justify-center rounded-btn bg-orange px-4 py-2.5 text-xs font-semibold text-jet hover:bg-orange-dark">View &amp; accept quote</a>}</div>) : <p className="p-4 text-sm text-mist">No quotes yet.</p>}</Section><Section title="Invoices" icon={Receipt}>{invoices.length ? invoices.map(i => <div key={i.id} className="px-4 py-4 border-b border-darkgrey last:border-0"><div className="flex justify-between gap-3"><div><p className="font-semibold text-sm">{i.invoice_number || 'Invoice'}</p><p className="text-xs text-mist capitalize mt-1">{statusLabel(i.status)} · due {date(i.due_date)}</p></div><p className="font-semibold">{money(i.total_amount)}</p></div><p className="text-xs text-mist mt-2">Paid {money(i.paid_amount)} · Balance {money(Math.max(0, Number(i.total_amount ?? 0) - Number(i.paid_amount ?? 0)))}</p>{Math.max(0, Number(i.total_amount ?? 0) - Number(i.paid_amount ?? 0)) > 0 && !['paid','void','cancelled'].includes((i.status ?? '').toLowerCase()) && <a href={paymentRequestHref(i, Math.max(0, Number(i.total_amount ?? 0) - Number(i.paid_amount ?? 0)), client.name)} target="_blank" rel="noreferrer" className="inline-flex mt-3 items-center justify-center rounded-btn bg-blue-fill px-3 py-2 text-xs font-semibold text-white hover:opacity-90">Request secure payment link</a>}<div className="mt-3 space-y-1">{invoiceItems.filter(x => x.invoice_id === i.id).map(x => <p key={x.id} className="text-xs text-mist">{x.quantity ?? ''} {x.unit ?? ''} · {x.description || 'Item'} · {money(x.unit_price)}</p>)}</div></div>) : <p className="p-4 text-sm text-mist">No invoices yet.</p>}</Section><Section title="Jobs & completion photos" icon={Camera}>{jobs.length ? jobs.map(job => { const jp = photos.filter(p => p.job_id === job.id); return <div key={job.id} className="px-4 py-4 border-b border-darkgrey last:border-0"><div className="flex justify-between gap-3"><div><p className="font-semibold text-sm">{job.title}</p><p className="text-xs text-mist capitalize mt-1">{statusLabel(job.status)} · scheduled {date(job.scheduled_date)}</p></div>{job.completed_date && <CheckCircle2 className="w-4 h-4 text-blue shrink-0" />}</div>{job.description && <p className="text-xs text-mist mt-2">{job.description}</p>}{job.completed_date && <p className="text-xs text-mist mt-2">Completed {date(job.completed_date)}</p>}{jp.length ? <div className="grid grid-cols-3 gap-2 mt-3">{jp.map(p => <a key={p.id} href={p.photo_url} target="_blank" rel="noreferrer" className="block aspect-square rounded-btn overflow-hidden border border-darkgrey"><img src={p.photo_url} alt={p.caption || p.type + ' job photo'} className="w-full h-full object-cover" /></a>)}</div> : <p className="text-xs text-mist mt-3">No job photos uploaded.</p>}</div> }) : <p className="p-4 text-sm text-mist">No jobs yet.</p>}</Section><Section title="Documents & materials" icon={FileText}>{documents.length ? documents.map(doc => <div key={doc.id} className="px-4 py-4 border-b border-darkgrey last:border-0"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="font-semibold text-sm">{doc.title}</p><p className="text-xs text-mist mt-1">{statusLabel(doc.category)} · {date(doc.created_at.slice(0, 10))}</p><p className="text-xs text-mist mt-1 break-words">{doc.original_filename}</p><p className="text-[11px] text-mist mt-1">Location: {doc.location_label}{doc.quote_id ? ' · Linked to quotation' : ''}</p></div><button type="button" onClick={() => downloadDocument(doc.id)} className="shrink-0 inline-flex items-center gap-2 rounded-btn border border-darkgrey px-3 py-2 text-xs font-semibold hover:border-blue hover:text-blue"><FileText className="w-3.5 h-3.5" /> Download</button></div></div>) : <p className="p-4 text-sm text-mist">No documents have been shared with you yet. Documents uploaded by NGMS will remain available here in your portal.</p>}</Section><footer className="text-center text-[11px] text-mist pb-4">NextGen Maintenance Solutions · ONE CALL. ALL SOLUTIONS. · WhatsApp 063 138 7945</footer></div></main>
}

export default function CustomerPortalPage() {
  const [session, setSession] = useState<boolean | null>(null)
  useEffect(() => { supabase.auth.getSession().then(({ data }) => setSession(!!data.session)); const { data: listener } = supabase.auth.onAuthStateChange((_e, s) => setSession(!!s)); return () => listener.subscription.unsubscribe() }, [])
  if (session === null) return <main className="min-h-[75vh] bg-jet flex items-center justify-center"><Loader2 className="w-6 h-6 text-blue animate-spin" /></main>
  return session ? <PortalHome /> : <PortalLogin />
}
