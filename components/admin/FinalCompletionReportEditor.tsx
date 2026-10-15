'use client'

import { useCallback, useEffect, useState } from 'react'
import { CheckCircle2, ClipboardCopy, FileCheck2, Loader2, RefreshCw, Save } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

type SavedReport = {
  id: string
  work_completed: string | null
  completion_notes: string | null
  outstanding_issues: string | null
  warranty_notes: string | null
  client_satisfaction: string | null
  updated_at: string
}
type PreviousReport = {
  report_type: string
  work_summary: string
  safety_notes: string | null
  issues_found: string | null
  materials_used: string | null
  next_steps: string | null
  submitted_by_email: string | null
  submitted_at: string
  status: string
  subcontractor_invitation_drafts?: { company_name?: string; contact_name?: string } | null
}

const field = 'w-full rounded-btn border border-darkgrey bg-jet px-3 py-2.5 text-sm text-paper placeholder:text-mist focus:border-orange focus:outline-none'

function previousReportText(report: PreviousReport) {
  return [
    'SUBCONTRACTOR REPORT — SOURCE COPY',
    `Submitted by: ${report.subcontractor_invitation_drafts?.company_name || report.submitted_by_email || 'Subcontractor'}`,
    `Stage: ${report.report_type.replace(/_/g, ' ')}`,
    `Submitted: ${new Date(report.submitted_at).toLocaleString()}`,
    '',
    'WORK COMPLETED / FINDINGS',
    report.work_summary || 'Not provided',
    report.safety_notes ? `\nSAFETY NOTES\n${report.safety_notes}` : '',
    report.issues_found ? `\nOUTSTANDING ISSUES\n${report.issues_found}` : '',
    report.materials_used ? `\nMATERIALS USED\n${report.materials_used}` : '',
    report.next_steps ? `\nFOLLOW-UP / NEXT STEPS\n${report.next_steps}` : '',
    '',
    'NGMS FINAL REPORT — REVIEW AND UPDATE BEFORE SAVING',
  ].filter(Boolean).join('\n')
}

