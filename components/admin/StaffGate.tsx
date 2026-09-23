'use client'

import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { useAdminAuth } from '@/hooks/useAdminAuth'

/** Shows children only to a signed-in staff member; otherwise a link to /admin to sign in. */
export default function StaffGate({ title, children }: { title: string; children: React.ReactNode }) {
  const { session, checking } = useAdminAuth()

  if (checking) {
    return (
      <main className="min-h-[60vh] flex items-center justify-center bg-jet">
        <Loader2 className="w-6 h-6 text-mist animate-spin" />
      </main>
    )
  }

  if (!session) {
    return (
      <main className="min-h-[60vh] flex items-center justify-center bg-jet px-4 py-16">
        <div className="w-full max-w-sm bg-cardgrey border border-darkgrey rounded-card p-8 text-center">
          <h1 className="font-heading text-2xl font-bold text-paper mb-2">{title}</h1>
          <p className="text-sm text-mist mb-6">Staff only. Sign in, then come back here.</p>
          <Link href="/admin" className="inline-block bg-blue hover:bg-blue-dark text-white font-heading font-semibold px-6 py-3 rounded-btn">
            Staff login
          </Link>
        </div>
      </main>
    )
  }

  return <>{children}</>
}
