'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, ArrowLeft, FileSpreadsheet, Loader2 } from 'lucide-react'
import StaffGate from '@/components/admin/StaffGate'
import { supabase } from '@/lib/supabaseClient'
import { rand } from '@/lib/ngms-ops/core'
import { monthReport, type MonthReport } from '@/lib/admin-report'

const thisMonth = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Johannesburg' }).slice(0, 7)
const label = (m: string) => new Date(`${m}-15T12:00:00Z`).toLocaleDateString('en-ZA', { month: 'long', year: 'numeric', timeZone: 'UTC' })

function Tile({ title, value, sub, warn }: { title: string; value: string; sub?: string; warn?: boolean }) {
  return (
    <div className="bg-jet border border-darkgrey rounded-card p-3 min-w-0">
      <p className="text-[11px] text-mist uppercase tracking-wide">{title}</p>
      <p className={`font-heading text-xl font-bold mt-1 whitespace-nowrap ${warn ? 'text-orange' : 'text-paper'}`}>{value}</p>
      {sub && <p className="text-xs text-mist mt-0.5">{sub}</p>}
    </div>
  )
}

function Reports() {
  const [month, setMonth] = useState(thisMonth())
  const [report, setReport] = useState<MonthReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [exporting, setExporting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setReport(await monthReport(supabase, month))
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [month])

  useEffect(() => {
    load()
  }, [load])

  async function excel() {
    if (!report) return
    setExporting(true)
    try {
      const { default: writeXlsxFile } = await import('write-excel-file/browser')
      const sheets = report.sheets.map((t) => ({
        sheet: t.title,
        stickyRowsCount: 1,
        columns: t.headers.map((h) => ({ width: Math.max(12, Math.min(44, h.length + 8)) })),
        data: [
          t.headers.map((h) => ({ value: h, fontWeight: 'bold' as const })),
          ...t.rows.map((r) => r.map((v) => (v === null ? null : { value: v, type: typeof v === 'number' ? Number : String }))),
        ],
      }))
      await writeXlsxFile(sheets).toFile(`NGMS report ${report.month}.xlsx`)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setExporting(false)
    }
  }

  const margin = report && report.jobRevenue > 0 ? Math.round((report.jobProfit / report.jobRevenue) * 100) : null

  return (
    <main className="min-h-[70vh] bg-jet px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Link href="/admin" className="text-xs text-mist hover:text-paper inline-flex items-center gap-1 mb-3">
          <ArrowLeft className="w-3.5 h-3.5" /> Admin
        </Link>
        <h1 className="font-heading text-2xl font-bold text-paper mb-4">Monthly report</h1>

        <div className="flex flex-wrap items-end gap-3 mb-4">
          <label className="text-xs text-mist">
            Month
            <input
              type="month"
              value={month}
              max={thisMonth()}
              onChange={(e) => e.target.value && setMonth(e.target.value)}
              className="block mt-1 bg-cardgrey border border-darkgrey text-paper rounded-btn px-3 py-2.5 text-sm"
            />
          </label>
          <button
            onClick={excel}
            disabled={!report || exporting}
            className="inline-flex items-center gap-2 bg-blue hover:bg-blue-dark text-white font-heading font-semibold px-4 py-2.5 rounded-btn disabled:opacity-50"
          >
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />} Excel for bookkeeper
          </button>
        </div>

        {error && (
          <p className="text-sm text-orange flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4" /> {error}
          </p>
        )}

        {loading && !report ? (
          <div className="py-16 flex justify-center">
            <Loader2 className="w-6 h-6 text-mist animate-spin" />
          </div>
        ) : report ? (
          <section className={`bg-cardgrey border border-darkgrey rounded-card p-4 ${loading ? 'opacity-60' : ''}`}>
            <h2 className="font-heading font-bold text-paper mb-3">{label(report.month)}</h2>
            <div className="grid grid-cols-2 gap-2">
              <Tile title="Invoiced" value={rand(report.invoiced)} sub={`${report.invoiceCount} invoice(s) raised`} />
              <Tile title="Collected" value={rand(report.collected)} sub={`${report.paymentCount} payment(s) received`} />
              <Tile title="Quoted" value={rand(report.quotedValue)} sub={`${report.quoteCount} quote(s) · ${report.wonCount} accepted`} />
              <Tile title="Owed to you now" value={rand(report.outstanding)} sub="all unpaid invoices" warn={report.outstanding > 0} />
              <Tile title="Job profit" value={rand(report.jobProfit)} sub={`${report.jobsCompleted} job(s) done${margin !== null ? ` · ${margin}% margin` : ''}`} warn={margin !== null && margin < 25} />
              <Tile title="Spend" value={rand(report.spend)} sub="job costs, labour, purchases" />
              <Tile title="New leads" value={String(report.leads)} sub={`${report.leadsWon} won`} />
              <Tile title="Won work" value={rand(report.wonValue)} sub="quotes from this month accepted" />
            </div>
            <p className="text-[11px] text-mist mt-3">
              The Excel file has tabs for the summary, invoices, payments, job profit and spend. Collected counts payments recorded in admin with a date in this month.
            </p>
          </section>
        ) : null}
      </div>
    </main>
  )
}

export default function ReportsPage() {
  return (
    <StaffGate title="Monthly report">
      <Reports />
    </StaffGate>
  )
}
