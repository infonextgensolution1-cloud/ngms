'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, Printer, Send, Ban, AlertTriangle, Save, CircleDollarSign } from 'lucide-react'
import StaffGate from '@/components/admin/StaffGate'
import { supabase } from '@/lib/supabaseClient'
import { handlersB } from '@/lib/ngms-ops/handlers-b'
import { rand } from '@/lib/ngms-ops/core'
import type { Invoice, Client, Item } from '@/lib/ngms-ops/core'
import { LOGO_DATA_URI } from '@/lib/logo'
import { PLACEHOLDER_ACC } from '@/lib/quote-terms'

type Money = { subtotal: number; vat: number; total: number; paid: number; balance: number; overdue: boolean; days_overdue: number }
type Business = { name: string | null; phone: string | null; whatsapp: string | null; email: string | null; address: string | null; vat_number: string | null; bank_details: string | null; logo_url: string | null }

const BRAND = { black: '#0A0A0A', purple: '#8B1BF5', orange: '#F57C1B', green: '#39D353', grey: '#5B5B5B', line: '#E4E4E4' }
const PAY_METHODS = ['eft', 'cash', 'card', 'other'] as const

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
              className="inline-flex items-center gap-2 bg-blue hover:bg-blue-dark text-white font-heading font-semibold px-4 py-2.5 rounded-btn shrink-0"
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

          <div className="flex flex-wrap items-center gap-2 mb-4">
            {invoice.status === 'draft' && (
              <button
                onClick={() => setStatus('sent')}
                disabled={!!busy}
                className="inline-flex items-center gap-1.5 bg-blue hover:bg-blue-dark text-white text-sm font-heading font-semibold px-3.5 py-2 rounded-btn disabled:opacity-50"
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
                {busy === 'void' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />} Void
              </button>
            )}
          </div>

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

          {msg && <p className="text-xs text-mist mb-4">{msg}</p>}

          <section className="bg-cardgrey border border-darkgrey rounded-card p-4 mb-6">
            <h2 className="font-heading font-bold text-paper mb-2">Notes</h2>
            <p className="text-sm text-mist whitespace-pre-line mb-3">{invoice.notes || '(no notes yet)'}</p>
            <textarea className={`${input} min-h-[64px]`} placeholder="Add a note" value={note} onChange={(e) => setNote(e.target.value)} />
            <button onClick={saveNote} disabled={!!busy || !note.trim()} className="mt-2 inline-flex items-center gap-2 border border-darkgrey hover:border-blue text-mist hover:text-paper text-sm font-heading font-semibold px-3.5 py-2 rounded-btn disabled:opacity-50">
              {busy === 'note' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Add note
            </button>
          </section>
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
