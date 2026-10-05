'use client'

import { useEffect, useState } from 'react'
import { Loader2, ShieldCheck } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

type Enrol = { factorId: string; qr: string; secret: string }

/** Dashboard card: turn two-step login on or off with an authenticator app (TOTP). */
export default function MfaSetup() {
  const [verifiedId, setVerifiedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [enrol, setEnrol] = useState<Enrol | null>(null)
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  async function load() {
    const { data } = await supabase.auth.mfa.listFactors()
    setVerifiedId(data?.totp?.find((f) => f.status === 'verified')?.id ?? null)
    setLoading(false)
  }
  useEffect(() => {
    void load()
  }, [])

  async function start() {
    setBusy(true)
    setMsg(null)
    try {
      // Clear any half-finished enrolment from an earlier attempt.
      const { data: existing } = await supabase.auth.mfa.listFactors()
      const stale = (existing?.all ?? []).filter((f) => f.factor_type === 'totp' && f.status === 'unverified')
      for (const f of stale) await supabase.auth.mfa.unenroll({ factorId: f.id })
      const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp', friendlyName: `NGMS admin ${new Date().toISOString().slice(0, 10)}` })
      if (error || !data || data.type !== 'totp') throw error ?? new Error('Could not start setup.')
      setEnrol({ factorId: data.id, qr: data.totp.qr_code, secret: data.totp.secret })
    } catch (e) {
      setMsg({ ok: false, text: (e as Error).message })
    } finally {
      setBusy(false)
    }
  }

  async function confirm(e: React.FormEvent) {
    e.preventDefault()
    if (!enrol) return
    setBusy(true)
    setMsg(null)
    try {
      const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: enrol.factorId, code: code.trim() })
      if (error) throw error
      setEnrol(null)
      setCode('')
      setMsg({ ok: true, text: 'Two-step login is on. You will be asked for a code each time you sign in.' })
      await load()
    } catch (err) {
      setMsg({ ok: false, text: (err as Error).message || 'That code did not work.' })
    } finally {
      setBusy(false)
    }
  }

  if (loading) return null

  return (
    <div className="bg-cardgrey border border-darkgrey rounded-card p-6 mb-6">
      <div className="flex items-center gap-2 mb-1">
        <ShieldCheck className={`w-5 h-5 ${verifiedId ? 'text-blue' : 'text-orange'}`} />
        <p className="font-heading font-bold text-paper">Two-step login: {verifiedId ? 'on' : 'required'}</p>
      </div>

      {!enrol && !verifiedId && (
        <>
          <p className="text-sm text-mist mb-3">
            Staff data (clients, quotes, payroll) is only available with a 6-digit code from an authenticator app (Google Authenticator,
            Microsoft Authenticator, Authy). Set it up now to get access.
          </p>
          <button onClick={start} disabled={busy} className="bg-blue-fill hover:bg-blue-dark text-white text-sm font-heading font-semibold px-4 py-2.5 rounded-btn disabled:opacity-60 inline-flex items-center gap-2">
            {busy && <Loader2 className="w-4 h-4 animate-spin" />} Set up two-step login
          </button>
        </>
      )}

      {enrol && (
        <form onSubmit={confirm} className="space-y-3 mt-2">
          <p className="text-sm text-mist">1. Scan this with your authenticator app.</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={enrol.qr} alt="QR code for your authenticator app" className="bg-white p-2 rounded-btn w-44 h-44" />
          <p className="text-xs text-mist break-all">
            Can&rsquo;t scan? Enter this key instead: <span className="text-paper font-mono">{enrol.secret}</span>
          </p>
          <p className="text-sm text-mist">2. Type the 6-digit code it shows to finish.</p>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            required
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            aria-label="6-digit code"
            className="w-40 bg-jet border border-darkgrey text-paper text-center text-xl tracking-[0.3em] rounded-btn px-3 py-2 focus:outline-none focus:border-blue"
          />
          <div className="flex gap-2">
            <button type="submit" disabled={busy || code.length !== 6} className="bg-blue-fill hover:bg-blue-dark text-white text-sm font-heading font-semibold px-4 py-2.5 rounded-btn disabled:opacity-60">
              Turn on
            </button>
            <button type="button" onClick={() => { setEnrol(null); setCode('') }} className="text-sm text-mist hover:text-orange px-3">
              Cancel
            </button>
          </div>
        </form>
      )}

      {verifiedId && !enrol && (
        <p className="text-sm text-mist">
          Required for all staff. Your data is only available after you enter the code from your authenticator app. Lost your phone?
          Remove the old authenticator in Supabase (Auth → Users → your user → Factors), sign in with your password, and set it up again here.
        </p>
      )}

      {msg && (
        <p role="status" className={`text-sm mt-3 ${msg.ok ? 'text-blue' : 'text-orange'}`}>
          {msg.text}
        </p>
      )}
    </div>
  )
}
