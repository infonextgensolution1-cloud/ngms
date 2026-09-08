import Link from 'next/link'

export type SolarLandingProps = {
  town: string
  areaLine: string
  heading: string
  intro: string
  nearby: string[]
}

const tiers = [
  { size: 'Up to 10 panels', price: 'from R550' },
  { size: '11–20 panels', price: 'from R950' },
  { size: '21–30 panels', price: 'from R1 350' },
  { size: '31–40 panels', price: 'from R1 700' },
  { size: '41+ panels', price: 'from R50/panel' },
]

const faqs = [
  {
    q: 'How often should solar panels be cleaned?',
    a: 'Every 4–6 months for most Helderberg homes. Coastal salt, summer wind-blown dust and spring pollen build up faster here than inland, and that film costs you output before you notice it.',
  },
  {
    q: 'Will cleaning damage my panels?',
    a: 'No. We use purified water and soft-brush methods — no harsh chemicals, no abrasive pads, no high pressure on the panel face. Safe for all major panel brands.',
  },
  {
    q: 'Do you charge a callout fee?',
    a: 'Not in Strand, Gordon’s Bay or Somerset West. Outside that zone it’s a flat R350.',
  },
  {
    q: 'Do you clean commercial and farm installations?',
    a: 'Yes. Larger systems are quoted after a site visit, with volume pricing from R50/panel on 41+ panel arrays.',
  },
]

export default function SolarLandingPage({ town, areaLine, heading, intro, nearby }: SolarLandingProps) {
  return (
    <main className="bg-jet">
      <section className="bg-jet text-white py-14 text-center px-4">
        <p className="text-blue font-bold text-sm mb-2 uppercase tracking-wide font-heading">Solar Panel Cleaning</p>
        <h1 className="font-heading text-3xl sm:text-5xl font-bold text-paper max-w-3xl mx-auto">{heading}</h1>
        <p className="text-mist text-lg max-w-2xl mx-auto mt-4">{intro}</p>
        <div className="flex gap-4 justify-center flex-wrap mt-8">
          <a
            href="https://wa.me/27631387945"
            className="bg-orange hover:bg-orange-dark text-white font-heading font-semibold px-6 py-3 rounded-btn"
          >
            WhatsApp for a Fast Quote
          </a>
          <Link
            href="/quote?service=solar-panel-cleaning"
            className="border border-mist text-paper font-heading font-semibold px-6 py-3 rounded-btn hover:border-blue hover:text-blue"
          >
            Book a Site Visit
          </Link>
        </div>
        <p className="text-xs tracking-widest text-mist uppercase mt-8">{areaLine}</p>
      </section>

      <section className="bg-graphite py-14 border-y border-darkgrey px-4">
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-cardgrey border border-darkgrey rounded-card p-6">
            <h2 className="font-heading text-lg font-semibold mb-2 text-paper">Eco-friendly &amp; streak-free</h2>
            <p className="text-mist text-sm">
              Purified water and soft-brush cleaning that lifts salt, dust, pollen and bird droppings without
              harsh chemicals or panel damage.
            </p>
          </div>
          <div className="bg-cardgrey border border-darkgrey rounded-card p-6">
            <h2 className="font-heading text-lg font-semibold mb-2 text-paper">Local {town} team</h2>
            <p className="text-mist text-sm">
              We work this coastline every week — we know what the southeaster and the salt air do to a roof in{' '}
              {town}, and how fast output drops because of it.
            </p>
          </div>
          <div className="bg-cardgrey border border-darkgrey rounded-card p-6">
            <h2 className="font-heading text-lg font-semibold mb-2 text-paper">Clear, upfront pricing</h2>
            <p className="text-mist text-sm">
              Tiered per-system pricing with no callout fee inside the Helderberg zone. You know the number
              before we arrive.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-jet py-14 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-paper mb-2">
            Solar cleaning prices in {town}
          </h2>
          <p className="text-mist text-sm mb-6">
            All prices exclude VAT. No callout fee in Strand, Gordon’s Bay or Somerset West — flat R350 outside
            that zone.
          </p>
          <div className="overflow-x-auto rounded-card border border-darkgrey">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-graphite text-left">
                  <th className="px-4 py-3 font-heading font-semibold text-paper">System size</th>
                  <th className="px-4 py-3 font-heading font-semibold text-paper">Price</th>
                </tr>
              </thead>
              <tbody>
                {tiers.map((t) => (
                  <tr key={t.size} className="border-t border-darkgrey bg-cardgrey">
                    <td className="px-4 py-3 text-mist">{t.size}</td>
                    <td className="px-4 py-3 font-bold text-orange">{t.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-mist text-sm mt-4">
            On a maintenance plan (every 4–6 months) you get <span className="text-orange font-bold">15% off</span>{' '}
            every clean plus priority booking.
          </p>
        </div>
      </section>

      <section className="bg-graphite py-14 border-y border-darkgrey px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-paper mb-6">Common questions</h2>
          <div className="space-y-4">
            {faqs.map((f) => (
              <div key={f.q} className="bg-cardgrey border border-darkgrey rounded-card p-5">
                <h3 className="font-heading font-semibold text-paper mb-2">{f.q}</h3>
                <p className="text-mist text-sm">{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-jet py-12 px-4 text-center">
        <h2 className="font-heading text-xl font-bold text-paper mb-3">Where we work</h2>
        <p className="text-mist text-sm max-w-2xl mx-auto">{nearby.join(' · ')}</p>
      </section>

      <section className="bg-graphite text-center py-12 px-4 border-t border-darkgrey">
        <h2 className="font-heading text-2xl font-bold mb-3 text-paper">
          Getting less out of your system than you used to?
        </h2>
        <p className="text-mist text-lg mb-6">
          Send us a photo of your roof on WhatsApp and we’ll come back with a price.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link
            href="/quote?service=solar-panel-cleaning"
            className="bg-orange hover:bg-orange-dark text-white font-heading font-semibold px-6 py-3 rounded-btn"
          >
            Get a Free Quote
          </Link>
          <a
            href="https://wa.me/27631387945"
            className="border border-mist text-paper font-heading font-semibold px-6 py-3 rounded-btn hover:border-blue hover:text-blue"
          >
            WhatsApp NGSMS
          </a>
        </div>
      </section>
    </main>
  )
}
