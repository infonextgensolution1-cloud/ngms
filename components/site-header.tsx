'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { WhatsAppIcon } from '@/lib/icons'
import { LOGO_DATA_URI } from '@/lib/logo'
import { SITE, whatsappLink } from '@/lib/site'

const WHATSAPP_URL = whatsappLink()

// Primary navigation — kept short so it fits on one line at xl. Secondary pages
// (gallery, FAQ, ROI calculator, about) live in the footer and the mobile menu.
const LINKS = [
  { href: '/services', label: 'Services' },
  { href: '/solar-panel-cleaning/helderberg', label: 'Solar cleaning' },
  { href: '/maintenance-packages', label: 'Maintenance plans' },
  { href: '/body-corporate-maintenance', label: 'Body corporates' },
  { href: '/portfolio', label: 'Projects' },
  { href: '/price-list', label: 'Prices' },
  { href: '/contact', label: 'Contact' },
]

const MORE_LINKS = [
  { href: '/gallery', label: 'Gallery' },
  { href: '/roi-calculator', label: 'Solar ROI calculator' },
  { href: '/faq', label: 'FAQ' },
  { href: '/about', label: 'About' },
]

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + '/')
}

export function SiteHeader() {
  const pathname = usePathname() ?? '/'
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close the mobile menu on navigation and on Escape.
  useEffect(() => setOpen(false), [pathname])
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <header
      className={`bg-jet/90 backdrop-blur-md text-white sticky top-0 z-50 border-b transition-shadow duration-300 ${
        scrolled ? 'border-darkgrey shadow-lg shadow-black/40' : 'border-white/5'
      }`}
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between px-4 gap-3 h-16 lg:h-[4.5rem]">
        <Link href="/" className="flex items-center shrink-0" aria-label={`${SITE.shortName} — home`}>
          <img src={LOGO_DATA_URI} alt="" width={160} height={56} className="h-11 lg:h-14 w-auto" />
        </Link>

        <nav aria-label="Main" className="hidden xl:flex items-center gap-1 text-[0.8rem] font-medium whitespace-nowrap">
          {LINKS.map((l) => {
            const active = isActive(pathname, l.href)
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? 'page' : undefined}
                className={`px-2.5 py-2 rounded-btn transition-colors ${
                  active ? 'text-paper bg-white/5' : 'text-mist hover:text-paper hover:bg-white/5'
                }`}
              >
                {l.label}
              </Link>
            )
          })}
        </nav>

        <div className="flex items-center gap-2">
          <a
            href={`tel:${SITE.phone}`}
            className="hidden md:inline-flex items-center px-3 py-2 text-sm font-semibold text-paper hover:text-blue transition-colors"
          >
            {SITE.phoneDisplay}
          </a>
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="WhatsApp NextGen"
            className="hidden sm:grid h-10 w-10 place-items-center rounded-btn text-whatsapp hover:bg-white/5"
          >
            <WhatsAppIcon className="h-6 w-6" />
          </a>
          <Link href="/quote" className="btn-quote !text-xs !px-4 !py-2.5 hidden sm:inline-flex">
            Get a quote
          </Link>

          <button
            type="button"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((v) => !v)}
            className="xl:hidden flex flex-col justify-center items-center gap-1.5 h-11 w-11 shrink-0 rounded-btn hover:bg-white/5"
          >
            <span className={`block h-0.5 w-6 bg-white transition ${open ? 'rotate-45 translate-y-2' : ''}`} />
            <span className={`block h-0.5 w-6 bg-white transition ${open ? 'opacity-0' : ''}`} />
            <span className={`block h-0.5 w-6 bg-white transition ${open ? '-rotate-45 -translate-y-2' : ''}`} />
          </button>
        </div>
      </div>

      {open && (
        // Scrolls inside itself so every link (and the quote button) stays reachable on short phone screens.
        <nav
          id="mobile-nav"
          aria-label="Mobile"
          className="xl:hidden border-t border-darkgrey px-4 pt-4 pb-6 flex flex-col text-base font-medium max-h-[calc(100dvh-4rem)] overflow-y-auto overscroll-contain"
        >
          <div className="grid grid-cols-2 gap-2 mb-3">
            <Link href="/quote" className="btn-quote">Get a quote</Link>
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="btn-wa">WhatsApp</a>
          </div>
          {[{ href: '/', label: 'Home' }, ...LINKS, ...MORE_LINKS].map((l) => {
            const active = l.href === '/' ? pathname === '/' : isActive(pathname, l.href)
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center min-h-12 border-b border-darkgrey/60 ${active ? 'text-blue' : 'text-paper hover:text-blue'}`}
              >
                {l.label}
              </Link>
            )
          })}
          <a href={`tel:${SITE.phone}`} className="mt-4 text-mist">
            Call <span className="text-paper font-semibold">{SITE.phoneDisplay}</span> · Mon–Sat 07:00–19:00
          </a>
        </nav>
      )}
    </header>
  )
}
