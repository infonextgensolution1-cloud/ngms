'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { supabase } from '@/lib/supabaseClient'
import { Loader2, Image as ImageIcon, LogOut } from 'lucide-react'

// Read-only view of the same 'site-visitors' presence channel the public
// site tracks itself into (see components/VisitorPresence.tsx). This tab
// never calls channel.track() itself, so it never counts as a visitor.
function LiveVisitors() {
  const [state, setState] = useState<Record<string, { path?: string }[]>>({})

  useEffect(() => {
    const channel = supabase.channel('site-visitors')
    channel
      .on('presence', { event: 'sync' }, () => {
        setState(channel.presenceState() as Record<string, { path?: string }[]>)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const entries = Object.values(state).flat()
  const count = entries.length

  return (
    <div className="bg-cardgrey border border-darkgrey rounded-card p-6 mb-6">
      <div className="flex items-center gap-2 mb-2">
        <span className={`h-2 w-2 rounded-full ${count > 0 ? 'bg-whatsapp animate-pulse' : 'bg-darkgrey'}`} />
        <p className="font-heading font-bold text-paper">
          {count} {count === 1 ? 'person' : 'people'} on the site right now
        </p>
      </div>
      {entries.length > 0 && (
        <ul className="text-sm text-mist space-y-1 mt-2">
          {entries.map((e, i) => (
            <li key={i}>{e.path || '/'}</li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function AdminPage() {
  const { session, checking } = useAdminAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [signingIn, setSigningIn] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSigningIn(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    setSigningIn(false)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
  }

  if (checking) {
    return (
      <main className="min-h-[60vh] flex items-center justify-center bg-jet">
        <Loader2 className="w-6 h-6 text-mist animate-spin" />
      </main>
    )
  }

  if (!session) {
    return (
      <main className="min-h-[70vh] flex items-center justify-center bg-jet px-4 py-16">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-sm bg-cardgrey border border-darkgrey rounded-card p-8 space-y-4"
        >
          <h1 className="font-heading text-2xl font-bold text-paper mb-1">Staff Login</h1>
          <p className="text-sm text-mist mb-4">NGSMS admin — hero slides, before/after &amp; gallery.</p>

          <div>
            <label className="block text-sm font-bold mb-1 text-paper font-heading">Email</label>
            <input
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-jet border border-darkgrey text-paper rounded-btn px-4 py-3 focus:outline-none focus:border-blue"
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1 text-paper font-heading">Password</label>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-jet border border-darkgrey text-paper rounded-btn px-4 py-3 focus:outline-none focus:border-blue"
            />
          </div>

          {error && <p className="text-sm text-orange">{error}</p>}

          <button
            type="submit"
            disabled={signingIn}
            className="w-full bg-blue hover:bg-blue-dark text-white font-heading font-semibold px-6 py-3 rounded-btn disabled:opacity-50 inline-flex items-center justify-center gap-2"
          >
            {signingIn && <Loader2 className="w-4 h-4 animate-spin" />}
            {signingIn ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </main>
    )
  }

  return (
    <main className="min-h-[70vh] bg-jet px-4 py-16">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-heading text-2xl font-bold text-paper">Admin Dashboard</h1>
            <p className="text-sm text-mist">{session.user.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-sm text-mist hover:text-orange inline-flex items-center gap-1"
          >
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>

        <LiveVisitors />

        <Link
          href="/admin/media"
          className="flex items-center gap-4 bg-cardgrey border border-darkgrey rounded-card p-6 hover:border-blue transition"
        >
          <div className="h-12 w-12 shrink-0 rounded-btn bg-jet flex items-center justify-center text-orange">
            <ImageIcon className="w-6 h-6" />
          </div>
          <div>
            <p className="font-heading font-bold text-paper">Media</p>
            <p className="text-sm text-mist">Manage hero slides, before/after pairs &amp; the gallery</p>
          </div>
        </Link>
      </div>
    </main>
  )
}
