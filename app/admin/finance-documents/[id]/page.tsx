'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { AlertTriangle, ArrowLeft, CheckCircle2, FileText, Loader2, ShieldCheck, XCircle } from 'lucide-react'
import StaffGate from '@/components/admin/StaffGate'
import { supabase } from '@/lib/supabaseClient'

type ReviewData = {
  document?: { id: string; document_number: string; document_type: string; title: string; issued_on: string | null; processing_status: string; review_status: string }
  extraction?: { id: string; attempt_number: number; status: string; extracted_fields: Record<string, unknown>; confidence: number | null; validation_errors: unknown[] } | null
  posting_review?: { amount: number | null; currency: string; status: string; rejection_reason: string | null } | null
  error?: string
}

function ReviewDocument() {
  const params = useParams<{ id: string }>()
  const id = params.id
  const [data, setData] = useState<ReviewData | null>(null)
  const [fields, setFields] = useState('')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [opening, setOpening] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const token = useCallback(async () => {
    const { data: sessionData } = await supabase.auth.getSession()
    if (!sessionData.session?.access_token) throw new Error('Your staff session has expired. Sign in again.')
    return sessionData.session.access_token
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const accessToken = await token()
      const response = await fetch(`/api/admin/finance-documents/${id}/review`, { headers: { Authorization: `Bearer ${accessToken}` }, cache: 'no-store' })
      const body = await response.json() as ReviewData
      if (!response.ok) throw new Error(body.error || 'Could not load review record.')
      setData(body)
      setFields(body.extraction ? JSON.stringify(body.extraction.extracted_fields, null, 2) : '')
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [id, token])

  useEffect(() => { void load() }, [load])

  async function openSource() {
    setOpening(true)
    setError('')
    try {
      const accessToken = await token()
      const response = await fetch(`/api/admin/finance-documents/${id}/download`, { headers: { Authorization: `Bearer ${accessToken}` }, cache: 'no-store' })
      const body = await response.json() as { url?: string; error?: string }
      if (!response.ok || !body.url) throw new Error(body.error || 'Could not open the source file.')
      window.open(body.url, '_blank', 'noopener,noreferrer')
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setOpening(false)
    }
  }

  async function review(action: 'approve' | 'reject') {
    setSaving(true)
    setError('')
    setNotice('')
    try {
      const accessToken = await token()
      let parsedFields: Record<string, unknown> | undefined
      if (action === 'approve') {
        try {
          const parsed = JSON.parse(fields) as unknown
          if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Fields must be a JSON object.')
          parsedFields = parsed as Record<string, unknown>
        } catch (e) {
          throw new Error(`Correct the extracted JSON before approval: ${(e as Error).message}`)
        }
      }
      const response = await fetch(`/api/admin/finance-documents/${id}/review`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, fields: parsedFields, reason }),
      })
      const body = await response.json() as { error?: string; message?: string; posting_status?: string }
      if (!response.ok) throw new Error(body.error || 'Review action failed.')
      setNotice(action === 'approve' ? (body.message || 'Review approved. Financial posting has not occurred.') : 'Document rejected and the reason was recorded.')
      await load()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="min-h-[70vh] bg-[#BDBDBD] px-4 py-7 text-[#171717] sm:px-6">
      <div className="mx-auto max-w-4xl">
        <Link href="/admin/finance-documents" className="mb-4 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wide hover:text-[#D9360B]">
          <ArrowLeft className="h-4 w-4" /> Document register
        </Link>
        {loading && !data ? <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin" /></div> : data?.document ? (
          <>
            <header className="mb-6 border-b border-[#777] pb-5">
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[#D9360B]">NGMS / REVIEW QUEUE · {data.document.document_number}</p>
              <h1 className="font-heading text-3xl font-bold uppercase leading-none sm:text-5xl">{data.document.title}</h1>
              <p className="mt-3 text-sm">{data.document.document_type.replaceAll('_', ' ')} · Review: {data.document.review_status} · Processing: {data.document.processing_status}</p>
              <button onClick={() => void openSource()} disabled={opening} className="mt-4 inline-flex items-center gap-2 border border-[#555] bg-[#F2F2EE] px-4 py-3 text-sm font-bold uppercase hover:border-[#FF3D0A] disabled:opacity-50">
                {opening ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />} Open source document
              </button>
            </header>
            {error && <p role="alert" className="mb-4 flex gap-2 border border-red-800 bg-red-50 p-3 text-sm text-red-900"><AlertTriangle className="h-4 w-4 shrink-0" />{error}</p>}
            {notice && <p role="status" className="mb-4 flex gap-2 border border-green-800 bg-green-50 p-3 text-sm text-green-900"><CheckCircle2 className="h-4 w-4 shrink-0" />{notice}</p>}
            {data.extraction ? (
              <section className="border border-[#777] bg-[#F2F2EE] p-4 sm:p-5">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <h2 className="font-heading text-xl font-bold uppercase">Extracted fields</h2>
                  <span className="bg-[#E1E1DC] px-2 py-1 text-xs font-bold uppercase">Attempt {data.extraction.attempt_number} · Confidence {data.extraction.confidence === null ? 'unknown' : `${Math.round(data.extraction.confidence * 100)}%`}</span>
                </div>
                {Array.isArray(data.extraction.validation_errors) && data.extraction.validation_errors.length > 0 && (
                  <div className="mb-3 border border-[#D9360B] bg-[#FFF0E8] p-3 text-sm">
                    <p className="mb-1 font-bold">Validation warnings</p>
                    <ul className="list-disc pl-5">{data.extraction.validation_errors.map((warning, i) => <li key={i}>{String(warning)}</li>)}</ul>
                  </div>
                )}
                <label className="block text-xs font-bold uppercase tracking-wide">Review and correct extracted JSON
                  <textarea value={fields} onChange={(e) => setFields(e.target.value)} rows={18} spellCheck={false} className="mt-2 block w-full border border-[#888] bg-white p-3 font-mono text-xs normal-case outline-none focus:border-[#FF3D0A] focus:ring-2 focus:ring-[#FF3D0A]/30" />
                </label>
                <p className="mt-2 text-xs text-[#555]">Compare every value with the source file before approval. Approval authorises a proposal for posting; this screen does not post a payment, supplier invoice or stock movement.</p>
              </section>
            ) : (
              <section className="border border-[#777] bg-[#F2F2EE] p-4">
                <p className="text-sm">No extraction is available yet. Return to the register and run extraction when the provider is configured, or retain this file for manual processing.</p>
              </section>
            )}
            <section className="mt-4 border border-[#777] bg-[#F2F2EE] p-4 sm:p-5">
              <h2 className="font-heading text-xl font-bold uppercase">Approval controls</h2>
              <p className="mt-1 text-sm text-[#555]">Current posting state: {data.posting_review?.status || 'No financial posting proposal'}. Nothing has been posted.</p>
              <label className="mt-4 block text-xs font-bold uppercase tracking-wide">Rejection reason (if rejecting)
                <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} maxLength={1000} className="mt-1 block w-full border border-[#888] bg-white p-3 text-sm normal-case" />
              </label>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <button disabled={saving || !data.extraction || data.document.review_status === 'approved'} onClick={() => void review('approve')} className="inline-flex min-h-11 items-center justify-center gap-2 bg-[#FF3D0A] px-4 py-3 text-sm font-bold uppercase text-black hover:bg-[#E93305] disabled:opacity-50">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />} Approve reviewed fields
                </button>
                <button disabled={saving || data.document.review_status === 'approved'} onClick={() => void review('reject')} className="inline-flex min-h-11 items-center justify-center gap-2 border border-[#777] px-4 py-3 text-sm font-bold uppercase hover:border-red-700 hover:text-red-800 disabled:opacity-50">
                  <XCircle className="h-4 w-4" /> Reject document
                </button>
              </div>
            </section>
          </>
        ) : <p className="py-12 text-sm">Document not found.</p>}
      </div>
    </main>
  )
}

export default function FinanceDocumentReviewPage() {
  return <StaffGate title="Review finance document"><ReviewDocument /></StaffGate>
}
