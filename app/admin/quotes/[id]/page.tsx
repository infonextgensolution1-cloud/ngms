'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, Printer, Check, X, Send, AlertTriangle, Receipt, Briefcase } from 'lucide-react'
import StaffGate from '@/components/admin/StaffGate'
import { supabase } from '@/lib/supabaseClient'
import { handlersA } from '@/lib/ngms-ops/handlers-a'
import { handlersB } from '@/lib/ngms-ops/handlers-b'
import { getSettings, rand, todaySast } from '@/lib/ngms-ops/core'
import type { Quote, Client, Item, Settings } from '@/lib/ngms-ops/core'
import { LOGO_DATA_URI } from '@/lib/logo'
import { QUOTE_TERMS, PLACEHOLDER_ACC } from '@/lib/quote-terms'

type Money = { subtotal: number; vat: number; total: number; deposit: number; deposit_percent: number; balance: number }
type JobRow = { id: string; title: string | null; status: string; scheduled_date: string | null }
type InvoiceRow = { id: string; invoice_number: string; status: string; total_amount: number | null; paid_amount: number | null }

const BRAND = { black: '#0A0A0A', purple: '#8B1BF5', orange: '#F57C1B', green: '#39D353', grey: '#5B5B5B', line: '#E4E4E4' }

const STATUS_STYLE: Record<string, string> = {
  draft: 'text-mist border-darkgrey',
  sent: 'text-blue border-blue',
  accepted: 'text-whatsapp border-whatsapp',
  declined: 'text-orange border-orange',
  expired: 'text-orange border-orange',
}

