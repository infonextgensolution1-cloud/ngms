'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Clipboard, Download, FileText, RotateCcw, WandSparkles } from 'lucide-react'
import StaffGate from '@/components/admin/StaffGate'

type TemplateType = 'inspection' | 'progress' | 'completion' | 'variation' | 'materials'
type FormState = {
  subcontractor: string
  contact: string
  trade: string
  client: string
  property: string
  reference: string
  reportDate: string
  originalScope: string
  workCompleted: string
  findings: string
  materials: string
  nextSteps: string
  materialsCost: string
  labourCost: string
  otherCost: string
}

const TEMPLATE_OPTIONS: { value: TemplateType; label: string; description: string }[] = [
  { value: 'inspection', label: 'Initial inspection', description: 'Site findings, access, risks, recommended work and estimate.' },
  { value: 'progress', label: 'Progress report', description: 'Work completed to date, blockers, materials and next actions.' },
  { value: 'completion', label: 'Completion report', description: 'Completed scope, testing, defects, handover and sign-off.' },
  { value: 'variation', label: 'Additional work / variation', description: 'Change to the original scope with costs and an approval gate.' },
  { value: 'materials', label: 'Materials request', description: 'Items required, reason, estimated costs and purchase approval.' },
]

const DEFAULT_FORM: FormState = {
  subcontractor: '',
  contact: '',
  trade: 'Plumbing',
  client: '',
  property: '',
  reference: '',
  reportDate: new Date().toLocaleDateString('en-CA'),
  originalScope: '',
  workCompleted: '',
  findings: '',
  materials: '',
  nextSteps: '',
  materialsCost: '',
  labourCost: '',
  otherCost: '',
}

const money = (value: string) => {
  const amount = Number(value)
  return Number.isFinite(amount) && value.trim() !== '' ? amount : 0
}
const zar = (amount: number) => new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', minimumFractionDigits: 2 }).format(amount)
const clean = (value: string) => value.trim() || 'Not provided'

