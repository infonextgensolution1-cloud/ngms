export const metadata = {
  title: 'Contact Us | NGSMS',
  description: 'Get in touch with NextGen Solar & Maintenance Solutions — Strand, Gordon’s Bay, Somerset West.',
}

const AREAS = ['Strand', 'Gordon’s Bay', 'Somerset West', 'Helderberg Basin']

export default function ContactPage() {
  return (
    <main className="bg-jet">
      <section className="bg-jet text-white py-14 px-4 text-center">
        <p className="text-blue font-bold text-sm uppercase tracking-wide mb-2 font-heading">Get In Touch</p>
        <h1 className="font-heading text-4xl sm:text-6xl font-bold text-paper">Contact NGSMS</h1>
        <p className="text-mist text-lg max-w-xl mx-auto mt-4">
          One call for all your property maintenance needs across the Helderberg Basin.
        </p>
      </section>

      <section className="bg-graphite py-14 border-y border-darkgrey">
        <div className="max-w-2xl mx-auto px-4 grid sm:grid-cols-2 gap-6 text-center">
          <a
            href="https://wa.me/27631387945"
            className="bg-cardgrey border border-darkgrey rounded-card p-8 hover:border-blue transition"
          >
            <p className="font-heading font-semibold text-lg mb-1 text-paper">WhatsApp</p>
            <p className="text-blue text-sm">063 138 7945</p>
          </a>
          <a
            href="tel:+27631387945"
            className="bg-cardgrey border border-darkgrey rounded-card p-8 hover:border-blue transition"
          >
            <p className="font-heading font-semibold text-lg mb-1 text-paper">Call</p>
            <p className="text-blue text-sm">063 138 7945</p>
          </a>
          <a
            href="mailto:info.nextgensolution1@gmail.com"
            className="bg-cardgrey border border-darkgrey rounded-card p-8 hover:border-blue transition sm:col-span-2"
          >
            <p className="font-heading font-semibold text-lg mb-1 text-paper">Email</p>
            <p className="text-blue text-sm">info.nextgensolution1@gmail.com</p>
          </a>
        </div>
      </section>

      <section className="bg-jet py-14">
        <div className="max-w-4xl mx-auto px-4">
          <p className="text-blue font-bold text-sm mb-4 uppercase tracking-wide text-center font-heading">Areas We Serve</p>
          <div className="flex flex-wrap justify-center gap-3 mb-10">
            {AREAS.map((a) => (
              <span key={a} className="bg-cardgrey border border-darkgrey rounded-full px-4 py-2 text-sm text-paper">
                {a}
              </span>
            ))}
          </div>
          <div className="rounded-card overflow-hidden border border-darkgrey">
            <iframe
              title="NGSMS service area — Helderberg Basin"
              src="https://maps.google.com/maps?q=Somerset+West,+Western+Cape&z=11&output=embed"
              className="w-full h-80"
              loading="lazy"
            />
          </div>
        </div>
      </section>

      <section className="bg-graphite text-white text-center py-10 px-4 border-t border-darkgrey">
        <p className="text-mist text-lg mb-4">Serving Strand, Gordon’s Bay, Somerset West and the Helderberg Basin</p>
        <a href="/quote" className="bg-orange hover:bg-orange-dark text-white font-heading font-semibold px-6 py-3 rounded-btn inline-block">
          Get a Free Quote
        </a>
      </section>
    </main>
  )
}
