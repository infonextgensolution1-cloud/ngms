'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import type { RealtimeChannel } from '@supabase/supabase-js'

// Tracks "currently on the site" using Supabase Realtime Presence — no
// database writes, no cookies, nothing stored. Presence disappears the
// moment the tab closes or the connection drops. Paired with the
// LiveVisitors widget on /admin.

export default function VisitorPresence() {
  const pathname = usePathname()
  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    const key = Math.random().toString(36).slice(2)
    const channel = supabase.channel('site-visitors', {
      config: { presence: { key } },
    })
    channelRef.current = channel

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        channel.track({ path: window.location.pathname, since: new Date().toISOString() })
      }
    })

    return () => {
      supabase.removeChannel(channel)
      channelRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    channelRef.current?.track({ path: pathname, since: new Date().toISOString() })
  }, [pathname])

  return null
}
