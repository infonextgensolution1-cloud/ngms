export const metadata = {
  title: 'About Us | NGSMS',
  description:
    'NextGen Solar & Maintenance Solutions — a multi-trade property maintenance contractor based in the Helderberg Basin, Western Cape.',
}

export default function AboutPage() {
  return (
    <main className="bg-jet">
      <section className="bg-jet text-white py-10 sm:py-14 px-4 text-center">
        <p className="text-blue font-bold text-sm uppercase tracking-wide mb-2 font-heading">About NGSMS</p>
        <h1 className="font-heading text-4xl sm:text-6xl font-bold text-paper">One Call, All Solutions</h1>
        <p className="text-mist text-lg max-w-xl mx-auto mt-4">
          Multi-trade property maintenance for the Helderberg Basin — Strand, Gordon’s Bay and Somerset West.
        </p>
      </section>

      <section className="bg-graphite py-10 sm:py-14 px-4 border-y border-darkgrey">
        <div className="max-w-3xl mx-auto bg-cardgrey border border-darkgrey rounded-card p-6 sm:p-8 text-mist text-base sm:text-lg leading-relaxed">
          <p>
            NextGen Solar &amp; Maintenance Solutions (NGSMS) was built around a simple idea: property owners
            shouldn’t need a different contractor for every job. From solar panel cleaning to painting,
            waterproofing, paving, plumbing, electrical work and more — NGSMS gives homeowners, body corporates,
            security complexes and light commercial clients one coordinated point of contact for 12 trade services.
          </p>
        </div>
      </section>

      <section className="bg-jet py-10 sm:py-14">
        <div className="max-w-4xl mx-auto px-4">
          <p className="text-blue font-bold text-sm mb-6 uppercase tracking-wide text-center font-heading">Meet the Owner</p>
          <div className="border-t-4 border-orange bg-cardgrey rounded-card overflow-hidden grid md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
            <img
              src="/jacques-gordon.webp"
              alt="Jacques Gordon, owner and project manager of NGSMS"
              width={720}
              height={900}
              loading="lazy"
              className="w-full aspect-[4/5] md:aspect-auto md:h-full object-cover object-top"
            />
            <div className="p-6 sm:p-8 space-y-4 text-mist text-base sm:text-lg leading-relaxed">
              <div>
                <p className="font-heading font-semibold text-2xl text-paper">Jacques Gordon</p>
                <p className="text-sm text-orange font-semibold uppercase tracking-wide">Owner &amp; Project Manager</p>
              </div>
              <p>
                Jacques founded NGSMS to give property owners one reliable contractor to call. Solar panel cleaning
                is the core of the business, backed by painting, waterproofing, paving, plumbing, electrical work
                and more.
              </p>
              <p>
                Before NGSMS he managed maintenance teams at Swift Pool Company and worked as a foreman at Liebcon
                Construction. He still leads every job hands-on, from the quote to the finished work.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-graphite text-white text-center py-12 px-4 border-t border-darkgrey">
        <h2 className="font-heading text-2xl font-bold mb-3 text-paper">Ready to get started?</h2>
        <div className="flex gap-4 justify-center flex-wrap mt-4">
          <a href="/quote" className="bg-orange hover:bg-orange-dark text-white font-heading font-semibold px-6 py-3 rounded-btn">
            Get a Free Quote
          </a>
          <a href="https://wa.me/27631387945" className="border border-mist text-paper font-heading font-semibold px-6 py-3 rounded-btn hover:border-blue hover:text-blue">
            WhatsApp NGSMS
          </a>
        </div>
      </section>
    </main>
  )
}
