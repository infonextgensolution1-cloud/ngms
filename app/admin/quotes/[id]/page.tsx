'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, Printer, Download, Check, X, Send, AlertTriangle, Receipt, Briefcase, CalendarPlus, MessageCircle } from 'lucide-react'
import StaffGate from '@/components/admin/StaffGate'
import DeleteRecord from '@/components/admin/DeleteRecord'
import { supabase } from '@/lib/supabaseClient'
import { deleteQuote } from '@/lib/admin-delete'
import { waTo, quoteMessage } from '@/lib/admin-wa'
import { handlersA } from '@/lib/ngms-ops/handlers-a'
import { handlersB } from '@/lib/ngms-ops/handlers-b'
import { getSettings, rand, todaySast } from '@/lib/ngms-ops/core'
import type { Quote, Client, Item, Settings } from '@/lib/ngms-ops/core'
import { LOGO_DATA_URI } from '@/lib/logo'
import { QUOTE_TERMS, PLACEHOLDER_ACC } from '@/lib/quote-terms'

type Money = { subtotal: number; vat: number; total: number; deposit: number; deposit_percent: number; balance: number }
type JobRow = { id: string; title: string | null; status: string; scheduled_date: string | null }
type InvoiceRow = { id: string; invoice_number: string; status: string; total_amount: number | null; paid_amount: number | null }\ntype QuoteVersionRow = { id: string; version_number: number; version_status: string; revision_reason: string | null; change_summary: string | null; created_at: string; sent_at: string | null; accepted_at: string | null; public_token: string | null }

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
  const router = useRouter()
  const [booking, setBooking] = useState(false)
  const [jobDate, setJobDate] = useState('')
  const [customerLink, setCustomerLink] = useState<string | null>(null)
  const [linkCopied, setLinkCopied] = useState(false)
  const [pdfSaved, setPdfSaved] = useState(false)\n  const [versions, setVersions] = useState<QuoteVersionRow[]>([])

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [res, s, versionRes] = await Promise.all([
        handlersA.ngms_get_quote(supabase, { quote_id: id }),
        getSettings(supabase),
        supabase.from('quote_versions').select('id,version_number,version_status,revision_reason,change_summary,created_at,sent_at,accepted_at,public_token').eq('quote_id', id).order('version_number', { ascending: false }),
      ])
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
      const versionRows = (versionRes.data ?? []) as QuoteVersionRow[]\n      setVersions(versionRows)\n      const latestVersion = versionRows[0]\n      setCustomerLink(latestVersion?.public_token ? `${window.location.origin}/quote/${latestVersion.public_token}` : null)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  async function downloadSavedPdf() {
    if (!quote) return
    setBusy('pdf-download')
    setMsg('')
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData.session?.access_token
      if (!token) throw new Error('Your session has expired. Sign in again.')
      const response = await fetch('/api/quotes/' + quote.id + '/pdf', {
        method: 'GET',
        headers: { Authorization: 'Bearer ' + token },
      })
      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new Error(body.error || 'Could not download the saved PDF.')
      }
      const blob = await response.blob()
      const disposition = response.headers.get('content-disposition') || ''
      const match = disposition.match(/filename="([^"]+)"/i)
      const fileName = match?.[1] || `${quote.quote_number}.pdf`
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
      setMsg('Saved PDF downloaded.')
    } catch (e) {
      setMsg((e as Error).message)
    } finally {
      setBusy(null)
    }
  }

  async function generatePdf(options?: { shareWhatsApp?: boolean }) {
    if (!quote) return
    setBusy('pdf')
    setMsg('')
    let shareWindow: Window | null = null
    if (options?.shareWhatsApp) {
      shareWindow = window.open('', '_blank')
    }

    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData.session?.access_token
      if (!token) throw new Error('Your session has expired. Sign in again.')

      const response = await fetch('/api/quotes/' + quote.id + '/pdf', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + token },
      })
      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new Error(body.error || 'Could not generate the PDF.')
      }

      const blob = await response.blob()
      const disposition = response.headers.get('content-disposition') || ''
      const match = disposition.match(/filename="([^"]+)"/i)
      const fileName = match?.[1] || `${quote.quote_number}.pdf`
      const url = URL.createObjectURL(blob)

      // Always download locally as a reliable fallback.
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      a.remove()

      setPdfSaved(true)
      await load()

      if (options?.shareWhatsApp) {
        const message = quoteMessage({
          client: client?.name ?? null,
          number: quote.quote_number,
          total: money?.total ?? Number(quote.total_amount ?? 0),
          deposit: money?.deposit ?? Number(quote.deposit_amount ?? 0),
          depositPct: money?.deposit_percent ?? 70,
          validUntil: quote.valid_until,
        })

        const file = new File([blob], fileName, { type: 'application/pdf' })
        const canShareFile =
          typeof navigator.share === 'function' &&
          typeof navigator.canShare === 'function' &&
          navigator.canShare({ files: [file] })

        if (canShareFile) {
          await navigator.share({
            files: [file],
            text: message,
            title: `NGMS ${quote.quote_number}`,
          })
          setMsg('PDF generated and ready to share via WhatsApp.')
        } else if (waQuote) {
          const target = shareWindow || window.open('', '_blank')
          if (target) {
            target.location.href = waQuote
          } else {
            window.location.href = waQuote
          }
          setMsg('PDF generated and downloaded. WhatsApp opened — attach the downloaded PDF.')
        } else {
          if (shareWindow) shareWindow.close()
          setMsg('PDF generated and downloaded.')
        }
      } else {
        setMsg('PDF saved to NGMS and downloaded.')
      }

      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (e) {
      if (shareWindow) shareWindow.close()
      if ((e as Error).name === 'AbortError') {
        setMsg('PDF generated and downloaded. Sharing was cancelled.')
      } else {
        setMsg((e as Error).message)
      }
    } finally {
      setBusy(null)
    }
  }

  async function savePdf() {
    return generatePdf()
  }


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

  async function createInvoice(kind: 'full' | 'balance') {
    if (!quote) return
    setBusy(kind)
    setMsg('')
    try {
      const res = await handlersB.ngms_create_invoice(supabase, { quote_id: quote.id, kind })
      if (res.isError) throw new Error(res.content[0]?.text ?? 'Could not create the invoice')
      const inv = res.structuredContent?.invoice as { id: string } | undefined
      if (inv?.id) return router.push(`/admin/invoices/${inv.id}`)
      await load()
    } catch (e) {
      setMsg((e as Error).message)
    } finally {
      setBusy(null)
    }
  }

  async function bookJob() {
    if (!quote) return
    setBusy('job')
    setMsg('')
    try {
      const res = await handlersB.ngms_create_job(supabase, { quote_id: quote.id, ...(jobDate ? { scheduled_date: jobDate } : {}) })
      if (res.isError) throw new Error(res.content[0]?.text ?? 'Could not book the job')
      const job = res.structuredContent?.job as { id: string } | undefined
      if (job?.id) return router.push(`/admin/jobs/${job.id}`)
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

  const waQuote = waTo(
    client?.phone,
    quoteMessage({ client: client?.name ?? null, number: quote.quote_number, total: money.total, deposit: money.deposit, depositPct: money.deposit_percent, validUntil: quote.valid_until }),
  )
  const liveInvoices = invoices.filter((i) => i.status !== 'void')
  const invoicedTotal = liveInvoices.reduce((t, i) => t + Number(i.total_amount ?? 0), 0)
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
            <div className="flex flex-wrap justify-end gap-2">
              <button
                onClick={savePdf}
                disabled={!!busy}
                className="inline-flex items-center gap-2 bg-blue-fill hover:bg-blue-dark text-white font-heading font-semibold px-4 py-2.5 rounded-btn shrink-0 disabled:opacity-50"
              >
                {busy === 'pdf' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                {busy === 'pdf' ? 'Generating…' : pdfSaved || quote.pdf_path ? 'Save / Download PDF' : 'Generate & Save PDF'}
              </button>
              {quote.pdf_path && (
                <button
                  type="button"
                  onClick={downloadSavedPdf}
                  disabled={!!busy}
                  className="inline-flex items-center gap-2 border border-darkgrey hover:border-blue text-mist hover:text-paper font-heading font-semibold px-3 py-2.5 rounded-btn shrink-0 disabled:opacity-50"
                >
                  {busy === 'pdf-download' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  Saved PDF
                </button>
              )}
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 border border-darkgrey hover:border-blue text-mist hover:text-paper font-heading font-semibold px-3 py-2.5 rounded-btn shrink-0"
              >
                <Printer className="w-4 h-4" /> Browser Print
              </button>
            </div>
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

          {waQuote ? (
            <button
              type="button"
              onClick={() => generatePdf({ shareWhatsApp: true })}
              disabled={!!busy}
              className="flex w-full items-center justify-center gap-2 bg-whatsapp hover:opacity-90 text-white font-heading font-semibold px-4 py-3 rounded-btn mb-2 disabled:opacity-50"
            >
              {busy === 'pdf' ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4 h-4" />}
              {busy === 'pdf' ? 'Generating PDF…' : `Generate PDF & Send on WhatsApp${client?.name ? ` to ${client.name.split(/\s+/)[0]}` : ''}`}
            </button>
          ) : (
            <p className="text-xs text-mist mb-2">No WhatsApp number on file for this client. Add one on their client page to send from here.</p>
          )}
          <p className="text-[11px] text-mist mb-4">The PDF is generated and saved first. On supported phones, WhatsApp opens with the PDF attached; otherwise WhatsApp opens with the message and the downloaded PDF can be attached.</p>

          {versions.length > 0 && (\n            <div className="mb-4 rounded-card border border-darkgrey bg-cardgrey p-3">\n              <div className="flex items-center justify-between gap-3 mb-2">\n                <div>\n                  <p className="text-xs font-heading font-semibold text-paper">Quote version history</p>\n                  <p className="text-[11px] text-mist mt-0.5">Customer-facing versions are preserved as snapshots.</p>\n                </div>\n                <span className="text-[10px] uppercase tracking-wider text-mist">{versions.length} version{versions.length === 1 ? '' : 's'}</span>\n              </div>\n              <div className="space-y-2">\n                {versions.map((v) => (\n                  <div key={v.id} className="rounded-btn border border-darkgrey px-3 py-2">\n                    <div className="flex flex-wrap items-center justify-between gap-2">\n                      <span className="text-xs font-heading font-semibold text-paper">v{v.version_number} · {v.version_status}</span>\n                      <span className="text-[10px] text-mist">{new Date(v.created_at).toLocaleString('en-ZA')}</span>\n                    </div>\n                    {v.change_summary && <p className="mt-1 text-[11px] text-mist">{v.change_summary}</p>}\n                    {v.revision_reason && <p className="mt-1 text-[11px] text-paper">Reason: {v.revision_reason}</p>}\n                  </div>\n                ))}\n              </div>\n            </div>\n          )}\n\n          {customerLink && (
            <div className="mb-4 rounded-card border border-blue bg-cardgrey p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-heading font-semibold text-paper">Customer quote link</p>
                  <p className="mt-1 truncate text-[11px] text-mist">{customerLink}</p>
                </div>
                <button
                  onClick={async () => {
                    await navigator.clipboard.writeText(customerLink)
                    setLinkCopied(true)
                    window.setTimeout(() => setLinkCopied(false), 1800)
                  }}
                  className="shrink-0 rounded-btn border border-blue px-3 py-2 text-xs font-heading font-semibold text-blue"
                >
                  {linkCopied ? 'Copied' : 'Copy link'}
                </button>
              </div>
              <p className="mt-2 text-[11px] text-mist">This link opens the exact latest quote version. Send it to the customer for review and acceptance.</p>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 mb-4">
            {quote.status === 'draft' && (
              <button onClick={() => setStatus('sent')} disabled={!!busy} className="inline-flex items-center gap-1.5 bg-blue-fill hover:bg-blue-dark text-white text-sm font-heading font-semibold px-3.5 py-2 rounded-btn disabled:opacity-50">
                {busy === 'sent' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Mark as sent
              </button>
            )}
            {quote.status === 'sent' && (
              <>
                <button onClick={() => setStatus('accepted')} disabled={!!busy} className="inline-flex items-center gap-1.5 bg-whatsapp hover:opacity-90 text-white text-sm font-heading font-semibold px-3.5 py-2 rounded-btn disabled:opacity-50">
                  {busy === 'accepted' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Accepted
                </button>
                <button onClick={() => setStatus('declined')} disabled={!!busy} className="inline-flex items-center gap-1.5 border border-darkgrey hover:border-orange text-mist hover:text-orange text-sm font-heading font-semibold px-3.5 py-2 rounded-btn disabled:opacity-50">
                  {busy === 'declined' ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />} Declined
                </button>
              </>
            )}
            {quote.status === 'accepted' && money.deposit > 0 && !liveInvoices.length && (
              <button onClick={createDepositInvoice} disabled={!!busy} className="inline-flex items-center gap-1.5 bg-orange hover:opacity-90 text-white text-sm font-heading font-semibold px-3.5 py-2 rounded-btn disabled:opacity-50">
                {busy === 'invoice' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Receipt className="w-4 h-4" />} Create deposit invoice
              </button>
            )}
            {['sent', 'accepted'].includes(quote.status) && !jobs.some((j) => j.status !== 'cancelled') && !booking && (
              <button onClick={() => setBooking(true)} disabled={!!busy} className="inline-flex items-center gap-1.5 bg-blue-fill hover:bg-blue-dark text-white text-sm font-heading font-semibold px-3.5 py-2 rounded-btn disabled:opacity-50">
                <CalendarPlus className="w-4 h-4" /> Book job
              </button>
            )}
            {quote.status === 'accepted' && !liveInvoices.length && (
              <button onClick={() => createInvoice('full')} disabled={!!busy} className="inline-flex items-center gap-1.5 border border-darkgrey hover:border-orange text-paper text-sm font-heading font-semibold px-3.5 py-2 rounded-btn disabled:opacity-50">
                {busy === 'full' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Receipt className="w-4 h-4" />} Invoice in full
              </button>
            )}
            {quote.status === 'accepted' && liveInvoices.length > 0 && invoicedTotal < money.total - 0.5 && (
              <button onClick={() => createInvoice('balance')} disabled={!!busy} className="inline-flex items-center gap-1.5 bg-orange hover:opacity-90 text-white text-sm font-heading font-semibold px-3.5 py-2 rounded-btn disabled:opacity-50">
                {busy === 'balance' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Receipt className="w-4 h-4" />} Final invoice ({rand(money.total - invoicedTotal)})
              </button>
            )}
            {booking && (
              <div className="w-full bg-cardgrey border border-blue rounded-card p-3.5 flex flex-wrap items-end gap-3">
                <label className="text-xs text-mist">
                  Job date (optional)
                  <input type="date" value={jobDate} min={todaySast()} onChange={(e) => setJobDate(e.target.value)} className="block mt-1 bg-jet border border-darkgrey text-paper rounded-btn px-3 py-2 text-sm" />
                </label>
                <button onClick={bookJob} disabled={!!busy} className="inline-flex items-center gap-1.5 bg-blue-fill hover:bg-blue-dark text-white text-sm font-heading font-semibold px-3.5 py-2 rounded-btn disabled:opacity-50">
                  {busy === 'job' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Book it
                </button>
                <button onClick={() => setBooking(false)} className="text-sm text-mist hover:text-paper py-2">Cancel</button>
                <p className="w-full text-[11px] text-mist">{quote.status === 'sent' ? 'Booking marks the quote accepted and the lead as won.' : 'Creates the job with the quote\'s scope and client.'}</p>
              </div>
            )}
            <DeleteRecord label="Delete quote" confirmText={`Delete ${quote.quote_number}${client?.name ? ` for ${client.name}` : ''} and its line items?`} onDelete={() => deleteQuote(supabase, quote.id)} redirectTo="/admin/quotes" />
          </div>

          {msg && <p className="text-xs text-mist mb-4">{msg}</p>}

          {(!!jobs.length || !!invoices.length) && (
            <div className="grid gap-2 mb-6">
              {!!invoices.length && (
                <div className="bg-cardgrey border border-darkgrey rounded-card px-3.5 py-3">
                  <p className="text-xs font-heading font-semibold text-paper flex items-center gap-1.5 mb-1.5"><Receipt className="w-3.5 h-3.5" /> Invoices</p>
                  {invoices.map((i) => <Link key={i.id} href={`/admin/invoices/${i.id}`} className="block text-xs text-blue hover:text-paper">{i.invoice_number} · {i.status} · {rand(i.total_amount ?? 0)} (paid {rand(i.paid_amount ?? 0)})</Link>)}
                </div>
              )}
              {!!jobs.length && (
                <div className="bg-cardgrey border border-darkgrey rounded-card px-3.5 py-3">
                  <p className="text-xs font-heading font-semibold text-paper flex items-center gap-1.5 mb-1.5"><Briefcase className="w-3.5 h-3.5" /> Jobs</p>
                  {jobs.map((j) => <Link key={j.id} href={`/admin/jobs/${j.id}`} className="block text-xs text-blue hover:text-paper">{j.title ?? 'Job'} · {j.status} · {j.scheduled_date ?? 'no date set'}</Link>)}
                </div>
              )}
            </div>
          )}
        </div>

        <div id="print-area" className="rounded-card shadow-xl" style={{ background: '#fff', color: BRAND.black, padding: '28px 26px', fontFamily: 'Inter, system-ui, sans-serif' }}>
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
            <div><p style={{ fontFamily: 'Space Grotesk, Inter, sans-serif', fontWeight: 700, fontSize: 22, color: BRAND.black, letterSpacing: 0.5 }}>QUOTE</p><p style={{ fontSize: 13, color: BRAND.grey, marginTop: 2 }}>{quote.quote_number}</p></div>
            <div style={{ textAlign: 'right', fontSize: 12, color: BRAND.grey }}>
              <p>Date: <strong style={{ color: BRAND.black }}>{sastDate(quote.created_at)}</strong></p>
              <p>Valid until: <strong style={{ color: expired ? BRAND.orange : BRAND.black }}>{quote.valid_until ?? '—'}</strong></p>
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
            <thead><tr style={{ background: BRAND.black, color: '#fff' }}>
              <th style={{ textAlign: 'left', padding: '7px 8px', fontWeight: 600 }}>Description</th>
              <th style={{ textAlign: 'right', padding: '7px 8px', fontWeight: 600, width: 46 }}>Qty</th>
              <th style={{ textAlign: 'left', padding: '7px 8px', fontWeight: 600, width: 60 }}>Unit</th>
              <th style={{ textAlign: 'right', padding: '7px 8px', fontWeight: 600, width: 84 }}>Price</th>
              <th style={{ textAlign: 'right', padding: '7px 8px', fontWeight: 600, width: 90 }}>Amount</th>
            </tr></thead>
            <tbody>{items.map((it, i) => <tr key={it.id ?? i} style={{ borderBottom: `1px solid ${BRAND.line}` }}>
              <td style={{ padding: '7px 8px' }}>{it.description}</td><td style={{ padding: '7px 8px', textAlign: 'right' }}>{it.quantity}</td><td style={{ padding: '7px 8px' }}>{it.unit}</td><td style={{ padding: '7px 8px', textAlign: 'right' }}>{rand(it.unit_price)}</td><td style={{ padding: '7px 8px', textAlign: 'right', fontWeight: 600 }}>{rand(it.quantity * it.unit_price)}</td>
            </tr>)}</tbody>
          </table>

          <div className="flex justify-end" style={{ marginBottom: 18 }}><div style={{ width: 240, fontSize: 13 }}>
            <Row label="Subtotal" value={rand(money.subtotal)} />{quote.vat_included ? <Row label={`VAT (${settings.vat_rate}%)`} value={rand(money.vat)} /> : <p style={{ fontSize: 10.5, color: BRAND.grey, fontStyle: 'italic', margin: '2px 0 6px' }}>Prices exclude VAT — not VAT registered.</p>}<Row label="Total" value={rand(money.total)} bold border /><Row label={`Deposit (${money.deposit_percent}%)`} value={rand(money.deposit)} accent={BRAND.purple} /><Row label="Balance on completion" value={rand(money.balance)} />
          </div></div>

          {quote.notes && <div style={{ marginBottom: 18, fontSize: 12.5 }}><p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5, color: BRAND.grey, marginBottom: 3 }}>Notes</p><p style={{ whiteSpace: 'pre-line' }}>{quote.notes}</p></div>}

          <div style={{ marginBottom: 18, fontSize: 11, color: BRAND.grey }}><p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5, color: BRAND.grey, marginBottom: 4, fontWeight: 700 }}>Terms</p><ul style={{ paddingLeft: 16, margin: 0 }}>{terms.map((t, i) => <li key={i} style={{ marginBottom: 2 }}>{t}</li>)}</ul></div>

          <div style={{ borderTop: `1px solid ${BRAND.line}`, paddingTop: 14, fontSize: 12 }}><p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5, color: BRAND.grey, marginBottom: 4, fontWeight: 700 }}>Banking details</p>{bankPlaceholder ? <p style={{ color: BRAND.orange }}>Banking details to follow — please contact us before paying a deposit.</p> : <p style={{ whiteSpace: 'pre-line' }}>{settings.bank_details}</p>}</div>

          <div style={{ textAlign: 'center', marginTop: 22, paddingTop: 12, borderTop: `1px solid ${BRAND.line}`, fontSize: 11, color: BRAND.grey }}>Thank you for the opportunity to quote — {settings.business_name}{settings.whatsapp ? ` · WhatsApp ${settings.phone ?? settings.whatsapp}` : ''}</div>
        </div>
      </div>
    </main>
  )
}

function Row({ label, value, bold, border, accent }: { label: string; value: string; bold?: boolean; border?: boolean; accent?: string }) {
  return <div className="flex items-center justify-between" style={{ padding: '3px 0', fontWeight: bold ? 700 : 400, fontSize: bold ? 15 : 13, borderTop: border ? `2px solid ${BRAND.black}` : undefined, marginTop: border ? 4 : 0, paddingTop: border ? 6 : 3, color: accent ?? BRAND.black }}><span>{label}</span><span>{value}</span></div>
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
  return <StaffGate title="Quote"><QuoteView /></StaffGate>
}
