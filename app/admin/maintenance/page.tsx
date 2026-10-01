'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Copy, ExternalLink, RefreshCw } from 'lucide-react'
import StaffGate from '@/components/admin/StaffGate'
import { supabase } from '@/lib/supabaseClient'

type Plan = {
  id: string
  name: string
  service_scope: string | null
  frequency_months: number
  discount_percent: number
  status: string
  next_due_date: string | null
  public_token: string | null
  created_at: string
}

function MaintenanceDashboard() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('maintenance_plans')
      .select('id,name,service_scope,frequency_months,discount_percent,status,next_due_date,public_token,created_at')
      .order('next_due_date', { ascending: true, nullsFirst: false })
    setPlans((data ?? []) as Plan[])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function copyLink(token: string) {
    const url = window.location.origin + '/maintenance/' + token
    await navigator.clipboard.writeText(url)
    setCopied(token)
    setTimeout(() => setCopied(null), 1800)
  }

  return (
    <main className="min-h-[70vh] bg-jet px-4 py-8">
      <div className="mx-auto max-w-5xl">
        <Link href="/admin/sales" className="mb-3 inline-flex items-center gap-1 text-xs text-mist hover:text-paper"><ArrowLeft className="h-3.5 w-3.5" /> Sales Engine</Link>
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <p className="kicker">Recurring Care</p>
            <h1 className="font-heading text-2xl font-bold text-paper">Maintenance Control</h1>
            <p className="mt-1 text-sm text-mist">Offers, active plans, due dates and customer acceptance links.</p>
          </div>
          <button onClick={load} className="p-2 text-mist hover:text-paper" aria-label="Refresh"><RefreshCw className={loading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} /></button>
        </div>

        <div className="overflow-hidden rounded-card border border-darkgrey bg-cardgrey">
          <div className="hidden grid-cols-[1.5fr_1fr_.7fr_1fr_1.2fr] gap-3 border-b border-darkgrey bg-jet px-4 py-3 text-[10px] uppercase tracking-wider text-mist md:grid">
            <span>Plan</span><span>Frequency</span><span>Status</span><span>Next due</span><span>Customer link</span>
          </div>
          {plans.map(plan => (
            <div key={plan.id} className="grid gap-3 border-b border-darkgrey p-4 last:border-b-0 md:grid-cols-[1.5fr_1fr_.7fr_1fr_1.2fr] md:items-center">
              <div>
                <p className="text-sm font-semibold text-paper">{plan.name}</p>
                <p className="mt-1 text-xs text-mist">{plan.service_scope ?? 'Property maintenance'}{Number(plan.discount_percent) ? ` · ${plan.discount_percent}% discount` : ''}</p>
              </div>
              <p className="text-xs text-mist">Every {plan.frequency_months} months</p>
              <span className="w-fit rounded-full border border-darkgrey px-2 py-1 text-[10px] uppercase text-mist">{plan.status}</span>
              <p className="text-xs text-mist">{plan.next_due_date ?? '—'}</p>
              <div className="flex gap-2">
                {plan.public_token && <button onClick={() => copyLink(plan.public_token!)} className="inline-flex items-center gap-1 rounded-btn border border-darkgrey px-2 py-1 text-xs text-paper"><Copy className="h-3 w-3" /> {copied === plan.public_token ? 'Copied' : 'Copy'}</button>}
                {plan.public_token && <Link href={`/maintenance/${plan.public_token}`} target="_blank" className="inline-flex items-center gap-1 rounded-btn border border-darkgrey px-2 py-1 text-xs text-paper"><ExternalLink className="h-3 w-3" /> Open</Link>}
              </div>
            </div>
          ))}
          {!plans.length && <p className="p-6 text-sm text-mist">No maintenance plans or offers found.</p>}
        </div>
      </div>
    </main>
  )
}

export default function MaintenancePage() {
  return <StaffGate title="Maintenance"><MaintenanceDashboard /></StaffGate>
}
