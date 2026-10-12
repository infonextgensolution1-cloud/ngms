'use client'

import { useCallback, useEffect, useState } from 'react'
import { CheckCircle2, Loader2, UserRoundCog } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

type Subcontractor = { id: string; company_name: string; contact_name: string; email: string; status: string }
type Assignment = { id: string; subcontractor_draft_id: string; subcontractor_invitation_drafts: Subcontractor | null }\ntype JobReport = { id: string; report_type: string; work_summary: string; safety_notes: string; issues_found: string; materials_used: string; next_steps: string; submitted_by_email: string; submitted_at: string; status: string; subcontractor_invitation_drafts: { company_name: string; contact_name: string } | null }

export default function SubcontractorJobAssignment({ jobId }: { jobId: string }) {
  const [subcontractors, setSubcontractors] = useState<Subcontractor[]>([])\n  const [reports, setReports] = useState<JobReport[]>([])
  const [selected, setSelected] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) throw new Error('Your admin session has expired. Sign in again.')
      const response = await fetch(`/api/admin/job-subcontractor-assignment?jobId=${encodeURIComponent(jobId)}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
        cache: 'no-store',
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(result.error || 'Could not load subcontractors.')
      const list = (result.subcontractors ?? []) as Subcontractor[]
      const assignments = (result.assignments ?? []) as Assignment[]
      setSubcontractors(list)
      setSelected(assignments[0]?.subcontractor_draft_id ?? '')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load subcontractors.')
    } finally { setLoading(false) }
  }, [jobId])

  useEffect(() => { void load() }, [load])

  async function save() {
    setSaving(true); setError(''); setMessage('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) throw new Error('Your admin session has expired. Sign in again.')
      const response = await fetch('/api/admin/job-subcontractor-assignment', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, subcontractorDraftId: selected || null }),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(result.error || 'Could not save assignment.')
      setMessage(selected ? 'Assignment saved.' : 'Subcontractor assignment removed.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save assignment.')
    } finally { setSaving(false) }
  }

  return (
    <section className="bg-cardgrey border border-darkgrey rounded-card p-4 mb-5">
      <h2 className="font-heading font-bold text-paper mb-1 flex items-center gap-2"><UserRoundCog className="w-4 h-4" /> Assigned subcontractor</h2>
      <p className="text-xs text-mist mb-3">Choose the subcontractor responsible for this job. Only saved invitation drafts are listed.</p>
      {loading ? <p className="text-sm text-mist flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading subcontractors…</p> : (
        <>
          <label className="block text-xs text-mist mb-2" htmlFor="job-subcontractor">Subcontractor</label>
          <select id="job-subcontractor" value={selected} onChange={e => { setSelected(e.target.value); setMessage('') }} className="w-full bg-jet border border-darkgrey text-paper rounded-btn px-3 py-2.5 text-sm focus:outline-none focus:border-blue">
            <option value="">No subcontractor assigned</option>
            {subcontractors.map(s => <option key={s.id} value={s.id}>{s.company_name} — {s.contact_name} ({s.email})</option>)}
          </select>
          {subcontractors.length === 0 && <p className="text-xs text-orange mt-2">No subcontractor drafts found. Create a draft in Admin → Subcontractors first.</p>}
          <div className="flex flex-wrap items-center gap-3 mt-3">
            <button type="button" onClick={save} disabled={saving} className="inline-flex items-center gap-2 bg-orange text-white font-heading font-semibold px-4 py-2 rounded-btn disabled:opacity-50">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />} Save assignment
            </button>
            {message && <span role="status" className="text-xs text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-4 h-4" />{message}</span>}
          </div>
          <p className="text-[11px] leading-5 text-mist mt-3">Important: this records the assignment in the admin system. It does not create a subcontractor login, send an invitation, or grant portal access.</p>
        </>
      )}
      <div className="mt-4 border-t border-darkgrey pt-4"><h3 className="font-heading font-bold text-paper mb-2">Submitted subcontractor reports ({reports.length})</h3>{reports.length === 0 ? <p className="text-xs text-mist">No reports submitted for this job yet.</p> : <div className="space-y-3">{reports.map(report => <article key={report.id} className="rounded-btn border border-darkgrey bg-jet p-3"><div className="flex flex-wrap items-start justify-between gap-2"><div><p className="text-sm font-semibold text-paper">{{inspection:'Initial inspection',during_work:'During work',completion:'After work / completion'}[report.report_type] ?? report.report_type.replace(/_/g, ' ')}</p><p className="text-xs text-mist">{report.subcontractor_invitation_drafts?.company_name ?? report.submitted_by_email} · {new Date(report.submitted_at).toLocaleString()}</p></div><span className="text-xs text-orange">{report.status.replace(/_/g, ' ')}</span></div><p className="mt-2 whitespace-pre-line text-sm text-paper">{report.work_summary}</p>{report.safety_notes && <p className="mt-2 text-xs text-mist"><strong>Safety:</strong> {report.safety_notes}</p>}{report.issues_found && <p className="mt-1 text-xs text-mist"><strong>Issues:</strong> {report.issues_found}</p>}{report.materials_used && <p className="mt-1 text-xs text-mist"><strong>Materials:</strong> {report.materials_used}</p>}{report.next_steps && <p className="mt-1 text-xs text-mist"><strong>Next steps:</strong> {report.next_steps}</p>}</article>)}</div>}</div>\n      {error && <p role="alert" className="mt-3 text-sm text-red-300">{error}</p>}
    </section>
  )
}
