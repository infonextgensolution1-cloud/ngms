'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Loader2, RefreshCw, AlertTriangle, MessageCircle, ArrowLeft } from 'lucide-react'
import StaffGate from '@/components/admin/StaffGate'
import { supabase } from '@/lib/supabaseClient'
import { waLink } from '@/lib/ngms-leads-ui'

type Plan = {
  id: string
  name: string
  phone: string
  email: string
  suburb: string | null
  plan_name: string
  interval_months: number
  next_reminder_date: string
  last_reminded_at: string | null
  unsubscribed_at: string | null
  created_at: string
}

const today = () => new Date().toISOString().slice(0, 10)
const fmt = (d: string) => new Date(d.slice(0, 10) + 'T12:00:00').toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })

function PlansList() {
  const [rows, setRows] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    const { data, error } = await supabase
      .from('plan_signups')
      .select('id,name,phone,email,suburb,plan_name,interval_months,next_reminder_date,last_reminded_at,unsubscribed_at,created_at')
      .order('next_reminder_date', { ascending: true })
      .limit(300)
    if (error) setError(error.message)
    else setRows((data ?? []) as Plan[])
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function setDate(id: string, date: string) {
    if (!date) return
    const { error } = await supabase.from('plan_signups').update({ next_reminder_date: date }).eq('id', id)
    if (error) setError(error.message)
    else load()
  }
  async function toggleUnsub(p: Plan) {
    const { error } = await supabase.from('plan_signups').update({ unsubscribed_at: p.unsubscribed_at ? null : new Date().toISOString() }).eq('id', p.id)
    if (error) setError(error.message)
    else load()
  }

  const active = rows.filter((r) => !r.unsubscribed_at)
  const due = active.filter((r) => r.next_reminder_date <= today())

  return (
    <main className="min-h-[70vh] bg-jet px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Link href="/admin" className="text-xs text-mist hover:text-paper inline-flex items-center gap-1 mb-3">
          <ArrowLeft className="w-3.5 h-3.5" /> Admin
        </Link>
        <div className="flex items-center justify-between gap-3 mb-2">
          <h1 className="font-heading text-2xl font-bold text-paper">Maintenance plans</h1>
          <button onClick={load} aria-label="Refresh" className="text-mist hover:text-paper p-1.5">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <p className="text-sm text-mist mb-4">
          {active.length} active · {due.length} due for a reminder · {rows.length - active.length} unsubscribed. Reminders email automatically at 08:00 SAST.
        </p>
        {error && (
          <p className="text-sm text-orange flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4" /> {error}
          </p>
        )}
        <section className="bg-cardgrey border border-darkgrey rounded-card">
          {loading && !rows.length ? (
            <div className="py-10 flex justify-center">
              <Loader2 className="w-5 h-5 text-mist animate-spin" />
            </div>
          ) : rows.length ? (
            <ul className="divide-y divide-darkgrey">
              {rows.map((p) => {
                const wa = waLink(p.phone)
                const isDue = !p.unsubscribed_at && p.next_reminder_date <= today()
                return (
                  <li key={p.id} className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-paper font-semibold truncate">
                          {p.name} · {p.plan_name}
                        </p>
                        <p className="text-xs text-mist truncate">
                          {p.suburb ?? 'area not given'} · every {p.interval_months} months · {p.email}
                        </p>
                      </div>
                      {wa && (
                        <a href={wa} target="_blank" rel="noreferrer" aria-label="WhatsApp" className="text-whatsapp">
                          <MessageCircle className="w-4 h-4" />
                        </a>
                      )}
                      <span className={`text-[10px] uppercase tracking-wider border rounded px-2 py-0.5 ${p.unsubscribed_at ? 'text-mist border-darkgrey' : isDue ? 'text-orange border-orange' : 'text-whatsapp border-whatsapp'}`}>
                        {p.unsubscribed_at ? 'Unsubscribed' : isDue ? 'Due' : 'Active'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-xs text-mist flex-wrap">
                      <label className="inline-flex items-center gap-1.5">
                        Next visit due
                        <input
                          type="date"
                          defaultValue={p.next_reminder_date}
                          onBlur={(e) => e.target.value !== p.next_reminder_date && setDate(p.id, e.target.value)}
                          className="bg-jet border border-darkgrey rounded px-2 py-1 text-paper"
                        />
                      </label>
                      {p.last_reminded_at && <span>Last reminded {fmt(p.last_reminded_at)}</span>}
                      <button onClick={() => toggleUnsub(p)} className="ml-auto underline hover:text-paper">
                        {p.unsubscribed_at ? 'Resubscribe' : 'Unsubscribe'}
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="px-4 py-10 text-center text-sm text-mist">No plan sign-ups yet.</p>
          )}
        </section>
      </div>
    </main>
  )
}

export default function PlansPage() {
  return (
    <StaffGate title="Maintenance plans">
      <PlansList />
    </StaffGate>
  )
}
