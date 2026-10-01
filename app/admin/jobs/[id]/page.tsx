'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, AlertTriangle, Plus, Trash2, Printer, Upload, Image as ImageIcon, CloudRain, CalendarPlus } from 'lucide-react'
import StaffGate from '@/components/admin/StaffGate'
import DeleteRecord from '@/components/admin/DeleteRecord'
import { supabase } from '@/lib/supabaseClient'
import TrackerLinkButton from '@/components/admin/TrackerLinkButton'
import { deleteJob } from '@/lib/admin-delete'
import { jobWeather, useForecast } from '@/lib/job-weather'
import { googleCalendarLink } from '@/lib/gcal-link'
import { handlersB } from '@/lib/ngms-ops/handlers-b'
import { handlersC } from '@/lib/ngms-ops/handlers-c'
import { rand, JOB_STATUSES, COST_CATEGORIES, PHOTO_TYPES } from '@/lib/ngms-ops/core'
import type { Job, Client } from '@/lib/ngms-ops/core'
import { LOGO_DATA_URI } from '@/lib/logo'

const BRAND = { black: '#0A0A0A', purple: '#8B1BF5', orange: '#F57C1B', green: '#39D353', grey: '#5B5B5B', line: '#E4E4E4' }
const input = 'w-full bg-jet border border-darkgrey text-paper rounded-btn px-3 py-2.5 text-sm focus:outline-none focus:border-blue'

const STATUS_STYLE: Record<string, string> = {
  scheduled: 'text-blue border-blue',
  in_progress: 'text-orange border-orange',
  on_hold: 'text-mist border-darkgrey',
  completed: 'text-whatsapp border-whatsapp',
  cancelled: 'text-mist border-darkgrey line-through',
}

type CostRow = { id: string; category: string; description: string | null; amount: number; created_at: string }
type LabourRow = { id: string; employee_name: string; hours: number; rate_per_hour: number; date: string | null }
type Costing = {
  revenue_ex_vat: number; revenue_basis: string; total_cost: number; cost_by_category: Record<string, number>
  labour_hours: number; gross_profit: number; margin_percent: number | null; costs: CostRow[]; labour: LabourRow[]
}
type Photo = { id: string; photo_url: string; type: string; caption: string | null; sort_order: number }

