'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, CloudUpload, Download, FileText, Loader2, Save, ShieldCheck, Wallet } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

type Job = { id: string; title: string | null; status: string; completed_date: string | null }
type Draft = { id: string; draft_key: string; title: string; payload: { title?: string; notes?: string }; saved_at: string; updated_at: string }
type DocumentRow = { id: string; job_id: string | null; document_type: string; linked_record_type: string | null; linked_record_id: string | null; original_filename: string; content_type: string; byte_size: number; review_status: string; notes: string; created_at: string }
type Settlement = { id: string; job_id: string; labour_amount_ex_vat: number; vat_rate: number; split_percent: number; payable_ex_vat: number; payable_inc_vat: number; status: string; payment_reference: string | null; jobs?: { title: string | null; status: string } | null; subcontractor_invitation_drafts?: { company_name: string } | null }
type Data = { drafts: Draft[]; documents: DocumentRow[]; settlements: Settlement[]; jobs: Job[] }

const input = 'w-full bg-jet border border-darkgrey text-paper rounded-btn px-3 py-2.5 text-sm focus:outline-none focus:border-orange'
const money = (n: number) => new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(Number(n || 0))
const label = (s: string) => s.replaceAll('_', ' ')

export default function OperationsControlPage() {
  const [data, setData] = useState<Data>({ drafts: [], documents: [], settlements: [], jobs: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [token, setToken] = useState('')
  const [draftTitle, setDraftTitle] = useState('')
  const [draftNotes, setDraftNotes] = useState('')
  const [draftState, setDraftState] = useState<'loading' | 'saved' | 'saving' | 'unsaved'>('loading')
  const [uploading, setUploading] = useState(false)
  const [selectedJob, setSelectedJob] = useState('')
  const [documentType, setDocumentType] = useState('supplier_receipt')
  const [documentNotes, setDocumentNotes] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [settlementJob, setSettlementJob] = useState('')
  const [labour, setLabour] = useState('')
  const [vatRate, setVatRate] = useState('0')
  const [savingSettlement, setSavingSettlement] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const booted = useRef(false)

  const request = useCallback(async (path = '', init?: RequestInit) => {
    if (!token) throw new Error('Sign in to the NGMS admin first.')
    const headers = new Headers(init?.headers)
    headers.set('Authorization', `Bearer ${token}`)
    if (init?.body && !(init.body instanceof FormData)) headers.set('Content-Type', 'application/json')
    const response = await fetch(`/api/admin/operations-control${path}`, { ...init, headers, cache: 'no-store' })
    const result = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(result.error || 'Operations request failed.')
    return result
  }, [token])

  const load = useCallback(async () => {
    if (!token) return
    setLoading(true); setError('')
    try {
      const result = await request()
      const next = result as Data
      setData(next)
      const draft = next.drafts.find((item) => item.draft_key === 'operations-control-main')
      if (draft) {
        setDraftTitle(draft.payload?.title ?? draft.title ?? '')
        setDraftNotes(draft.payload?.notes ?? '')
      }
      booted.current = true
      setDraftState('saved')
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not load operations data.') }
    finally { setLoading(false) }
  }, [token, request])

  useEffect(() => {
    let active = true
    supabase.auth.getSession().then(({ data: auth }) => {
      if (active) setToken(auth.session?.access_token ?? '')
    })
    return () => { active = false }
  }, [])
  useEffect(() => { void load() }, [load])

  const saveDraft = useCallback(async (automatic: boolean) => {
    if (!token || !booted.current) return
    setDraftState('saving')
    try {
      await request('', { method: 'POST', body: JSON.stringify({
        action: 'save-draft', draftKey: 'operations-control-main', title: draftTitle,
        payload: { title: draftTitle, notes: draftNotes },
      }) })
      setDraftState('saved')
      if (!automatic) setMessage('Draft saved and synced to your account.')
    } catch (e) {
      setDraftState('unsaved')
      setError(e instanceof Error ? e.message : 'Draft save failed.')
    }
  }, [token, request, draftTitle, draftNotes])

  useEffect(() => {
    if (!booted.current) return
    setDraftState('unsaved')
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => { void saveDraft(true) }, 900)
    return () => { if (timer.current) clearTimeout(timer.current) }
  }, [draftTitle, draftNotes, saveDraft])

  async function uploadDocument() {
    if (!file) { setError('Choose a file first.'); return }
    setUploading(true); setError(''); setMessage('')
    try {
      const form = new FormData()
      form.set('file', file); form.set('jobId', selectedJob); form.set('documentType', documentType); form.set('notes', documentNotes)
      const result = await request('', { method: 'POST', body: form })
      setData((old) => ({ ...old, documents: [result.document, ...old.documents] }))
      setFile(null); setDocumentNotes('')
      const fileInput = document.getElementById('operations-document-file') as HTMLInputElement | null
      if (fileInput) fileInput.value = ''
      setMessage('Document uploaded privately. Review status: pending.')
    } catch (e) { setError(e instanceof Error ? e.message : 'Upload failed.') }
    finally { setUploading(false) }
  }

  async function reviewDocument(doc: DocumentRow, status: string) {
    setError(''); setMessage('')
    try {
      await request('', { method: 'POST', body: JSON.stringify({ action: 'review-document', id: doc.id, status, notes: doc.notes }) })
      setData((old) => ({ ...old, documents: old.documents.map((item) => item.id === doc.id ? { ...item, review_status: status } : item) }))
      setMessage(`Document marked ${label(status)}.`)
    } catch (e) { setError(e instanceof Error ? e.message : 'Review update failed.') }
  }

  async function downloadDocument(doc: DocumentRow) {
    try {
      const result = await request(`?download=${encodeURIComponent(doc.id)}`)
      window.open(result.url, '_blank', 'noopener,noreferrer')
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not open document.') }
  }

  async function saveSettlement() {
    if (!settlementJob || labour === '') { setError('Select a job and enter the labour-only amount ex VAT.'); return }
    setSavingSettlement(true); setError(''); setMessage('')
    try {
      const result = await request('', { method: 'POST', body: JSON.stringify({ action: 'save-settlement', jobId: settlementJob, labourAmountExVat: Number(labour), vatRate: Number(vatRate) }) })
      setMessage(result.message)
      setLabour('')
      await load()
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not save settlement.') }
    finally { setSavingSettlement(false) }
  }

  async function markPaid(item: Settlement) {
    const reference = window.prompt('Enter the bank/payment reference after the transfer is actually completed:')
    if (!reference?.trim()) return
    try {
      await request('', { method: 'POST', body: JSON.stringify({ action: 'mark-paid', id: item.id, reference }) })
      setData((old) => ({ ...old, settlements: old.settlements.map((s) => s.id === item.id ? { ...s, status: 'paid', payment_reference: reference } : s) }))
      setMessage('Payment recorded. No transfer was initiated by NGMS Admin.')
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not record payment.') }
  }

  const ex = Number(labour || 0) * 0.5
  const inc = ex * (1 + Number(vatRate || 0))
  const pendingDocs = data.documents.filter((doc) => doc.review_status === 'pending').length
  const payable = data.settlements.filter((item) => item.status === 'payable').reduce((sum, item) => sum + Number(item.payable_inc_vat), 0)

  return (
    <main className="min-h-screen bg-jet px-4 py-8 sm:py-12">
      <div className="max-w-6xl mx-auto">
        <Link href="/admin" className="inline-flex items-center gap-2 text-sm text-mist hover:text-paper mb-6"><ArrowLeft className="w-4 h-4" /> Admin dashboard</Link>
        <div className="flex flex-wrap items-start justify-between gap-4 mb-7">
          <div><p className="text-xs uppercase tracking-[.18em] text-orange font-semibold">NGMS / Admin</p><h1 className="font-heading text-3xl sm:text-4xl font-bold text-paper mt-1">Operations Control</h1><p className="text-sm text-mist mt-2">Drafts · documents · job links · subcontractor labour settlement</p></div>
          <div className="flex items-center gap-2 text-xs border border-darkgrey rounded-btn px-3 py-2 text-mist"><ShieldCheck className="w-4 h-4 text-orange" /> Staff + MFA protected</div>
        </div>
        {error && <div role="alert" className="bg-red-950/40 border border-red-800 text-red-200 rounded-btn p-3 mb-4 text-sm">{error}</div>}
        {message && <div role="status" className="border border-darkgrey text-paper rounded-btn p-3 mb-4 text-sm flex gap-2"><CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />{message}</div>}
        {loading ? <div className="flex items-center gap-2 text-mist py-12"><Loader2 className="w-5 h-5 animate-spin" /> Loading operations…</div> : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
              <Metric label="Documents" value={String(data.documents.length)} sub="Private uploads" />
              <Metric label="Awaiting review" value={String(pendingDocs)} sub="Need staff review" />
              <Metric label="Subcontractor payable" value={money(payable)} sub="Payable status, incl. VAT" />
              <Metric label="Job records" value={String(data.jobs.length)} sub="Latest 200 jobs" />
            </div>

            <section className="bg-cardgrey border border-darkgrey rounded-card p-4 sm:p-6 mb-5">
              <div className="flex items-start justify-between gap-3 mb-4"><div><h2 className="font-heading text-xl font-bold text-paper">Workspace draft</h2><p className="text-sm text-mist mt-1">Auto-saves drafts across devices; use Save draft for an explicit save.</p></div><span className="text-xs text-mist">{draftState === 'saving' ? 'Auto-saving…' : draftState === 'saved' ? 'Synced' : draftState === 'unsaved' ? 'Unsaved changes' : 'Loading'}</span></div>
              <div className="grid gap-3">
                <input className={input} value={draftTitle} onChange={(e) => setDraftTitle(e.target.value)} placeholder="Draft title / job reference" aria-label="Draft title" />
                <textarea className={input + ' min-h-32'} value={draftNotes} onChange={(e) => setDraftNotes(e.target.value)} placeholder="Notes, supplier purchases, scope changes, materials to link…" aria-label="Draft notes" />
                <div><button onClick={() => void saveDraft(false)} disabled={draftState === 'saving'} className="inline-flex items-center gap-2 bg-orange text-white font-heading font-semibold px-4 py-2.5 rounded-btn disabled:opacity-50"><Save className="w-4 h-4" /> Save draft now</button><p className="text-xs text-mist mt-2">Drafts are tied to your staff account and can sync between signed-in devices.</p></div>
              </div>
            </section>

            <section className="bg-cardgrey border border-darkgrey rounded-card p-4 sm:p-6 mb-5">
              <div className="flex items-start gap-3 mb-4"><CloudUpload className="w-6 h-6 text-orange mt-0.5" /><div><h2 className="font-heading text-xl font-bold text-paper">Documents & links</h2><p className="text-sm text-mist mt-1">Upload supplier receipts, invoices, material bulk files, quotes, contracts and completion reports. Every upload is private and reviewable.</p></div></div>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="text-xs text-mist">Link to job<select className={input + ' mt-1'} value={selectedJob} onChange={(e) => setSelectedJob(e.target.value)}><option value="">No job link</option>{data.jobs.map((job) => <option key={job.id} value={job.id}>{job.title || 'Untitled job'} · {job.status}</option>)}</select></label>
                <label className="text-xs text-mist">Document type<select className={input + ' mt-1'} value={documentType} onChange={(e) => setDocumentType(e.target.value)}><option value="supplier_receipt">Supplier receipt</option><option value="invoice">Invoice</option><option value="materials_bulk_upload">Materials bulk upload (CSV / Excel)</option><option value="quote">Quote</option><option value="completion_report">Completion report</option><option value="contract">Contract</option><option value="other">Other</option></select></label>
                <label className="text-xs text-mist md:col-span-2">File (PDF, image, CSV or Excel; max 20 MB)<input id="operations-document-file" className={input + ' mt-1'} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,.csv,.xls,.xlsx" onChange={(e) => setFile(e.target.files?.[0] ?? null)} /></label>
                <label className="text-xs text-mist md:col-span-2">Notes<input className={input + ' mt-1'} value={documentNotes} onChange={(e) => setDocumentNotes(e.target.value)} placeholder="Supplier, invoice number, materials, job details…" /></label>
              </div>
              <button onClick={() => void uploadDocument()} disabled={uploading || !file} className="inline-flex items-center gap-2 bg-orange text-white font-heading font-semibold px-4 py-2.5 rounded-btn mt-3 disabled:opacity-50">{uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CloudUpload className="w-4 h-4" />}{uploading ? 'Uploading…' : 'Upload document'}</button>
              <div className="mt-5 space-y-2">
                {data.documents.length === 0 ? <p className="text-sm text-mist">No documents uploaded yet.</p> : data.documents.map((doc) => <div key={doc.id} className="border border-darkgrey rounded-btn p-3 flex flex-col md:flex-row md:items-center gap-3 justify-between">
                  <div className="min-w-0"><p className="text-sm text-paper font-semibold break-words">{doc.original_filename}</p><p className="text-xs text-mist mt-1">{label(doc.document_type)} · {doc.job_id ? (data.jobs.find((j) => j.id === doc.job_id)?.title || 'Linked job') : 'No job link'} · {(doc.byte_size / 1024 / 1024).toFixed(2)} MB</p><p className="text-xs text-mist mt-1">Status: <span className="text-orange capitalize">{label(doc.review_status)}</span>{doc.notes ? ' · ' + doc.notes : ''}</p></div>
                  <div className="flex flex-wrap gap-2 shrink-0"><button onClick={() => void downloadDocument(doc)} className="inline-flex items-center gap-1.5 border border-darkgrey text-paper text-xs px-3 py-2 rounded-btn"><Download className="w-3.5 h-3.5" /> Open</button>{doc.review_status !== 'approved' && <button onClick={() => void reviewDocument(doc, 'approved')} className="inline-flex items-center gap-1.5 border border-green-800 text-green-300 text-xs px-3 py-2 rounded-btn"><CheckCircle2 className="w-3.5 h-3.5" /> Approve</button>}{doc.review_status !== 'rejected' && <button onClick={() => void reviewDocument(doc, 'rejected')} className="border border-red-900 text-red-300 text-xs px-3 py-2 rounded-btn">Reject</button>}</div>
                </div>)}
              </div>
            </section>

            <section className="bg-cardgrey border border-darkgrey rounded-card p-4 sm:p-6 mb-5">
              <div className="flex items-start gap-3 mb-4"><Wallet className="w-6 h-6 text-orange mt-0.5" /><div><h2 className="font-heading text-xl font-bold text-paper">Subcontractor split — labour only</h2><p className="text-sm text-mist mt-1">50% of the entered labour amount. Materials, fuel and overhead are excluded. Amounts are shown ex VAT and incl. VAT.</p></div></div>
              <div className="grid gap-3 md:grid-cols-3">
                <label className="text-xs text-mist md:col-span-1">Job<select className={input + ' mt-1'} value={settlementJob} onChange={(e) => setSettlementJob(e.target.value)}><option value="">Choose job…</option>{data.jobs.map((job) => <option key={job.id} value={job.id}>{job.title || 'Untitled job'} · {job.status}</option>)}</select></label>
                <label className="text-xs text-mist">Total labour only (ex VAT)<input className={input + ' mt-1'} type="number" min="0" step="0.01" value={labour} onChange={(e) => setLabour(e.target.value)} placeholder="R 0.00" /></label>
                <label className="text-xs text-mist">VAT rate<select className={input + ' mt-1'} value={vatRate} onChange={(e) => setVatRate(e.target.value)}><option value="0">0% / not charging VAT</option><option value="0.15">15% standard VAT (only if applicable)</option></select></label>
              </div>
              <div className="grid grid-cols-2 gap-3 my-4"><div className="border border-darkgrey rounded-btn p-3"><p className="text-xs text-mist">Subcontractor 50% · ex VAT</p><p className="font-heading text-xl font-bold text-paper mt-1">{money(ex)}</p></div><div className="border border-darkgrey rounded-btn p-3"><p className="text-xs text-mist">Subcontractor 50% · incl VAT</p><p className="font-heading text-xl font-bold text-paper mt-1">{money(inc)}</p></div></div>
              <button onClick={() => void saveSettlement()} disabled={savingSettlement || !settlementJob || labour === ''} className="inline-flex items-center gap-2 bg-orange text-white font-heading font-semibold px-4 py-2.5 rounded-btn disabled:opacity-50">{savingSettlement ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save settlement</button>
              <p className="text-xs text-mist mt-2">When a job changes to Completed, the saved settlement automatically becomes Payable. This creates the payable record only; it does not initiate a bank transfer.</p>
              <div className="mt-5 space-y-2">{data.settlements.length === 0 ? <p className="text-sm text-mist">No settlements recorded yet.</p> : data.settlements.map((item) => <div key={item.id} className="border border-darkgrey rounded-btn p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"><div><p className="text-sm font-semibold text-paper">{item.jobs?.title || 'Job settlement'}</p><p className="text-xs text-mist mt-1">Labour: {money(Number(item.labour_amount_ex_vat))} ex VAT · 50% payable: {money(Number(item.payable_ex_vat))} ex / {money(Number(item.payable_inc_vat))} incl.</p><p className="text-xs text-mist mt-1 capitalize">Status: {label(item.status)}{item.payment_reference ? ' · Ref ' + item.payment_reference : ''}</p></div>{item.status === 'payable' && <button onClick={() => void markPaid(item)} className="border border-darkgrey text-paper text-xs px-3 py-2 rounded-btn">Record paid</button>}</div>)}</div>
            </section>
            <div className="flex items-start gap-2 text-xs text-mist"><FileText className="w-4 h-4 shrink-0" /> This is an isolated feature-branch preview workflow. It does not alter production or automatically transfer funds. Apply the included database migration only to a preview database before end-to-end testing.</div>
          </>
        )}
      </div>
    </main>
  )
}

function Metric({ label: title, value, sub }: { label: string; value: string; sub: string }) {
  return <div className="bg-cardgrey border border-darkgrey rounded-card p-4 min-w-0"><p className="text-xs uppercase tracking-wide text-mist">{title}</p><p className="font-heading text-xl sm:text-2xl font-bold text-paper mt-1 break-words">{value}</p><p className="text-xs text-mist mt-1">{sub}</p></div>
}
