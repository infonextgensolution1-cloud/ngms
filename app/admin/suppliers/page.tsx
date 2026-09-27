'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Loader2, Plus, RefreshCw, AlertTriangle, ArrowLeft, Upload, FileText, CheckCircle2 } from 'lucide-react'
import StaffGate from '@/components/admin/StaffGate'
import { supabase } from '@/lib/supabaseClient'
import { handlersB } from '@/lib/ngms-ops/handlers-b'
import { handlersC } from '@/lib/ngms-ops/handlers-c'
import { rand, PURCHASE_CATEGORIES } from '@/lib/ngms-ops/core'

type Supplier = { id: string; name: string; contact_person: string | null; phone: string | null; email: string | null; address: string | null; categories: string | null; notes: string | null }
type JobRow = { id: string; title: string | null; client_name: string | null }
type Purchase = {
  id: string; supplier_id: string | null; job_id: string | null; purchase_date: string; description: string; category: string
  amount: number; receipt_url: string | null; payment_status: string; logged_to_job: boolean; supplier_name: string | null; job_title: string | null
}

const input = 'w-full bg-jet border border-darkgrey text-paper rounded-btn px-3 py-2.5 text-sm focus:outline-none focus:border-blue'

function NewSupplierForm({ onSaved }: { onSaved: () => void }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [contact, setContact] = useState('')
  const [phone, setPhone] = useState('')
  const [categories, setCategories] = useState('')
  const [saving, setSaving] = useState(false)

  async function save() {
    if (!name.trim()) return
    setSaving(true)
    await handlersC.ngms_save_supplier(supabase, { name: name.trim(), contact_person: contact.trim() || undefined, phone: phone.trim() || undefined, categories: categories.trim() || undefined })
    setSaving(false)
    setName('')
    setContact('')
    setPhone('')
    setCategories('')
    setOpen(false)
    onSaved()
  }

  if (!open)
    return (
      <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 border border-darkgrey hover:border-blue text-mist hover:text-paper text-sm font-heading font-semibold px-3.5 py-2 rounded-btn">
        <Plus className="w-4 h-4" /> Add supplier
      </button>
    )
  return (
    <div className="bg-cardgrey border border-darkgrey rounded-card p-4 mb-4">
      <p className="font-heading font-bold text-paper mb-3">New supplier</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <input className={input} placeholder="Supplier name" value={name} onChange={(e) => setName(e.target.value)} />
        <input className={input} placeholder="Contact person" value={contact} onChange={(e) => setContact(e.target.value)} />
        <input className={input} placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <input className={input} placeholder="What they supply, e.g. Paint, Steel" value={categories} onChange={(e) => setCategories(e.target.value)} />
      </div>
      <div className="flex items-center gap-3 mt-3">
        <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 bg-blue hover:bg-blue-dark text-white font-heading font-semibold px-4 py-2.5 rounded-btn disabled:opacity-50">
          {saving && <Loader2 className="w-4 h-4 animate-spin" />} Save
        </button>
        <button onClick={() => setOpen(false)} className="text-sm text-mist hover:text-paper">
          Cancel
        </button>
      </div>
    </div>
  )
}