function AddCostForm({ jobId, onSaved }: { jobId: string; onSaved: () => void }) {
  const [open, setOpen] = useState(false)
  const [category, setCategory] = useState<(typeof COST_CATEGORIES)[number]>('Materials')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [saving, setSaving] = useState(false)

  async function save() {
    if (!amount) return
    setSaving(true)
    await handlersB.ngms_add_job_cost(supabase, { job_id: jobId, category, description: description.trim() || undefined, amount: Number(amount) })
    setSaving(false)
    setDescription('')
    setAmount('')
    setOpen(false)
    onSaved()
  }

  if (!open)
    return (
      <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 text-xs border border-darkgrey hover:border-blue text-mist hover:text-paper px-3 py-1.5 rounded-btn">
        <Plus className="w-3.5 h-3.5" /> Add cost
      </button>
    )
  return (
    <div className="bg-jet border border-darkgrey rounded-btn p-3 mt-2">
      <div className="grid gap-2 sm:grid-cols-3">
        <select className={input} value={category} onChange={(e) => setCategory(e.target.value as (typeof COST_CATEGORIES)[number])}>
          {COST_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <input className={input} placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
        <input className={input} type="number" placeholder="Amount (R)" value={amount} onChange={(e) => setAmount(e.target.value)} />
      </div>
      <div className="flex items-center gap-3 mt-2">
        <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 bg-blue hover:bg-blue-dark text-white text-sm font-heading font-semibold px-3 py-2 rounded-btn disabled:opacity-50">
          {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Save
        </button>
        <button onClick={() => setOpen(false)} className="text-xs text-mist hover:text-paper">
          Cancel
        </button>
      </div>
    </div>
  )
}

function AddLabourForm({ jobId, onSaved }: { jobId: string; onSaved: () => void }) {
  const [open, setOpen] = useState(false)
  const [employee, setEmployee] = useState('')
  const [hours, setHours] = useState('')
  const [rate, setRate] = useState('')
  const [saving, setSaving] = useState(false)

  async function save() {
    if (!employee.trim() || !hours || !rate) return
    setSaving(true)
    await handlersB.ngms_log_labour(supabase, { job_id: jobId, employee_name: employee.trim(), hours: Number(hours), rate_per_hour: Number(rate) })
    setSaving(false)
    setEmployee('')
    setHours('')
    setRate('')
    setOpen(false)
    onSaved()
  }

  if (!open)
    return (
      <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 text-xs border border-darkgrey hover:border-blue text-mist hover:text-paper px-3 py-1.5 rounded-btn">
        <Plus className="w-3.5 h-3.5" /> Log labour
      </button>
    )
  return (
    <div className="bg-jet border border-darkgrey rounded-btn p-3 mt-2">
      <div className="grid gap-2 sm:grid-cols-3">
        <input className={input} placeholder="Worker name" value={employee} onChange={(e) => setEmployee(e.target.value)} />
        <input className={input} type="number" placeholder="Hours" value={hours} onChange={(e) => setHours(e.target.value)} />
        <input className={input} type="number" placeholder="Rate / hour (R)" value={rate} onChange={(e) => setRate(e.target.value)} />
      </div>
      <div className="flex items-center gap-3 mt-2">
        <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 bg-blue hover:bg-blue-dark text-white text-sm font-heading font-semibold px-3 py-2 rounded-btn disabled:opacity-50">
          {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Save
        </button>
        <button onClick={() => setOpen(false)} className="text-xs text-mist hover:text-paper">
          Cancel
        </button>
      </div>
    </div>
  )
}

function PhotoUploader({ jobId, onSaved }: { jobId: string; onSaved: () => void }) {
  const [type, setType] = useState<(typeof PHOTO_TYPES)[number]>('before')
  const [caption, setCaption] = useState('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  async function upload(file: File) {
    setUploading(true)
    setError('')
    try {
      const ext = file.name.split('.').pop()
      const path = `${jobId}/${type}-${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage.from('job-photos').upload(path, file, { cacheControl: '3600', upsert: false })
      if (upErr) throw upErr
      const { data } = supabase.storage.from('job-photos').getPublicUrl(path)
      const res = await handlersC.ngms_save_job_photo(supabase, { job_id: jobId, photo_url: data.publicUrl, type, caption: caption.trim() || undefined })
      if (res.isError) throw new Error(res.content[0]?.text)
      setCaption('')
      onSaved()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="bg-jet border border-darkgrey rounded-btn p-3">
      <div className="grid gap-2 sm:grid-cols-3">
        <select className={input} value={type} onChange={(e) => setType(e.target.value as (typeof PHOTO_TYPES)[number])}>
          {PHOTO_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <input className={`${input} sm:col-span-2`} placeholder="Caption (optional)" value={caption} onChange={(e) => setCaption(e.target.value)} />
      </div>
      <label className="inline-flex items-center gap-2 text-sm text-mist hover:text-paper border border-darkgrey hover:border-blue rounded-btn px-3 py-2 mt-2 cursor-pointer">
        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} {uploading ? 'Uploading…' : 'Upload photo'}
        <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
      </label>
      {error && <p className="text-xs text-orange mt-2">{error}</p>}
    </div>
  )
}

function JobDetail() {
  const params = useParams<{ id: string }>()
  const id = params.id
  const [job, setJob] = useState<Job | null>(null)
  const [client, setClient] = useState<Client | null>(null)
  const [costing, setCosting] = useState<Costing | null>(null)
  const [photos, setPhotos] = useState<Photo[]>([])
  const [workflowQuote, setWorkflowQuote] = useState<{ id: string; quote_number: string | null; status: string; total_amount: number | null } | null>(null)
  const [workflowInvoices, setWorkflowInvoices] = useState<{ id: string; invoice_number: string; status: string; total_amount: number | null; paid_amount: number | null; due_date: string | null }[]>([])
  const [workflowBusy, setWorkflowBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [savingStatus, setSavingStatus] = useState(false)
  const forecast = useForecast()

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [jobRes, photoRes] = await Promise.all([handlersB.ngms_get_job(supabase, { job_id: id }), handlersC.ngms_list_job_photos(supabase, { job_id: id })])
      if (jobRes.isError) throw new Error(jobRes.content[0]?.text ?? 'Could not load that job')
      const sc = jobRes.structuredContent as { job: Job; client: Client | null; costing: Costing }
      setJob(sc.job)
      setClient(sc.client)
      setCosting(sc.costing)
      setPhotos(((photoRes.structuredContent?.photos as Photo[]) ?? []) as Photo[])
      if (sc.job.quote_id) {
        const [{ data: q }, { data: invs }] = await Promise.all([
          supabase.from('quotes').select('id,quote_number,status,total_amount').eq('id', sc.job.quote_id).maybeSingle(),
          supabase.from('invoices').select('id,invoice_number,status,total_amount,paid_amount,due_date').eq('quote_id', sc.job.quote_id).neq('status', 'void').order('created_at', { ascending: false }),
        ])
        setWorkflowQuote(q ?? null)
        setWorkflowInvoices((invs ?? []) as { id: string; invoice_number: string; status: string; total_amount: number | null; paid_amount: number | null; due_date: string | null }[])
      } else {
        setWorkflowQuote(null)
        setWorkflowInvoices([])
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

  async function setStatus(status: string) {
    if (!job) return
    setSavingStatus(true)
    await handlersB.ngms_update_job(supabase, { job_id: job.id, status })
    setSavingStatus(false)
    load()
  }

  async function deleteCost(costId: string) {
    await handlersB.ngms_delete_job_cost(supabase, { cost_id: costId })
    load()
  }
  async function deleteLabour(labourId: string) {
    await handlersB.ngms_delete_job_cost(supabase, { labour_entry_id: labourId })
    load()
  }
  async function deletePhoto(photoId: string) {
    await handlersC.ngms_delete_job_photo(supabase, { photo_id: photoId })
    load()
  }

  const grouped = useMemo(() => {
    const g: Record<string, Photo[]> = { before: [], progress: [], after: [] }
    for (const p of photos) (g[p.type] ??= []).push(p)
    return g
  }, [photos])

  if (loading && !job) {
    return (
      <main className="min-h-[60vh] flex items-center justify-center bg-jet">
        <Loader2 className="w-6 h-6 text-mist animate-spin" />
      </main>
    )
  }
  if (error || !job) {
    return (
      <main className="min-h-[60vh] bg-jet px-4 py-16">
        <div className="max-w-md mx-auto text-center">
          <p className="text-orange flex items-center justify-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5" /> {error || 'Not found'}
          </p>
          <Link href="/admin/jobs" className="text-blue text-sm">
            Back to jobs
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-jet px-4 py-8">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #print-area, #print-area * { visibility: visible; }
          #print-area { position: absolute; left: 0; top: 0; width: 100%; margin: 0 !important; padding: 14mm !important; }
          .no-print { display: none !important; }
          @page { margin: 10mm; }
        }
      `}</style>

      <div className="max-w-2xl mx-auto">
        <div className="no-print">
          <Link href="/admin/jobs" className="text-xs text-mist hover:text-paper inline-flex items-center gap-1 mb-3">
            <ArrowLeft className="w-3.5 h-3.5" /> Jobs
          </Link>

          <div className="flex items-start justify-between gap-3 mb-2">
            <div>
              <h1 className="font-heading text-2xl font-bold text-paper">{job.title ?? 'Untitled job'}</h1>
              <p className="text-sm text-mist">
                {client?.name ?? '—'}{client?.suburb ? `, ${client.suburb}` : ''} · {job.scheduled_date ?? 'no date set'}
              </p>
            </div>
            <button onClick={() => window.print()} className="inline-flex items-center gap-2 border border-darkgrey hover:border-blue text-mist hover:text-paper text-sm font-heading font-semibold px-3.5 py-2 rounded-btn shrink-0">
              <Printer className="w-4 h-4" /> Print report
            </button>
          </div>

          <div className="mb-3"><TrackerLinkButton jobId={job.id} /></div>

          {workflowQuote && (
            <section className="bg-cardgrey border border-darkgrey rounded-card p-4 mb-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-mist">Workflow</p>
                  <h2 className="font-heading font-bold text-paper">Quote → Job → Invoice</h2>
                  <p className="text-xs text-mist mt-1">Linked commercial record for this job.</p>
                </div>
                <Link href={`/admin/quotes/${workflowQuote.id}`} className="text-xs text-blue hover:text-paper">Open quote</Link>
              </div>

              <div className="grid sm:grid-cols-3 gap-2 mt-3">
                <div className="border border-darkgrey rounded-btn px-3 py-2">
                  <p className="text-[10px] uppercase tracking-wider text-mist">Quote</p>
                  <p className="text-sm text-paper font-semibold">{workflowQuote.quote_number ?? 'Quote'}</p>
                  <p className="text-xs text-mist capitalize">{workflowQuote.status}</p>
                </div>
                <div className="border border-darkgrey rounded-btn px-3 py-2">
                  <p className="text-[10px] uppercase tracking-wider text-mist">Value</p>
                  <p className="text-sm text-paper font-semibold">{rand(Number(workflowQuote.total_amount ?? 0))}</p>
                  <p className="text-xs text-mist">{workflowInvoices.length} invoice{workflowInvoices.length === 1 ? '' : 's'}</p>
                </div>
                <div className="border border-darkgrey rounded-btn px-3 py-2">
                  <p className="text-[10px] uppercase tracking-wider text-mist">Billing</p>
                  {workflowInvoices.length ? workflowInvoices.slice(0, 2).map((i) => (
                    <Link key={i.id} href={`/admin/invoices/${i.id}`} className="block text-xs text-blue hover:text-paper">
                      {i.invoice_number} · {i.status} · {rand(Number(i.total_amount ?? 0))}
                    </Link>
                  )) : <p className="text-xs text-orange">No invoice raised</p>}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 mt-3">
                {workflowInvoices.map((i) => (
                  <Link key={i.id} href={`/admin/invoices/${i.id}`} className="text-xs border border-darkgrey hover:border-blue text-mist hover:text-paper px-3 py-1.5 rounded-btn">
                    Open {i.invoice_number}
                  </Link>
                ))}
                {!workflowInvoices.some((i) => ['paid'].includes(i.status)) && workflowQuote.status !== 'declined' && workflowQuote.status !== 'expired' && (
                  <button
                    disabled={workflowBusy}
                    onClick={async () => {
                      setWorkflowBusy(true)
                      try {
                        const res = await handlersB.ngms_create_invoice(supabase, { quote_id: workflowQuote.id, kind: 'balance' })
                        if (res.isError) throw new Error(res.content[0]?.text ?? 'Could not create invoice')
                        const inv = res.structuredContent?.invoice as { id: string } | undefined
                        if (inv?.id) window.location.href = `/admin/invoices/${inv.id}`
                      } catch (e) {
                        setError((e as Error).message)
                      } finally {
                        setWorkflowBusy(false)
                      }
                    }}
                    className="text-xs bg-orange hover:opacity-90 text-white font-heading font-semibold px-3 py-1.5 rounded-btn disabled:opacity-50"
                  >
                    {workflowBusy ? 'Creating…' : workflowInvoices.length ? 'Raise balance invoice' : 'Raise invoice'}
                  </button>
                )}
              </div>
            </section>
          )

          {job.scheduled_date && (
            <a
              href={googleCalendarLink({
                title: job.title ?? 'NGMS job',
                date: job.scheduled_date,
                details: [client?.name && `Client: ${client.name}`, client?.phone && `Phone: ${client.phone}`, job.description].filter(Boolean).join('\n'),
                location: [client?.address, client?.suburb].filter(Boolean).join(', '),
              })}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-blue hover:text-paper mb-3"
            >
              <CalendarPlus className="w-4 h-4" /> Add to Google Calendar
            </a>
          )}

          <div className="flex flex-wrap items-center gap-2 mb-5">
            {JOB_STATUSES.map((s) => (
              <button
                key={s}
                disabled={savingStatus}
                onClick={() => setStatus(s)}
                className={`text-xs px-3 py-1.5 rounded-btn border capitalize disabled:opacity-50 ${job.status === s ? (STATUS_STYLE[s] ?? 'border-orange text-orange') : 'border-darkgrey text-mist hover:text-paper'}`}
              >
                {s.replace('_', ' ')}
              </button>
            ))}
          </div>

          {(() => {
            const w = ['scheduled', 'in_progress'].includes(job.status) ? jobWeather(`${job.title ?? ''} ${job.description ?? ''}`, job.scheduled_date, forecast) : null
            return w ? (
              <p className="text-sm text-jet bg-orange rounded-card px-3.5 py-2.5 mb-5 flex items-start gap-2">
                <CloudRain className="w-4 h-4 shrink-0 mt-0.5" /> {w.note}
              </p>
            ) : null
          })()}

          {job.description && (
            <div className="bg-cardgrey border border-darkgrey rounded-card p-4 mb-5 text-sm text-paper whitespace-pre-line">{job.description}</div>
          )}

          {/* Job costing — internal only, never printed */}
          {costing && (
            <section className="bg-cardgrey border border-darkgrey rounded-card p-4 mb-5">
              <h2 className="font-heading font-bold text-paper mb-2">Job costing (internal)</h2>
              <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                <p className="text-mist">
                  Revenue: <span className="text-paper">{rand(costing.revenue_ex_vat)}</span>
                </p>
                <p className="text-mist">
                  Costs: <span className="text-paper">{rand(costing.total_cost)}</span>
                </p>
                <p className="text-mist">
                  Gross profit: <span className={costing.gross_profit >= 0 ? 'text-whatsapp' : 'text-orange'}>{rand(costing.gross_profit)}</span>
                </p>
                <p className="text-mist">
                  Margin: <span className="text-paper">{costing.margin_percent !== null ? `${costing.margin_percent}%` : '—'}</span>
                </p>
              </div>
              <p className="text-xs text-mist mb-3">{costing.revenue_basis}</p>

              <p className="text-xs font-heading uppercase tracking-wider text-mist mb-1">Costs</p>
              {costing.costs.length > 0 && (
                <ul className="mb-1 divide-y divide-darkgrey">
                  {costing.costs.map((c) => (
                    <li key={c.id} className="flex items-center justify-between py-1.5 text-sm">
                      <span className="text-paper truncate">
                        {c.category}{c.description ? ` — ${c.description}` : ''}
                      </span>
                      <span className="flex items-center gap-2 shrink-0">
                        <span className="text-paper">{rand(c.amount)}</span>
                        <button onClick={() => deleteCost(c.id)} className="text-mist hover:text-orange">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              <AddCostForm jobId={job.id} onSaved={load} />

              <p className="text-xs font-heading uppercase tracking-wider text-mist mt-4 mb-1">Labour ({costing.labour_hours}h)</p>
              {costing.labour.length > 0 && (
                <ul className="mb-1 divide-y divide-darkgrey">
                  {costing.labour.map((l) => (
                    <li key={l.id} className="flex items-center justify-between py-1.5 text-sm">
                      <span className="text-paper truncate">
                        {l.date ?? '—'} · {l.employee_name} · {l.hours}h × {rand(l.rate_per_hour)}
                      </span>
                      <span className="flex items-center gap-2 shrink-0">
                        <span className="text-paper">{rand(l.hours * l.rate_per_hour)}</span>
                        <button onClick={() => deleteLabour(l.id)} className="text-mist hover:text-orange">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              <AddLabourForm jobId={job.id} onSaved={load} />
            </section>
          )}

          {/* Photo management */}
          <section className="bg-cardgrey border border-darkgrey rounded-card p-4 mb-5">
            <h2 className="font-heading font-bold text-paper mb-2 flex items-center gap-2">
              <ImageIcon className="w-4 h-4" /> Photos
            </h2>
            <PhotoUploader jobId={job.id} onSaved={load} />
            {photos.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mt-3">
                {photos.map((p) => (
                  <div key={p.id} className="relative group">
                    <img src={p.photo_url} alt={p.caption ?? p.type} className="w-full aspect-square object-cover rounded-btn border border-darkgrey" />
                    <span className="absolute top-1 left-1 text-[9px] uppercase tracking-wider bg-jet/80 text-mist px-1.5 py-0.5 rounded">{p.type}</span>
                    <button onClick={() => deletePhoto(p.id)} className="absolute top-1 right-1 bg-jet/80 text-mist hover:text-orange p-1 rounded">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          <div className="mb-6">
            <DeleteRecord
              label="Delete job"
              confirmText={`Delete "${job.title ?? 'Untitled job'}"? Its costs, labour entries and photos are deleted with it.`}
              onDelete={() => deleteJob(supabase, job.id)}
              redirectTo="/admin/jobs"
            />
          </div>
        </div>

        {/* Printable client-facing report — no financial figures, ever */}
        <div id="print-area" className="rounded-card shadow-xl" style={{ background: '#fff', color: BRAND.black, padding: '28px 26px', fontFamily: 'Inter, system-ui, sans-serif' }}>
          <div className="flex items-start justify-between gap-4" style={{ borderBottom: `3px solid ${BRAND.purple}`, paddingBottom: 16, marginBottom: 20 }}>
            <img src={LOGO_DATA_URI} alt="NGMS logo" style={{ height: 48, width: 'auto', objectFit: 'contain' }} />
            <div style={{ textAlign: 'right', fontSize: 12, color: BRAND.grey }}>
              <p style={{ fontWeight: 700, fontSize: 15, color: BRAND.black }}>NextGen Solar Clean &amp; Maintenance Solutions</p>
              <p>Job Completion Report</p>
            </div>
          </div>

          <div style={{ background: '#F7F5FA', borderRadius: 10, padding: '12px 14px', marginBottom: 18, fontSize: 13 }}>
            <p style={{ fontWeight: 700 }}>{job.title ?? 'Job'}</p>
            <p style={{ color: BRAND.grey }}>{client?.name ?? ''}{client?.suburb ? `, ${client.suburb}` : ''}</p>
            <p style={{ color: BRAND.grey }}>
              Scheduled: {job.scheduled_date ?? '—'} {job.completed_date ? `· Completed: ${job.completed_date}` : ''}
            </p>
          </div>

          {(['before', 'progress', 'after'] as const).map((t) =>
            grouped[t]?.length ? (
              <div key={t} style={{ marginBottom: 18 }}>
                <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, color: BRAND.grey, fontWeight: 700, marginBottom: 8 }}>{t}</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                  {grouped[t].map((p) => (
                    <div key={p.id}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.photo_url} alt={p.caption ?? t} style={{ width: '100%', borderRadius: 8, border: `1px solid ${BRAND.line}`, objectFit: 'cover', aspectRatio: '4/3' }} />
                      {p.caption && <p style={{ fontSize: 11, color: BRAND.grey, marginTop: 4 }}>{p.caption}</p>}
                    </div>
                  ))}
                </div>
              </div>
            ) : null
          )}

          {!photos.length && <p style={{ color: BRAND.grey, fontSize: 13, marginBottom: 18 }}>No photos added to this job yet.</p>}

          <div style={{ borderTop: `1px solid ${BRAND.line}`, paddingTop: 14, fontSize: 12, color: BRAND.grey }}>
            <p>Thank you for choosing NextGen Solar Clean &amp; Maintenance Solutions. Get in touch any time if you have questions about this job.</p>
          </div>
        </div>
      </div>
    </main>
  )
}

export default function JobPage() {
  return (
    <StaffGate title="Job">
      <JobDetail />
    </StaffGate>
  )
}
