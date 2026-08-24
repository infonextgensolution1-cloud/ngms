import Link from 'next/link'
import { services } from '@/lib/services'

export const metadata = {
  title: 'Our Services | NGMS',
  description:
    '12 trade services across Strand, Somerset West, Gordon’s Bay and the Helderberg Basin — one call, all solutions.',
}

export default function ServicesPage() {
  return (
    <main className="bg-white text-black">
      <section className="bg-jet text-white py-14 text-center px-4">
        <p className="text-orange font-semibold text-sm mb-2 uppercase tracking-wide">What We Do</p>
        <h1 className="text-3xl sm:text-5xl font-black">Everything Your Property Needs</h1>
        <p className="text-gray-400 max-w-xl mx-auto mt-4">
          One call covers 12 trade services across Strand, Somerset West, Gordon’s Bay and the Helderberg Basin.
        </p>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service) => (
          <Link
            key={service.slug}
            href={`/services/${service.slug}`}
            className="block border border-gray-200 rounded-2xl p-6 hover:border-orange hover:shadow-lg transition"
          >
            <h2 className="text-lg font-bold mb-1">{service.name}</h2>
            <p className="text-orange text-sm font-semibold mb-3">{service.tagline}</p>
            <p className="text-gray-600 text-sm">{service.description}</p>
            <span className="inline-block mt-4 text-sm font-semibold text-orange">Learn more &rarr;</span>
          </Link>
        ))}
      </section>

      <section className="bg-graphite text-white text-center py-12 px-4">
        <h2 className="text-2xl font-black mb-3">Not sure which service you need?</h2>
        <p className="text-gray-400 mb-6">Tell us what’s going on and we’ll point you the right way.</p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link href="/quote" className="bg-orange hover:bg-orange-dark text-white font-semibold px-6 py-3 rounded-full">
            Get a Free Quote
          </Link>
          <a href="https://wa.me/27631387945" className="border border-white text-white font-semibold px-6 py-3 rounded-full">
            WhatsApp NGMS
          </a>
        </div>
      </section>
    </main>
  )
}
