import type { Metadata } from 'next'
import { Oswald, Inter } from 'next/font/google'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Analytics } from '@vercel/analytics/next'
import Link from 'next/link'
import { FacebookIcon, WhatsAppIcon } from '@/lib/icons'
import { LOGO_DATA_URI } from '@/lib/logo'
import { SITE } from '@/lib/site'
import { services } from '@/lib/services'
import { SiteHeader } from '@/components/site-header'
import AdminLink from '@/components/AdminLink'
import VisitorPresence from '@/components/VisitorPresence'
import ClickTracking from '@/components/ClickTracking'
import './globals.css'

const oswald = Oswald({ subsets: ['latin'], weight: ['500', '600', '700'], variable: '--font-oswald' })
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-inter' })

const FACEBOOK_URL = 'https://www.facebook.com/p/Nextgen-Solar-Maintenance-Solutions-61590183304623/'
const WHATSAPP_URL = 'https://wa.me/27631387945'

const SITE_TITLE = 'NextGen Solar Clean & Maintenance Solutions | Solar Cleaning, Pressure Cleaning & Handyman Helderberg'
const SITE_DESCRIPTION =
  'Professional solar panel cleaning, pressure cleaning, painting, waterproofing, plumbing, electrical & handyman services in Strand, Gordon’s Bay & Somerset West. Reliable local team. Free quotes.'

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  openGraph: {
    title: SITE_TITLE,
    description: 'One call, all solutions — solar panel cleaning and multi-trade property maintenance across the Helderberg Basin.',
    siteName: SITE.name,
    locale: 'en_ZA',
    type: 'website',
  },
  twitter: { card: 'summary_large_image' },
}

// LocalBusiness structured data — helps Google show NGSMS in Maps / local results.
const LOCAL_BUSINESS_JSONLD = {
  '@context': 'https://schema.org',
  '@type': 'HomeAndConstructionBusiness',
  '@id': `${SITE.url}/#business`,
  name: SITE.name,
  alternateName: SITE.shortName,
  url: SITE.url,
  logo: `${SITE.url}/opengraph-image`,
  image: `${SITE.url}/opengraph-image`,
  telephone: SITE.phone,
  email: SITE.email,
  slogan: 'One Call. All Solutions.',
  priceRange: 'R550+',
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Strand',
    addressRegion: 'Western Cape',
    addressCountry: 'ZA',
  },
  areaServed: SITE.serviceAreas.map((name) => ({ '@type': 'Place', name: `${name}, Western Cape` })),
  openingHoursSpecification: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      opens: '07:00',
      closes: '18:00',
    },
  ],
  contactPoint: [
    { '@type': 'ContactPoint', telephone: SITE.phone, contactType: 'customer service', areaServed: 'ZA' },
    { '@type': 'ContactPoint', telephone: '+27627007509', contactType: 'reservations', areaServed: 'ZA' },
  ],
  sameAs: [FACEBOOK_URL],
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'Property maintenance services',
    itemListElement: services.map((s) => ({
      '@type': 'Offer',
      itemOffered: { '@type': 'Service', name: s.name, url: `${SITE.url}/services/${s.slug}` },
    })),
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${oswald.variable} ${inter.variable}`}>
      <body className="bg-jet font-body">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(LOCAL_BUSINESS_JSONLD) }}
        />
        <VisitorPresence />
        <ClickTracking />
        <SiteHeader />

        {children}

        <div className="bg-graphite border-t border-darkgrey py-10 text-center px-4">
          <p className="font-heading font-bold text-2xl sm:text-3xl text-paper">
            ONE CALL. <span className="text-orange">ALL SOLUTIONS.</span>
          </p>
          <p className="text-mist text-sm uppercase tracking-widest font-semibold mt-2">
            Across the Helderberg Basin
          </p>
        </div>

        <footer className="bg-jet text-mist text-sm pt-14 pb-8 border-t border-darkgrey">
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
                <li><Link href="/maintenance-packages" className="hover:text-orange">Maintenance Packages</Link></li>
                <li><Link href="/roi-calculator" className="hover:text-orange">ROI Calculator</Link></li>
                <li><Link href="/about" className="hover:text-orange">About</Link></li>
                <li><Link href="/faq" className="hover:text-orange">FAQ</Link></li>
                <li><Link href="/contact" className="hover:text-orange">Contact</Link></li>
              </ul>
            </div>

            <div>
              <p className="font-heading font-bold text-paper mb-4 uppercase tracking-wide">Contact Us</p>
              <ul className="space-y-2">
                <li>
                  <a href="tel:+27631387945" className="hover:text-orange">063 138 7945</a>
                </li>
                <li>
                  Bookings:{' '}
                  <a href="tel:+27627007509" className="hover:text-orange">062 700 7509</a>
                </li>
                <li className="break-all">
                  <a href="mailto:info.nextgensolution1@gmail.com" className="hover:text-orange">
                    info.nextgensolution1@gmail.com
                  </a>
                </li>
                <li>Strand &middot; Gordon’s Bay &middot; Somerset West</li>
                <li>Mon &ndash; Sat: 07:00 &ndash; 18:00</li>
              </ul>
            </div>
          </div>

          <div className="max-w-6xl mx-auto px-4 mt-10 pt-6 border-t border-darkgrey text-xs flex flex-wrap items-center justify-between gap-3">
            <span className="opacity-70">
              &copy; {new Date().getFullYear()} NextGen Solar Clean &amp; Maintenance Solutions. All rights reserved.
            </span>
            <AdminLink />
          </div>
        </footer>

        <a
          href={WHATSAPP_URL}
          aria-label="WhatsApp NGSMS"
          className="fixed bottom-5 right-5 z-50 flex items-center justify-center h-14 w-14"
        >
          <span aria-hidden className="absolute inset-0 rounded-full bg-whatsapp animate-wa-ping" />
          <span className="relative flex items-center justify-center h-14 w-14 rounded-full shadow-lg bg-whatsapp">
            <WhatsAppIcon className="h-7 w-7 text-white" />
          </span>
        </a>

        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  )
}
