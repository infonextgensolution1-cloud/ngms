'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

/** Second step of staff login: the 6-digit code from the authenticator app. */
export default function MfaChallenge({ onDone }: { onDone: () => void }) {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const { data: factors, error: listErr } = await supabase.auth.mfa.listFactors()
      if (listErr) throw listErr
      const factor = factors?.totp?.find((f) => f.status === 'verified')
      if (!factor) throw new Error('No authenticator is set up on this account.')
      const { error: verifyErr } = await supabase.auth.mfa.challengeAndVerify({ factorId: factor.id, code: code.trim() })
      if (verifyErr) throw verifyErr
      onDone()
    } catch (err) {
      setError((err as Error).message || 'That code did not work. Try the latest one.')
      setCode('')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="min-h-[70vh] flex items-center justify-center bg-jet px-4 py-16">
      <form onSubmit={submit} className="w-full max-w-sm bg-cardgrey border border-darkgrey rounded-card p-8 space-y-4">
        <h1 className="font-heading text-2xl font-bold text-paper mb-1">Two-step login</h1>
        <p className="text-sm text-mist">Open your authenticator app and enter the 6-digit code for NGMS.</p>
        <input
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]{6}"
          maxLength={6}
          required
          autoFocus
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
          aria-label="6-digit code"
          className="w-full bg-jet border border-darkgrey text-paper text-center text-2xl tracking-[0.4em] rounded-btn px-4 py-3 focus:outline-none focus:border-blue"
        />
        {error && <p role="alert" className="text-sm text-orange">{error}</p>}
        <button
          type="submit"
          disabled={busy || code.length !== 6}
          className="w-full bg-blue-fill hover:bg-blue-dark text-white font-heading font-semibold px-6 py-3 rounded-btn disabled:opacity-50 inline-flex items-center justify-center gap-2"
        >
          {busy && <Loader2 className="w-4 h-4 animate-spin" />}
          Verify
        </button>
        <button type="button" onClick={() => supabase.auth.signOut()} className="w-full text-sm text-mist hover:text-orange">
          Cancel and sign out
        </button>
      </form>
    </main>
  )
}
