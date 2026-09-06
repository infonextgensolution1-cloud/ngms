import Link from 'next/link'

export const metadata = {
  title: 'Maintenance Packages | NGSMS',
  description: 'Recurring property maintenance packages from NextGen Solar & Maintenance Solutions — Strand, Gordon\'s Bay, Somerset West.',
}

const PACKAGES = [
  {
    name: 'Basic Care',
    frequency: 'Every 6 months',
    price: 'from R850',
    unit: 'per visit',
    features: [
      'Solar panel clean (up to 20 panels)',
      'Gutter check & flush',
      'General exterior visual inspection',
      'Priority booking',
    ],
  },
  {
    name: 'Standard Care',
    frequency: 'Every 4 months',
    price: 'from R1 450',
    unit: 'per visit',
    featured: true,
    features: [
      'Solar panel clean (up to 20 panels)',
      'Gutter clean & flush',
      'High-pressure wash — driveway or entrance area',
      'Minor handyman fixes (up to 30 min)',
      '15% off solar cleaning rate',
      'Priority booking',
    ],
  },
  {
    name: 'Complete Care',
    frequency: 'Every 3 months',
    price: 'from R2 200',
    unit: 'per visit',
    features: [
      'Solar panel clean (up to 20 panels)',
      'Gutter clean & flush',
      'Full exterior high-pressure wash',
      'Handyman hour included',
      'Annual waterproofing inspection',
      '15% off solar cleaning rate',
      'Priority booking & fastest response',
    ],
  },
]

export default function MaintenancePackagesPage() {
  return (
    <main className="bg-jet">
      <section className="bg-jet text-white py-14 px-4 text-center">
        <p className="text-blue font-bold text-sm uppercase tracking-wide mb-2 font-heading">Recurring Care</p>
        <h1 className="font-heading text-4xl sm:text-6xl font-bold text-paper">Maintenance Packages</h1>
        <p className="text-mist text-lg max-w-xl mx-auto mt-4">
          Skip the repeat call-outs. One recurring visit keeps your property in shape — at a better rate than
          booking each service separately.
        </p>
      </section>

      <section className="bg-graphite py-14 border-y border-darkgrey">
        <div className="max-w-5xl mx-auto px-4 grid sm:grid-cols-3 gap-6">
          {PACKAGES.map((pkg) => (
            <div
              key={pkg.name}
              className={`bg-cardgrey rounded-card p-6 flex flex-col ${
                pkg.featured ? 'border-2 border-orange' : 'border border-darkgrey'
              }`}
            >
              {pkg.featured && (
                <span className="self-start bg-orange text-white text-[10px] uppercase tracking-wide px-2 py-1 rounded-btn mb-3 font-heading font-semibold">
                  Most Popular
                </span>
              )}
              <h2 className="font-heading text-xl font-bold text-paper">{pkg.name}</h2>
              <p className="text-blue text-sm font-semibold mt-1">{pkg.frequency}</p>
              <p className="font-heading text-3xl font-bold text-paper mt-4">{pkg.price}</p>
              <p className="text-mist text-xs mb-6">{pkg.unit}, VAT excl.</p>
              <ul className="space-y-2 text-mist text-sm flex-1">
                {pkg.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <span className="text-whatsapp">&#10003;</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/quote"
                className="mt-6 block text-center bg-whatsapp hover:bg-whatsapp-dark text-white font-heading font-semibold px-6 py-3 rounded-btn"
              >
                Get Started
              </Link>
            </div>
          ))}
        </div>

        <p className="text-center text-mist text-sm max-w-2xl mx-auto mt-10 opacity-80">
          Panel counts above 20 are quoted at the standard per-panel rate. All packages can be customised to your
          property during a free site visit — exact scope and pricing confirmed before your first visit.
        </p>
      </section>

      <section className="bg-jet text-white text-center py-14 px-4">
        <h2 className="font-heading text-2xl font-bold mb-3 text-paper">Not sure which package fits?</h2>
        <div className="flex gap-4 justify-center flex-wrap mt-4">
          <a href="https://wa.me/27631387945" className="bg-whatsapp hover:bg-whatsapp-dark text-white font-heading font-semibold px-6 py-3 rounded-btn">
            WhatsApp Us
          </a>
          <Link href="/price-list" className="border border-mist text-paper font-heading font-semibold px-6 py-3 rounded-btn hover:border-orange hover:text-orange">
            View Full Catalog
          </Link>
        </div>
      </section>
    </main>
  )
}
