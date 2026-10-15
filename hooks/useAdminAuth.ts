import { useCallback, useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabaseClient'

/**
 * Admin session. If the signed-in user has two-step login (TOTP) set up but has only
 * entered their password so far, `session` stays null and `mfaPending` is true, so every
 * admin page treats them as signed out until the app code is entered on /admin.
 * Users with no authenticator set up are not affected.
 */
export function useAdminAuth() {
  const [raw, setRaw] = useState<Session | null>(null)
  const [mfaPending, setMfaPending] = useState(false)
  const [checking, setChecking] = useState(true)

  const evaluate = useCallback(async (s: Session | null) => {
    setRaw(s)
    if (!s) {
      setMfaPending(false)
      setChecking(false)
      return
    }
    const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
    setMfaPending(data?.nextLevel === 'aal2' && data.currentLevel !== 'aal2')
    setChecking(false)
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => evaluate(data.session))
    const { data: listener } = supabase.auth.onAuthStateChange((_e, newSession) => {
      // Defer: calling supabase auth methods inside this callback can deadlock.
      setTimeout(() => void evaluate(newSession), 0)
    })
    return () => listener.subscription.unsubscribe()
  }, [evaluate])

  const refresh = useCallback(async () => {
    const { data } = await supabase.auth.getSession()
    await evaluate(data.session)
  }, [evaluate])

  return { session: raw && !mfaPending ? raw : null, mfaPending, checking, refresh }
}
