import type { Metadata } from 'next'
import { Oswald, Inter } from 'next/font/google'
import Link from 'next/link'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { FacebookIcon, WhatsAppIcon } from '@/lib/icons'
import { LOGO_DATA_URI } from '@/lib/logo'
import { services } from '@/lib/services'
import { SiteHeader } from '@/components/site-header'
import './globals.css'

const oswald = Oswald({ subsets: ['latin'], weight: ['500', '600', '700'], variable: '--font-oswald' })
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-inter' })

const FACEBOOK_URL = 'https://www.facebook.com/p/Nextgen-Solar-Maintenance-Solutions-61590183304623/'
const WHATSAPP_URL = 'https://wa.me/27631387945'

export const metadata: Metadata = {
  title: 'NextGen Solar & Maintenance Solutions | Solar Cleaning, Pressure Cleaning & Handyman Helderberg',
  description:
    'Professional solar panel cleaning, pressure cleaning, painting, waterproofing, plumbing, electrical & handyman services in Strand, Gordon’s Bay & Somerset West. Reliable local team. Free quotes.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${oswald.variable} ${inter.variable}`}>
      <body className="bg-jet font-body">
        <SiteHeader />

        {children}

        <footer className="bg-jet text-mist text-sm pt-14 pb-8 mt-10 border-t border-darkgrey">
          <div className="max-w-6xl mx-auto px-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
            <div>
              <img src={LOGO_DATA_URI} alt="NGSMS logo" className="h-12 w-auto mb-4" />
              <p className="text-mist">
                Professional property maintenance across the Helderberg Basin. Quality work, done safely and
                properly.
              </p>
              <div className="flex items-center gap-4 mt-5">
                <a href={FACEBOOK_URL} aria-label="NGSMS on Facebook" className="text-blue hover:opacity-80">
                  <FacebookIcon className="h-7 w-7" />
                </a>
                <a href={WHATSAPP_URL} aria-label="WhatsApp NGSMS" className="text-whatsapp hover:opacity-80">
                  <WhatsAppIcon className="h-7 w-7" />
                </a>
              </div>
            </div>

            <div>
              <p className="font-heading font-bold text-paper mb-4 uppercase tracking-wide">Our Services</p>
              <ul className="space-y-2 uppercase text-xs tracking-wide font-semibold">
                {services.slice(0, 5).map((s) => (
                  <li key={s.slug}>
                    <Link href={`/services/${s.slug}`} className="hover:text-orange">{s.name}</Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="font-heading font-bold text-paper mb-4 uppercase tracking-wide">Quick Links</p>
              <ul className="space-y-2 uppercase text-xs tracking-wide font-semibold">
                <li><Link href="/" className="hover:text-orange">Home</Link></li>
                <li><Link href="/services" className="hover:text-orange">Services</Link></li>
                <li><Link href="/portfolio" className="hover:text-orange">Projects</Link></li>
                <li><Link href="/gallery" className="hover:text-orange">Gallery</Link></li>
                <li><Link href="/price-list" className="hover:text-orange">Catalog</Link></li>
                <li><Link href="/about" className="hover:text-orange">About</Link></li>
                <li><Link href="/contact" className="hover:text-orange">Contact</Link></li>
              </ul>
            </div>

            <div>
              <p className="font-heading font-bold text-paper mb-4 uppercase tracking-wide">Contact Us</p>
              <ul className="space-y-2">
                <li>063 138 7945</li>
                <li className="break-all">info.nextgensolution1@gmail.com</li>
                <li>Strand &middot; Gordon’s Bay &middot; Somerset West</li>
                <li>Mon &ndash; Sat: 07:00 &ndash; 18:00</li>
              </ul>
            </div>
          </div>

          <div className="max-w-6xl mx-auto px-4 mt-10 pt-6 border-t border-darkgrey text-xs opacity-70">
            &copy; {new Date().getFullYear()} NextGen Solar &amp; Maintenance Solutions. All rights reserved.
          </div>
        </footer>

        <a
          href={WHATSAPP_URL}
          aria-label="WhatsApp NGSMS"
          className="fixed bottom-5 right-5 z-50 flex items-center justify-center h-14 w-14 rounded-full shadow-lg bg-whatsapp"
        >
          <WhatsAppIcon className="h-7 w-7 text-white" />
        </a>
        <SpeedInsights />
      </body>
    </html>
  )
}
