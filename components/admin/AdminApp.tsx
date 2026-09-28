'use client'

import { useEffect, useState } from 'react'
import { WifiOff } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

const DATA_CACHE = 'ngms-admin-data' // must match public/admin-sw.js

/**
 * Wraps every /admin screen: installs the offline service worker, shows a bar
 * when there's no signal, and wipes saved data on sign-out so a shared or lost
 * phone doesn't keep client details after you log out.
 */
export default function AdminApp({ children }: { children: React.ReactNode }) {
  const [offline, setOffline] = useState(false)

  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/admin-sw.js').catch(() => {})
    }

    const update = () => setOffline(!navigator.onLine)
    update()
    window.addEventListener('online', update)
    window.addEventListener('offline', update)

    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT' && 'caches' in window) caches.delete(DATA_CACHE).catch(() => {})
    })

    return () => {
      window.removeEventListener('online', update)
      window.removeEventListener('offline', update)
      data.subscription.unsubscribe()
    }
  }, [])

  return (
    <>
      {offline && (
        <div className="sticky top-0 z-50 bg-orange text-jet text-xs font-semibold px-4 py-2 flex items-center justify-center gap-2">
          <WifiOff className="w-4 h-4 shrink-0" />
          No signal: showing saved copies. Changes need signal to save.
        </div>
      )}
      {children}
    </>
  )
}
