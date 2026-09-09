import { notFound } from 'next/navigation'
import { solarLocations, getSolarLocation } from '@/lib/solar-locations'
import { getService } from '@/lib/services'

export function generateStaticParams() {
  return solarLocations.map((l) => ({ location: l.slug }))
}

export function generateMetadata({ params }: { params: { location: string } }) {
  const loc = getSolarLocation(params.location)
  if (!loc) return {}
  return {
    title: loc.metaTitle,
    description: loc.metaDescription,
  }
}

const tiers = [
  { size: 'Up to 10 panels', price: 'from R550' },
  { size: '11–20 panels', price: 'from R950' },
  { size: '21–30 panels', price: 'from R1 350' },
  { size: '31–40 panels', price: 'from R1 700' },
  { size: '41+ panels', price: 'from R50/panel' },
]

export default function SolarLocationPage({
  params,
}: {
  params: { location: string }
}) {
  const loc = getSolarLocation(params.location)
  if (!loc) notFound()

  const solar = getService('solar-panel-cleaning')

  return (
    <main className="max-w-4xl mx-auto px-4 py-12">
      <p className="text-orange font-semibold text-sm uppercase tracking-wide mb-2">
        Solar Panel Cleaning
      </p>
      <h1 className="text-3xl sm:text-4xl font-black mb-4">{loc.heading}</h1>
      <p className="text-lg text-gray-300 mb-6">{loc.intro}</p>

      <div className="flex gap-3 flex-wrap mb-10">
        <a
          href="https://wa.me/27631387945"
          className="bg-eco text-white font-semibold px-6 py-3 rounded-full"
        >
          WhatsApp for a fast quote
        </a>
        <a
          href="/quote?service=solar-panel-cleaning"
          className="bg-orange hover:bg-orange-dark text-white font-semibold px-6 py-3 rounded-full"
        >
          Book a site visit
        </a>
      </div>

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-3">
          Why panels get dirty faster in {loc.town}
        </h2>
        <p className="text-gray-300">{loc.localAngle}</p>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-3">What&apos;s included</h2>
        <ul className="space-y-2 text-gray-300">
          {solar?.whatsIncluded.map((item) => (
            <li key={item} className="flex gap-2">
              <span className="text-orange">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-3">Pricing</h2>
        <div className="overflow-x-auto rounded-lg border border-gray-700">
          <table className="w-full text-sm">
            <tbody>
              {tiers.map((t) => (
                <tr key={t.size} className="border-t border-gray-800 first:border-t-0">
                  <td className="px-4 py-2">{t.size}</td>
                  <td className="px-4 py-2 font-semibold text-orange">{t.price}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-sm text-gray-400 mt-3">
          {loc.callout ? (
            <span className="text-orange font-semibold">{loc.callout} </span>
          ) : (
            <>No callout fee in Strand, Gordon&apos;s Bay or Somerset West. </>
          )}
          Maintenance plan (every 4–6 months) gets 15% off with priority booking. Prices
          exclude VAT.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-3">Common questions</h2>
        <div className="space-y-4">
          {solar?.faqs.map((faq) => (
            <div key={faq.question}>
              <p className="font-semibold mb-1">{faq.question}</p>
              <p className="text-gray-300 text-sm">{faq.answer}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-gray-800 pt-6">
        <h2 className="text-lg font-bold mb-2">Areas we cover near {loc.town}</h2>
        <p className="text-gray-400 text-sm mb-4">{loc.nearby.join(' · ')}</p>
        <p className="text-gray-400 text-sm">
          Also serving:{' '}
          {solarLocations
            .filter((l) => l.slug !== loc.slug)
            .map((l, i, arr) => (
              <span key={l.slug}>
                <a href={`/solar-panel-cleaning/${l.slug}`} className="text-orange underline">
                  {l.town}
                </a>
                {i < arr.length - 1 ? ' · ' : ''}
              </span>
            ))}
        </p>
      </section>
    </main>
  )
}
