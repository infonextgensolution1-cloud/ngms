'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, Printer, Send, Ban, AlertTriangle, Save, CircleDollarSign, MessageCircle, BellRing, CheckCircle2 } from 'lucide-react'
import StaffGate from '@/components/admin/StaffGate'
import DeleteRecord from '@/components/admin/DeleteRecord'
import { supabase } from '@/lib/supabaseClient'
import { deleteDraftInvoice } from '@/lib/admin-delete'
import { waTo, invoiceMessage, reminderMessage } from '@/lib/admin-wa'
import { handlersB } from '@/lib/ngms-ops/handlers-b'
import { rand } from '@/lib/ngms-ops/core'
import type { Invoice, Client, Item } from '@/lib/ngms-ops/core'
import { LOGO_DATA_URI } from '@/lib/logo'
import { PLACEHOLDER_ACC } from '@/lib/quote-terms'

type PaymentEntry = { line: string; amount: number; index: number; reversed: boolean }
type CreditNote = { id:string; credit_note_number:string; invoice_id:string; client_id:string; status:'draft'|'issued'|'void'; review_status:'pending'|'manual_review_required'|'approved'|'rejected'; reason:string; subtotal:number; vat_amount:number; total_amount:number; created_at:string; issued_at:string|null; review_note:string|null }

function paymentEntries(notes: string | null): PaymentEntry[] {
  const lines = (notes ?? '').split('\n')
  return lines.flatMap((line, index) => {
    // Notes may be timestamp-prefixed, e.g. "[13 Oct 2026, 01:30] Payment R4 050.00 ...".
    // Keep the original line for audit/reversal matching; strip the timestamp only for parsing.
    const paymentLine = line.replace(/^\[[^\]]+\]\s*/, '')
    if (!/^Payment\s+/i.test(paymentLine)) return []
    const match = paymentLine.match(/^Payment\s+R?\s*([\d, ]+(?:\.\d{1,2})?)/i)
    if (!match) return []
    const amount = Number(match[1].replace(/[ ,]/g, ''))
    if (!Number.isFinite(amount) || amount <= 0) return []
    return [{ line, amount, index, reversed: lines.some((entry) => entry.startsWith(`PAYMENT REVERSAL [entry ${index + 1}]:`)) }]
  })
}

type Money = { subtotal: number; vat: number; total: number; paid: number; balance: number; overdue: boolean; days_overdue: number }
type Business = { name: string | null; phone: string | null; whatsapp: string | null; email: string | null; address: string | null; vat_number: string | null; bank_details: string | null; logo_url: string | null }

const BRAND = { black: '#0A0A0A', purple: '#8B1BF5', orange: '#F57C1B', green: '#39D353', grey: '#5B5B5B', line: '#E4E4E4' }
const PAY_METHODS = ['eft', 'cash', 'card', 'other'] as const
const CREDIT_NOTE_UI_ENABLED = process.env.NEXT_PUBLIC_NGMS_CREDIT_NOTES_ENABLED === 'true'

const STATUS_STYLE: Record<string, string> = {
  draft: 'text-mist border-darkgrey',
  sent: 'text-blue border-blue',
  partial: 'text-orange border-orange',
  paid: 'text-whatsapp border-whatsapp',
  void: 'text-mist border-darkgrey',
}

function sastDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Africa/Johannesburg' })
}

