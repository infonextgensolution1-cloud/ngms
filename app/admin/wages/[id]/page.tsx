'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, AlertTriangle, Save, Upload, Trash2, Printer, FileText } from 'lucide-react'
import StaffGate from '@/components/admin/StaffGate'
import { supabase } from '@/lib/supabaseClient'
import { handlersC } from '@/lib/ngms-ops/handlers-c'
import { rand, WORKER_CATEGORIES, WORKER_STATUSES, ACCOUNT_TYPES, WORKER_DOC_TYPES, PAYSLIP_PERIODS } from '@/lib/ngms-ops/core'
import type { Worker, Payslip } from '@/lib/ngms-ops/core'

const input = 'w-full bg-jet border border-darkgrey text-paper rounded-btn px-3 py-2.5 text-sm focus:outline-none focus:border-blue'
const label = 'text-xs text-mist'

type Doc = { id: string; doc_type: string; file_url: string; file_name: string | null; uploaded_at: string }

function toNum(v: string): number {
  const n = parseFloat(v)
  return Number.isFinite(n) ? n : 0
}

function WorkerView() {
  const params = useParams<{ id: string }>()
  const id = params.id

  const [worker, setWorker] = useState<Worker | null>(null)
  const [docs, setDocs] = useState<Doc[]>([])
  const [payslips, setPayslips] = useState<Payslip[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState<string | null>(null)

  // profile form state
  const [form, setForm] = useState<Record<string, string>>({})

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await handlersC.ngms_get_worker(supabase, { worker_id: id })
      if (res.isError) throw new Error(res.content[0]?.text ?? 'Could not load that worker')
      const sc = res.structuredContent as { worker: Worker; documents: Doc[]; recent_payslips: Payslip[] }
      setWorker(sc.worker)
      setDocs(sc.documents ?? [])
      setPayslips(sc.recent_payslips ?? [])
      setForm({
        name: sc.worker.name,
        category: sc.worker.category,
        status: sc.worker.status,
        id_number: sc.worker.id_number ?? '',
        phone: sc.worker.phone ?? '',
        email: sc.worker.email ?? '',
        emergency_contact_name: sc.worker.emergency_contact_name ?? '',
        emergency_contact_phone: sc.worker.emergency_contact_phone ?? '',
        start_date: sc.worker.start_date ?? '',
        notes: sc.worker.notes ?? '',
        daily_rate: String(sc.worker.daily_rate ?? 0),
        bank_name: sc.worker.bank_name ?? '',
        account_holder: sc.worker.account_holder ?? '',
        account_number: sc.worker.account_number ?? '',
        branch_code: sc.worker.branch_code ?? '',
        account_type: sc.worker.account_type ?? '',
        payment_reference: sc.worker.payment_reference ?? '',
      })
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  function set(k: string, v: string) {
    setForm((f) => ({ ...f, [k]: v }))
  }

  async function saveProfile() {
    setSaving(true)
    setMsg('')
    const res = await handlersC.ngms_save_worker(supabase, {
      worker_id: id,
      name: form.name,
      category: form.category,
      status: form.status,
      id_number: form.id_number || undefined,
      phone: form.phone || undefined,
      email: form.email || undefined,
      emergency_contact_name: form.emergency_contact_name || undefined,
      emergency_contact_phone: form.emergency_contact_phone || undefined,
      start_date: form.start_date || undefined,
      notes: form.notes || undefined,
      daily_rate: toNum(form.daily_rate),
      bank_name: form.bank_name || undefined,
      account_holder: form.account_holder || undefined,
      account_number: form.account_number || undefined,
      branch_code: form.branch_code || undefined,
      account_type: form.account_type || undefined,
      payment_reference: form.payment_reference || undefined,
    })
    setSaving(false)
    setMsg(res.isError ? res.content[0]?.text ?? 'Could not save' : 'Saved.')
    if (!res.isError) load()
  }

  async function uploadDoc(docType: string, file: File) {
    setUploading(docType)
    setMsg('')
    try {
      const ext = file.name.split('.').pop()
      const path = `${id}/${docType}-${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage.from('worker-documents').upload(path, file, { cacheControl: '3600', upsert: false })
      if (upErr) throw upErr
      const res = await handlersC.ngms_save_worker_document(supabase, { worker_id: id, doc_type: docType, file_url: path, file_name: file.name })
      if (res.isError) throw new Error(res.content[0]?.text)
      await load()
    } catch (e) {
      setMsg((e as Error).message)
    } finally {
      setUploading(null)
    }
  }

  async function viewDoc(path: string) {
    const { data, error: e } = await supabase.storage.from('worker-documents').createSignedUrl(path, 300)
    if (e || !data) {
      setMsg('Could not open that document.')
      return
    }
    window.open(data.signedUrl, '_blank')
  }

  async function deleteDoc(docId: string) {
    await handlersC.ngms_delete_worker_document(supabase, { document_id: docId })
    load()
  }

  // ---------------------------------------------------------- payslip generator
  const [period, setPeriod] = useState<(typeof PAYSLIP_PERIODS)[number]>('weekly')
  const [periodStart, setPeriodStart] = useState('')
  const [periodEnd, setPeriodEnd] = useState('')
  const [daysWorked, setDaysWorked] = useState('5')
  const [absentDays, setAbsentDays] = useState('0')
  const [rateOverride, setRateOverride] = useState('')
  const [travel, setTravel] = useState('0')
  const [otHours, setOtHours] = useState('0')
  const [otRate, setOtRate] = useState('0')
  const [bonus, setBonus] = useState('0')
  const [uifApplied, setUifApplied] = useState(true)
  const [paye, setPaye] = useState('0')
  const [advance, setAdvance] = useState('0')
  const [toolDed, setToolDed] = useState('0')
  const [otherDed, setOtherDed] = useState('0')
  const [dedNotes, setDedNotes] = useState('')
  const [generating, setGenerating] = useState(false)

  const preview = useMemo(() => {
    const rate = rateOverride ? toNum(rateOverride) : n0(worker?.daily_rate)
    const days = toNum(daysWorked)
    const absent = toNum(absentDays)
    const basic = rate * (days - absent)
    const travelTotal = toNum(travel) * days
    const ot = toNum(otHours) * toNum(otRate)
    const gross = basic + travelTotal + ot + toNum(bonus)
    const uif = uifApplied ? basic * 0.01 : 0
    const totalDed = uif + toNum(paye) + toNum(advance) + toNum(toolDed) + toNum(otherDed)
    const net = gross - totalDed
    return { basic, travelTotal, ot, gross, uif, totalDed, net }
  }, [worker, rateOverride, daysWorked, absentDays, travel, otHours, otRate, bonus, uifApplied, paye, advance, toolDed, otherDed])

  function n0(v: number | undefined): number {
    return v ?? 0
  }

  async function generatePayslip() {
    setGenerating(true)
    setMsg('')
    const res = await handlersC.ngms_generate_payslip(supabase, {
      worker_id: id,
      period,
      period_start: periodStart || undefined,
      period_end: periodEnd || undefined,
      days_worked: toNum(daysWorked),
      absent_days: toNum(absentDays),
      daily_rate: rateOverride ? toNum(rateOverride) : undefined,
      travel_allowance: toNum(travel),
      overtime_hours: toNum(otHours),
      overtime_rate: toNum(otRate),
      bonus: toNum(bonus),
      uif_applied: uifApplied,
      paye_deduction: toNum(paye),
      advance_deduction: toNum(advance),
      tool_deduction: toNum(toolDed),
      other_deduction: toNum(otherDed),
      deduction_notes: dedNotes || undefined,
    })
    setGenerating(false)
    if (res.isError) {
      setMsg(res.content[0]?.text ?? 'Could not generate payslip')
      return
    }
    setMsg('Payslip generated.')
    load()
  }

  if (loading && !worker) {
    return (
      <main className="min-h-[60vh] flex items-center justify-center bg-jet">
        <Loader2 className="w-6 h-6 text-mist animate-spin" />
      </main>
    )
  }
  if (error && !worker) {
    return (
      <main className="min-h-[60vh] bg-jet px-4 py-16">
        <div className="max-w-md mx-auto text-center">
          <p className="text-orange flex items-center justify-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5" /> {error}
          </p>
          <Link href="/admin/wages" className="text-blue text-sm">
            Back to wages
          </Link>
        </div>
      </main>
    )
  }
  if (!worker) return null

  return (
    <main className="min-h-screen bg-jet px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Link href="/admin/wages" className="text-xs text-mist hover:text-paper inline-flex items-center gap-1 mb-3">
          <ArrowLeft className="w-3.5 h-3.5" /> Wages &amp; Payroll
        </Link>
        <h1 className="font-heading text-2xl font-bold text-paper mb-1">{worker.name}</h1>
        <p className="text-sm text-mist mb-5">{worker.category} · {rand(worker.daily_rate)}/day</p>

        {msg && <p className="text-xs text-mist mb-4">{msg}</p>}

        {/* Personal */}
        <section className="bg-cardgrey border border-darkgrey rounded-card p-4 mb-4">
          <h2 className="font-heading font-bold text-paper mb-3">Personal</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className={label}>
              Full name
              <input className={`${input} mt-1`} value={form.name ?? ''} onChange={(e) => set('name', e.target.value)} />
            </label>
            <label className={label}>
              Category
              <select className={`${input} mt-1`} value={form.category ?? ''} onChange={(e) => set('category', e.target.value)}>
                {WORKER_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label className={label}>
              ID number
              <input className={`${input} mt-1`} value={form.id_number ?? ''} onChange={(e) => set('id_number', e.target.value)} />
            </label>
            <label className={label}>
              Phone
              <input className={`${input} mt-1`} value={form.phone ?? ''} onChange={(e) => set('phone', e.target.value)} />
            </label>
            <label className={label}>
              Email
              <input className={`${input} mt-1`} value={form.email ?? ''} onChange={(e) => set('email', e.target.value)} />
            </label>
            <label className={label}>
              Status
              <select className={`${input} mt-1`} value={form.status ?? ''} onChange={(e) => set('status', e.target.value)}>
                {WORKER_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label className={label}>
              Emergency contact name
              <input className={`${input} mt-1`} value={form.emergency_contact_name ?? ''} onChange={(e) => set('emergency_contact_name', e.target.value)} />
            </label>
            <label className={label}>
              Emergency contact phone
              <input className={`${input} mt-1`} value={form.emergency_contact_phone ?? ''} onChange={(e) => set('emergency_contact_phone', e.target.value)} />
            </label>
            <label className={label}>
              Start date
              <input type="date" className={`${input} mt-1`} value={form.start_date ?? ''} onChange={(e) => set('start_date', e.target.value)} />
            </label>
            <label className={label}>
              Daily rate (R)
              <input type="number" className={`${input} mt-1`} value={form.daily_rate ?? ''} onChange={(e) => set('daily_rate', e.target.value)} />
            </label>
          </div>
          <label className={`${label} block mt-3`}>
            Notes
            <textarea className={`${input} mt-1 min-h-[70px]`} value={form.notes ?? ''} onChange={(e) => set('notes', e.target.value)} />
          </label>
        </section>

        {/* Banking */}
        <section className="bg-cardgrey border border-darkgrey rounded-card p-4 mb-4">
          <h2 className="font-heading font-bold text-paper mb-3">Banking</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className={label}>
              Bank name
              <input className={`${input} mt-1`} value={form.bank_name ?? ''} onChange={(e) => set('bank_name', e.target.value)} />
            </label>
            <label className={label}>
              Account holder
              <input className={`${input} mt-1`} value={form.account_holder ?? ''} onChange={(e) => set('account_holder', e.target.value)} />
            </label>
            <label className={label}>
              Account number
              <input className={`${input} mt-1`} value={form.account_number ?? ''} onChange={(e) => set('account_number', e.target.value)} />
            </label>
            <label className={label}>
              Branch code
              <input className={`${input} mt-1`} value={form.branch_code ?? ''} onChange={(e) => set('branch_code', e.target.value)} />
            </label>
            <label className={label}>
              Account type
              <select className={`${input} mt-1`} value={form.account_type ?? ''} onChange={(e) => set('account_type', e.target.value)}>
                <option value="">—</option>
                {ACCOUNT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
            <label className={label}>
              Payment reference
              <input className={`${input} mt-1`} value={form.payment_reference ?? ''} onChange={(e) => set('payment_reference', e.target.value)} />
            </label>
          </div>
        </section>

        <button onClick={saveProfile} disabled={saving} className="inline-flex items-center gap-2 bg-blue-fill hover:bg-blue-dark text-white font-heading font-semibold px-4 py-2.5 rounded-btn disabled:opacity-50 mb-6">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save profile
        </button>

        {/* Documents */}
        <section className="bg-cardgrey border border-darkgrey rounded-card p-4 mb-6">
          <h2 className="font-heading font-bold text-paper mb-3">Documents</h2>
          <div className="flex flex-wrap gap-2 mb-3">
            {WORKER_DOC_TYPES.map((dt) => (
              <label key={dt} className="inline-flex items-center gap-1.5 text-xs border border-darkgrey rounded-btn px-3 py-2 cursor-pointer hover:border-blue text-mist">
                {uploading === dt ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />} Upload {dt}
                <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadDoc(dt, f) }} />
              </label>
            ))}
          </div>
          {docs.length ? (
            <ul className="divide-y divide-darkgrey">
              {docs.map((d) => (
                <li key={d.id} className="flex items-center justify-between py-2 text-sm">
                  <button onClick={() => viewDoc(d.file_url)} className="text-blue hover:underline flex items-center gap-1.5 min-w-0">
                    <FileText className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">{d.file_name ?? d.doc_type}</span>
                  </button>
                  <button onClick={() => deleteDoc(d.id)} className="text-mist hover:text-orange shrink-0">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-mist">No documents on file.</p>
          )}
        </section>

        {/* Payslip generator */}
        <section className="bg-cardgrey border border-darkgrey rounded-card p-4 mb-6">
          <h2 className="font-heading font-bold text-paper mb-3">Generate payslip</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className={label}>
              Period
              <select className={`${input} mt-1`} value={period} onChange={(e) => setPeriod(e.target.value as (typeof PAYSLIP_PERIODS)[number])}>
                {PAYSLIP_PERIODS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </label>
            <label className={label}>
              Period start
              <input type="date" className={`${input} mt-1`} value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} />
            </label>
            <label className={label}>
              Period end
              <input type="date" className={`${input} mt-1`} value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} />
            </label>
            <label className={label}>
              Days worked
              <input type="number" step="0.5" className={`${input} mt-1`} value={daysWorked} onChange={(e) => setDaysWorked(e.target.value)} />
            </label>
            <label className={label}>
              Absent days
              <input type="number" step="0.5" className={`${input} mt-1`} value={absentDays} onChange={(e) => setAbsentDays(e.target.value)} />
            </label>
            <label className={label}>
              Daily rate override (R)
              <input type="number" className={`${input} mt-1`} placeholder={String(worker.daily_rate)} value={rateOverride} onChange={(e) => setRateOverride(e.target.value)} />
            </label>
            <label className={label}>
              Travel allowance (R/day)
              <input type="number" className={`${input} mt-1`} value={travel} onChange={(e) => setTravel(e.target.value)} />
            </label>
            <label className={label}>
              Overtime hours
              <input type="number" step="0.5" className={`${input} mt-1`} value={otHours} onChange={(e) => setOtHours(e.target.value)} />
            </label>
            <label className={label}>
              Overtime rate (R/hr)
              <input type="number" className={`${input} mt-1`} value={otRate} onChange={(e) => setOtRate(e.target.value)} />
            </label>
            <label className={label}>
              Bonus / incentive (R)
              <input type="number" className={`${input} mt-1`} value={bonus} onChange={(e) => setBonus(e.target.value)} />
            </label>
          </div>

          <h3 className="text-xs font-heading font-bold text-mist uppercase tracking-wide mt-4 mb-2">Deductions</h3>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="text-xs text-mist flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={uifApplied} onChange={(e) => setUifApplied(e.target.checked)} /> UIF (1% of basic pay)
            </label>
            <label className={label}>
              PAYE (R)
              <input type="number" className={`${input} mt-1`} value={paye} onChange={(e) => setPaye(e.target.value)} />
            </label>
            <label className={label}>
              Advance / loan (R)
              <input type="number" className={`${input} mt-1`} value={advance} onChange={(e) => setAdvance(e.target.value)} />
            </label>
            <label className={label}>
              Tool / equipment (R)
              <input type="number" className={`${input} mt-1`} value={toolDed} onChange={(e) => setToolDed(e.target.value)} />
            </label>
            <label className={label}>
              Other (R)
              <input type="number" className={`${input} mt-1`} value={otherDed} onChange={(e) => setOtherDed(e.target.value)} />
            </label>
          </div>
          <label className={`${label} block mt-3`}>
            Deduction notes
            <input className={`${input} mt-1`} value={dedNotes} onChange={(e) => setDedNotes(e.target.value)} />
          </label>

          <div className="bg-jet border border-darkgrey rounded-card p-3 mt-4 text-sm">
            <Row l="Basic pay" v={rand(preview.basic)} />
            <Row l="Travel allowance" v={rand(preview.travelTotal)} />
            <Row l="Overtime" v={rand(preview.ot)} />
            <Row l="Gross pay" v={rand(preview.gross)} bold />
            <Row l="Deductions (incl. UIF)" v={`− ${rand(preview.totalDed)}`} />
            <Row l="Net pay" v={rand(preview.net)} bold accent />
          </div>

          <button
            onClick={generatePayslip}
            disabled={generating}
            className="inline-flex items-center gap-2 bg-orange text-white font-heading font-semibold px-4 py-2.5 rounded-btn disabled:opacity-50 mt-4"
          >
            {generating && <Loader2 className="w-4 h-4 animate-spin" />} Generate payslip
          </button>
        </section>

        {/* Payslip history */}
        <section className="bg-cardgrey border border-darkgrey rounded-card">
          <h2 className="font-heading font-bold text-paper p-4 pb-2">Payslip history</h2>
          {payslips.length ? (
            <ul className="divide-y divide-darkgrey">
              {payslips.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-paper text-sm truncate">
                      {p.period_start}
                      {p.period_end ? ` → ${p.period_end}` : ''} · {p.period}
                    </p>
                    <p className="text-xs text-mist">Net {rand(p.net_pay)} (gross {rand(p.gross_pay)})</p>
                  </div>
                  <Link href={`/admin/wages/payslip/${p.id}`} className="text-blue hover:underline text-xs inline-flex items-center gap-1 shrink-0">
                    <Printer className="w-3.5 h-3.5" /> Print
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-mist px-4 pb-4">No payslips generated yet.</p>
          )}
        </section>
      </div>
    </main>
  )
}

function Row({ l, v, bold, accent }: { l: string; v: string; bold?: boolean; accent?: boolean }) {
  return (
    <div className={`flex items-center justify-between ${bold ? 'font-semibold' : ''}`} style={{ color: accent ? '#39D353' : undefined }}>
      <span className="text-mist">{l}</span>
      <span className="text-paper" style={{ color: accent ? '#39D353' : undefined }}>
        {v}
      </span>
    </div>
  )
}

export default function WorkerDetailPage() {
  return (
    <StaffGate title="Worker">
      <WorkerView />
    </StaffGate>
  )
}
