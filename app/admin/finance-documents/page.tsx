'use client'

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { AlertTriangle, ArrowLeft, CheckCircle2, FileText, FolderSync, Loader2, Search, UploadCloud } from 'lucide-react'
import StaffGate from '@/components/admin/StaffGate'
import { supabase } from '@/lib/supabaseClient'

type Customer = { id: string; name: string }
type Project = { id: string; title: string | null; client_id: string | null; status: string | null }
type Supplier = { id: string; name: string }
type DocumentRecord = {
  id: string
  document_number: string
  document_type: string
  title: string
  issued_on: string | null
  customer_id: string | null
  project_id: string | null
  supplier_id: string | null
  original_filename: string
  byte_size: number
  processing_status: string
  review_status: string
  created_at: string
}
type ApiResult = {
  document?: DocumentRecord
  documents?: DocumentRecord[]
  options?: { customers: Customer[]; projects: Project[]; suppliers: Supplier[] }
  error?: string
  warning?: string | null
}

const TYPES = [
  ['supplier_invoice', 'Supplier invoice'],
  ['customer_invoice', 'Customer invoice'],
  ['quote', 'Quote'],
  ['receipt', 'Receipt'],
  ['job_report', 'Job report'],
  ['completion_report', 'Completion report'],
  ['job_photo', 'Job photo'],
  ['purchase_order', 'Purchase order'],
  ['delivery_note', 'Delivery note'],
  ['contract', 'Contract'],
  ['tax_document', 'Tax document'],
  ['correspondence', 'Correspondence'],
  ['other', 'Other'],
]

