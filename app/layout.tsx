import type { Metadata, Viewport } from 'next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Analytics } from '@vercel/analytics/next'
import Link from 'next/link'
import { Inter, Poppins } from 'next/font/google'
import { FacebookIcon, WhatsAppIcon } from '@/lib/icons'
import { LOGO_DATA_URI } from '@/lib/logo'
import { SITE, whatsappLink } from '@/lib/site'
import { services } from '@/lib/services'
import { SiteHeader } from '@/components/site-header'
import { getBusinessHours, hoursLabel, hoursDayNames, type BusinessHours } from '@/lib/business-hours'
import AdminLink from '@/components/AdminLink'
import VisitorPresence from '@/components/VisitorPresence'
import ClickTracking from '@/components/ClickTracking'
import PWARegister from '@/components/PWARegister'
import './globals.css'

// Solar Forge type system: Inter for body/UI, Poppins for display headings.
// Exposed as CSS variables that tailwind.config.ts maps to font-body / font-heading.
const bodyFont = Inter({ subsets: ['latin'], variable: '--font-body', display: 'swap' })
const headingFont = Poppins({ subsets: ['latin'], weight: ['500', '600', '700', '800'], variable: '--font-heading', display: 'swap' })

const FACEBOOK_URL = 'https://www.facebook.com/p/Nextgen-Solar-Maintenance-Solutions-61590183304623/'
const WHATSAPP_URL = whatsappLink()

const SITE_TITLE = 'NextGen Solar Clean & Maintenance Solutions | Helderberg'
const SITE_DESCRIPTION =
  'Solar panel cleaning, painting, waterproofing, paving, plumbing, electrical and property maintenance across Strand, Gordon’s Bay and Somerset West. One call. All solutions.'

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: SITE_TITLE, template: '%s | NextGen' },
  description: SITE_DESCRIPTION,
  applicationName: SITE.shortName,
  generator: 'Next.js',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    siteName: SITE.name,
    locale: 'en_ZA',
    type: 'website',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'NextGen Solar Clean & Maintenance Solutions — One Call. All Solutions.' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ['/opengraph-image'],
  },
  icons: {
    icon: [{ url: '/admin-app/icon-192.png', sizes: '192x192', type: 'image/png' }],
    apple: '/admin-app/apple-touch-icon.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#0A0A0A',
  colorScheme: 'dark',
}

