import { notFound } from 'next/navigation'
import { CheckCircle2, Clock3, MessageCircle, XCircle } from 'lucide-react'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getSettings, rand, todaySast } from '@/lib/ngms-ops/core'
import { QUOTE_TERMS } from '@/lib/quote-terms'

type Props = { params: Promise<{ token: string }> }

export const dynamic = 'force-dynamic'

export default async function CustomerQuotePage({ params }: Props) {
  const { token } = await params
  const db = supabaseAdmin()
  const { data: version } = await db
    .from('quote_versions')
    .select('id,quote_id,version_number,version_status,revision_reason,snapshot,created_at,accepted_at')
    .eq('public_token', token)
    .maybeSingle()

  if (!version) notFound()

  const snapshot = (version.snapshot ?? {}) as {
    quote?: {
      quote_number?: string
      status?: string
      total_amount?: number | null
      deposit_amount?: number | null
      valid_until?: string | null
      notes?: string | null
      created_at?: string | null
      vat_included?: boolean | null
    }
    client?: { name?: string | null; address?: string | null; suburb?: string | null }
    items?: Array<{ description?: string; quantity?: number; unit?: string; unit_price?: number }>
    money?: { subtotal?: number; vat?: number; total?: number; deposit?: number }
  }
  const q = snapshot.quote
  const client = snapshot.client
  const items = snapshot.items ?? []
  const money = snapshot.money
  const total = Number(money?.total ?? q?.total_amount ?? 0)
  const deposit = Number(money?.deposit ?? q?.deposit_amount ?? 0)
  const expired = version.version_status !== 'accepted' && !!q?.valid_until && q.valid_until < todaySast()
  const settings = await getSettings(db)
  const terms = QUOTE_TERMS.map((t) => t.replace('{deposit}', String(total > 0 ? Math.round((deposit / total) * 100) : 0)))
  const canAct = version.version_status === 'sent' && !expired

  return (
    <main className="min-h-screen bg-jet px-4 py-8 text-paper">
      <div className="mx-auto max-w-2xl">
        <header className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-mist">NextGen Maintenance Solutions</p>
            <h1 className="mt-1 font-heading text-2xl font-bold">Quote {q?.quote_number ?? '—'}</h1>
            <p className="mt-1 text-xs text-mist">Version {version.version_number}</p>
          </div>
          <span className="rounded-full border border-darkgrey px-3 py-1 text-xs uppercase tracking-wider">
            {expired ? 'Expired' : version.version_status}
          </span>
        </header>

        <section className="rounded-card border border-darkgrey bg-cardgrey p-5 shadow-xl">
          <div className="mb-5">
            <p className="text-xs uppercase tracking-wider text-mist">Prepared for</p>
            <p className="mt-1 text-lg font-semibold">{client?.name ?? 'Customer'}</p>
            {(client?.address || client?.suburb) && <p className="text-sm text-mist">{[client.address, client.suburb].filter(Boolean).join(', ')}</p>}
          </div>

          <div className="overflow-hidden rounded-card border border-darkgrey">
            <div className="grid grid-cols-[1fr_auto] gap-3 border-b border-darkgrey bg-jet px-4 py-3 text-xs uppercase tracking-wider text-mist">
              <span>Scope</span><span>Total</span>
            </div>
            {items.map((item, i) => (
              <div key={i} className="grid grid-cols-[1fr_auto] gap-3 border-b border-darkgrey px-4 py-3">
                <div>
                  <p className="text-sm font-medium">{item.description ?? 'Service'}</p>
                  <p className="text-xs text-mist">{item.quantity ?? 1} {item.unit ?? 'item'} × {rand(Number(item.unit_price ?? 0))}</p>
                </div>
                <p className="text-sm font-semibold">{rand(Number(item.quantity ?? 1) * Number(item.unit_price ?? 0))}</p>
              </div>
            ))}
            <div className="grid grid-cols-[1fr_auto] gap-3 bg-jet px-4 py-4">
              <span className="font-heading font-semibold">Quote total</span>
              <span className="font-heading text-xl font-bold">{rand(total)}</span>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-card border border-darkgrey bg-jet p-4">
              <p className="text-xs text-mist">Deposit</p>
              <p className="mt-1 font-heading text-lg font-bold">{rand(deposit)}</p>
            </div>
            <div className="rounded-card border border-darkgrey bg-jet p-4">
              <p className="text-xs text-mist">Valid until</p>
              <p className="mt-1 font-heading text-lg font-bold">{q?.valid_until ?? '—'}</p>
            </div>
          </div>

          {q?.notes && <div className="mt-5 rounded-card border border-darkgrey bg-jet p-4 text-sm text-mist whitespace-pre-wrap">{q.notes}</div>}

          {version.revision_reason && (
            <div className="mt-5 rounded-card border border-blue bg-blue/10 p-4 text-sm">
              <p className="font-semibold">Revision note</p>
              <p className="mt-1 text-mist">{version.revision_reason}</p>
            </div>
          )}

          {canAct && <CustomerActions token={token} />}
          {version.version_status === 'accepted' && (
            <div className="mt-5 flex items-center gap-2 rounded-card border border-whatsapp bg-whatsapp/10 p-4 text-sm">
              <CheckCircle2 className="h-5 w-5 text-whatsapp" /> This quote version has been accepted. We can now schedule the work.
            </div>
          )}
          {expired && (
            <div className="mt-5 flex items-center gap-2 rounded-card border border-orange bg-orange/10 p-4 text-sm">
              <Clock3 className="h-5 w-5 text-orange" /> This quote has passed its validity date. Please contact NGMS for an updated quote.
            </div>
          )}
        </section>

        <section className="mt-5 rounded-card border border-darkgrey bg-cardgrey p-5 text-sm text-mist">
          <h2 className="font-heading font-semibold text-paper">Terms</h2>
          <ul className="mt-3 list-disc space-y-1 pl-5">
            {terms.map((term, i) => <li key={i}>{term}</li>)}
          </ul>
          <div className="mt-5 border-t border-darkgrey pt-4 text-xs">
            <p className="font-semibold text-paper">{settings.business_name}</p>
            {settings.phone && <p>{settings.phone}</p>}
            {settings.email && <p>{settings.email}</p>}
          </div>
        </section>

        <p className="mt-6 text-center text-xs text-mist">One call. All solutions.</p>
      </div>
    </main>
  )
}

function CustomerActions({ token }: { token: string }) {
  return (
    <div className="mt-5 grid gap-3 sm:grid-cols-2">
      <form action={`/api/quote/${token}/accept`} method="post">
        <button className="flex w-full items-center justify-center gap-2 rounded-btn bg-whatsapp px-4 py-3 font-heading font-semibold text-white">
          <CheckCircle2 className="h-4 w-4" /> Accept quote
        </button>
      </form>
      <form action={`/api/quote/${token}/decline`} method="post">
        <button className="flex w-full items-center justify-center gap-2 rounded-btn border border-darkgrey px-4 py-3 font-heading font-semibold text-paper">
          <XCircle className="h-4 w-4" /> Decline quote
        </button>
      </form>
      <a href={`https://wa.me/27631387945?text=${encodeURIComponent('Hi NGMS, I have a question about quote ' + token)}`} className="sm:col-span-2 flex items-center justify-center gap-2 rounded-btn border border-darkgrey px-4 py-3 text-sm">
        <MessageCircle className="h-4 w-4" /> Ask NGMS on WhatsApp
      </a>
    </div>
  )
}
