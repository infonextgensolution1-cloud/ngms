import Link from 'next/link'
import NgmsIcon from '@/components/NgmsIcon'
import { COMMERCIAL_COMBOS, RECURRING_PACKAGES, SEASONAL_COMBOS, type Package } from '@/lib/packages'

export const metadata = {
  title: 'Maintenance Packages | NextGen Solar Clean & Maintenance Solutions',
  description:
    "Recurring, seasonal and commercial property maintenance packages from NextGen Solar Clean & Maintenance Solutions — Strand, Gordon's Bay, Somerset West.",
}

function PackageGrid({ packages }: { packages: Package[] }) {
  return (
    <div className="max-w-5xl mx-auto px-4 grid sm:grid-cols-3 gap-6">
      {packages.map((pkg, i) => (
        <div
          key={pkg.name}
          className={`group bg-cardgrey rounded-card p-6 flex flex-col transition-colors ${
            pkg.featured ? 'border-2 border-orange' : 'border border-darkgrey hover:border-orange'
          }`}
        >
          <NgmsIcon name={pkg.icon} index={i} className="h-12 w-12 mb-4" />
          {pkg.featured && (
            <span className="btn-popular self-start mb-4 px-3 py-1.5 text-xs font-heading">
              {pkg.badge || 'Most Popular'}
            </span>
          )}
          <h2 className="font-heading text-xl font-bold text-paper">{pkg.name}</h2>
          <p className="text-orange text-sm font-semibold mt-1">{pkg.frequency}</p>
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
            Get started
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
        <p className="text-orange font-bold text-sm uppercase tracking-wide mb-2 font-heading">Recurring care</p>
        <h1 className="font-heading text-4xl sm:text-6xl font-bold text-paper">Maintenance packages</h1>
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
          <p className="text-orange font-bold text-sm uppercase tracking-wide mb-2 font-heading">Seasonal combos</p>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-paper">Built around the Cape weather</h2>
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
          <p className="text-orange font-bold text-sm uppercase tracking-wide mb-2 font-heading">
            Commercial &amp; Body Corporate
          </p>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-paper">Built for complexes &amp; business</h2>
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
          <a href="https://wa.me/27631387945" className="btn-wa-price">
            WhatsApp us about price
          </a>
          <Link href="/price-list" className="border border-mist text-paper font-heading font-semibold px-6 py-3 rounded-btn hover:border-orange hover:text-orange">
            View full price list
          </Link>
        </div>
      </section>
    </main>
  )
}
