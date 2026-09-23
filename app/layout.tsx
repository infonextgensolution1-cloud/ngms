import type { Metadata, Viewport } from 'next'
import { Big_Shoulders_Display, IBM_Plex_Sans } from 'next/font/google'
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

// Ember Grid typography — Big Shoulders Display (headings) + IBM Plex Sans (body)
const heading = Big_Shoulders_Display({ subsets: ['latin'], weight: ['600', '700', '800'], variable: '--font-heading' })
const body = IBM_Plex_Sans({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-body' })

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

// Mobile-first: full-width viewport, dark browser chrome on Android, and draw under the notch / home bar
// (safe-area insets keep the floating WhatsApp button clear of them).
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#0A0A0A',
  colorScheme: 'dark',
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
    <html lang="en" className={`${heading.variable} ${body.variable}`}>
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

        <footer className="bg-jet text-mist text-sm pt-10 sm:pt-14 pb-24 sm:pb-8 border-t border-darkgrey">
          <div className="max-w-6xl mx-auto px-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
            <div>
              <img src={LOGO_DATA_URI} alt="NGSMS logo" className="h-12 w-auto mb-4" />
              <p className="text-mist">
                Professional property maintenance across the Helderberg Basin. Quality work, done safely and
                properly.
              </p>
              <div className="flex items-center gap-1 mt-3 -ml-2">
                <a href={FACEBOOK_URL} aria-label="NGSMS on Facebook" className="text-blue hover:opacity-80 p-2.5">
                  <FacebookIcon className="h-7 w-7" />
                </a>
                <a href={WHATSAPP_URL} aria-label="WhatsApp NGSMS" className="text-whatsapp hover:opacity-80 p-2.5">
                  <WhatsAppIcon className="h-7 w-7" />
                </a>
              </div>
            </div>

            <div>
              <p className="font-heading font-bold text-paper mb-4 uppercase tracking-wide">Our Services</p>
              <ul className="uppercase text-xs tracking-wide font-semibold">
                {services.slice(0, 5).map((s) => (
                  <li key={s.slug}>
                    <Link href={`/services/${s.slug}`} className="hover:text-orange inline-flex items-center min-h-10 sm:min-h-0 sm:py-1">{s.name}</Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="font-heading font-bold text-paper mb-4 uppercase tracking-wide">Quick Links</p>
              {/* Two columns on phones keeps the footer short while every link stays a full-size tap target */}
              <ul className="grid grid-cols-2 sm:grid-cols-1 gap-x-3 uppercase text-xs tracking-wide font-semibold">
                {[
                  ['/', 'Home'],
                  ['/services', 'Services'],
                  ['/portfolio', 'Projects'],
                  ['/gallery', 'Gallery'],
                  ['/price-list', 'Catalog'],
                  ['/maintenance-packages', 'Maintenance Packages'],
                  ['/roi-calculator', 'ROI Calculator'],
                  ['/about', 'About'],
                  ['/faq', 'FAQ'],
                  ['/contact', 'Contact'],
                ].map(([href, label]) => (
                  <li key={href}>
                    <Link href={href} className="hover:text-orange inline-flex items-center min-h-10 sm:min-h-0 sm:py-1">{label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="font-heading font-bold text-paper mb-4 uppercase tracking-wide">Contact Us</p>
              <ul className="space-y-1">
                <li>
                  <a href="tel:+27631387945" className="hover:text-orange inline-block py-2 sm:py-1">063 138 7945</a>
                </li>
                <li>
                  Bookings:{' '}
                  <a href="tel:+27627007509" className="hover:text-orange inline-block py-2 sm:py-1">062 700 7509</a>
                </li>
                <li className="break-all">
                  <a href="mailto:info.nextgensolution1@gmail.com" className="hover:text-orange inline-block py-2 sm:py-1">
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
          className="fixed z-50 flex items-center justify-center h-12 w-12 sm:h-14 sm:w-14"
          style={{ bottom: 'calc(1rem + env(safe-area-inset-bottom))', right: 'calc(1rem + env(safe-area-inset-right))' }}
        >
          <span aria-hidden className="absolute inset-0 rounded-full bg-whatsapp animate-wa-ping" />
          <span className="relative flex items-center justify-center h-12 w-12 sm:h-14 sm:w-14 rounded-full shadow-lg bg-whatsapp">
            <WhatsAppIcon className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
          </span>
        </a>

        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  )
}
