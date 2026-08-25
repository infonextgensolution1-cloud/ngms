export const metadata = {
  title: 'About Us | NGSMS',
  description:
    'NextGen Solar & Maintenance Solutions — a multi-trade property maintenance contractor based in the Helderberg Basin, Western Cape.',
}

export default function AboutPage() {
  return (
    <main className="bg-jet">
      <section className="bg-jet text-white py-14 px-4 text-center">
        <p className="text-blue font-bold text-sm uppercase tracking-wide mb-2 font-heading">About NGSMS</p>
        <h1 className="font-heading text-4xl sm:text-6xl font-bold text-paper">One Call, All Solutions</h1>
        <p className="text-mist text-lg max-w-xl mx-auto mt-4">
          Multi-trade property maintenance for the Helderberg Basin — Strand, Gordon’s Bay and Somerset West.
        </p>
      </section>

      <section className="bg-graphite py-14 border-y border-darkgrey">
        <div className="max-w-3xl mx-auto px-4 bg-cardgrey border border-darkgrey rounded-card p-8 space-y-5 text-mist text-lg leading-relaxed">
          <p>
            NextGen Solar &amp; Maintenance Solutions (NGSMS) was built around a simple idea: property owners
            shouldn’t need a different contractor for every job. From solar panel cleaning to painting,
            waterproofing, paving, plumbing, electrical work and more — NGSMS gives homeowners, body corporates,
            security complexes and light commercial clients one coordinated point of contact for 12 trade services.
          </p>
          <p>
            NGSMS is owned and run by Jacques Gordon, who leads every project hands-on as owner, project manager
            and contractor — backed by hands-on experience managing maintenance teams at Swift Pool Company and as
            a foreman at Liebcon Construction before founding NGSMS.
          </p>
        </div>
      </section>

      <section className="bg-jet py-14">
        <div className="max-w-4xl mx-auto px-4">
          <p className="text-blue font-bold text-sm mb-6 uppercase tracking-wide text-center font-heading">The Team</p>
          <div className="grid sm:grid-cols-3 gap-6 text-center">
            <div className="border-t-4 border-orange bg-cardgrey rounded-card p-6">
              <p className="font-heading font-semibold text-lg text-paper">Jacques Gordon</p>
              <p className="text-sm text-mist font-semibold">Owner &amp; Project Manager</p>
            </div>
            <div className="border-t-4 border-blue bg-cardgrey rounded-card p-6">
              <p className="font-heading font-semibold text-lg text-paper">Mitch Ludick</p>
              <p className="text-sm text-mist font-semibold">Paving Specialist</p>
            </div>
            <div className="border-t-4 border-blue bg-cardgrey rounded-card p-6">
              <p className="font-heading font-semibold text-lg text-paper">Henry Matthews</p>
              <p className="text-sm text-mist font-semibold">Plumbing &amp; Maintenance Specialist</p>
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