const localBusinessJsonLd = (hours: BusinessHours) => ({
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
  address: { '@type': 'PostalAddress', addressLocality: 'Strand', addressRegion: 'Western Cape', addressCountry: 'ZA' },
  areaServed: SITE.serviceAreas.map((name) => ({ '@type': 'Place', name: `${name}, Western Cape` })),
  openingHoursSpecification: [{ '@type': 'OpeningHoursSpecification', dayOfWeek: hoursDayNames(hours.days), opens: hours.open, closes: hours.close }],
  contactPoint: [{ '@type': 'ContactPoint', telephone: SITE.phone, contactType: 'customer service', areaServed: 'ZA' }],
  sameAs: [FACEBOOK_URL],
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'Property maintenance services',
    itemListElement: services.map((s) => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name: s.name, url: `${SITE.url}/services/${s.slug}` } })),
  },
})

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const hours = await getBusinessHours()
  return (
    <html lang="en-ZA" className={`font-body ${bodyFont.variable} ${headingFont.variable}`}>
      <body className="bg-jet font-body">
        <a href="#main-content" className="skip-link">Skip to content</a>
        <PWARegister />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd(hours)) }} />
        <VisitorPresence />
        <ClickTracking />
        <SiteHeader hours={hoursLabel(hours)} />
        <div id="main-content" tabIndex={-1} className="outline-none">
          {children}
        </div>
        <footer data-site-marketing className="bg-jet text-mist text-sm border-t border-darkgrey">
          <div className="border-b border-darkgrey">
            <div className="max-w-6xl mx-auto px-4 py-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <p className="font-heading font-bold text-2xl sm:text-3xl text-paper uppercase tracking-tight">One call. <span className="text-blue">All solutions.</span></p>
                <p className="text-mist mt-1">Property maintenance across Strand, Gordon&rsquo;s Bay and Somerset West.</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link href="/quote" className="btn-quote">Get a quote</Link>
                <a href={WHATSAPP_URL} className="btn-wa" target="_blank" rel="noopener noreferrer">WhatsApp</a>
              </div>
            </div>
          </div>
          <div className="max-w-6xl mx-auto px-4 pt-10 sm:pt-12 pb-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
            <div>
              <img src={LOGO_DATA_URI} alt={`${SITE.name} logo`} width={160} height={48} className="h-12 w-auto mb-4" />
              <p>Multi-trade property maintenance for homes, body corporates, security complexes and light commercial properties.</p>
              <div className="flex items-center gap-1 mt-3 -ml-2">
                <a href={FACEBOOK_URL} aria-label="NextGen on Facebook" className="text-facebook hover:opacity-80 p-2.5" target="_blank" rel="noopener noreferrer"><FacebookIcon className="h-7 w-7" /></a>
                <a href={WHATSAPP_URL} aria-label="WhatsApp NextGen" className="text-whatsapp hover:opacity-80 p-2.5" target="_blank" rel="noopener noreferrer"><WhatsAppIcon className="h-7 w-7" /></a>
              </div>
            </div>
            <nav aria-label="Services">
              <p className="font-heading font-semibold text-paper mb-4 uppercase tracking-wide text-xs">Services</p>
              <ul className="grid grid-cols-1 gap-x-3">
                {services.map((s) => <li key={s.slug}><Link href={`/services/${s.slug}`} className="hover:text-blue inline-flex items-center min-h-10 sm:min-h-0 sm:py-1">{s.name}</Link></li>)}
              </ul>
            </nav>
            <nav aria-label="Quick links">
              <p className="font-heading font-semibold text-paper mb-4 uppercase tracking-wide text-xs">Company</p>
              <ul className="grid grid-cols-2 sm:grid-cols-1 gap-x-3">
                {[['/portfolio', 'Projects'], ['/gallery', 'Gallery'], ['/price-list', 'Price list'], ['/maintenance-packages', 'Maintenance plans'], ['/body-corporate-maintenance', 'Body corporates'], ['/roi-calculator', 'Solar ROI calculator'], ['/about', 'About'], ['/faq', 'FAQ'], ['/contact', 'Contact'], ['/portal', 'Client portal']].map(([href, label]) => <li key={href}><Link href={href} className="hover:text-blue inline-flex items-center min-h-10 sm:min-h-0 sm:py-1">{label}</Link></li>)}
              </ul>
            </nav>
            <div>
              <p className="font-heading font-semibold text-paper mb-4 uppercase tracking-wide text-xs">Contact</p>
              <ul className="space-y-1">
                <li><a href={`tel:${SITE.phone}`} className="text-paper font-semibold hover:text-blue inline-block py-2 sm:py-1">{SITE.phoneDisplay}</a></li>
                <li className="break-all"><a href={`mailto:${SITE.email}`} className="hover:text-blue inline-block py-2 sm:py-1">{SITE.email}</a></li>
                <li>{hoursLabel(hours).replace(/–/g, '\u2013')}</li>
                <li className="pt-2">Strand &middot; Gordon&rsquo;s Bay &middot; Somerset West</li>
                <li>Also serving the Overberg, Stellenbosch, Paarl, Worcester and Cape Town</li>
                <li className="text-paper">R350 callout fee outside the Helderberg</li>
              </ul>
            </div>
          </div>
          <div className="max-w-6xl mx-auto px-4 pb-24 sm:pb-8 pt-6 border-t border-darkgrey text-xs flex flex-wrap items-center justify-between gap-3">
            <span className="opacity-80">&copy; {new Date().getFullYear()} {SITE.name}. All rights reserved.</span>
            <span className="flex flex-wrap gap-x-5">
              <Link href="/terms" className="hover:text-blue inline-flex items-center min-h-10 sm:min-h-0 sm:py-1">Terms &amp; Conditions</Link>
              <Link href="/privacy" className="hover:text-blue inline-flex items-center min-h-10 sm:min-h-0 sm:py-1">Privacy Policy (POPIA)</Link>
            </span>
            <AdminLink />
          </div>
        </footer>
        <a data-site-marketing href={WHATSAPP_URL} aria-label="WhatsApp NextGen" target="_blank" rel="noopener noreferrer" className="fixed z-50 flex items-center justify-center h-12 w-12 sm:h-14 sm:w-14" style={{ bottom: 'calc(1rem + env(safe-area-inset-bottom))', right: 'calc(1rem + env(safe-area-inset-right))' }}>
          <span aria-hidden className="absolute inset-0 rounded-full bg-whatsapp animate-wa-ping" />
          <span className="relative flex items-center justify-center h-12 w-12 sm:h-14 sm:w-14 rounded-full shadow-lg bg-whatsapp"><WhatsAppIcon className="h-6 w-6 sm:h-7 sm:w-7 text-white" /></span>
        </a>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  )
}