function makeTemplate(type: TemplateType, form: FormState) {
  const total = money(form.materialsCost) + money(form.labourCost) + money(form.otherCost)
  const header = [
    'NEXTGEN MAINTENANCE SOLUTIONS (NGMS)',
    'SUBCONTRACTOR SITE TEMPLATE',
    'ONE CALL. ALL SOLUTIONS.',
    '',
    `Template: ${TEMPLATE_OPTIONS.find((item) => item.value === type)?.label ?? type}`,
    `Report date: ${clean(form.reportDate)}`,
    `Subcontractor: ${clean(form.subcontractor)}`,
    `Contact person: ${clean(form.contact)}`,
    `Trade: ${clean(form.trade)}`,
    `Client: ${clean(form.client)}`,
    `Property / site: ${clean(form.property)}`,
    `Job / quote reference: ${clean(form.reference)}`,
    '',
  ]

  const sections: Record<TemplateType, string[]> = {
    inspection: [
      '1. REQUESTED / ORIGINAL SCOPE',
      clean(form.originalScope),
      '',
      '2. SITE FINDINGS, CONDITION & ACCESS',
      clean(form.findings),
      '',
      '3. WORK ALREADY COMPLETED (IF ANY)',
      clean(form.workCompleted),
      '',
      '4. MATERIALS / EQUIPMENT REQUIRED',
      clean(form.materials),
      '',
      '5. RECOMMENDATION & NEXT STEPS',
      clean(form.nextSteps),
      '',
      'ESTIMATED COSTS (SUBJECT TO REVIEW)',
      `Materials: ${zar(money(form.materialsCost))}`,
      `Labour: ${zar(money(form.labourCost))}`,
      `Other: ${zar(money(form.otherCost))}`,
      `Estimated total: ${zar(total)}`,
      '',
      'Approval status: NOT APPROVED BY THIS TEMPLATE.',
      'Do not start extra or chargeable work until NGMS/client approval is confirmed.',
    ],
    progress: [
      '1. AGREED / ORIGINAL SCOPE',
      clean(form.originalScope),
      '',
      '2. WORK COMPLETED TO DATE',
      clean(form.workCompleted),
      '',
      '3. FINDINGS, DELAYS, SAFETY OR ACCESS ISSUES',
      clean(form.findings),
      '',
      '4. MATERIALS USED / REQUIRED',
      clean(form.materials),
      '',
      '5. NEXT STEPS / EXPECTED RETURN VISIT',
      clean(form.nextSteps),
      '',
      'COST POSITION (IF APPLICABLE)',
      `Materials: ${zar(money(form.materialsCost))}`,
      `Labour: ${zar(money(form.labourCost))}`,
      `Other: ${zar(money(form.otherCost))}`,
      `Total reported estimate: ${zar(total)}`,
      '',
      'Status must reflect the actual site position. Do not mark the job complete or costs approved unless confirmed.',
    ],
    completion: [
      '1. AGREED / ORIGINAL SCOPE',
      clean(form.originalScope),
      '',
      '2. WORK COMPLETED',
      clean(form.workCompleted),
      '',
      '3. TESTS, COMMISSIONING & QUALITY CHECKS',
      clean(form.findings),
      '',
      '4. MATERIALS USED',
      clean(form.materials),
      '',
      '5. DEFECTS, EXCLUSIONS OR FOLLOW-UP WORK',
      clean(form.nextSteps),
      '',
      'COST SUMMARY (FOR NGMS REVIEW)',
      `Materials: ${zar(money(form.materialsCost))}`,
      `Labour: ${zar(money(form.labourCost))}`,
      `Other: ${zar(money(form.otherCost))}`,
      `Reported total: ${zar(total)}`,
      '',
      'Subcontractor name / signature: ______________________________',
      'NGMS review: ______________________________  Date: ______________',
      'Client sign-off (only if obtained): ____________________________',
      '',
      'Record actual test results. Leave sign-off blank until it is genuinely obtained.',
    ],
    variation: [
      '1. ORIGINAL / APPROVED SCOPE',
      clean(form.originalScope),
      '',
      '2. ADDITIONAL WORK REQUESTED',
      clean(form.workCompleted),
      '',
      '3. REASON / SITE FINDINGS',
      clean(form.findings),
      '',
      '4. MATERIALS / COMPONENTS REQUIRED',
      clean(form.materials),
      '',
      '5. PROGRAMME / NEXT STEPS',
      clean(form.nextSteps),
      '',
      'PROPOSED ADDITIONAL COST',
      `Materials: ${zar(money(form.materialsCost))}`,
      `Labour: ${zar(money(form.labourCost))}`,
      `Other: ${zar(money(form.otherCost))}`,
      `PROPOSED TOTAL: ${zar(total)}`,
      '',
      'APPROVAL STATUS: PENDING — DO NOT PROCEED UNTIL AUTHORISED.',
      'Client / authorised approver: _________________________________',
      'Approval date: __________________  Reference: _________________',
      'An estimate or payment receipt alone is not approval of a variation.',
    ],
    materials: [
      '1. JOB REQUIREMENT / ORIGINAL SCOPE',
      clean(form.originalScope),
      '',
      '2. REASON FOR MATERIALS REQUEST',
      clean(form.findings),
      '',
      '3. MATERIALS / QUANTITIES / SPECIFICATION',
      clean(form.materials),
      '',
      '4. WORK TO BE SUPPORTED',
      clean(form.workCompleted),
      '',
      '5. DELIVERY, COLLECTION OR NEXT STEPS',
      clean(form.nextSteps),
      '',
      'ESTIMATED COST',
      `Materials estimate: ${zar(money(form.materialsCost))}`,
      `Associated labour (if applicable): ${zar(money(form.labourCost))}`,
      `Other: ${zar(money(form.otherCost))}`,
      `Estimated total: ${zar(total)}`,
      '',
      'Purchase approval: PENDING until explicitly authorised by NGMS.',
      'Supplier / receipt / invoice reference: ________________________',
    ],
  }

  return [...header, ...sections[type], '', 'Prepared for NGMS review. Verify all facts, dates, amounts and approvals before issuing.', 'This generated template is a draft; it is not a submitted subcontractor report, invoice, payment record or authorisation.'].join('\n')
}

const inputClass = 'mt-1 w-full rounded-lg border border-darkgrey bg-jet px-3 py-2.5 text-sm text-paper placeholder:text-mist focus:border-orange focus:outline-none'
const textareaClass = inputClass + ' resize-y'