function NewPurchaseForm({ suppliers, jobs, onSaved }: { suppliers: Supplier[]; jobs: JobRow[]; onSaved: () => void }) {
  const [open, setOpen] = useState(false)
  const [supplierId, setSupplierId] = useState('')
  const [jobId, setJobId] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<(typeof PURCHASE_CATEGORIES)[number]>('Materials')
  const [amount, setAmount] = useState('')
  const [purchaseDate, setPurchaseDate] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [logToJob, setLogToJob] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function save() {
    if (!description.trim() || !amount) {
      setError('Description and amount are required.')
      return
    }
    setSaving(true)
    setError('')
    try {
      let receiptUrl: string | undefined
      if (file) {
        const ext = file.name.split('.').pop()
        const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
        const { error: upErr } = await supabase.storage.from('purchase-receipts').upload(path, file, { cacheControl: '3600', upsert: false })
        if (upErr) throw upErr
        receiptUrl = path
      }
      const res = await handlersC.ngms_save_supplier_purchase(supabase, {
        supplier_id: supplierId || undefined,
        job_id: jobId || undefined,
        description: description.trim(),
        category,
        amount: Number(amount),
        purchase_date: purchaseDate || undefined,
        receipt_url: receiptUrl,
        log_to_job: logToJob && !!jobId,
      })
      if (res.isError) throw new Error(res.content[0]?.text)
      setDescription('')
      setAmount('')
      setFile(null)
      setOpen(false)
      onSaved()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  if (!open)
    return (
      <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 bg-orange text-white font-heading font-semibold px-4 py-2.5 rounded-btn">
        <Plus className="w-4 h-4" /> Log purchase
      </button>
    )
  return (
    <div className="bg-cardgrey border border-darkgrey rounded-card p-4 mb-4">
      <p className="font-heading font-bold text-paper mb-3">New purchase</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <input className={`${input} sm:col-span-2`} placeholder="Description, e.g. Paint + brushes for Job #4" value={description} onChange={(e) => setDescription(e.target.value)} />
        <select className={input} value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
          <option value="">No supplier / ad-hoc</option>
          {suppliers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <select className={input} value={jobId} onChange={(e) => setJobId(e.target.value)}>
          <option value="">Not linked to a job</option>
          {jobs.map((j) => (
            <option key={j.id} value={j.id}>
              {j.title ?? 'Untitled'} — {j.client_name ?? ''}
            </option>
          ))}
        </select>
        <select className={input} value={category} onChange={(e) => setCategory(e.target.value as (typeof PURCHASE_CATEGORIES)[number])}>
          {PURCHASE_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <input className={input} type="number" placeholder="Amount (R)" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <input className={input} type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} />
        <label className="inline-flex items-center gap-1.5 text-xs border border-darkgrey rounded-btn px-3 py-2.5 cursor-pointer hover:border-blue text-mist">
          <Upload className="w-3.5 h-3.5" /> {file ? file.name : 'Upload receipt'}
          <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </label>
      </div>
      {jobId && (
        <label className="inline-flex items-center gap-2 text-xs text-mist mt-3 cursor-pointer">
          <input type="checkbox" checked={logToJob} onChange={(e) => setLogToJob(e.target.checked)} /> Also add this as a job cost
        </label>
      )}
      {error && <p className="text-xs text-orange mt-2">{error}</p>}
      <div className="flex items-center gap-3 mt-3">
        <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 bg-blue hover:bg-blue-dark text-white font-heading font-semibold px-4 py-2.5 rounded-btn disabled:opacity-50">
          {saving && <Loader2 className="w-4 h-4 animate-spin" />} Save
        </button>
        <button onClick={() => setOpen(false)} className="text-sm text-mist hover:text-paper">
          Cancel
        </button>
      </div>
    </div>
  )
}

function SuppliersAndPurchases() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [jobs, setJobs] = useState<JobRow[]>([])
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [unpaidOnly, setUnpaidOnly] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [sRes, jRes, pRes] = await Promise.all([
        handlersC.ngms_list_suppliers(supabase, { limit: 200 }),
        handlersB.ngms_list_jobs(supabase, { open_only: true, limit: 100 }),
        handlersC.ngms_list_supplier_purchases(supabase, { limit: 100, ...(unpaidOnly ? { payment_status: 'unpaid' } : {}) }),
      ])
      if (sRes.isError) throw new Error(sRes.content[0]?.text)
      if (pRes.isError) throw new Error(pRes.content[0]?.text)
      setSuppliers(((sRes.structuredContent?.suppliers as Supplier[]) ?? []) as Supplier[])
      setJobs(((jRes.structuredContent?.jobs as JobRow[]) ?? []) as JobRow[])
      setPurchases(((pRes.structuredContent?.purchases as Purchase[]) ?? []) as Purchase[])
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [unpaidOnly])

  useEffect(() => {
    load()
  }, [load])

  async function viewReceipt(path: string) {
    const { data } = await supabase.storage.from('purchase-receipts').createSignedUrl(path, 300)
    if (data) window.open(data.signedUrl, '_blank')
  }

  async function markPaid(id: string) {
    await handlersC.ngms_save_supplier_purchase(supabase, { purchase_id: id, payment_status: 'paid' })
    load()
  }

  return (
    <main className="min-h-[70vh] bg-jet px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Link href="/admin/materials" className="text-xs text-mist hover:text-paper inline-flex items-center gap-1 mb-3">
          <ArrowLeft className="w-3.5 h-3.5" /> Materials Catalog
        </Link>
        <h1 className="font-heading text-2xl font-bold text-paper mb-5">Suppliers &amp; Purchases</h1>

        {error && (
          <p className="text-sm text-orange flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4" /> {error}
          </p>
        )}

        {/* Suppliers */}
        <section className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-heading font-bold text-paper">Suppliers</h2>
            <NewSupplierForm onSaved={load} />
          </div>
          <div className="bg-cardgrey border border-darkgrey rounded-card">
            {suppliers.length ? (
              <ul className="divide-y divide-darkgrey">
                {suppliers.map((s) => (
                  <li key={s.id} className="px-4 py-3">
                    <p className="text-paper text-sm font-semibold">{s.name}</p>
                    <p className="text-xs text-mist">
                      {s.categories ?? 'General'} · {s.phone ?? 'no phone on file'}
                      {s.contact_person ? ` · ${s.contact_person}` : ''}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-mist px-4 py-6 text-center">No suppliers on file yet.</p>
            )}
          </div>
        </section>

        {/* Purchases */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-heading font-bold text-paper">Purchases</h2>
            <div className="flex items-center gap-2">
              <button onClick={load} aria-label="Refresh" className="text-mist hover:text-paper p-1.5">
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
          <NewPurchaseForm suppliers={suppliers} jobs={jobs} onSaved={load} />
          <label className="inline-flex items-center gap-2 text-xs text-mist mb-2 cursor-pointer">
            <input type="checkbox" checked={unpaidOnly} onChange={(e) => setUnpaidOnly(e.target.checked)} /> Unpaid only
          </label>
          <div className="bg-cardgrey border border-darkgrey rounded-card">
            {loading && !purchases.length ? (
              <div className="py-10 flex justify-center">
                <Loader2 className="w-5 h-5 text-mist animate-spin" />
              </div>
            ) : purchases.length ? (
              <ul className="divide-y divide-darkgrey">
                {purchases.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <p className="text-paper text-sm truncate">{p.description}</p>
                      <p className="text-xs text-mist truncate">
                        {p.purchase_date} · {p.category} · {p.supplier_name ?? 'ad-hoc'}
                        {p.job_title ? ` → ${p.job_title}` : ''}
                        {p.logged_to_job ? ' · logged to job' : ''}
                      </p>
                    </div>
                    <div className="text-right shrink-0 flex items-center gap-2">
                      {p.receipt_url && (
                        <button onClick={() => viewReceipt(p.receipt_url!)} className="text-blue hover:text-blue-dark">
                          <FileText className="w-4 h-4" />
                        </button>
                      )}
                      <div>
                        <p className="text-paper text-sm">{rand(p.amount)}</p>
                        {p.payment_status === 'paid' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] text-whatsapp">
                            <CheckCircle2 className="w-3 h-3" /> paid
                          </span>
                        ) : (
                          <button onClick={() => markPaid(p.id)} className="text-[10px] text-orange uppercase tracking-wider hover:underline">
                            mark paid
                          </button>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-mist px-4 py-6 text-center">No purchases logged yet.</p>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}

export default function SuppliersPage() {
  return (
    <StaffGate title="Suppliers & Purchases">
      <SuppliersAndPurchases />
    </StaffGate>
  )
}
