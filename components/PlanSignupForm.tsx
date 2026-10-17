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
    setMsg('')
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
      <div className="max-w-md mx-auto text-center text-paper" role="status" aria-live="polite">
        <h3 className="font-heading text-xl font-bold">You&rsquo;re on the list!</h3>
        <p className="text-mist mt-2">We&rsquo;ll be in touch to confirm your first visit and will remind you when each service is due.</p>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3 max-w-md mx-auto text-left" aria-busy={status === 'sending'}>
      <label htmlFor="plan-signup-plan" className="grid gap-1 text-sm text-mist">
        <span>Maintenance plan <span aria-hidden="true">*</span></span>
        <select id="plan-signup-plan" name="plan" required className="field" defaultValue="">
          <option value="" disabled>Choose a plan</option>
          {RECURRING_PACKAGES.map((p) => (
            <option key={p.name} value={p.name}>{p.name} — {p.frequency} ({p.price})</option>
          ))}
        </select>
      </label>
      <label htmlFor="plan-signup-name" className="grid gap-1 text-sm text-mist">
        <span>Full name <span aria-hidden="true">*</span></span>
        <input id="plan-signup-name" required name="name" autoComplete="name" placeholder="Full name" className="field" />
      </label>
      <label htmlFor="plan-signup-phone" className="grid gap-1 text-sm text-mist">
        <span>Phone / WhatsApp <span aria-hidden="true">*</span></span>
        <input id="plan-signup-phone" required name="phone" type="tel" autoComplete="tel" placeholder="Phone / WhatsApp" className="field" />
      </label>
      <label htmlFor="plan-signup-email" className="grid gap-1 text-sm text-mist">
        <span>Email for reminders <span aria-hidden="true">*</span></span>
        <input id="plan-signup-email" required type="email" name="email" autoComplete="email" placeholder="Email (for reminders)" className="field" />
      </label>
      <label htmlFor="plan-signup-suburb" className="grid gap-1 text-sm text-mist">
        <span>Suburb</span>
        <input id="plan-signup-suburb" name="suburb" autoComplete="address-level2" placeholder="Suburb" className="field" />
      </label>
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
      <label className="flex items-start gap-2 text-sm text-mist">
        <input required type="checkbox" name="consent" className="mt-0.5" />
        <span>I agree that NextGen may store my details and email me service reminders. I can unsubscribe at any time. See our <a href="/privacy" className="underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">privacy policy</a> (POPIA).</span>
      </label>
      <button className="btn btn-quote" type="submit" disabled={status === 'sending'} aria-disabled={status === 'sending'}>
        {status === 'sending' ? 'Sending...' : 'Sign up for this plan'}
      </button>
      {status === 'error' && <p className="text-orange text-sm text-center" role="alert" aria-live="assertive">{msg}</p>}
    </form>
  )
}
