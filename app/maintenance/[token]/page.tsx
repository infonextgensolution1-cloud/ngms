import { notFound } from 'next/navigation'
import { CheckCircle2, MessageCircle, ShieldCheck, XCircle } from 'lucide-react'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getSettings } from '@/lib/ngms-ops/core'

export const dynamic = 'force-dynamic'

export default async function MaintenancePlanPage({ params, searchParams }: {
  params: Promise<{ token: string }>
  searchParams: Promise<{ active?: string; declined?: string }>
}) {
  const { token } = await params
  const query = await searchParams
  const db = supabaseAdmin()
  const { data: plan } = await db
    .from('maintenance_plans')
    .select('id,name,service_scope,frequency_months,discount_percent,status,next_due_date,notes')
    .eq('public_token', token)
    .maybeSingle()

  if (!plan) notFound()

  const settings = await getSettings(db)
  const canAct = ['offered', 'paused'].includes(plan.status)
  const active = plan.status === 'active' || query.active === '1'
  const declined = plan.status === 'declined' || query.declined === '1'

  return (
    <main className="min-h-screen bg-jet px-4 py-8 text-paper">
      <div className="mx-auto max-w-2xl">
        <header className="mb-6">
          <p className="text-xs uppercase tracking-[0.2em] text-mist">NextGen Maintenance Solutions</p>
          <h1 className="mt-2 font-heading text-3xl font-bold">Maintenance Care Plan</h1>
          <p className="mt-1 text-sm text-mist">One call. All solutions. Ongoing property care.</p>
        </header>

        <section className="rounded-card border border-darkgrey bg-cardgrey p-5 shadow-xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wider text-mist">Plan</p>
              <h2 className="mt-1 font-heading text-2xl font-bold">{plan.name}</h2>
            </div>
            <span className="rounded-full border border-darkgrey px-3 py-1 text-xs uppercase tracking-wider">{plan.status}</span>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-card border border-darkgrey bg-jet p-4">
              <p className="text-xs text-mist">Service scope</p>
              <p className="mt-1 text-sm font-medium">{plan.service_scope ?? 'Property maintenance'}</p>
            </div>
            <div className="rounded-card border border-darkgrey bg-jet p-4">
              <p className="text-xs text-mist">Frequency</p>
              <p className="mt-1 text-sm font-medium">Every {plan.frequency_months} months</p>
            </div>
            <div className="rounded-card border border-darkgrey bg-jet p-4">
              <p className="text-xs text-mist">Plan discount</p>
              <p className="mt-1 text-sm font-medium">{Number(plan.discount_percent) ? plan.discount_percent + '%' : 'Standard pricing'}</p>
            </div>
            <div className="rounded-card border border-darkgrey bg-jet p-4">
              <p className="text-xs text-mist">Next due</p>
              <p className="mt-1 text-sm font-medium">{plan.next_due_date ?? 'To be scheduled'}</p>
            </div>
          </div>

          <div className="mt-5 flex gap-3 rounded-card border border-blue bg-blue/10 p-4 text-sm">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-blue" />
            <p>Accepting activates the plan. This offer does not enrol you automatically.</p>
          </div>

          {active && <div className="mt-5 flex items-center gap-2 rounded-card border border-whatsapp bg-whatsapp/10 p-4 text-sm"><CheckCircle2 className="h-5 w-5 text-whatsapp" /> Your maintenance plan is active. NGMS can now coordinate the next service cycle.</div>}
          {declined && <div className="mt-5 flex items-center gap-2 rounded-card border border-darkgrey bg-jet p-4 text-sm"><XCircle className="h-5 w-5 text-mist" /> This maintenance offer has been declined.</div>}

          {canAct && !active && !declined && (
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <form action={`/api/maintenance/${token}/accept`} method="post">
                <button className="flex w-full items-center justify-center gap-2 rounded-btn bg-whatsapp px-4 py-3 font-heading font-semibold text-white">
                  <CheckCircle2 className="h-4 w-4" /> Activate plan
                </button>
              </form>
              <form action={`/api/maintenance/${token}/decline`} method="post">
                <button className="flex w-full items-center justify-center gap-2 rounded-btn border border-darkgrey px-4 py-3 font-heading font-semibold">
                  <XCircle className="h-4 w-4" /> Decline offer
                </button>
              </form>
            </div>
          )}

          <a href={`https://wa.me/27631387945?text=${encodeURIComponent('Hi NGMS, I have a question about my ' + plan.name)}`} className="mt-4 flex items-center justify-center gap-2 rounded-btn border border-darkgrey px-4 py-3 text-sm">
            <MessageCircle className="h-4 w-4" /> Ask NGMS on WhatsApp
          </a>
        </section>

        <section className="mt-5 rounded-card border border-darkgrey bg-cardgrey p-5 text-sm text-mist">
          <h2 className="font-heading font-semibold text-paper">What happens next?</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5">
            <li>Activate the plan if you want recurring maintenance.</li>
            <li>NGMS confirms the service window before the next visit.</li>
            <li>The job is scheduled and completed through the NGMS field workflow.</li>
          </ol>
          <div className="mt-5 border-t border-darkgrey pt-4 text-xs">
            <p className="font-semibold text-paper">{settings.business_name}</p>
            {settings.phone && <p>{settings.phone}</p>}
            {settings.email && <p>{settings.email}</p>}
          </div>
        </section>
      </div>
    </main>
  )
}