export default function FinalCompletionReportEditor({ jobId }: { jobId: string }) {
  const [saved, setSaved] = useState<SavedReport | null>(null)
  const [previous, setPrevious] = useState<PreviousReport | null>(null)
  const [workCompleted, setWorkCompleted] = useState('')
  const [completionNotes, setCompletionNotes] = useState('')
  const [outstandingIssues, setOutstandingIssues] = useState('')
  const [warrantyNotes, setWarrantyNotes] = useState('')
  const [clientSatisfaction, setClientSatisfaction] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) throw new Error('Admin session expired. Sign in again.')
      const response = await fetch(`/api/admin/job-completion-report?jobId=${encodeURIComponent(jobId)}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
        cache: 'no-store',
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(result.error || 'Could not load completion report.')
      const row = result.saved as SavedReport | null
      setSaved(row)
      setPrevious((result.previous as PreviousReport | null) ?? null)
      setWorkCompleted(row?.work_completed ?? '')
      setCompletionNotes(row?.completion_notes ?? '')
      setOutstandingIssues(row?.outstanding_issues ?? '')
      setWarrantyNotes(row?.warranty_notes ?? '')
      setClientSatisfaction(row?.client_satisfaction ?? '')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load completion report.')
    } finally { setLoading(false) }
  }, [jobId])

  useEffect(() => { void load() }, [load])

  async function save() {
    setSaving(true); setError(''); setMessage('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) throw new Error('Admin session expired. Sign in again.')
      const response = await fetch('/api/admin/job-completion-report', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, workCompleted, completionNotes, outstandingIssues, warrantyNotes, clientSatisfaction }),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(result.error || 'Could not save completion report.')
      setSaved(result.saved as SavedReport)
      setMessage('Final completion report saved to this job.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save completion report.')
    } finally { setSaving(false) }
  }

  function copyPrevious() {
    if (!previous) return
    setWorkCompleted(previousReportText(previous))
    if (previous.issues_found) setOutstandingIssues(previous.issues_found)
    if (previous.next_steps) setCompletionNotes(previous.next_steps)
    setMessage('Previous subcontractor report copied into the draft. Review and update it before saving.')
  }

  return (
    <section className="mb-5 rounded-card border border-darkgrey bg-cardgrey p-4">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-heading font-bold text-paper"><FileCheck2 className="h-4 w-4 text-orange" /> Final completion report</h2>
        <button type="button" onClick={() => void load()} disabled={loading || saving} className="inline-flex items-center gap-1.5 rounded-btn border border-darkgrey px-2.5 py-1.5 text-xs text-mist hover:border-orange hover:text-paper disabled:opacity-50"><RefreshCw className="h-3.5 w-3.5" /> Refresh</button>
      </div>
      <p className="mb-4 text-xs leading-5 text-mist">Use the subcontractor's previous report as a starting point, edit the final wording, then save it against this job. Saving here does not send it to the client, change job status, or approve extra costs.</p>
      {loading ? <p className="flex items-center gap-2 text-sm text-mist"><Loader2 className="h-4 w-4 animate-spin" /> Loading report…</p> : <>
        <div className="mb-4 rounded-btn border border-darkgrey bg-jet p-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-paper">Previous subcontractor report</p>
              {previous ? <p className="mt-1 text-xs text-mist">{previous.subcontractor_invitation_drafts?.company_name || previous.submitted_by_email || 'Subcontractor'} · {previous.report_type.replace(/_/g, ' ')} · {new Date(previous.submitted_at).toLocaleString()}</p> : <p className="mt-1 text-xs text-mist">No submitted subcontractor report is available for this job yet. You can paste a report manually below.</p>}
            </div>
            <button type="button" onClick={copyPrevious} disabled={!previous} className="inline-flex items-center gap-1.5 rounded-btn border border-orange px-3 py-2 text-xs font-semibold text-orange disabled:cursor-not-allowed disabled:opacity-40"><ClipboardCopy className="h-3.5 w-3.5" /> Copy into draft</button>
          </div>
          {previous && <p className="mt-2 line-clamp-3 whitespace-pre-line text-xs text-mist">{previous.work_summary}</p>}
        </div>

        <div className="space-y-3">
          <label className="block text-xs text-mist">Final report / work completed *<textarea required maxLength={12000} rows={8} value={workCompleted} onChange={e => { setWorkCompleted(e.target.value); setMessage('') }} className={field} placeholder="Paste the previous subcontractor report here, then update it into the final NGMS completion report…" /></label>
          <label className="block text-xs text-mist">Completion notes / follow-up<textarea maxLength={5000} rows={3} value={completionNotes} onChange={e => setCompletionNotes(e.target.value)} className={field} placeholder="Return visit, next actions, client instructions or internal context…" /></label>
          <label className="block text-xs text-mist">Outstanding work / issues<textarea maxLength={5000} rows={3} value={outstandingIssues} onChange={e => setOutstandingIssues(e.target.value)} className={field} placeholder="Outstanding items or state 'None' only after confirming…" /></label>
          <label className="block text-xs text-mist">Warranty / handover notes<textarea maxLength={3000} rows={2} value={warrantyNotes} onChange={e => setWarrantyNotes(e.target.value)} className={field} placeholder="Warranty terms, exclusions or handover notes…" /></label>
          <label className="block text-xs text-mist">Client satisfaction / sign-off notes<textarea maxLength={1000} rows={2} value={clientSatisfaction} onChange={e => setClientSatisfaction(e.target.value)} className={field} placeholder="Record client feedback or sign-off status; do not imply approval if not confirmed…" /></label>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button type="button" onClick={() => void save()} disabled={saving || !workCompleted.trim()} className="inline-flex items-center gap-2 rounded-btn bg-orange px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}{saving ? 'Saving…' : 'Save final report'}</button>
          {saved?.updated_at && <span className="text-xs text-mist">Last saved {new Date(saved.updated_at).toLocaleString()}</span>}
          {message && <span role="status" className="flex items-center gap-1 text-xs text-emerald-400"><CheckCircle2 className="h-4 w-4" />{message}</span>}
        </div>
      </>}
      {error && <p role="alert" className="mt-3 text-sm text-red-300">{error}</p>}
    </section>
  )
}
