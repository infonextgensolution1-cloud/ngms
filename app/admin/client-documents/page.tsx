'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { FileUp, Loader2, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react'

type Client = { id: string; name: string; email: string | null; suburb: string | null }
type Quote = { id: string; quote_number: string | null; client_id: string }

export default function ClientDocumentsAdminPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [clientId, setClientId] = useState('')
  const [quoteId, setQuoteId] = useState('')
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('materials')
  const [locationLabel, setLocationLabel] = useState("Gordon's Bay")
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [documents, setDocuments] = useState<Array<{id:string;title:string;category:string;original_filename:string;created_at:string;location_label:string}>>([])

  async function load() {
    setError('')
    const [c, q] = await Promise.all([
      supabase.from('clients').select('id,name,email,suburb').order('name'),
      supabase.from('quotes').select('id,quote_number,client_id').order('created_at', { ascending: false }),
    ])
    if (c.error || q.error) { setError(c.error?.message || q.error?.message || 'Could not load client records.'); return }
    setClients((c.data ?? []) as Client[])
    setQuotes((q.data ?? []) as Quote[])
  }

  async function loadDocuments(forClient = clientId) {
    if (!forClient) { setDocuments([]); return }
    const token = (await supabase.auth.getSession()).data.session?.access_token
    if (!token) { setError('Sign in to the NGMS admin portal first.'); return }
    const response = await fetch('/api/admin/client-documents?client_id=' + encodeURIComponent(forClient), { headers: { Authorization: 'Bearer ' + token }, cache: 'no-store' })
    const payload = await response.json().catch(() => ({}))
    if (!response.ok) { setError(payload.error || 'Could not load documents.'); return }
    setDocuments(payload.documents ?? [])
  }

  useEffect(() => { void load() }, [])
  useEffect(() => { void loadDocuments(clientId) }, [clientId])

  async function upload(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError(''); setMessage('')
    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token
      if (!token) throw new Error('Sign in to the NGMS admin portal first.')
      if (!clientId || !title.trim() || !file) throw new Error('Choose a client, enter a title and select a file.')
      const form = new FormData()
      form.set('client_id', clientId); form.set('quote_id', quoteId); form.set('title', title.trim())
      form.set('category', category); form.set('location_label', locationLabel.trim() || "Gordon's Bay"); form.set('file', file)
      const response = await fetch('/api/admin/client-documents', { method: 'POST', headers: { Authorization: 'Bearer ' + token }, body: form })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.error || 'Upload failed.')
      setMessage('Document uploaded and permanently linked to the selected client portal.')
      setTitle(''); setFile(null)
      const input = document.getElementById('client-document-file') as HTMLInputElement | null
      if (input) input.value = ''
      await loadDocuments(clientId)
    } catch (e) { setError(e instanceof Error ? e.message : 'Upload failed.') }
    finally { setBusy(false) }
  }

  const clientQuotes = quotes.filter(q => q.client_id === clientId)
  return <main className="min-h-screen bg-jet text-paper px-4 py-8"><div className="max-w-3xl mx-auto space-y-5">
    <header><p className="text-xs uppercase tracking-[0.2em] text-blue font-semibold">NGMS Admin</p><h1 className="font-heading text-2xl font-bold mt-1">Client documents & materials</h1><p className="text-sm text-mist mt-2">Upload quotations, material lists, receipts, warranties and reports. Shared files remain available in the client portal until an authorised staff member removes or hides them.</p></header>
    {error && <div role="alert" className="rounded-card border border-orange p-3 text-sm flex gap-2"><AlertTriangle className="w-4 h-4 shrink-0"/>{error}</div>}
    {message && <div role="status" className="rounded-card border border-blue p-3 text-sm flex gap-2"><CheckCircle2 className="w-4 h-4 shrink-0"/>{message}</div>}
    <form onSubmit={upload} className="rounded-card border border-darkgrey bg-cardgrey p-5 space-y-4">
      <label className="block text-sm font-semibold">Client<select required value={clientId} onChange={e => {setClientId(e.target.value);setQuoteId('')}} className="mt-1 w-full rounded-btn border border-darkgrey bg-jet p-3 text-sm"><option value="">Select client…</option>{clients.map(c => <option key={c.id} value={c.id}>{c.name}{c.email ? ' · '+c.email : ''}</option>)}</select></label>
      <label className="block text-sm font-semibold">Link to quotation (optional)<select value={quoteId} onChange={e => setQuoteId(e.target.value)} className="mt-1 w-full rounded-btn border border-darkgrey bg-jet p-3 text-sm"><option value="">Client-level document</option>{clientQuotes.map(q => <option key={q.id} value={q.id}>{q.quote_number || q.id}</option>)}</select></label>
      <label className="block text-sm font-semibold">Document title<input required maxLength={180} value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Materials list — waterproofing" className="mt-1 w-full rounded-btn border border-darkgrey bg-jet p-3 text-sm"/></label>
      <div className="grid sm:grid-cols-2 gap-3">
        <label className="block text-sm font-semibold">Category<select value={category} onChange={e => setCategory(e.target.value)} className="mt-1 w-full rounded-btn border border-darkgrey bg-jet p-3 text-sm">{[['materials','Materials'],['quotation','Quotation'],['invoice','Invoice'],['receipt','Receipt'],['report','Report'],['warranty','Warranty'],['other','Other']].map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label>
        <label className="block text-sm font-semibold">Location label<input value={locationLabel} onChange={e => setLocationLabel(e.target.value)} maxLength={100} className="mt-1 w-full rounded-btn border border-darkgrey bg-jet p-3 text-sm"/></label>
      </div>
      <label className="block text-sm font-semibold">File (max 15 MB)<input id="client-document-file" required type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,.txt,.doc,.docx,.xls,.xlsx" onChange={e => setFile(e.target.files?.[0] ?? null)} className="mt-2 block w-full text-sm file:mr-3 file:rounded-btn file:border-0 file:bg-orange file:px-3 file:py-2 file:font-semibold file:text-jet"/></label>
      <p className="text-xs text-mist">Files are private. Clients can only access documents linked to their verified portal account. Filenames follow QuoteNumber_Initials_ClientName_Location_Date.</p>
      <button disabled={busy} className="inline-flex items-center justify-center gap-2 rounded-btn bg-orange px-5 py-3 text-sm font-bold text-jet disabled:opacity-60">{busy ? <Loader2 className="w-4 h-4 animate-spin"/> : <FileUp className="w-4 h-4"/>}{busy ? 'Uploading…' : 'Upload to client portal'}</button>
    </form>
    <section className="rounded-card border border-darkgrey bg-cardgrey">
      <div className="flex items-center justify-between border-b border-darkgrey p-4"><h2 className="font-heading font-bold">Existing shared documents</h2><button onClick={() => loadDocuments()} className="inline-flex items-center gap-2 text-xs text-blue"><RefreshCw className="w-3.5 h-3.5"/>Refresh</button></div>
      {!clientId ? <p className="p-4 text-sm text-mist">Select a client to view their documents.</p> : documents.length ? documents.map(d => <div key={d.id} className="border-b border-darkgrey p-4 last:border-0"><p className="font-semibold text-sm">{d.title}</p><p className="mt-1 break-words text-xs text-mist">{d.original_filename}</p><p className="mt-1 text-xs text-mist">{d.category} · {d.location_label} · {new Date(d.created_at).toLocaleDateString('en-ZA')}</p></div>) : <p className="p-4 text-sm text-mist">No shared documents for this client yet.</p>}
    </section>
  </div></main>
}