function InvoiceView() {
  const params = useParams<{ id: string }>()
  const id = params.id

  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [client, setClient] = useState<Client | null>(null)
  const [items, setItems] = useState<Item[]>([])
  const [money, setMoney] = useState<Money | null>(null)
  const [quoteNumber, setQuoteNumber] = useState<string | null>(null)
  const [business, setBusiness] = useState<Business | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [msg, setMsg] = useState('')
  const [note, setNote] = useState('')
  const [jobId, setJobId] = useState<string | null>(null)
  const [jobStatus, setJobStatus] = useState<string | null>(null)
  const [creditNotes, setCreditNotes] = useState<CreditNote[]>([])
  const [creditNotesAvailable, setCreditNotesAvailable] = useState(true)
  const [creditReason, setCreditReason] = useState('')
  const [creditDescription, setCreditDescription] = useState('Credit against original invoice')
  const [creditSubtotal, setCreditSubtotal] = useState('')
  const [creditVatRate, setCreditVatRate] = useState('0')
  const [creditReviewNote, setCreditReviewNote] = useState('')
  const [creditBusy, setCreditBusy] = useState<string | null>(null)
  const [printCreditNote, setPrintCreditNote] = useState<CreditNote | null>(null)

  const [payAmount, setPayAmount] = useState('')
  const [payMethod, setPayMethod] = useState<(typeof PAY_METHODS)[number]>('eft')
  const [payRef, setPayRef] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await handlersB.ngms_get_invoice(supabase, { invoice_id: id })
      if (res.isError) throw new Error(res.content[0]?.text ?? 'Could not load that invoice')
      const sc = res.structuredContent as { invoice: Invoice; client: Client | null; items: Item[]; money: Money; quote_number: string | null; business: Business }
      setInvoice(sc.invoice)
      setClient(sc.client)
      setItems(sc.items)
      setMoney(sc.money)
      setQuoteNumber(sc.quote_number)
      setBusiness(sc.business)
      const { data: creditRows, error: creditRowsError } = await supabase.from('credit_notes').select('id,credit_note_number,invoice_id,client_id,status,review_status,reason,subtotal,vat_amount,total_amount,created_at,issued_at,review_note').eq('invoice_id', id).order('created_at', { ascending: false })
      if (creditRowsError) {
        if (/credit_notes|schema cache|does not exist/i.test(creditRowsError.message)) { setCreditNotesAvailable(false); setCreditNotes([]) }
        else throw creditRowsError
      } else { setCreditNotesAvailable(true); setCreditNotes((creditRows ?? []) as CreditNote[]) }
      setCreditVatRate(String(sc.money.subtotal > 0 ? Math.round((sc.money.vat / sc.money.subtotal) * 10000) / 100 : 0))
      const { data: linkedJob } = sc.invoice.quote_id ? await supabase.from('jobs').select('id,status').eq('quote_id', sc.invoice.quote_id).neq('status','cancelled').order('created_at',{ascending:false}).limit(1).maybeSingle() : { data: null }
      setJobId((linkedJob as {id:string;status:string}|null)?.id ?? null)
      setJobStatus((linkedJob as {id:string;status:string}|null)?.status ?? null)
      setPayAmount(sc.money.balance > 0 ? String(sc.money.balance) : '')
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  async function setStatus(status: 'sent' | 'void') {
    if (!invoice) return
    if (status === 'void') {
      const reason = window.prompt(`Why are you voiding ${invoice.invoice_number}? This keeps the invoice on record but removes it from active totals.`, 'Created incorrectly')
      if (reason === null) return
      if (!reason.trim()) { setMsg('A reason is required when voiding an invoice.'); return }
      setBusy(status)
      setMsg('')
      try {
        const res = await handlersB.ngms_update_invoice(supabase, { invoice_id: invoice.id, status, note: `VOID REASON: ${reason.trim()}` })
        if (res.isError) throw new Error(res.content[0]?.text ?? 'Could not void the invoice')
        setMsg('Invoice voided and the reason was recorded.')
        await load()
      } catch (e) {
        setMsg((e as Error).message)
      } finally {
        setBusy(null)
      }
      return
    }
    setBusy(status)
    setMsg('')
    try {
      const res = await handlersB.ngms_update_invoice(supabase, { invoice_id: invoice.id, status })
      if (res.isError) throw new Error(res.content[0]?.text ?? 'Could not update the invoice')
      setMsg(`Marked as ${status}.`)
      await load()
    } catch (e) {
      setMsg((e as Error).message)
    } finally {
      setBusy(null)
    }
  }

  async function recordPayment() {
    if (!invoice) return
    const amount = parseFloat(payAmount.replace(',', '.'))
    if (!Number.isFinite(amount) || amount <= 0) {
      setMsg('Enter a valid payment amount.')
      return
    }
    setBusy('payment')
    setMsg('')
    try {
      const res = await handlersB.ngms_record_payment(supabase, { invoice_id: invoice.id, amount, method: payMethod, reference: payRef.trim() || undefined })
      if (res.isError) throw new Error(res.content[0]?.text ?? 'Could not record the payment')
      setMsg(`Payment of ${rand(amount)} recorded.`)
      setPayRef('')
      await load()
    } catch (e) {
      setMsg((e as Error).message)
    } finally {
      setBusy(null)
    }
  }

  async function reversePayment(entry: PaymentEntry) {
    if (!invoice || !money || entry.reversed) return
    const reason = window.prompt(`Why are you reversing this payment on ${invoice.invoice_number}?\\n\\n${entry.line}`, 'Payment incorrectly recorded')
    if (reason === null) return
    if (!reason.trim()) { setMsg('A reason is required to reverse a payment.'); return }
    if (!window.confirm(`Reverse ${rand(entry.amount)} from ${invoice.invoice_number}? The outstanding balance will increase.`)) return
    setBusy(`reverse-${entry.index}`)
    setMsg('')
    try {
      // Read the latest row before applying the correction to avoid relying only on the page's cached amount.
      const { data: latest, error: readError } = await supabase.from('invoices').select('paid_amount,status,notes').eq('id', invoice.id).single()
      if (readError || !latest) throw new Error(readError?.message ?? 'Could not reload the latest invoice payment state.')
      const latestNotes = String(latest.notes ?? '')
      const currentLines = latestNotes.split('\n')
      const marker = `PAYMENT REVERSAL [entry ${entry.index + 1}]:`
      if (currentLines.some((line: string) => line.startsWith(marker))) throw new Error('This payment has already been reversed. Refresh the invoice to see the latest history.')
      if (!currentLines.includes(entry.line)) throw new Error('This payment entry has changed. Refresh the invoice before reversing it.')
      if (Number(latest.paid_amount ?? 0) + 0.004 < entry.amount) throw new Error('The current paid amount is lower than this payment. Refresh and reconcile the invoice before reversing it.')
      const nextPaid = Math.max(0, Math.round((Number(latest.paid_amount ?? 0) - entry.amount) * 100) / 100)
      const nextStatus = nextPaid <= 0.004 ? 'sent' : nextPaid >= money.total - 0.004 ? 'paid' : 'partial'
      const audit = `${marker} ${rand(entry.amount)} reversed on ${new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Johannesburg' })}. Reason: ${reason.trim()}. Original: ${entry.line}`
      const { error: updateError } = await supabase.from('invoices').update({ paid_amount: nextPaid, status: nextStatus, notes: [latestNotes, audit].filter(Boolean).join('\n') }).eq('id', invoice.id)
      if (updateError) throw new Error(updateError.message)
      setMsg(`Payment reversed. Paid amount and outstanding balance recalculated; invoice is now ${nextStatus}.`)
      await load()
    } catch (e) {
      setMsg((e as Error).message)
    } finally {
      setBusy(null)
    }
  }

  async function completeJobAndRequestFinal() {
    if (!jobId) return
    if (!window.confirm('Mark this job completed and create/request the outstanding final balance invoice?')) return
    setBusy('complete')
    setMsg('')
    try {
      const res = await handlersB.ngms_update_job(supabase, { job_id: jobId, status: 'completed', note: 'Job completed from invoice workflow. Final balance requested; completion report/review workflow unlocked.' })
      if (res.isError) throw new Error(res.content[0]?.text ?? 'Could not complete the job')
      setMsg('Job completed. The outstanding balance invoice has been created or confirmed. Next: send the completion report and review request.')
      await load()
    } catch (e) {
      setMsg((e as Error).message)
    } finally {
      setBusy(null)
    }
  }


  async function createCreditNoteDraft() {
    if (!CREDIT_NOTE_UI_ENABLED) { setMsg('Credit-note writes are disabled until the isolated preview database and feature flag are configured.'); return }
    if (!invoice || !client || !money) return
    const subtotal = Number(creditSubtotal), vatRate = Number(creditVatRate)
    if (!creditReason.trim() || !creditDescription.trim()) { setMsg('Credit reason and line description are required.'); return }
    if (!Number.isFinite(subtotal) || subtotal <= 0 || !Number.isFinite(vatRate) || vatRate < 0 || vatRate > 100) { setMsg('Enter a positive subtotal and a valid VAT rate.'); return }
    const vat = Math.round(subtotal * vatRate) / 100
    const total = Math.round((subtotal + vat + Number.EPSILON) * 100) / 100
    const issuedTotal = creditNotes.filter(n => n.status === 'issued').reduce((s,n) => s + Number(n.total_amount), 0)
    if (total > money.total - issuedTotal + 0.004) { setMsg('Credit exceeds the remaining creditable invoice value.'); return }
    const { data: auth, error: authError } = await supabase.auth.getUser()
    if (authError || !auth.user) { setMsg('Staff session expired. Sign in again.'); return }
    setCreditBusy('create'); setMsg('')
    try {
      const { data: row, error } = await supabase.from('credit_notes').insert({ invoice_id: invoice.id, client_id: client.id, reason: creditReason.trim(), subtotal, vat_amount: vat, total_amount: total, created_by: auth.user.id, status: 'draft', review_status: 'pending' }).select('id').single()
      if (error || !row) throw new Error(error?.message ?? 'Could not create credit note.')
      const { error: itemError } = await supabase.from('credit_note_items').insert({ credit_note_id: row.id, description: creditDescription.trim(), quantity: 1, unit: 'item', unit_price: subtotal, vat_rate: vatRate })
      if (itemError) { await supabase.from('credit_notes').delete().eq('id', row.id).eq('status', 'draft'); throw new Error(itemError.message) }
      setCreditReason(''); setCreditSubtotal(''); setMsg('Credit-note draft created. It must be reviewed before issue.'); await load()
    } catch(e) { setMsg((e as Error).message) } finally { setCreditBusy(null) }
  }

  async function reviewCreditNote(note: CreditNote, decision: 'approve'|'reject') {
    if (!CREDIT_NOTE_UI_ENABLED) { setMsg('Credit-note writes are disabled until the isolated preview database and feature flag are configured.'); return }
    if (creditReviewNote.trim().length < 8) { setMsg('Review note must be at least 8 characters.'); return }
    if (!window.confirm(`${decision === 'approve' ? 'Approve' : 'Reject'} ${note.credit_note_number}? Paid and partially paid invoices require explicit Admin review.`)) return
    setCreditBusy(note.id); setMsg('')
    try {
      const { data, error } = await supabase.rpc('ngms_review_credit_note', { p_credit_note_id: note.id, p_decision: decision, p_review_note: creditReviewNote.trim() })
      if (error) throw new Error(error.message)
      const result = data as { message?: string; review_status?: string }
      setMsg(result.message ?? `Review recorded: ${result.review_status ?? decision}.`); setCreditReviewNote(''); await load()
    } catch(e) { setMsg((e as Error).message) } finally { setCreditBusy(null) }
  }

  async function issueCreditNote(note: CreditNote) {
    if (!CREDIT_NOTE_UI_ENABLED) { setMsg('Credit-note writes are disabled until the isolated preview database and feature flag are configured.'); return }
    if (!window.confirm(`Issue ${note.credit_note_number}? This will not change invoice balances or payment history.`)) return
    setCreditBusy(note.id); setMsg('')
    try {
      const { data, error } = await supabase.rpc('ngms_issue_credit_note', { p_credit_note_id: note.id })
      if (error) throw new Error(error.message)
      const result = data as { credit_note_number?: string; message?: string }
      setMsg(result.message ?? `${result.credit_note_number ?? note.credit_note_number} issued. Invoice and payment history remain unchanged.`); await load()
    } catch(e) { setMsg((e as Error).message) } finally { setCreditBusy(null) }
  }

  useEffect(() => {
    if (!printCreditNote) return
    document.body.classList.add('print-credit-note')
    window.print()
    document.body.classList.remove('print-credit-note')
    setPrintCreditNote(null)
  }, [printCreditNote])

  async function saveNote() {
    if (!invoice || !note.trim()) return
    setBusy('note')
    setMsg('')
    try {
      const res = await handlersB.ngms_update_invoice(supabase, { invoice_id: invoice.id, note: note.trim() })
      if (res.isError) throw new Error(res.content[0]?.text ?? 'Could not save the note')
      setNote('')
      setMsg('Note added.')
      await load()
    } catch (e) {
      setMsg((e as Error).message)
    } finally {
      setBusy(null)
    }
  }

  if (loading && !invoice) {
    return (
      <main className="min-h-[60vh] flex items-center justify-center bg-jet">
        <Loader2 className="w-6 h-6 text-mist animate-spin" />
      </main>
    )
  }

  if (error && !invoice) {
    return (
      <main className="min-h-[60vh] bg-jet px-4 py-16">
        <div className="max-w-md mx-auto text-center">
          <p className="text-orange flex items-center justify-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5" /> {error}
          </p>
          <Link href="/admin/invoices" className="text-blue text-sm">
            Back to invoices
          </Link>
        </div>
      </main>
    )
  }

  if (!invoice || !money || !business) return null

  const bankPlaceholder = !business.bank_details || PLACEHOLDER_ACC.test(business.bank_details)
  const input = 'w-full bg-jet border border-darkgrey text-paper rounded-btn px-3 py-2.5 text-sm focus:outline-none focus:border-blue'
  const canVoid = invoice.status !== 'void' && invoice.status !== 'paid' && money.paid <= 0.004
  const bank = bankPlaceholder ? null : business.bank_details
  const owing = invoice.status !== 'void' && money.balance > 0.004
  const waInvoice = owing
    ? waTo(
        client?.phone,
        money.overdue
          ? reminderMessage({ client: client?.name ?? null, number: invoice.invoice_number, balance: money.balance, daysOverdue: money.days_overdue, bank })
          : invoiceMessage({ client: client?.name ?? null, number: invoice.invoice_number, balance: money.balance, dueDate: invoice.due_date, bank }),
      )
    : null

  return (
    <main className="min-h-screen bg-jet px-4 py-8">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #print-area, #print-area * { visibility: visible; }
          #print-area { position: absolute; left: 0; top: 0; width: 100%; margin: 0 !important; padding: 14mm !important; box-shadow: none !important; border-radius: 0 !important; }
          #credit-note-print-area { display: none; }
          body.print-credit-note #print-area { display: none !important; }
          body.print-credit-note #credit-note-print-area { display: block !important; visibility: visible; position: absolute; left: 0; top: 0; width: 100%; margin: 0 !important; padding: 14mm !important; }
          body.print-credit-note #credit-note-print-area * { visibility: visible; }
          .no-print { display: none !important; }
          @page { margin: 10mm; }
        }
      `}</style>

      <div className="max-w-2xl mx-auto">
        <div className="no-print">
          <Link href="/admin/invoices" className="text-xs text-mist hover:text-paper inline-flex items-center gap-1 mb-3">
            <ArrowLeft className="w-3.5 h-3.5" /> Invoices
          </Link>

          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h1 className="font-heading text-2xl font-bold text-paper">{invoice.invoice_number}</h1>
              <span className={`inline-block mt-1 text-[10px] uppercase tracking-wider border rounded px-2 py-0.5 ${STATUS_STYLE[invoice.status] ?? 'text-mist border-darkgrey'}`}>
                {money.overdue ? `${money.days_overdue}d overdue` : invoice.status}
              </span>
              {quoteNumber && <span className="ml-2 text-xs text-mist">quote {quoteNumber}</span>}
            </div>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 bg-blue-fill hover:bg-blue-dark text-white font-heading font-semibold px-4 py-2.5 rounded-btn shrink-0"
            >
              <Printer className="w-4 h-4" /> Print / Save as PDF
            </button>
          </div>

          {bankPlaceholder && (
            <p className="text-xs text-orange flex items-start gap-1.5 mb-3 bg-cardgrey border border-darkgrey rounded-card px-3 py-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              Capitec account number isn&apos;t set yet — this invoice will print without banking details.{' '}
              <Link href="/admin/quotes" className="underline shrink-0">
                Fix in Business &amp; banking
              </Link>
            </p>
          )}

          {owing &&
            (waInvoice ? (
              <a
                href={waInvoice}
                target="_blank"
                rel="noreferrer"
                onClick={() => {
                  if (invoice.status === 'draft') setStatus('sent')
                }}
                className={`flex items-center justify-center gap-2 ${money.overdue ? 'bg-orange' : 'bg-whatsapp'} hover:opacity-90 text-white font-heading font-semibold px-4 py-3 rounded-btn mb-2`}
              >
                {money.overdue ? <BellRing className="w-4 h-4" /> : <MessageCircle className="w-4 h-4" />}
                {money.overdue ? `Send payment reminder (${money.days_overdue}d overdue)` : 'Send on WhatsApp'}
              </a>
            ) : (
              <p className="text-xs text-mist mb-2">No WhatsApp number on file for this client. Add one on their client page to send from here.</p>
            ))}
          {owing && bankPlaceholder && <p className="text-[11px] text-orange mb-2">The message won&apos;t include banking details until the Capitec account number is set.</p>}

          <div className="flex flex-wrap items-center gap-2 mb-4 mt-2">
            {invoice.status === 'draft' && (
              <button
                onClick={() => setStatus('sent')}
                disabled={!!busy}
                className="inline-flex items-center gap-1.5 bg-blue-fill hover:bg-blue-dark text-white text-sm font-heading font-semibold px-3.5 py-2 rounded-btn disabled:opacity-50"
              >
                {busy === 'sent' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Mark as sent
              </button>
            )}
            {canVoid && (
              <button
                onClick={() => setStatus('void')}
                disabled={!!busy}
                className="inline-flex items-center gap-1.5 border border-darkgrey hover:border-orange text-mist hover:text-orange text-sm font-heading font-semibold px-3.5 py-2 rounded-btn disabled:opacity-50"
              >
                {busy === 'void' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />} Void invoice
              </button>
            )}
            {/* Only unsent drafts can be deleted; issued invoices are voided so they stay on record. */}
            {invoice.status === 'draft' && money.paid <= 0.004 && (
              <DeleteRecord
                label="Delete draft invoice"
                confirmText={`Permanently delete draft ${invoice.invoice_number}${client?.name ? ` for ${client.name}` : ''}? This cannot be undone. Only unpaid drafts can be deleted.`}
                onDelete={() => deleteDraftInvoice(supabase, invoice.id)}
                redirectTo="/admin/invoices"
              />
            )}
          </div>

          <section id="payment-history" className="bg-cardgrey border-2 border-orange rounded-card p-4 mb-4 scroll-mt-6">
            <h2 className="font-heading font-bold text-paper mb-2 text-base">PAYMENT HISTORY &amp; CORRECTIONS</h2>
            <p className="text-xs text-mist mb-3">Reverse an incorrectly recorded payment here. A reason is required and the correction is appended to the invoice audit notes.</p>
            {paymentEntries(invoice.notes).length === 0 ? (
              <p className="text-sm text-mist">No payment entries found in this invoice&apos;s notes.</p>
            ) : (
              <div className="space-y-2">
                {paymentEntries(invoice.notes).map((entry) => (
                  <div key={entry.index} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border border-darkgrey rounded-btn p-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-paper">{rand(entry.amount)}</p>
                      <p className="text-xs text-mist break-words">{entry.line}</p>
                      {entry.reversed && <p className="text-xs text-orange mt-1">Reversal recorded in audit history</p>}
                    </div>
                    {entry.reversed ? (
                      <span className="text-xs text-mist border border-darkgrey px-2 py-1 rounded shrink-0">Reversed</span>
                    ) : (
                      <button onClick={() => reversePayment(entry)} disabled={!!busy || entry.amount > (money?.paid ?? 0) + 0.004} className="inline-flex items-center justify-center gap-1.5 border border-orange text-orange hover:bg-orange/10 text-xs font-semibold px-3 py-2 rounded-btn disabled:opacity-40 shrink-0">
                        {busy === `reverse-${entry.index}` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Ban className="w-3.5 h-3.5" />} Reverse payment
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {money.balance > 0.004 && invoice.status !== 'void' && (
            <section className="bg-cardgrey border border-darkgrey rounded-card p-4 mb-4">
              <h2 className="font-heading font-bold text-paper mb-3 flex items-center gap-2">
                <CircleDollarSign className="w-4 h-4 text-whatsapp" /> Record payment
              </h2>
              <div className="grid gap-3 sm:grid-cols-3">
                <label className="text-xs text-mist">
                  Amount (R)
                  <input className={`${input} mt-1`} inputMode="decimal" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} />
                </label>
                <label className="text-xs text-mist">
                  Method
                  <select className={`${input} mt-1`} value={payMethod} onChange={(e) => setPayMethod(e.target.value as (typeof PAY_METHODS)[number])}>
                    {PAY_METHODS.map((m) => (
                      <option key={m} value={m}>
                        {m.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-xs text-mist">
                  Reference
                  <input className={`${input} mt-1`} value={payRef} onChange={(e) => setPayRef(e.target.value)} placeholder="Bank ref" />
                </label>
              </div>
              <p className="text-[11px] text-mist mt-2">Balance due: {rand(money.balance)}</p>
              <button onClick={recordPayment} disabled={!!busy} className="mt-3 inline-flex items-center gap-2 bg-whatsapp hover:opacity-90 text-white font-heading font-semibold px-4 py-2.5 rounded-btn disabled:opacity-50">
                {busy === 'payment' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Record payment
              </button>
            </section>
          )}

          {jobId && invoice.status === 'paid' && invoice.notes?.toLowerCase().includes('deposit invoice') && (
            <section className="bg-cardgrey border border-blue/40 rounded-card p-4 mb-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 text-whatsapp shrink-0" />
                <div className="flex-1">
                  <h2 className="font-heading font-bold text-paper">Deposit received — next step</h2>
                  <p className="mt-1 text-xs text-mist">The deposit is paid. Complete the job to automatically calculate the actual outstanding balance and unlock the completion/review workflow.</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {jobStatus === 'completed' ? (
                      <Link href={`/admin/jobs/${jobId}/completion`} className="inline-flex items-center gap-2 bg-blue-fill hover:bg-blue-dark text-white font-heading font-semibold px-3.5 py-2.5 rounded-btn">
                        View completion report
                      </Link>
                    ) : (
                      <button onClick={completeJobAndRequestFinal} disabled={!!busy} className="inline-flex items-center gap-2 bg-whatsapp hover:opacity-90 text-white font-heading font-semibold px-3.5 py-2.5 rounded-btn disabled:opacity-50">
                        {busy === 'complete' ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                        Complete job &amp; request final balance
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </section>
          )}

          {msg && <p className="text-xs text-mist mb-4">{msg}</p>}




          <section className="bg-cardgrey border border-darkgrey rounded-card p-4 mb-4">
            <h2 className="font-heading font-bold text-paper mb-1">CREDIT NOTES</h2>
            <p className="text-xs text-mist mb-3">Separate, numbered accounting documents. Issuing does not refund cash or rewrite invoice/payment history.</p>
            {!creditNotesAvailable && <p className="text-xs text-orange border border-orange/40 rounded-btn p-3 mb-3">Credit-note database migration is not available in this environment. Existing invoice operations remain unaffected.</p>}
            {!CREDIT_NOTE_UI_ENABLED && <p className="text-xs text-mist border border-darkgrey rounded-btn p-3 mb-3">Read-only preview mode. Credit-note writes remain disabled until an isolated preview database is configured and NEXT_PUBLIC_NGMS_CREDIT_NOTES_ENABLED is explicitly enabled there.</p>}
            {['paid','partial'].includes(invoice.status) && <p className="text-xs text-orange border border-orange/40 rounded-btn p-3 mb-3">Manual Admin accounting review is required for this {invoice.status} invoice.</p>}
            {CREDIT_NOTE_UI_ENABLED && creditNotesAvailable && (<>\n            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-xs text-mist sm:col-span-2">Reason<textarea className={`${input} mt-1 min-h-[60px]`} value={creditReason} onChange={e=>setCreditReason(e.target.value)} placeholder="Reason for credit" /></label>
              <label className="text-xs text-mist sm:col-span-2">Credit line description<input className={`${input} mt-1`} value={creditDescription} onChange={e=>setCreditDescription(e.target.value)} /></label>
              <label className="text-xs text-mist">Subtotal excluding VAT (R)<input className={`${input} mt-1`} inputMode="decimal" value={creditSubtotal} onChange={e=>setCreditSubtotal(e.target.value)} placeholder="0.00" /></label>
              <label className="text-xs text-mist">VAT rate (%)<input className={`${input} mt-1`} inputMode="decimal" value={creditVatRate} onChange={e=>setCreditVatRate(e.target.value)} /></label>
            </div>
            <p className="text-xs text-mist mt-2">Confirm the original invoice VAT treatment before creating a draft.</p>
            <button onClick={createCreditNoteDraft} disabled={!!creditBusy || !creditReason.trim() || !creditSubtotal} className="mt-3 inline-flex items-center gap-2 bg-blue-fill text-white font-heading font-semibold px-4 py-2.5 rounded-btn disabled:opacity-50">{creditBusy==='create' ? 'Creating…' : 'Create credit-note draft'}</button>
            </>)}\n            <div className="border-t border-darkgrey mt-4 pt-4 space-y-3">
              <h3 className="font-heading font-semibold text-paper text-sm">Linked credit-note history</h3>
              {creditNotes.length===0 ? <p className="text-xs text-mist">No credit notes recorded.</p> : creditNotes.map(note=><div key={note.id} className="border border-darkgrey rounded-btn p-3">
                <div className="flex flex-wrap justify-between gap-2"><div><p className="font-semibold text-paper text-sm">{note.credit_note_number}</p><p className="text-xs text-mist mt-1">{note.reason}</p><p className="text-xs text-mist mt-1">{sastDate(note.created_at)} · {note.review_status.replaceAll('_',' ')}</p></div><div className="text-right"><p className="font-semibold text-paper">{rand(Number(note.total_amount))}</p><p className="text-[10px] uppercase text-mist">{note.status}</p></div></div>
                {note.review_note && <p className="text-xs text-mist mt-2">Review: {note.review_note}</p>}
                <div className="flex flex-wrap gap-2 mt-3">
                  <button onClick={()=>setPrintCreditNote(note)} className="border border-darkgrey text-mist px-3 py-2 rounded-btn text-xs">Print credit note</button>
                  {CREDIT_NOTE_UI_ENABLED && note.status==='draft' && note.review_status!=='approved' && <button onClick={()=>reviewCreditNote(note,'approve')} disabled={!!creditBusy || creditReviewNote.trim().length<8} className="border border-blue text-blue px-3 py-2 rounded-btn text-xs disabled:opacity-50">Record approval</button>}
                  {CREDIT_NOTE_UI_ENABLED && note.status==='draft' && note.review_status!=='rejected' && <button onClick={()=>reviewCreditNote(note,'reject')} disabled={!!creditBusy || creditReviewNote.trim().length<8} className="border border-orange text-orange px-3 py-2 rounded-btn text-xs disabled:opacity-50">Reject</button>}
                  {CREDIT_NOTE_UI_ENABLED && note.status==='draft' && note.review_status==='approved' && <button onClick={()=>issueCreditNote(note)} disabled={!!creditBusy} className="bg-orange text-black px-3 py-2 rounded-btn text-xs font-semibold disabled:opacity-50">{creditBusy===note.id?'Issuing…':'Issue credit note'}</button>}
                </div>
              </div>)}
              {CREDIT_NOTE_UI_ENABLED && creditNotes.some(n=>n.status==='draft') && <label className="block text-xs text-mist">Review note (minimum 8 characters)<textarea className={`${input} mt-1 min-h-[56px]`} value={creditReviewNote} onChange={e=>setCreditReviewNote(e.target.value)} placeholder="Reason for approval or rejection" /></label>}
            </div>
          </section>
          <section className="bg-cardgrey border border-darkgrey rounded-card p-4 mb-6">
            <h2 className="font-heading font-bold text-paper mb-2">Notes</h2>
            <p className="text-sm text-mist whitespace-pre-line mb-3">{invoice.notes || '(no notes yet)'}</p>
            <textarea className={`${input} min-h-[64px]`} placeholder="Add a note" value={note} onChange={(e) => setNote(e.target.value)} />
            <button onClick={saveNote} disabled={!!busy || !note.trim()} className="mt-2 inline-flex items-center gap-2 border border-darkgrey hover:border-blue text-mist hover:text-paper text-sm font-heading font-semibold px-3.5 py-2 rounded-btn disabled:opacity-50">
              {busy === 'note' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Add note
            </button>
          </section>
        </div>


        <div id="credit-note-print-area" style={{ display:'none', background:'#fff', color:BRAND.black, padding:'28px 26px', fontFamily:'Inter, system-ui, sans-serif' }}>
          <div style={{ display:'flex', justifyContent:'space-between', gap:20, borderBottom:`3px solid ${BRAND.orange}`, paddingBottom:16, marginBottom:20 }}>
            <img src={LOGO_DATA_URI} alt="NGMS logo" style={{ height:52, width:'auto', objectFit:'contain' }} />
            <div style={{ textAlign:'right', fontSize:12, color:BRAND.grey, lineHeight:1.5 }}><p style={{fontWeight:700,fontSize:15,color:BRAND.black}}>{business.name}</p>{business.address&&<p>{business.address}</p>}{business.phone&&<p>{business.phone}</p>}{business.email&&<p>{business.email}</p>}{business.vat_number&&<p>VAT no: {business.vat_number}</p>}</div>
          </div>
          <p style={{fontWeight:800,fontSize:24,marginBottom:4}}>CREDIT NOTE</p><p style={{color:BRAND.grey,fontSize:13,marginBottom:18}}>{printCreditNote?.credit_note_number??''}</p>
          <p style={{fontSize:12,marginBottom:8}}>Issued to: <strong>{client?.name??'—'}</strong></p><p style={{fontSize:12,marginBottom:8}}>Original invoice: <strong>{invoice.invoice_number}</strong></p>
          <p style={{fontSize:12,marginBottom:16}}>Reason: {printCreditNote?.reason??''}</p>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:12.5,marginBottom:16}}><thead><tr style={{background:BRAND.black,color:'#fff'}}><th style={{textAlign:'left',padding:8}}>Credit description</th><th style={{textAlign:'right',padding:8}}>Subtotal</th></tr></thead><tbody><tr style={{borderBottom:`1px solid ${BRAND.line}`}}><td style={{padding:8}}>{printCreditNote?.reason??'Credit against original invoice'}</td><td style={{padding:8,textAlign:'right'}}>{rand(Number(printCreditNote?.subtotal??0))}</td></tr></tbody></table>
          <div style={{marginLeft:'auto',width:240,fontSize:13}}><Row label="Subtotal" value={rand(Number(printCreditNote?.subtotal??0))}/><Row label="VAT" value={rand(Number(printCreditNote?.vat_amount??0))}/><Row label="CREDIT TOTAL" value={rand(Number(printCreditNote?.total_amount??0))} bold border accent={BRAND.orange}/></div>
          <p style={{marginTop:24,paddingTop:12,borderTop:`1px solid ${BRAND.line}`,textAlign:'center',fontSize:11,color:BRAND.grey}}>This credit note does not itself confirm a cash refund or rewrite payment history.</p>
        </div>
        {/* -------- printable invoice sheet -------- */}
        <div
          id="print-area"
          className="rounded-card shadow-xl"
          style={{ background: '#fff', color: BRAND.black, padding: '28px 26px', fontFamily: 'Inter, system-ui, sans-serif' }}
        >
          <div className="flex items-start justify-between gap-4" style={{ borderBottom: `3px solid ${BRAND.purple}`, paddingBottom: 16, marginBottom: 20 }}>
            <img src={LOGO_DATA_URI} alt="NGMS logo" style={{ height: 52, width: 'auto', objectFit: 'contain' }} />
            <div style={{ textAlign: 'right', fontSize: 12, color: BRAND.grey, lineHeight: 1.5 }}>
              <p style={{ fontFamily: 'Space Grotesk, Inter, sans-serif', fontWeight: 700, fontSize: 15, color: BRAND.black }}>{business.name}</p>
              {business.address && <p>{business.address}</p>}
              {business.phone && <p>{business.phone}</p>}
              {business.email && <p>{business.email}</p>}
              {business.vat_number && <p>VAT no: {business.vat_number}</p>}
            </div>
          </div>

          <div className="flex items-start justify-between gap-4" style={{ marginBottom: 18 }}>
            <div>
              <p style={{ fontFamily: 'Space Grotesk, Inter, sans-serif', fontWeight: 700, fontSize: 22, color: BRAND.black, letterSpacing: 0.5 }}>INVOICE</p>
              <p style={{ fontSize: 13, color: BRAND.grey, marginTop: 2 }}>{invoice.invoice_number}</p>
              {quoteNumber && <p style={{ fontSize: 11, color: BRAND.grey }}>Quote reference: {quoteNumber}</p>}
            </div>
            <div style={{ textAlign: 'right', fontSize: 12, color: BRAND.grey }}>
              <p>
                Issued: <strong style={{ color: BRAND.black }}>{sastDate(invoice.created_at)}</strong>
              </p>
              <p>
                Due: <strong style={{ color: money.overdue ? BRAND.orange : BRAND.black }}>{invoice.due_date ?? '—'}</strong>
              </p>
              <p style={{ marginTop: 4, textTransform: 'uppercase', fontSize: 10, letterSpacing: 1, fontWeight: 700, color: invoice.status === 'paid' ? BRAND.green : invoice.status === 'void' ? BRAND.grey : money.overdue ? BRAND.orange : '#2B7FD9' }}>
                {money.overdue ? `${money.days_overdue}d overdue` : invoice.status}
              </p>
            </div>
          </div>

          <div style={{ background: '#F7F5FA', borderRadius: 10, padding: '12px 14px', marginBottom: 20, fontSize: 13 }}>
            <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5, color: BRAND.grey, marginBottom: 3 }}>Billed to</p>
            <p style={{ fontWeight: 700 }}>{client?.name ?? '—'}</p>
            {client?.phone && <p style={{ color: BRAND.grey }}>{client.phone}</p>}
            {client?.email && <p style={{ color: BRAND.grey }}>{client.email}</p>}
            {(client?.address || client?.suburb) && <p style={{ color: BRAND.grey }}>{[client?.address, client?.suburb].filter(Boolean).join(', ')}</p>}
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, marginBottom: 4 }}>
            <thead>
              <tr style={{ background: BRAND.black, color: '#fff' }}>
                <th style={{ textAlign: 'left', padding: '7px 8px', fontWeight: 600 }}>Description</th>
                <th style={{ textAlign: 'right', padding: '7px 8px', fontWeight: 600, width: 46 }}>Qty</th>
                <th style={{ textAlign: 'left', padding: '7px 8px', fontWeight: 600, width: 60 }}>Unit</th>
                <th style={{ textAlign: 'right', padding: '7px 8px', fontWeight: 600, width: 84 }}>Price</th>
                <th style={{ textAlign: 'right', padding: '7px 8px', fontWeight: 600, width: 90 }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, i) => (
                <tr key={it.id ?? i} style={{ borderBottom: `1px solid ${BRAND.line}` }}>
                  <td style={{ padding: '7px 8px' }}>{it.description}</td>
                  <td style={{ padding: '7px 8px', textAlign: 'right' }}>{it.quantity}</td>
                  <td style={{ padding: '7px 8px' }}>{it.unit}</td>
                  <td style={{ padding: '7px 8px', textAlign: 'right' }}>{rand(it.unit_price)}</td>
                  <td style={{ padding: '7px 8px', textAlign: 'right', fontWeight: 600 }}>{rand(it.quantity * it.unit_price)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-end" style={{ marginBottom: 18 }}>
            <div style={{ width: 240, fontSize: 13 }}>
              <Row label="Subtotal" value={rand(money.subtotal)} />
              {money.vat ? <Row label="VAT" value={rand(money.vat)} /> : (
                <p style={{ fontSize: 10.5, color: BRAND.grey, fontStyle: 'italic', margin: '2px 0 6px' }}>Prices exclude VAT — not VAT registered.</p>
              )}
              <Row label="Total" value={rand(money.total)} bold border />
              <Row label="Paid" value={rand(money.paid)} accent={BRAND.purple} />
              <Row label="Balance due" value={rand(money.balance)} bold />
            </div>
          </div>

          <div style={{ borderTop: `1px solid ${BRAND.line}`, paddingTop: 14, fontSize: 12 }}>
            <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5, color: BRAND.grey, marginBottom: 4, fontWeight: 700 }}>Pay to</p>
            {bankPlaceholder ? (
              <p style={{ color: BRAND.orange }}>Banking details to follow — please contact us before paying.</p>
            ) : (
              <p style={{ whiteSpace: 'pre-line' }}>{business.bank_details}</p>
            )}
            <p style={{ marginTop: 6 }}>Reference: {invoice.invoice_number}</p>
          </div>

          <div style={{ textAlign: 'center', marginTop: 22, paddingTop: 12, borderTop: `1px solid ${BRAND.line}`, fontSize: 11, color: BRAND.grey }}>
            Thank you for your business — {business.name}
            {business.whatsapp ? ` · WhatsApp ${business.phone ?? business.whatsapp}` : ''}
          </div>
        </div>
      </div>
    </main>
  )
}

function Row({ label, value, bold, border, accent }: { label: string; value: string; bold?: boolean; border?: boolean; accent?: string }) {
  return (
    <div
      className="flex items-center justify-between"
      style={{
        padding: '3px 0',
        fontWeight: bold ? 700 : 400,
        fontSize: bold ? 15 : 13,
        borderTop: border ? `2px solid ${BRAND.black}` : undefined,
        marginTop: border ? 4 : 0,
        paddingTop: border ? 6 : 3,
        color: accent ?? BRAND.black,
      }}
    >
      <span>{label}</span>
      <span>{value}</span>
    </div>
  )
}

export default function InvoiceDetailPage() {
  return (
    <StaffGate title="Invoice">
      <InvoiceView />
    </StaffGate>
  )
}