function SubcontractorTemplatePanel() {
  const [type, setType] = useState<TemplateType>('progress')
  const [form, setForm] = useState<FormState>(DEFAULT_FORM)
  const [output, setOutput] = useState('')
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  const total = useMemo(() => money(form.materialsCost) + money(form.labourCost) + money(form.otherCost), [form.materialsCost, form.labourCost, form.otherCost])
  const selected = TEMPLATE_OPTIONS.find((item) => item.value === type) ?? TEMPLATE_OPTIONS[1]

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }))
    setNotice('')
  }

  function generate() {
    setError('')
    setNotice('')
    setOutput(makeTemplate(type, form))
    setNotice('Draft generated. Review the text below before copying or downloading it.')
  }

  async function copyOutput() {
    if (!output) { setError('Generate a template before copying.'); return }
    try {
      await navigator.clipboard.writeText(output)
      setNotice('Template copied to clipboard.')
      setError('')
    } catch {
      setError('Clipboard access was blocked. Select the generated text and copy it manually.')
    }
  }

  function downloadOutput() {
    if (!output) { setError('Generate a template before downloading.'); return }
    const blob = new Blob([output], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    const safeRef = (form.reference || 'NGMS').replace(/[^a-z0-9_-]+/gi, '-')
    anchor.href = url
    anchor.download = `NGMS-Subcontractor-${type}-${safeRef}.txt`
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(url)
    setNotice('Text file prepared for download.')
    setError('')
  }

  function resetForm() {
    setForm({ ...DEFAULT_FORM, reportDate: new Date().toLocaleDateString('en-CA') })
    setOutput('')
    setNotice('')
    setError('')
  }

  return (
    <main className="min-h-screen bg-jet px-4 py-6 text-paper sm:px-6">
      <div className="mx-auto max-w-6xl">
        <Link href="/admin" className="mb-5 inline-flex items-center gap-2 text-sm text-mist hover:text-paper"><ArrowLeft className="h-4 w-4" /> Admin dashboard</Link>
        <header className="mb-6">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange">NGMS operations</p>
          <h1 className="mt-2 font-heading text-3xl font-bold">Subcontractor Template Generator</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-mist">Create editable, consistent site templates for inspection, progress, completion, additional-work approval and materials requests. Generate a draft, review it, then copy or download it for the job file.</p>
        </header>

        <div className="grid gap-5 xl:grid-cols-[1fr_0.95fr]">
          <section className="rounded-xl border border-darkgrey bg-cardgrey p-5">
            <div className="mb-4 flex items-center gap-2">
              <WandSparkles className="h-5 w-5 text-orange" />
              <h2 className="font-heading text-xl font-bold">Template details</h2>
            </div>

            <label className="mb-4 block text-sm text-mist">Template type
              <select value={type} onChange={(e) => { setType(e.target.value as TemplateType); setOutput(''); setNotice('') }} className={inputClass}>
                {TEMPLATE_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
              <span className="mt-1 block text-xs leading-5 text-mist">{selected.description}</span>
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm text-mist">Subcontractor / company<input value={form.subcontractor} onChange={(e) => update('subcontractor', e.target.value)} maxLength={160} className={inputClass} placeholder="e.g. Alpha Plumbing" /></label>
              <label className="block text-sm text-mist">Contact person<input value={form.contact} onChange={(e) => update('contact', e.target.value)} maxLength={160} className={inputClass} placeholder="Name and surname" /></label>
              <label className="block text-sm text-mist">Trade<input value={form.trade} onChange={(e) => update('trade', e.target.value)} maxLength={100} className={inputClass} placeholder="Plumbing, electrical, painting…" /></label>
              <label className="block text-sm text-mist">Report date<input type="date" value={form.reportDate} onChange={(e) => update('reportDate', e.target.value)} className={inputClass} /></label>
              <label className="block text-sm text-mist">Client<input value={form.client} onChange={(e) => update('client', e.target.value)} maxLength={160} className={inputClass} placeholder="Client name" /></label>
              <label className="block text-sm text-mist">Job / quote reference<input value={form.reference} onChange={(e) => update('reference', e.target.value)} maxLength={100} className={inputClass} placeholder="e.g. Q-0013" /></label>
              <label className="block text-sm text-mist sm:col-span-2">Property / site address<input value={form.property} onChange={(e) => update('property', e.target.value)} maxLength={300} className={inputClass} placeholder="Street, unit, complex and suburb" /></label>
            </div>

            <div className="mt-5 space-y-3">
              <label className="block text-sm text-mist">Original / agreed scope<textarea value={form.originalScope} onChange={(e) => update('originalScope', e.target.value)} maxLength={5000} rows={3} className={textareaClass} placeholder="What was originally agreed or assigned?" /></label>
              <label className="block text-sm text-mist">{type === 'inspection' ? 'Site findings / inspection observations' : type === 'materials' ? 'Reason for request / site findings' : type === 'variation' ? 'Additional work requested' : type === 'completion' ? 'Work completed' : 'Work completed to date'}<textarea value={form.workCompleted} onChange={(e) => update('workCompleted', e.target.value)} maxLength={8000} rows={4} className={textareaClass} placeholder="Describe actual work or requested work. Do not state work is complete unless verified." /></label>
              <label className="block text-sm text-mist">Findings, issues, risks or reason<textarea value={form.findings} onChange={(e) => update('findings', e.target.value)} maxLength={5000} rows={3} className={textareaClass} placeholder="Blockages, access constraints, damage, safety issues or justification…" /></label>
              <label className="block text-sm text-mist">Materials, parts, quantities or equipment<textarea value={form.materials} onChange={(e) => update('materials', e.target.value)} maxLength={5000} rows={3} className={textareaClass} placeholder="Item, quantity, specification and supplier if known…" /></label>
              <label className="block text-sm text-mist">Next steps, defects or follow-up<textarea value={form.nextSteps} onChange={(e) => update('nextSteps', e.target.value)} maxLength={5000} rows={3} className={textareaClass} placeholder="Return visit, outstanding tasks, test results or handover…" /></label>
            </div>

            <div className="mt-5 rounded-lg border border-darkgrey bg-jet p-4">
              <h3 className="font-heading font-bold">Cost estimate (ZAR)</h3>
              <p className="mt-1 text-xs text-mist">Enter estimates as numbers. The total updates automatically and does not approve a cost.</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <label className="block text-xs text-mist">Materials (R)<input type="number" min="0" step="0.01" value={form.materialsCost} onChange={(e) => update('materialsCost', e.target.value)} className={inputClass} placeholder="0.00" /></label>
                <label className="block text-xs text-mist">Labour (R)<input type="number" min="0" step="0.01" value={form.labourCost} onChange={(e) => update('labourCost', e.target.value)} className={inputClass} placeholder="0.00" /></label>
                <label className="block text-xs text-mist">Other (R)<input type="number" min="0" step="0.01" value={form.otherCost} onChange={(e) => update('otherCost', e.target.value)} className={inputClass} placeholder="0.00" /></label>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-darkgrey pt-3"><span className="text-sm text-mist">Estimated total</span><strong className="font-heading text-xl text-orange">{zar(total)}</strong></div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <button type="button" onClick={generate} className="inline-flex items-center gap-2 rounded-lg bg-orange px-4 py-2.5 text-sm font-bold text-white hover:brightness-110"><FileText className="h-4 w-4" /> Generate template</button>
              <button type="button" onClick={resetForm} className="inline-flex items-center gap-2 rounded-lg border border-darkgrey px-4 py-2.5 text-sm font-semibold text-mist hover:border-orange hover:text-paper"><RotateCcw className="h-4 w-4" /> Reset form</button>
            </div>
          </section>

          <section className="rounded-xl border border-darkgrey bg-cardgrey p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div><h2 className="font-heading text-xl font-bold">Generated template</h2><p className="mt-1 text-xs text-mist">Editable preview — review all details before issuing.</p></div>
              <span className="rounded border border-darkgrey px-2 py-1 text-xs uppercase tracking-wide text-orange">{selected.label}</span>
            </div>
            {output ? <textarea aria-label="Generated subcontractor template" value={output} onChange={(e) => { setOutput(e.target.value); setNotice('') }} rows={30} className="w-full resize-y rounded-lg border border-darkgrey bg-jet p-4 font-mono text-xs leading-5 text-paper focus:border-orange focus:outline-none" /> : <div className="flex min-h-[420px] flex-col items-center justify-center rounded-lg border border-dashed border-darkgrey p-8 text-center"><FileText className="mb-3 h-9 w-9 text-mist" /><p className="font-semibold">Your template will appear here</p><p className="mt-2 max-w-sm text-sm text-mist">Choose a template type, fill in the job details and select Generate template.</p></div>}
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" onClick={() => void copyOutput()} disabled={!output} className="inline-flex items-center gap-2 rounded-lg border border-orange px-3 py-2 text-sm font-semibold text-orange disabled:cursor-not-allowed disabled:opacity-40"><Clipboard className="h-4 w-4" /> Copy text</button>
              <button type="button" onClick={downloadOutput} disabled={!output} className="inline-flex items-center gap-2 rounded-lg border border-darkgrey px-3 py-2 text-sm font-semibold text-paper hover:border-orange disabled:cursor-not-allowed disabled:opacity-40"><Download className="h-4 w-4" /> Download .txt</button>
            </div>
            {notice && <p role="status" className="mt-3 text-sm text-emerald-400">{notice}</p>}
            {error && <p role="alert" className="mt-3 text-sm text-red-300">{error}</p>}
            <div className="mt-5 rounded-lg border border-darkgrey bg-jet p-3 text-xs leading-5 text-mist">
              <strong className="text-paper">Workflow safeguards</strong>
              <p className="mt-1">Generation does not save to a job, send email/WhatsApp, submit a subcontractor report, issue an invoice, record a payment, or approve variations. Generated templates are drafts until reviewed and issued by authorised NGMS staff.</p>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}

export default function SubcontractorTemplatesPage() {
  return <StaffGate title="Subcontractor template generator"><SubcontractorTemplatePanel /></StaffGate>
}
