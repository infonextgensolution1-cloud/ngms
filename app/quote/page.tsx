'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'

export default function AdminLink() {
  const [signedIn, setSignedIn] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSignedIn(!!data.session)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSignedIn(!!session)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  return (
    <Link
      href="/admin"
      className="text-xs text-mist opacity-50 hover:opacity-100 hover:text-blue transition-opacity"
    >
      {signedIn ? 'Admin Dashboard' : 'Staff Login'}
    </Link>
  )
}
