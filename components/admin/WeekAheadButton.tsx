'use client'

import { useState } from 'react'
import { CalendarDays, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

/** Emails the owner this week's summary right now (it also goes out every Monday at 08:00). */
export default function WeekAheadButton() {
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  async function send() {
    setBusy(true)
    setMsg(null)
    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token
      const res = await fetch('/api/admin/week-ahead', { method: 'POST', headers: { Authorization: `Bearer ${token ?? ''}` } })
      const json = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string }
      if (!res.ok || !json.ok) throw new Error(json.error || 'Could not send it.')
      setMsg({ ok: true, text: 'Sent. Check your lead-notification inbox.' })
    } catch (e) {
      setMsg({ ok: false, text: (e as Error).message })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mb-6 flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={send}
        disabled={busy}
        className="inline-flex items-center gap-2 border border-darkgrey hover:border-blue text-paper text-sm font-heading font-semibold px-4 py-2.5 rounded-btn disabled:opacity-60"
      >
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarDays className="w-4 h-4" />} Email me the week ahead
      </button>
      {msg && (
        <span role="status" className={`text-sm ${msg.ok ? 'text-blue' : 'text-orange'}`}>
          {msg.text}
        </span>
      )}
    </div>
  )
}
