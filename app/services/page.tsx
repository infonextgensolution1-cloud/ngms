import Link from 'next/link'
import ServiceGrid from '@/components/ServiceGrid'
import Calculators from '@/components/Calculators'

export const metadata = {
  title: 'Our Services | NGSMS',
  description:
    'Solar panel cleaning specialists plus 11 more trades across Strand, Somerset West, Gordon’s Bay and the Helderberg Basin — one call, all solutions.',
}

export default function ServicesPage() {
  return (
    <main className="bg-jet">
      <section className="bg-jet text-white py-14 text-center px-4">
        <p className="text-blue font-bold text-sm mb-2 uppercase tracking-wide font-heading">What We Do</p>
        <h1 className="font-heading text-4xl sm:text-6xl font-bold text-paper">Everything Your Property Needs</h1>
        <p className="text-mist text-lg max-w-xl mx-auto mt-4">
          Solar panel cleaning is what we’re known for — and one call covers 11 more trades
          across Strand, Somerset West, Gordon’s Bay and the Helderberg Basin.
        </p>
      </section>

      <section className="bg-graphite py-14 border-y border-darkgrey">
        <div className="max-w-6xl mx-auto px-4">
          <ServiceGrid />
        </div>
      </section>

      <section className="bg-jet border-b border-darkgrey">
        <Calculators />
      </section>

      <section className="bg-jet text-white text-center py-12 px-4">
        <h2 className="font-heading text-2xl font-bold mb-3 text-paper">Not sure which service you need?</h2>
        <p className="text-mist text-lg mb-6">Tell us what’s going on and we’ll point you the right way.</p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link href="/quote" className="bg-orange hover:bg-orange-dark text-white font-heading font-semibold px-6 py-3 rounded-btn">
            Get a Free Quote
          </Link>
          <a href="https://wa.me/27631387945" className="border border-mist text-paper font-heading font-semibold px-6 py-3 rounded-btn hover:border-blue hover:text-blue">
            WhatsApp NGSMS
          </a>
        </div>
      </section>
    </main>
  )
}
