import { notFound } from 'next/navigation'
import Link from 'next/link'
import { services, getService } from '@/lib/services'

export function generateStaticParams() {
  return services.map((service) => ({ slug: service.slug }))
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const service = getService(params.slug)
  if (!service) return {}
  return {
    title: service.metaTitle,
    description: service.metaDescription,
  }
}

export default function ServiceDetailPage({ params }: { params: { slug: string } }) {
  const service = getService(params.slug)
  if (!service) notFound()

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: service.name,
    name: `${service.name} | NextGen Solar & Maintenance Solutions`,
    description: service.metaDescription,
    areaServed: ['Strand', 'Gordon’s Bay', 'Somerset West', 'Helderberg Basin'],
    provider: {
      '@type': 'LocalBusiness',
      name: 'NextGen Solar & Maintenance Solutions',
      telephone: '+27631387945',
      email: 'info.nextgensolution1@gmail.com',
      areaServed: 'Helderberg Basin, Western Cape, South Africa',
    },
  }

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: service.faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  }

  return (
    <main className="bg-jet">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <section className="bg-jet text-white py-14 px-4 text-center">
        <p className="text-blue font-bold text-sm uppercase tracking-wide mb-2 font-heading">Service</p>
        <h1 className="font-heading text-3xl sm:text-5xl font-bold text-paper">{service.name}</h1>
        <p className="text-mist max-w-xl mx-auto mt-4">{service.tagline}</p>
      </section>

      <section className="bg-graphite border-y border-darkgrey">
        <div className="max-w-3xl mx-auto px-4 py-14">
          <p className="text-mist text-lg leading-relaxed">{service.description}</p>

          <div className="mt-10 grid sm:grid-cols-2 gap-4">
            <Link
              href="/quote"
              className="bg-whatsapp hover:bg-whatsapp-dark text-white font-heading font-semibold text-center px-6 py-4 rounded-btn"
            >
              Get a Free Quote
            </Link>
            <a
              href="https://wa.me/27631387945"
              className="border border-mist text-paper font-heading font-semibold text-center px-6 py-4 rounded-btn hover:border-blue hover:text-blue"
            >
              WhatsApp NGSMS
            </a>
          </div>

          <p className="text-sm text-mist mt-6 opacity-80">
            Serving Strand, Somerset West, Gordon’s Bay and the Helderberg Basin. See our{' '}
            <Link href="/price-list" className="text-orange font-semibold">
              price list
            </Link>{' '}
            for indicative rates, or request a site visit for an accurate quote.
          </p>
        </div>
      </section>

      <section className="bg-jet py-14">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="font-heading text-2xl font-bold text-paper mb-6">What&apos;s Included</h2>
          <ul className="space-y-3">
            {service.whatsIncluded.map((item) => (
              <li key={item} className="flex gap-3 text-mist">
                <span className="text-whatsapp mt-0.5">&#10003;</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-graphite py-14 border-t border-darkgrey">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="font-heading text-2xl font-bold text-paper mb-6">Common Questions</h2>
          <div className="space-y-4">
            {service.faqs.map((faq) => (
              <details key={faq.question} className="bg-cardgrey border border-darkgrey rounded-card p-5 group">
                <summary className="font-heading font-semibold text-paper cursor-pointer list-none flex items-center justify-between">
                  {faq.question}
                  <span className="text-orange ml-4 group-open:rotate-45 transition-transform">+</span>
                </summary>
                <p className="text-mist mt-3 text-sm leading-relaxed">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-jet text-white text-center py-10 px-4">
        <Link href="/services" className="text-sm font-semibold text-mist hover:text-orange">
          &larr; Back to all services
        </Link>
      </section>
    </main>
  )
}