function QuoteView() {
  const params = useParams<{ id: string }>()
  const id = params.id

  const [quote, setQuote] = useState<Quote | null>(null)
  const [client, setClient] = useState<Client | null>(null)
  const [items, setItems] = useState<Item[]>([])
  const [money, setMoney] = useState<Money | null>(null)
  const [jobs, setJobs] = useState<JobRow[]>([])
  const [invoices, setInvoices] = useState<InvoiceRow[]>([])
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [msg, setMsg] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [res, s] = await Promise.all([handlersA.ngms_get_quote(supabase, { quote_id: id }), getSettings(supabase)])
      if (res.isError) throw new Error(res.content[0]?.text ?? 'Could not load that quote')
      const sc = res.structuredContent as {
        quote: Quote
        client: Client | null
        items: Item[]
        money: Money
        jobs: JobRow[]
        invoices: InvoiceRow[]
      }
      setQuote(sc.quote)
      setClient(sc.client)
      setItems(sc.items)
      setMoney(sc.money)
      setJobs(sc.jobs ?? [])
      setInvoices(sc.invoices ?? [])
      setSettings(s)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  async function setStatus(status: 'sent' | 'accepted' | 'declined') {
    if (!quote) return
    setBusy(status)
    setMsg('')
    try {
      const res = await handlersA.ngms_update_quote(supabase, { quote_id: quote.id, status })
      if (res.isError) throw new Error(res.content[0]?.text ?? 'Could not update the quote')
      setMsg(`Marked as ${status}.`)
      await load()
    } catch (e) {
      setMsg((e as Error).message)
    } finally {
      setBusy(null)
    }
  }

  async function createDepositInvoice() {
    if (!quote) return
    setBusy('invoice')
    setMsg('')
    try {
      const res = await handlersB.ngms_create_invoice(supabase, { quote_id: quote.id, kind: 'deposit' })
      setMsg(res.content[0]?.text?.split('\n')[0] ?? (res.isError ? 'Could not create the invoice' : 'Deposit invoice created.'))
      if (!res.isError) await load()
    } catch (e) {
      setMsg((e as Error).message)
    } finally {
      setBusy(null)
    }
  }

  if (loading && !quote) {
    return (
      <main className="min-h-[60vh] flex items-center justify-center bg-jet">
        <Loader2 className="w-6 h-6 text-mist animate-spin" />
      </main>
    )
  }

  if (error && !quote) {
    return (
      <main className="min-h-[60vh] bg-jet px-4 py-16">
        <div className="max-w-md mx-auto text-center">
          <p className="text-orange flex items-center justify-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5" /> {error}
          </p>
          <Link href="/admin/quotes" className="text-blue text-sm">
            Back to quotes
          </Link>
        </div>
      </main>
    )
  }

  if (!quote || !money || !settings) return null

  const expired = quote.status === 'sent' && !!quote.valid_until && quote.valid_until < todaySast()
  const badgeKey = expired ? 'expired' : quote.status
  const bankPlaceholder = !settings.bank_details || PLACEHOLDER_ACC.test(settings.bank_details)
  const terms = QUOTE_TERMS.map((t) => t.replace('{deposit}', String(money.deposit_percent)))

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
        {/* -------- screen-only toolbar -------- */}
        <div className="no-print">
          <Link href="/admin/quotes" className="text-xs text-mist hover:text-paper inline-flex items-center gap-1 mb-3">
            <ArrowLeft className="w-3.5 h-3.5" /> Quotes
          </Link>

          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h1 className="font-heading text-2xl font-bold text-paper">{quote.quote_number}</h1>
              <span className={`inline-block mt-1 text-[10px] uppercase tracking-wider border rounded px-2 py-0.5 ${STATUS_STYLE[badgeKey] ?? 'text-mist border-darkgrey'}`}>
                {badgeKey}
              </span>
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
              Capitec account number isn&apos;t set yet — this quote will print without banking details.{' '}
              <Link href="/admin/quotes" className="underline shrink-0">
                Fix in Business & banking
              </Link>
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2 mb-4">
            {quote.status === 'draft' && (
              <button
                onClick={() => setStatus('sent')}
                disabled={!!busy}
                className="inline-flex items-center gap-1.5 bg-blue hover:bg-blue-dark text-white text-sm font-heading font-semibold px-3.5 py-2 rounded-btn disabled:opacity-50"
              >
                {busy === 'sent' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Mark as sent
              </button>
            )}
            {quote.status === 'sent' && (
              <>
                <button
                  onClick={() => setStatus('accepted')}
                  disabled={!!busy}
                  className="inline-flex items-center gap-1.5 bg-whatsapp hover:opacity-90 text-white text-sm font-heading font-semibold px-3.5 py-2 rounded-btn disabled:opacity-50"
                >
                  {busy === 'accepted' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Accepted
                </button>
                <button
                  onClick={() => setStatus('declined')}
                  disabled={!!busy}
                  className="inline-flex items-center gap-1.5 border border-darkgrey hover:border-orange text-mist hover:text-orange text-sm font-heading font-semibold px-3.5 py-2 rounded-btn disabled:opacity-50"
                >
                  {busy === 'declined' ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />} Declined
                </button>
              </>
            )}
            {quote.status === 'accepted' && money.deposit > 0 && (
              <button
                onClick={createDepositInvoice}
                disabled={!!busy}
                className="inline-flex items-center gap-1.5 bg-orange hover:opacity-90 text-white text-sm font-heading font-semibold px-3.5 py-2 rounded-btn disabled:opacity-50"
              >
                {busy === 'invoice' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Receipt className="w-4 h-4" />} Create deposit invoice
              </button>
            )}
          </div>

          {msg && <p className="text-xs text-mist mb-4">{msg}</p>}

          {(!!jobs.length || !!invoices.length) && (
            <div className="grid gap-2 mb-6">
              {!!invoices.length && (
                <div className="bg-cardgrey border border-darkgrey rounded-card px-3.5 py-3">
                  <p className="text-xs font-heading font-semibold text-paper flex items-center gap-1.5 mb-1.5">
                    <Receipt className="w-3.5 h-3.5" /> Invoices
                  </p>
                  {invoices.map((i) => (
                    <p key={i.id} className="text-xs text-mist">
                      {i.invoice_number} · {i.status} · {rand(i.total_amount ?? 0)} (paid {rand(i.paid_amount ?? 0)})
                    </p>
                  ))}
                </div>
              )}
              {!!jobs.length && (
                <div className="bg-cardgrey border border-darkgrey rounded-card px-3.5 py-3">
                  <p className="text-xs font-heading font-semibold text-paper flex items-center gap-1.5 mb-1.5">
                    <Briefcase className="w-3.5 h-3.5" /> Jobs
                  </p>
                  {jobs.map((j) => (
                    <p key={j.id} className="text-xs text-mist">
                      {j.title ?? 'Job'} · {j.status} · {j.scheduled_date ?? 'no date set'}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* -------- printable quote sheet -------- */}
        <div
          id="print-area"
          className="rounded-card shadow-xl"
          style={{ background: '#fff', color: BRAND.black, padding: '28px 26px', fontFamily: 'Inter, system-ui, sans-serif' }}
        >
          <div className="flex items-start justify-between gap-4" style={{ borderBottom: `3px solid ${BRAND.purple}`, paddingBottom: 16, marginBottom: 20 }}>
            <img src={LOGO_DATA_URI} alt="NGMS logo" style={{ height: 52, width: 'auto', objectFit: 'contain' }} />
            <div style={{ textAlign: 'right', fontSize: 12, color: BRAND.grey, lineHeight: 1.5 }}>
              <p style={{ fontFamily: 'Space Grotesk, Inter, sans-serif', fontWeight: 700, fontSize: 15, color: BRAND.black }}>{settings.business_name}</p>
              {settings.address && <p>{settings.address}</p>}
              {settings.phone && <p>{settings.phone}</p>}
              {settings.email && <p>{settings.email}</p>}
              {settings.vat_registered && settings.vat_number && <p>VAT no: {settings.vat_number}</p>}
            </div>
          </div>

          <div className="flex items-start justify-between gap-4" style={{ marginBottom: 18 }}>
            <div>
              <p style={{ fontFamily: 'Space Grotesk, Inter, sans-serif', fontWeight: 700, fontSize: 22, color: BRAND.black, letterSpacing: 0.5 }}>QUOTE</p>
              <p style={{ fontSize: 13, color: BRAND.grey, marginTop: 2 }}>{quote.quote_number}</p>
            </div>
            <div style={{ textAlign: 'right', fontSize: 12, color: BRAND.grey }}>
              <p>
                Date: <strong style={{ color: BRAND.black }}>{sastDate(quote.created_at)}</strong>
              </p>
              <p>
                Valid until: <strong style={{ color: expired ? BRAND.orange : BRAND.black }}>{quote.valid_until ?? '—'}</strong>
              </p>
              <p style={{ marginTop: 4, textTransform: 'uppercase', fontSize: 10, letterSpacing: 1, fontWeight: 700, color: statusColor(badgeKey) }}>{badgeKey}</p>
            </div>
          </div>

          <div style={{ background: '#F7F5FA', borderRadius: 10, padding: '12px 14px', marginBottom: 20, fontSize: 13 }}>
            <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5, color: BRAND.grey, marginBottom: 3 }}>Quoted to</p>
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
              {quote.vat_included ? (
                <Row label={`VAT (${settings.vat_rate}%)`} value={rand(money.vat)} />
              ) : (
                <p style={{ fontSize: 10.5, color: BRAND.grey, fontStyle: 'italic', margin: '2px 0 6px' }}>Prices exclude VAT — not VAT registered.</p>
              )}
              <Row label="Total" value={rand(money.total)} bold border />
              <Row label={`Deposit (${money.deposit_percent}%)`} value={rand(money.deposit)} accent={BRAND.purple} />
              <Row label="Balance on completion" value={rand(money.balance)} />
            </div>
          </div>

          {quote.notes && (
            <div style={{ marginBottom: 18, fontSize: 12.5 }}>
              <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5, color: BRAND.grey, marginBottom: 3 }}>Notes</p>
              <p style={{ whiteSpace: 'pre-line' }}>{quote.notes}</p>
            </div>
          )}

          <div style={{ marginBottom: 18, fontSize: 11, color: BRAND.grey }}>
            <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5, color: BRAND.grey, marginBottom: 4, fontWeight: 700 }}>Terms</p>
            <ul style={{ paddingLeft: 16, margin: 0 }}>
              {terms.map((t, i) => (
                <li key={i} style={{ marginBottom: 2 }}>
                  {t}
                </li>
              ))}
            </ul>
          </div>

          <div style={{ borderTop: `1px solid ${BRAND.line}`, paddingTop: 14, fontSize: 12 }}>
            <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5, color: BRAND.grey, marginBottom: 4, fontWeight: 700 }}>Banking details</p>
            {bankPlaceholder ? (
              <p style={{ color: BRAND.orange }}>Banking details to follow — please contact us before paying a deposit.</p>
            ) : (
              <p style={{ whiteSpace: 'pre-line' }}>{settings.bank_details}</p>
            )}
          </div>

          <div style={{ textAlign: 'center', marginTop: 22, paddingTop: 12, borderTop: `1px solid ${BRAND.line}`, fontSize: 11, color: BRAND.grey }}>
            Thank you for the opportunity to quote — {settings.business_name}
            {settings.whatsapp ? ` · WhatsApp ${settings.phone ?? settings.whatsapp}` : ''}
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

function statusColor(status: string): string {
  if (status === 'accepted') return BRAND.green
  if (status === 'declined' || status === 'expired') return BRAND.orange
  if (status === 'sent') return '#2B7FD9'
  return BRAND.grey
}

function sastDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Africa/Johannesburg' })
}

export default function QuoteDetailPage() {
  return (
    <StaffGate title="Quote">
      <QuoteView />
    </StaffGate>
  )
}
