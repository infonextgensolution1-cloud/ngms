'use client'

import { useState } from 'react'
import { RECURRING_PACKAGES } from '@/lib/packages'
import { site } from '@/lib/site'

export default function PlanSignupForm() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')
  const [msg, setMsg] = useState('')

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('sending')
    const d = new FormData(e.currentTarget)
    try {
      const r = await fetch('/api/plan-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: d.get('name'), phone: d.get('phone'), email: d.get('email'), suburb: d.get('suburb'),
          plan: d.get('plan'), website: d.get('website'), consent: d.get('consent') === 'on',
        }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok || !j.ok) {
        setMsg(j.error || `Something went wrong. WhatsApp us on ${site.phoneDisplay}.`)
        return setStatus('error')
      }
      setStatus('done')
    } catch {
      setMsg(`Something went wrong. WhatsApp us on ${site.phoneDisplay}.`)
      setStatus('error')
    }
  }

  if (status === 'done') {
    return (
      <div className="max-w-md mx-auto text-center text-paper">
        <h3 className="font-heading text-xl font-bold">You&rsquo;re on the list!</h3>
        <p className="text-mist mt-2">We&rsquo;ll be in touch to confirm your first visit and will remind you when each service is due.</p>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3 max-w-md mx-auto text-left">
      <select name="plan" required className="field" defaultValue="">
        <option value="" disabled>Choose a plan</option>
        {RECURRING_PACKAGES.map((p) => (
          <option key={p.name} value={p.name}>{p.name} — {p.frequency} ({p.price})</option>
        ))}
      </select>
      <input required name="name" placeholder="Full name" className="field" />
      <input required name="phone" placeholder="Phone / WhatsApp" className="field" />
      <input required type="email" name="email" placeholder="Email (for reminders)" className="field" />
      <input name="suburb" placeholder="Suburb" className="field" />
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
      <label className="flex items-start gap-2 text-xs text-mist">
        <input required type="checkbox" name="consent" className="mt-0.5" />
        <span>I agree that NextGen may store my details and email me service reminders. I can unsubscribe at any time (POPIA).</span>
      </label>
      <button className="btn btn-quote" type="submit" disabled={status === 'sending'}>
        {status === 'sending' ? 'Sending...' : 'Sign up for this plan'}
      </button>
      {status === 'error' && <p className="text-orange text-sm text-center">{msg}</p>}
    </form>
  )
}
