export const metadata = {
  title: 'About Us | NGMS',
  description:
    'Next Gen Maintenance Solutions — a multi-trade property maintenance contractor based in the Helderberg Basin, Western Cape.',
}

export default function AboutPage() {
  return (
    <main className="bg-white text-black">
      <section className="bg-jet text-white py-14 px-4 text-center">
        <p className="text-orange font-semibold text-sm uppercase tracking-wide mb-2">About NGMS</p>
        <h1 className="text-3xl sm:text-5xl font-black">One Call, All Solutions</h1>
        <p className="text-gray-400 max-w-xl mx-auto mt-4">
          Multi-trade property maintenance for the Helderberg Basin — Strand, Gordon’s Bay and Somerset West.
        </p>
      </section>

      <section className="max-w-3xl mx-auto px-4 py-14 space-y-6 text-gray-700 leading-relaxed">
        <p>
          Next Gen Maintenance Solutions (NGMS) was built around a simple idea: property owners shouldn’t need a
          different contractor for every job. From solar panel cleaning to painting, waterproofing, paving,
          plumbing, electrical work and more — NGMS gives homeowners, body corporates, security complexes and
          light commercial clients one coordinated point of contact for 12 trade services.
        </p>
        <p>
          NGMS is owned and run by Jacques Gordon, who leads every project hands-on as owner, project manager and
          contractor — backed by hands-on experience managing maintenance teams at Swift Pool Company and as a
          foreman at Liebcon Construction before founding NGMS.
        </p>
      </section>

      <section className="bg-white text-black py-6">
        <div className="max-w-4xl mx-auto px-4">
          <p className="text-orange font-semibold text-sm mb-6 uppercase tracking-wide text-center">The Team</p>
          <div className="grid sm:grid-cols-3 gap-6 text-center">
            <div className="border border-gray-200 rounded-2xl p-6">
              <p className="font-bold">Jacques Gordon</p>
              <p className="text-sm text-gray-500">Owner &amp; Project Manager</p>
            </div>
            <div className="border border-gray-200 rounded-2xl p-6">
              <p className="font-bold">Mitch Ludick</p>
              <p className="text-sm text-gray-500">Paving Specialist</p>
            </div>
            <div className="border border-gray-200 rounded-2xl p-6">
              <p className="font-bold">Henry Matthews</p>
              <p className="text-sm text-gray-500">Plumbing &amp; Maintenance Specialist</p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-graphite text-white text-center py-12 px-4 mt-10">
        <h2 className="text-2xl font-black mb-3">Ready to get started?</h2>
        <div className="flex gap-4 justify-center flex-wrap mt-4">
          <a href="/quote" className="bg-orange hover:bg-orange-dark text-white font-semibold px-6 py-3 rounded-full">
            Get a Free Quote
          </a>
          <a href="https://wa.me/27631387945" className="border border-white text-white font-semibold px-6 py-3 rounded-full">
            WhatsApp NGMS
          </a>
        </div>
      </section>
    </main>
  )
}
