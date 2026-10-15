'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, Printer, AlertTriangle } from 'lucide-react'
import StaffGate from '@/components/admin/StaffGate'
import { supabase } from '@/lib/supabaseClient'
import { handlersC } from '@/lib/ngms-ops/handlers-c'
import { rand } from '@/lib/ngms-ops/core'
import type { Worker, Payslip } from '@/lib/ngms-ops/core'
import { LOGO_DATA_URI } from '@/lib/logo'

const BRAND = { black: '#0A0A0A', purple: '#8B1BF5', orange: '#F57C1B', green: '#39D353', grey: '#5B5B5B', line: '#E4E4E4' }

function PayslipView() {
  const params = useParams<{ id: string }>()
  const id = params.id
  const [payslip, setPayslip] = useState<Payslip | null>(null)
  const [worker, setWorker] = useState<Worker | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await handlersC.ngms_get_payslip(supabase, { payslip_id: id })
      if (res.isError) throw new Error(res.content[0]?.text ?? 'Could not load that payslip')
      const sc = res.structuredContent as { payslip: Payslip; worker: Worker }
      setPayslip(sc.payslip)
      setWorker(sc.worker)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  if (loading && !payslip) {
    return (
      <main className="min-h-[60vh] flex items-center justify-center bg-jet">
        <Loader2 className="w-6 h-6 text-mist animate-spin" />
      </main>
    )
  }
  if (error || !payslip || !worker) {
    return (
      <main className="min-h-[60vh] bg-jet px-4 py-16">
        <div className="max-w-md mx-auto text-center">
          <p className="text-orange flex items-center justify-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5" /> {error || 'Not found'}
          </p>
          <Link href="/admin/wages" className="text-blue text-sm">
            Back to wages
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
          #print-area { position: absolute; left: 0; top: 0; width: 100%; margin: 0 !important; padding: 14mm !important; box-shadow: none !important; border-radius: 0 !important; }
          .no-print { display: none !important; }
          @page { margin: 10mm; }
        }
      `}</style>

      <div className="max-w-xl mx-auto">
        <div className="no-print">
          <Link href={`/admin/wages/${worker.id}`} className="text-xs text-mist hover:text-paper inline-flex items-center gap-1 mb-3">
            <ArrowLeft className="w-3.5 h-3.5" /> {worker.name}
          </Link>
          <div className="flex items-center justify-between gap-3 mb-4">
            <h1 className="font-heading text-2xl font-bold text-paper">Payslip</h1>
            <button onClick={() => window.print()} className="inline-flex items-center gap-2 bg-blue-fill hover:bg-blue-dark text-white font-heading font-semibold px-4 py-2.5 rounded-btn">
              <Printer className="w-4 h-4" /> Print / Save as PDF
            </button>
          </div>
        </div>

        <div id="print-area" className="rounded-card shadow-xl" style={{ background: '#fff', color: BRAND.black, padding: '28px 26px', fontFamily: 'Inter, system-ui, sans-serif' }}>
          <div className="flex items-start justify-between gap-4" style={{ borderBottom: `3px solid ${BRAND.purple}`, paddingBottom: 16, marginBottom: 20 }}>
            <img src={LOGO_DATA_URI} alt="NGMS logo" style={{ height: 48, width: 'auto', objectFit: 'contain' }} />
            <div style={{ textAlign: 'right', fontSize: 12, color: BRAND.grey }}>
              <p style={{ fontWeight: 700, fontSize: 15, color: BRAND.black }}>NextGen Solar Clean &amp; Maintenance Solutions</p>
              <p>Payslip</p>
            </div>
          </div>

          <div style={{ background: '#F7F5FA', borderRadius: 10, padding: '12px 14px', marginBottom: 18, fontSize: 13 }}>
            <p style={{ fontWeight: 700 }}>{worker.name}</p>
            <p style={{ color: BRAND.grey }}>{worker.category}</p>
            <p style={{ color: BRAND.grey }}>
              Pay period: {payslip.period_start}
              {payslip.period_end ? ` → ${payslip.period_end}` : ''} ({payslip.period})
            </p>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginBottom: 14 }}>
            <tbody>
              <Row l="Days worked" v={String(payslip.days_worked)} />
              <Row l="Absent days" v={String(payslip.absent_days)} />
              <Row l="Daily rate" v={rand(payslip.daily_rate)} />
              <Row l="Basic pay" v={rand(payslip.daily_rate * (payslip.days_worked - payslip.absent_days))} />
              <Row l="Travel allowance" v={rand(payslip.travel_allowance * payslip.days_worked)} />
              <Row l="Overtime" v={`${payslip.overtime_hours}h × ${rand(payslip.overtime_rate)} = ${rand(payslip.overtime_hours * payslip.overtime_rate)}`} />
              <Row l="Bonus / incentive" v={rand(payslip.bonus)} />
              <Row l="Gross pay" v={rand(payslip.gross_pay)} bold border />
            </tbody>
          </table>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginBottom: 14 }}>
            <tbody>
              {payslip.uif_applied && <Row l="UIF (1% of basic)" v={`− ${rand(payslip.daily_rate * (payslip.days_worked - payslip.absent_days) * 0.01)}`} />}
              {payslip.paye_deduction > 0 && <Row l="PAYE" v={`− ${rand(payslip.paye_deduction)}`} />}
              {payslip.advance_deduction > 0 && <Row l="Advance / loan" v={`− ${rand(payslip.advance_deduction)}`} />}
              {payslip.tool_deduction > 0 && <Row l="Tool / equipment" v={`− ${rand(payslip.tool_deduction)}`} />}
              {payslip.other_deduction > 0 && <Row l="Other" v={`− ${rand(payslip.other_deduction)}`} />}
              <Row l="Total deductions" v={`− ${rand(payslip.total_deductions)}`} bold border />
            </tbody>
          </table>

          {payslip.deduction_notes && (
            <p style={{ fontSize: 11.5, color: BRAND.grey, marginBottom: 14 }}>
              <strong>Notes:</strong> {payslip.deduction_notes}
            </p>
          )}

          <div className="flex justify-end" style={{ marginBottom: 18 }}>
            <div style={{ width: 240, fontSize: 16, fontWeight: 700, borderTop: `2px solid ${BRAND.black}`, paddingTop: 8, display: 'flex', justifyContent: 'space-between' }}>
              <span>Net pay</span>
              <span style={{ color: BRAND.green }}>{rand(payslip.net_pay)}</span>
            </div>
          </div>

          <div style={{ borderTop: `1px solid ${BRAND.line}`, paddingTop: 14, fontSize: 12 }}>
            <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5, color: BRAND.grey, marginBottom: 4, fontWeight: 700 }}>Paid to</p>
            {worker.bank_name && worker.account_number ? (
              <p style={{ whiteSpace: 'pre-line' }}>
                {worker.bank_name} · {worker.account_holder ?? worker.name}
                {'\n'}Account: {worker.account_number}
                {worker.branch_code ? ` · Branch: ${worker.branch_code}` : ''}
              </p>
            ) : (
              <p style={{ color: BRAND.orange }}>No banking details on file for this worker.</p>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}

function Row({ l, v, bold, border }: { l: string; v: string; bold?: boolean; border?: boolean }) {
  return (
    <tr style={{ borderTop: border ? `2px solid ${BRAND.black}` : undefined }}>
      <td style={{ padding: '4px 0', fontWeight: bold ? 700 : 400 }}>{l}</td>
      <td style={{ padding: '4px 0', textAlign: 'right', fontWeight: bold ? 700 : 400 }}>{v}</td>
    </tr>
  )
}

export default function PayslipPage() {
  return (
    <StaffGate title="Payslip">
      <PayslipView />
    </StaffGate>
  )
}
