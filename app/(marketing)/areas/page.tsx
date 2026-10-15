import Link from 'next/link'
import type { Metadata } from 'next'
import { SUBURBS } from '@/lib/suburbs'
import { services } from '@/lib/services'
import { SOLAR_SUBURB_TO_LOCATION } from '@/lib/solar-pricing'
import { NOINDEX_SERVICE_SLUGS } from '@/lib/area-seo'
import { SITE } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Areas We Serve: Strand, Gordon’s Bay, Somerset West & the Overberg',
  description:
    'NextGen Solar Clean & Maintenance Solutions serves Strand, Gordon’s Bay and Somerset West with free callouts, and Kleinmond, Grabouw, Elgin and Bot River on our Overberg run.',
  alternates: { canonical: '/areas' },
}

// Area hubs that exist as their own pages today.
const HUB_SLUGS = new Set(['strand', 'gordons-bay', 'somerset-west'])

export default function AreasPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Areas we serve',
    url: `${SITE.url}/areas`,
    mainEntity: {
      '@type': 'LocalBusiness',
      name: SITE.name,
      telephone: SITE.phone,
      email: SITE.email,
      areaServed: SUBURBS.map((s) => ({ '@type': 'Place', name: `${s.name}, Western Cape, South Africa` })),
    },
  }

  const linkedServices = services.filter((s) => !NOINDEX_SERVICE_SLUGS.includes(s.slug))
  const areaHref = (serviceSlug: string, suburbSlug: string) =>
    serviceSlug === 'solar-panel-cleaning' && SOLAR_SUBURB_TO_LOCATION[suburbSlug]
      ? `/solar-panel-cleaning/${SOLAR_SUBURB_TO_LOCATION[suburbSlug]}`
      : `/services/${serviceSlug}/${suburbSlug}`

  return (
    <section>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="bg-graphite border-b border-line py-14 px-4 text-center">
        <p className="kicker">Where we work</p>
        <h1 className="text-3xl md:text-5xl">Areas we serve</h1>
        <p className="text-mist mt-3 max-w-xl mx-auto">
          Free callouts in the Helderberg Basin. We also run regularly to the Overberg for a R350 callout.
        </p>
      </div>

      <div className="wrap max-w-[860px] py-10 space-y-6">
        {SUBURBS.map((sub) => {
          const isHelderberg = sub.region === 'Helderberg Basin'
          return (
            <div key={sub.slug} id={sub.slug} className="card">
              <p className="kicker !mb-1">{sub.region}</p>
              <h2 className="text-2xl">{sub.name}</h2>
              <p className="text-mist leading-relaxed mt-2">{sub.blurb}</p>
              <p className="text-orange text-sm font-semibold mt-2">{sub.calloutNote}</p>

              {isHelderberg ? (
                <>
                  {HUB_SLUGS.has(sub.slug) && (
                    <p className="mt-3">
                      <Link href={`/property-maintenance/${sub.slug}`} className="text-blue font-bold">
                        Property maintenance in {sub.name} &rarr;
                      </Link>
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2 mt-4">
                    {linkedServices.map((s) => (
                      <Link
                        key={s.slug}
                        href={areaHref(s.slug, sub.slug)}
                        className="text-sm px-3 py-1.5 rounded-full border border-line text-mist hover:border-orange hover:text-orange transition-colors"
                      >
                        {s.name}
                      </Link>
                    ))}
                  </div>
                </>
              ) : (
                <p className="mt-4">
                  <Link href={`/quote?area=${encodeURIComponent(sub.name)}`} className="btn-quote">
                    Get a quote for {sub.name}
                  </Link>
                </p>
              )}
            </div>
          )
        })}

        <div className="card text-center">
          <h2 className="text-xl">Not on the list?</h2>
          <p className="text-mist mt-2">
            We also serve Stellenbosch, Paarl, Worcester and Cape Town. Send us the address and we&rsquo;ll confirm the callout.
          </p>
          <p className="mt-4">
            <Link href="/quote" className="btn-quote">
              Get a quote
            </Link>
          </p>
        </div>
      </div>
    </section>
  )
}
