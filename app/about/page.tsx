export const metadata = { alternates: { canonical: '/about' },
  title: 'About Us | NextGen Solar Clean & Maintenance',
  description:
    'NextGen Solar Clean & Maintenance Solutions — solar panel cleaning first, backed by multi-trade property maintenance across the Helderberg Basin, Western Cape.',
}

export default function AboutPage() {
  return (
    <main className="bg-jet">
      <section className="bg-jet text-white py-10 sm:py-14 px-4 text-center">
        <p className="text-blue font-bold text-sm uppercase tracking-wide mb-2 font-heading">About NextGen</p>
        <h1 className="font-heading text-4xl sm:text-6xl font-bold text-paper">
          Solar panel cleaning first. Every other trade behind it.
        </h1>
        <p className="text-mist text-lg max-w-xl mx-auto mt-4">
          Multi-trade property maintenance for the Helderberg Basin — Strand, Gordon’s Bay and Somerset West.
        </p>
      </section>

      <section className="bg-graphite py-10 sm:py-14 px-4 border-y border-darkgrey">
        <div className="max-w-3xl mx-auto bg-cardgrey border border-darkgrey rounded-card p-6 sm:p-8 text-mist text-base sm:text-lg leading-relaxed">
          <p>
            NextGen Solar Clean &amp; Maintenance Solutions is a Helderberg-based contractor built around solar
            panel cleaning. Painting, waterproofing, paving, plumbing, electrical, pool lining, high-pressure
            cleaning, rubble removal, steelwork and handyman work sit behind it. Homeowners, body corporates,
            security complexes and light commercial clients get one call, one quote and one person accountable for
            the job.
          </p>
        </div>
      </section>

      <section className="bg-jet py-10 sm:py-14">
        <div className="max-w-4xl mx-auto px-4">
          <p className="text-blue font-bold text-sm mb-6 uppercase tracking-wide text-center font-heading">Meet the Owner</p>
          <div className="border-t-4 border-orange bg-cardgrey rounded-card overflow-hidden flex flex-col sm:flex-row items-center sm:items-start p-6 sm:p-8 gap-6 sm:gap-8">
            <img
              src="/jacques-gordon.webp"
              alt="Jacques Gordon, owner and project manager of NextGen Solar Clean & Maintenance"
              width={720}
              height={900}
              loading="lazy"
              className="w-32 sm:w-36 aspect-[4/5] object-cover object-top rounded-card flex-shrink-0"
            />
            <div className="space-y-4 text-mist text-base sm:text-lg leading-relaxed text-center sm:text-left">
              <div>
                <p className="font-heading font-semibold text-2xl text-paper">Jacques Gordon</p>
                <p className="text-sm text-orange font-semibold uppercase tracking-wide">Owner &amp; Project Manager</p>
              </div>
              <p>
                Jacques founded NextGen to give property owners one reliable contractor to call. Solar panel cleaning
                is the core of the business, backed by painting, waterproofing, paving, plumbing, electrical work
                and more.
              </p>
              <p>
                Before NextGen he worked as a foreman at Liebcon Construction. He still leads every job hands-on,
                from the quote to the finished work.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-graphite py-10 sm:py-14 px-4 border-t border-darkgrey text-center">
        <p className="text-blue font-bold text-sm uppercase tracking-wide mb-3 font-heading">Where We Work</p>
        <p className="text-paper text-lg font-semibold max-w-2xl mx-auto">
          Strand, Gordon’s Bay and Somerset West.
        </p>
        <p className="text-mist text-base max-w-2xl mx-auto mt-2">
          We also cover the Overberg, Stellenbosch, Paarl, Worcester and Cape Town, with a R350 callout fee
          outside the Helderberg Basin.
        </p>
      </section>

      <section className="bg-jet text-white text-center py-12 px-4 border-t border-darkgrey">
        <h2 className="font-heading text-2xl font-bold mb-3 text-paper">Ready to get started?</h2>
        <div className="flex gap-4 justify-center flex-wrap mt-4">
          <a href="/quote" className="btn-glow font-heading font-semibold px-6 py-3 rounded-btn">
            Get a Free Quote
          </a>
          <a href="https://wa.me/27631387945" className="btn-wa">
            WhatsApp NextGen
          </a>
        </div>
      </section>
    </main>
  )
}