const dateLabel = (value: string) => new Date(value).toLocaleDateString('en-ZA', { timeZone: 'Africa/Johannesburg', year: 'numeric', month: 'short', day: '2-digit' })
const sizeLabel = (bytes: number) => bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`

function FinanceDocuments() {
  const [documents, setDocuments] = useState<DocumentRecord[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [title, setTitle] = useState('')
  const [documentType, setDocumentType] = useState('supplier_invoice')
  const [issuedOn, setIssuedOn] = useState(new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Johannesburg' }))
  const [customerId, setCustomerId] = useState('')
  const [projectId, setProjectId] = useState('')
  const [supplierId, setSupplierId] = useState('')
  const [supplierPurchaseId, setSupplierPurchaseId] = useState('')
  const [visibleToCustomer, setVisibleToCustomer] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [openingId, setOpeningId] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const sessionToken = useCallback(async () => {
    const { data } = await supabase.auth.getSession()
    if (!data.session?.access_token) throw new Error('Your staff session has expired. Sign in again.')
    return data.session.access_token
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const token = await sessionToken()
      const response = await fetch('/api/admin/finance-documents?include=options&limit=100', {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      })
      const body = await response.json() as ApiResult
      if (!response.ok) throw new Error(body.error || 'Could not load document records.')
      setDocuments(body.documents ?? [])
      setCustomers(body.options?.customers ?? [])
      setProjects(body.options?.projects ?? [])
      setSuppliers(body.options?.suppliers ?? [])
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [sessionToken])

  useEffect(() => { void load() }, [load])

  const visibleProjects = useMemo(
    () => projects.filter((project) => !customerId || !project.client_id || project.client_id === customerId),
    [projects, customerId],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return documents
    return documents.filter((doc) => [doc.document_number, doc.title, doc.original_filename, doc.document_type].some((v) => v.toLowerCase().includes(q)))
  }, [documents, search])

  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setNotice('')
    if (!file || !title.trim()) {
      setError('Enter a document title and select a file.')
      return
    }
    setUploading(true)
    try {
      const token = await sessionToken()
      const body = new FormData()
      body.set('file', file)
      body.set('title', title.trim())
      body.set('document_type', documentType)
      if (issuedOn) body.set('issued_on', issuedOn)
      if (customerId) body.set('customer_id', customerId)
      if (projectId) body.set('project_id', projectId)
      if (supplierId) body.set('supplier_id', supplierId)
      if (supplierPurchaseId.trim()) body.set('supplier_purchase_id', supplierPurchaseId.trim())
      body.set('is_visible_to_customer', String(visibleToCustomer))
      const response = await fetch('/api/admin/finance-documents', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body,
      })
      const result = await response.json() as ApiResult
      if (!response.ok) throw new Error(result.error || 'Upload failed.')
      let statusMessage = result.warning || 'Document saved securely.'
      if (result.document?.id) {
        try {
          const extractResponse = await fetch(`/api/admin/finance-documents/${result.document.id}/extract`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
          })
          const extractResult = await extractResponse.json() as { error?: string; validation_warnings?: string[] }
          if (extractResponse.ok) {
            statusMessage = `Document saved and extracted. ${extractResult.validation_warnings?.length ? 'Validation warnings require review.' : 'Verify the extracted fields before approval.'} No financial transaction has been posted.`
          } else {
            statusMessage = `Document saved securely, but automatic extraction did not run: ${extractResult.error || 'provider unavailable'}. It remains available for manual review.`
          }
        } catch {
          statusMessage = 'Document saved securely, but extraction could not be reached. It remains available for manual review.'
        }
      }
      setNotice(statusMessage)
      setTitle('')
      setFile(null)
      setSupplierPurchaseId('')
      const input = document.getElementById('ngms-finance-document-file') as HTMLInputElement | null
      if (input) input.value = ''
      await load()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setUploading(false)
    }
  }

  async function openDocument(id: string) {
    setOpeningId(id)
    setError('')
    try {
      const token = await sessionToken()
      const response = await fetch(`/api/admin/finance-documents/${id}/download`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
      const body = await response.json() as { url?: string; error?: string }
      if (!response.ok || !body.url) throw new Error(body.error || 'Could not open document.')
      window.open(body.url, '_blank', 'noopener,noreferrer')
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setOpeningId('')
    }
  }

  return (
    <main className="min-h-[70vh] bg-[#BDBDBD] px-4 py-7 text-[#171717] sm:px-6">
      <div className="mx-auto max-w-6xl">
        <Link href="/admin" className="mb-4 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#333] hover:text-[#FF3D0A]">
          <ArrowLeft className="h-4 w-4" /> Admin
        </Link>
        <div className="mb-6 border-b border-[#777] pb-5">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[#D9360B]">NGMS / DOCUMENT CONTROL · 02</p>
          <h1 className="font-heading text-3xl font-bold uppercase leading-none sm:text-5xl">Documents.<br /><span className="text-[#5B5B5B]">Trace everything.</span></h1>
          <p className="mt-4 max-w-2xl text-sm text-[#282828]">Store supplier invoices, receipts, project reports and supporting records. Files remain private in Supabase. Extraction and financial posting require review before approval.</p>
        </div>

        {error && <div role="alert" className="mb-4 flex items-start gap-2 border border-red-800 bg-red-50 p-3 text-sm text-red-900"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{error}</div>}
        {notice && <div role="status" className="mb-4 flex items-start gap-2 border border-green-800 bg-green-50 p-3 text-sm text-green-900"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />{notice}</div>}

        <div className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <section className="border border-[#777] bg-[#F2F2EE] p-4 sm:p-5">
            <div className="mb-4 flex items-center gap-2">
              <UploadCloud className="h-5 w-5 text-[#FF3D0A]" />
              <h2 className="font-heading text-xl font-bold uppercase">Upload document</h2>
            </div>
            <form onSubmit={upload} className="space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wide">Document title
                <input value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={240} className="mt-1 block w-full border border-[#888] bg-white px-3 py-2.5 text-sm font-normal normal-case outline-none focus:border-[#FF3D0A] focus:ring-2 focus:ring-[#FF3D0A]/30" />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-xs font-bold uppercase tracking-wide">Document type
                  <select value={documentType} onChange={(e) => setDocumentType(e.target.value)} className="mt-1 block w-full border border-[#888] bg-white px-3 py-2.5 text-sm font-normal normal-case">
                    {TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </label>
                <label className="block text-xs font-bold uppercase tracking-wide">Issue date
                  <input type="date" value={issuedOn} onChange={(e) => setIssuedOn(e.target.value)} className="mt-1 block w-full border border-[#888] bg-white px-3 py-2.5 text-sm font-normal normal-case" />
                </label>
              </div>
              <label className="block text-xs font-bold uppercase tracking-wide">Customer (optional)
                <select value={customerId} onChange={(e) => { setCustomerId(e.target.value); setProjectId('') }} className="mt-1 block w-full border border-[#888] bg-white px-3 py-2.5 text-sm font-normal normal-case">
                  <option value="">Not linked to a customer</option>
                  {customers.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              </label>
              <label className="block text-xs font-bold uppercase tracking-wide">Project / job (optional)
                <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="mt-1 block w-full border border-[#888] bg-white px-3 py-2.5 text-sm font-normal normal-case">
                  <option value="">Not linked to a project</option>
                  {visibleProjects.map((item) => <option key={item.id} value={item.id}>{item.title || 'Untitled job'} · {item.status || 'unknown'}</option>)}
                </select>
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-xs font-bold uppercase tracking-wide">Supplier (optional)
                  <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} className="mt-1 block w-full border border-[#888] bg-white px-3 py-2.5 text-sm font-normal normal-case">
                    <option value="">Not linked</option>
                    {suppliers.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                  </select>
                </label>
                <label className="block text-xs font-bold uppercase tracking-wide">Purchase ID (optional)
                  <input value={supplierPurchaseId} onChange={(e) => setSupplierPurchaseId(e.target.value)} placeholder="Existing purchase UUID" className="mt-1 block w-full border border-[#888] bg-white px-3 py-2.5 text-sm font-normal normal-case" />
                </label>
              </div>
              <label className="flex items-start gap-2 text-sm">
                <input type="checkbox" checked={visibleToCustomer} onChange={(e) => setVisibleToCustomer(e.target.checked)} className="mt-1 accent-[#FF3D0A]" />
                <span>Release to customer portal <span className="block text-xs text-[#555]">Only select this for approved, customer-safe documents.</span></span>
              </label>
              <label className="block text-xs font-bold uppercase tracking-wide">File (PDF, image, Word, Excel or text; max 15 MiB)
                <input id="ngms-finance-document-file" type="file" required accept=".pdf,.jpg,.jpeg,.png,.webp,.txt,.doc,.docx,.xls,.xlsx" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="mt-1 block w-full border border-[#888] bg-white p-2 text-sm font-normal normal-case file:mr-3 file:border-0 file:bg-[#171717] file:px-3 file:py-2 file:font-semibold file:text-white" />
              </label>
              <button disabled={uploading} className="inline-flex min-h-11 w-full items-center justify-center gap-2 bg-[#FF3D0A] px-4 py-3 font-heading text-sm font-bold uppercase text-black hover:bg-[#E93305] disabled:cursor-not-allowed disabled:opacity-60">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
                {uploading ? 'Saving document…' : 'Save to NGMS'}
              </button>
              <p className="text-xs text-[#555]">Upload is implemented on this feature branch. OCR provider and Google Drive authentication must be configured before extraction or archive sync can run.</p>
            </form>
          </section>

          <section className="min-w-0 border border-[#777] bg-[#F2F2EE] p-4 sm:p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-[#FF3D0A]" />
                <h2 className="font-heading text-xl font-bold uppercase">Document register</h2>
              </div>
              <button onClick={() => void load()} disabled={loading} className="border border-[#777] px-3 py-2 text-xs font-bold uppercase hover:border-[#FF3D0A] disabled:opacity-50">Refresh</button>
            </div>
            <label className="mb-4 flex items-center gap-2 border border-[#888] bg-white px-3">
              <Search className="h-4 w-4 shrink-0 text-[#555]" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search title, filename or document number" className="min-h-11 min-w-0 flex-1 bg-transparent text-sm outline-none" />
            </label>
            {loading ? <div className="flex items-center justify-center gap-2 py-12 text-sm"><Loader2 className="h-4 w-4 animate-spin" />Loading records…</div> : filtered.length === 0 ? <div className="py-10 text-center text-sm text-[#555]">No documents found.</div> : (
              <div className="space-y-2">
                {filtered.map((doc) => (
                  <article key={doc.id} className="border border-[#CCC] bg-white p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="break-words text-xs font-bold uppercase tracking-wide text-[#D9360B]">{doc.document_number}</p>
                        <h3 className="mt-1 break-words font-semibold">{doc.title}</h3>
                        <p className="mt-1 break-words text-xs text-[#555]">{doc.original_filename} · {sizeLabel(doc.byte_size)} · {dateLabel(doc.created_at)}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <Link href={`/admin/finance-documents/${doc.id}`} aria-label={`Review ${doc.title}`} className="border border-[#777] px-2 py-2 text-[10px] font-bold uppercase hover:border-[#FF3D0A]">Review</Link>
                        <button onClick={() => void openDocument(doc.id)} disabled={openingId === doc.id} aria-label={`Open ${doc.title}`} className="border border-[#777] p-2 hover:border-[#FF3D0A] disabled:opacity-50">
                          {openingId === doc.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="bg-[#E5E5E0] px-2 py-1 text-[10px] font-bold uppercase">{doc.document_type.replaceAll('_', ' ')}</span>
                      <span className="bg-[#E5E5E0] px-2 py-1 text-[10px] font-bold uppercase">Review: {doc.review_status}</span>
                      <span className="bg-[#E5E5E0] px-2 py-1 text-[10px] font-bold uppercase">Extraction: {doc.processing_status}</span>
                    </div>
                  </article>
                ))}
              </div>
            )}
            <div className="mt-4 flex items-start gap-2 border-t border-[#CCC] pt-3 text-xs text-[#555]">
              <FolderSync className="mt-0.5 h-4 w-4 shrink-0 text-[#D9360B]" />
              Google Drive sync and OCR status will be surfaced here when those integrations are connected and the background workers are implemented.
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}

export default function FinanceDocumentsPage() {
  return <StaffGate title="Finance document control"><FinanceDocuments /></StaffGate>
}
