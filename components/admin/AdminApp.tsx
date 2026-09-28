'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CalendarDays, HardHat, Home, Plus, Users, WifiOff } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

const DATA_CACHE = 'ngms-admin-data' // must match public/admin-sw.js

const TABS = [
  { href: '/admin', label: 'Home', icon: Home, exact: true },
  { href: '/admin/leads', label: 'Leads', icon: Users },
  { href: '/admin/quotes/new', label: 'Quote', icon: Plus, primary: true },
  { href: '/admin/jobs', label: 'Jobs', icon: HardHat },
  { href: '/admin/calendar', label: 'Calendar', icon: CalendarDays },
]

/**
 * Wraps every /admin screen: installs the offline service worker, shows a bar
 * when there's no signal, wipes saved data on sign-out so a shared or lost
 * phone doesn't keep client details, hides the public site's footer and
 * WhatsApp button, and gives phones a bottom tab bar.
 */
export default function AdminApp({ children }: { children: React.ReactNode }) {
  const [offline, setOffline] = useState(false)
  const [signedIn, setSignedIn] = useState(false)
  const path = usePathname()
  // The quote builder has its own fixed Save bar at the bottom.
  const showTabs = signedIn && path !== '/admin/quotes/new'

  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/admin-sw.js').catch(() => {})
    }

    const update = () => setOffline(!navigator.onLine)
    update()
    window.addEventListener('online', update)
    window.addEventListener('offline', update)

    supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session))
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      setSignedIn(!!session)
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
      <style>{`[data-site-marketing]{display:none!important}
@media (max-width:639px){.admin-app button,.admin-app select{min-height:40px}}`}</style>
      {offline && (
        <div className="bg-orange text-jet text-xs font-semibold px-4 py-2 flex items-center justify-center gap-2">
          <WifiOff className="w-4 h-4 shrink-0" />
          No signal: showing saved copies. Changes need signal to save.
        </div>
      )}

      <div className={`admin-app ${showTabs ? 'pb-24 sm:pb-0' : ''}`}>{children}</div>

      {showTabs && (
        <nav
          aria-label="Admin"
          className="sm:hidden fixed inset-x-0 bottom-0 z-50 bg-jet/95 backdrop-blur border-t border-darkgrey grid grid-cols-5"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          {TABS.map(({ href, label, icon: Icon, exact, primary }) => {
            const active = exact ? path === href : path === href || path.startsWith(`${href}/`)
            return (
              <Link key={href} href={href} className="flex flex-col items-center justify-center gap-0.5 min-h-[60px] text-[11px]">
                {primary ? (
                  <span className="h-10 w-10 -mt-1 rounded-full bg-orange text-white flex items-center justify-center shadow-lg">
                    <Icon className="w-6 h-6" />
                  </span>
                ) : (
                  <Icon className={`w-6 h-6 ${active ? 'text-orange' : 'text-mist'}`} />
                )}
                <span className={active || primary ? 'text-paper font-semibold' : 'text-mist'}>{label}</span>
              </Link>
            )
          })}
        </nav>
      )}
    </>
  )
}
