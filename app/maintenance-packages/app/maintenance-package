import Link from 'next/link'

export const metadata = {
  title: 'Maintenance Packages | NGSMS',
  description:
    "Recurring, seasonal and commercial property maintenance packages from NextGen Solar & Maintenance Solutions — Strand, Gordon's Bay, Somerset West.",
}

const RECURRING_PACKAGES = [
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
    badge: 'Most Popular',
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

const SEASONAL_COMBOS = [
  {
    name: 'Winter Storm-Ready',
    frequency: 'May – August',
    price: 'from R2 150',
    unit: 'once-off project',
    features: [
      'Full roof & gutter inspection and clean',
      'Waterproofing leak-point check + minor patch (up to 5m²)',
      'Interior touch-up painting (up to 15m²)',
      'Free follow-up call-out if a leak shows up within 30 days',
    ],
  },
  {
    name: 'Summer Refresh',
    frequency: 'September – April',
    price: 'from R2 950',
    unit: 'once-off project',
    featured: true,
    badge: 'Peak Season Pick',
    features: [
      'Full exterior high-pressure wash (driveway, walls, entrance)',
      'Solar panel clean (up to 20 panels)',
      'Exterior touch-up painting (up to 15m²)',
      'Paving joint & crack check',
    ],
  },
  {
    name: 'Pool & Entertaining Combo',
    frequency: 'September – April',
    price: 'from R2 250',
    unit: 'once-off project',
    features: [
      'Pool fibre lining check + minor patch (up to 3m²)',
      'High-pressure wash — pool deck & entrance area',
      'Solar panel clean (up to 10 panels)',
      '2-hour handyman slot for pre-season touch-ups',
    ],
  },
]

const COMMERCIAL_COMBOS = [
  {
    name: 'Body Corporate Essentials',
    frequency: 'Quarterly',
    price: 'from R3 200',
    unit: 'per visit',
    features: [
      'Solar panel clean — communal/rooftop arrays (up to 40 panels)',
      'Common area high-pressure wash (entrances & walkways)',
      'Gutter clean — up to 4 downpipe runs',
      'Site safety walk-through + minor electrical check',
    ],
  },
  {
    name: 'Security Complex Care',
    frequency: 'Bi-annual',
    price: 'from R4 800',
    unit: 'per visit',
    featured: true,
    badge: 'Most Requested',
    features: [
      'Solar panel clean — all unit arrays (volume-priced on-site)',
      'Perimeter wall & boundary high-pressure wash',
      'Common area exterior paint touch-up',
      'Electrical safety check on shared lighting',
      'Priority-response SLA for the season',
    ],
  },
  {
    name: 'Light Commercial Facade',
    frequency: 'Quarterly',
    price: 'from R2 800',
    unit: 'per visit',
    features: [
      'Storefront/exterior high-pressure wash',
      'Exterior paint touch-up (signage area, entrance)',
      'Gutter & roof check',
      'Rubble/waste clear-out if repairs leave debris',
    ],
  },
]

function PackageGrid({ packages }) {
  return (
    <div className="max-w-5xl mx-auto px-4 grid sm:grid-cols-3 gap-6">
      {packages.map((pkg) => (
        <div
          key={pkg.name}
          className={`bg-cardgrey rounded-card p-6 flex flex-col ${
            pkg.featured ? 'border-2 border-orange' : 'border border-darkgrey'
          }`}
        >
          {pkg.featured && (
            <span className="self-start bg-orange text-white text-[10px] uppercase tracking-wide px-2 py-1 rounded-btn mb-3 font-heading font-semibold">
              {pkg.badge || 'Most Popular'}
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
  )
}

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
        <PackageGrid packages={RECURRING_PACKAGES} />
        <p className="text-center text-mist text-sm max-w-2xl mx-auto mt-10 opacity-80">
          Panel counts above 20 are quoted at the standard per-panel rate. All packages can be customised to your
          property during a free site visit — exact scope and pricing confirmed before your first visit.
        </p>
      </section>

      <section className="bg-jet py-14 px-4">
        <div className="text-center mb-10">
          <p className="text-blue font-bold text-sm uppercase tracking-wide mb-2 font-heading">Seasonal Combos</p>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-paper">Built Around the Cape Weather</h2>
          <p className="text-mist text-base max-w-xl mx-auto mt-3">
            Winter rain and summer sun each bring their own to-do list. These combos bundle the right services for
            the season so nothing gets missed.
          </p>
        </div>
        <PackageGrid packages={SEASONAL_COMBOS} />
        <p className="text-center text-mist text-sm max-w-2xl mx-auto mt-10 opacity-80">
          Once-off project pricing — scope confirmed on-site. Ask about combining a seasonal combo with a
          recurring plan for an extra discount.
        </p>
      </section>

      <section className="bg-graphite py-14 px-4 border-y border-darkgrey">
        <div className="text-center mb-10">
          <p className="text-blue font-bold text-sm uppercase tracking-wide mb-2 font-heading">
            Commercial &amp; Body Corporate
          </p>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-paper">Built for Complexes &amp; Business</h2>
          <p className="text-mist text-base max-w-xl mx-auto mt-3">
            Volume-priced packages for security complexes, body corporates and light commercial sites — one
            contractor, one contract, one point of contact.
          </p>
        </div>
        <PackageGrid packages={COMMERCIAL_COMBOS} />
        <p className="text-center text-mist text-sm max-w-2xl mx-auto mt-10 opacity-80">
          Pricing shown reflects a typical mid-size site. Larger complexes and multi-building sites are quoted
          after a free walk-through.
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
