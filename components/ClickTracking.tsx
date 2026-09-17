'use client'

import { useEffect } from 'react'
import { track } from '@vercel/analytics'

// Site-wide click tracking for the CTAs that actually matter to the
// business: WhatsApp taps, phone calls, and quote-page visits. One
// listener on the whole document — no need to touch every button/link
// across the site individually, and it keeps working on new pages too.

export default function ClickTracking() {
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const link = (e.target as HTMLElement)?.closest('a')
      if (!link) return
      const href = link.getAttribute('href') || ''
      const path = window.location.pathname

      if (href.includes('wa.me')) {
        track('whatsapp_click', { path })
      } else if (href.startsWith('tel:')) {
        track('call_click', { path })
      } else if (href === '/quote' || href.startsWith('/quote?') || href.startsWith('/quote#')) {
        track('quote_link_click', { path })
      }
    }

    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])

  return null
}
