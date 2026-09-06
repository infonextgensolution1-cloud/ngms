export const metadata = {
  title: 'FAQ | NGSMS',
  description: 'Frequently asked questions about NextGen Solar & Maintenance Solutions services, pricing and areas served.',
}

const FAQS = [
  {
    q: 'What areas do you service?',
    a: 'We’re based in and focused on the Helderberg Basin — Strand, Gordon’s Bay and Somerset West. There’s no call-out fee within these areas.',
  },
  {
    q: 'How much does solar panel cleaning cost?',
    a: 'Pricing depends on system size, starting from R550 for up to 10 panels. See our full price list for all tiers, or use the ROI Calculator to see what dirty panels might be costing you.',
  },
  {
    q: 'Do your prices include VAT?',
    a: 'No — all prices on our catalog and quotes exclude VAT (15%), which is added separately.',
  },
  {
    q: 'How often should solar panels be cleaned?',
    a: 'We recommend every 4–6 months for most Helderberg homes, more often near dusty roads or under trees. Our maintenance plans build this in automatically at a discount.',
  },
  {
    q: 'What happens if it rains on the day of my booking?',
    a: 'Exterior work (painting, waterproofing, pressure cleaning, paving) is rescheduled at no cost if weather intervenes — no cancellation fees.',
  },
  {
    q: 'Do you provide free quotes?',
    a: 'Yes. Every job is measured and quoted properly after a free site assessment — the price list gives you a starting-point estimate in the meantime.',
  },
  {
    q: 'How do I pay?',
    a: 'EFT, cash or card on completion of the job.',
  },
  {
    q: 'What materials do you use?',
    a: 'We use Builders Warehouse as our primary supplier for paint, waterproofing and paving materials, so quality and availability are consistent.',
  },
  {
    q: 'Can you handle multiple services on the same property?',
    a: 'Yes — that’s the whole idea behind NGSMS. One call covers all 12 trade services, coordinated by a single point of contact instead of juggling separate contractors.',
  },
  {
    q: 'Do you offer recurring maintenance plans?',
    a: 'Yes — see our Maintenance Packages for bundled, recurring visits at a discounted rate.',
  },
]

export default function FaqPage() {
  return (
    <main className="bg-jet">
      <section className="bg-jet text-white py-14 px-4 text-center">
        <p className="text-blue font-bold text-sm uppercase tracking-wide mb-2 font-heading">Questions</p>
        <h1 className="font-heading text-4xl sm:text-6xl font-bold text-paper">Frequently Asked Questions</h1>
        <p className="text-mist text-lg max-w-xl mx-auto mt-4">
          Everything we get asked most about pricing, areas and how we work.
        </p>
      </section>

      <section className="bg-graphite py-14 border-y border-darkgrey">
        <div className="max-w-3xl mx-auto px-4 space-y-4">
          {FAQS.map((item) => (
            <details key={item.q} className="bg-cardgrey border border-darkgrey rounded-card p-5 group">
              <summary className="font-heading font-semibold text-paper cursor-pointer list-none flex items-center justify-between">
                {item.q}
                <span className="text-orange ml-4 group-open:rotate-45 transition-transform">+</span>
              </summary>
              <p className="text-mist mt-3 text-sm leading-relaxed">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="bg-jet text-white text-center py-14 px-4">
        <h2 className="font-heading text-2xl font-bold mb-3 text-paper">Still have a question?</h2>
        <div className="flex gap-4 justify-center flex-wrap mt-4">
          <a href="https://wa.me/27631387945" className="bg-whatsapp hover:bg-whatsapp-dark text-white font-heading font-semibold px-6 py-3 rounded-btn">
            WhatsApp Us
          </a>
          <a href="/contact" className="border border-mist text-paper font-heading font-semibold px-6 py-3 rounded-btn hover:border-orange hover:text-orange">
            Contact Page
          </a>
        </div>
      </section>
    </main>
  )
}
