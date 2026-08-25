'use client'

import { useState } from 'react'
import Link from 'next/link'
import { FacebookIcon, WhatsAppIcon } from '@/lib/icons'
import { LOGO_DATA_URI } from '@/lib/logo'

const FACEBOOK_URL = 'https://www.facebook.com/p/Nextgen-Solar-Maintenance-Solutions-61590183304623/'
const WHATSAPP_URL = 'https://wa.me/27631387945'

const LINKS = [
  { href: '/', label: 'Home' },
  { href: '/services', label: 'Services' },
  { href: '/portfolio', label: 'Projects' },
  { href: '/gallery', label: 'Gallery' },
  { href: '/price-list', label: 'Catalog' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
]

export function SiteHeader() {
  const [open, setOpen] = useState(false)

  return (
    <header className="bg-jet text-white sticky top-0 z-50 border-b border-darkgrey">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-2 gap-3">
        <Link href="/" className="flex items-center shrink-0" onClick={() => setOpen(false)}>
          <img src={LOGO_DATA_URI} alt="NGSMS logo" className="h-16 lg:h-20 w-auto" />
        </Link>

        <nav className="hidden lg:flex items-center gap-6 text-base font-semibold font-heading uppercase tracking-wide">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="text-mist hover:text-orange">
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-4">
          <a href={FACEBOOK_URL} aria-label="NGSMS on Facebook" className="text-blue hover:opacity-80">
            <FacebookIcon className="h-7 w-7" />
          </a>
          <a href={WHATSAPP_URL} aria-label="WhatsApp NGSMS" className="text-whatsapp hover:opacity-80">
            <WhatsAppIcon className="h-7 w-7" />
          </a>
          <Link
            href="/quote"
            className="bg-whatsapp hover:bg-whatsapp-dark text-white font-bold text-xs px-4 py-2.5 rounded-btn uppercase"
          >
            Get A Quote
          </Link>
        </div>

        <button
          type="button"
          aria-label="Toggle menu"
          onClick={() => setOpen((v) => !v)}
          className="lg:hidden flex flex-col justify-center items-center gap-1.5 h-11 w-11 shrink-0"
        >
          <span className={`block h-0.5 w-6 bg-white transition ${open ? 'rotate-45 translate-y-2' : ''}`} />
          <span className={`block h-0.5 w-6 bg-white transition ${open ? 'opacity-0' : ''}`} />
          <span className={`block h-0.5 w-6 bg-white transition ${open ? '-rotate-45 -translate-y-2' : ''}`} />
        </button>
      </div>

      {open && (
        <nav className="lg:hidden border-t border-darkgrey px-4 py-5 flex flex-col gap-5 text-base font-semibold font-heading uppercase tracking-wide">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="text-mist hover:text-orange">
              {l.label}
            </Link>
          ))}
          <div className="flex items-center gap-5 pt-1">
            <a href={FACEBOOK_URL} aria-label="NGSMS on Facebook" className="text-blue">
              <FacebookIcon className="h-7 w-7" />
            </a>
            <a href={WHATSAPP_URL} aria-label="WhatsApp NGSMS" className="text-whatsapp">
              <WhatsAppIcon className="h-7 w-7" />
            </a>
          </div>
          <Link
            href="/quote"
            onClick={() => setOpen(false)}
            className="bg-whatsapp hover:bg-whatsapp-dark text-white font-bold text-sm px-4 py-3 rounded-btn text-center"
          >
            Get A Quote
          </Link>
        </nav>
      )}
    </header>
  )
}
