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
    title: `${service.name} | NGMS`,
    description: service.description,
  }
}

export default function ServiceDetailPage({ params }: { params: { slug: string } }) {
  const service = getService(params.slug)
  if (!service) notFound()

  return (
    <main className="bg-white text-black">
      <section className="bg-jet text-white py-14 px-4 text-center">
        <p className="text-orange font-semibold text-sm uppercase tracking-wide mb-2">Service</p>
        <h1 className="text-3xl sm:text-5xl font-black">{service.name}</h1>
        <p className="text-gray-400 max-w-xl mx-auto mt-4">{service.tagline}</p>
      </section>

      <section className="max-w-3xl mx-auto px-4 py-14">
        <p className="text-gray-700 text-lg leading-relaxed">{service.description}</p>

        <div className="mt-10 grid sm:grid-cols-2 gap-4">
          <Link
            href="/quote"
            className="bg-orange hover:bg-orange-dark text-white font-semibold text-center px-6 py-4 rounded-full"
          >
            Get a Free Quote
          </Link>
          <a
            href="https://wa.me/27631387945"
            className="border border-black text-black font-semibold text-center px-6 py-4 rounded-full"
          >
            WhatsApp NGMS
          </a>
        </div>

        <p className="text-sm text-gray-500 mt-6">
          Serving Strand, Somerset West, Gordon’s Bay and the Helderberg Basin. See our{' '}
          <Link href="/price-list" className="text-orange font-semibold">
            price list
          </Link>{' '}
          for indicative rates, or request a site visit for an accurate quote.
        </p>
      </section>

      <section className="bg-graphite text-white text-center py-10 px-4">
        <Link href="/services" className="text-sm font-semibold text-gray-300 hover:text-orange">
          &larr; Back to all services
        </Link>
      </section>
    </main>
  )
}
