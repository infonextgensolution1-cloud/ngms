import Link from 'next/link'
import PlanSignupForm from '@/components/PlanSignupForm'
import { COMMERCIAL_COMBOS, RECURRING_PACKAGES, SEASONAL_COMBOS, type Package } from '@/lib/packages'

export const metadata = {
  alternates: { canonical: '/maintenance-packages' },
  title: 'Maintenance Packages | NextGen Solar Clean & Maintenance Solutions',
  description: "Recurring, seasonal and commercial property maintenance packages from NextGen Solar Clean & Maintenance Solutions — Strand, Gordon's Bay, Somerset West.",
}

function PackageRow({ pkg, index, joinable = false }: { pkg: Package; index: number; joinable?: boolean }) {
  return (
    <article className={'ngms-mp-package ngms-mp-package--' + (index % 3) + (pkg.featured ? ' is-featured' : '')}>
      <div className="ngms-mp-package__number">{String(index + 1).padStart(2, '0')}</div>
      <div className="ngms-mp-package__summary">
        <p className="ngms-mp-kicker">{pkg.frequency}</p>
        <h3>{pkg.name}</h3>
        <p className="ngms-mp-package__unit">{pkg.unit} · VAT excluded</p>
        {pkg.featured ? <span className="ngms-mp-badge">{pkg.badge || 'Featured plan'}</span> : null}
      </div>
      <div className="ngms-mp-package__features">
        <p className="ngms-mp-kicker">WHAT’S INCLUDED</p>
        <ul>{pkg.features.map((feature) => <li key={feature}><span aria-hidden="true">↗</span>{feature}</li>)}</ul>
      </div>
      <div className="ngms-mp-package__price">
        <span className="ngms-mp-kicker">FROM</span>
        <strong>{pkg.price}</strong>
        <Link href={joinable ? '#join' : '/quote?service=Property%20Maintenance'}>{joinable ? 'CHOOSE PLAN' : 'ENQUIRE ↗'}</Link>
      </div>
    </article>
  )
}

function PackageSection({ id, eyebrow, title, description, packages, joinable = false }: {
  id: string; eyebrow: string; title: string; description: string; packages: Package[]; joinable?: boolean
}) {
  return (
    <section id={id} className="ngms-mp-section">
      <div className="ngms-mp-section__heading">
        <p className="ngms-mp-kicker">{eyebrow}</p>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      <div className="ngms-mp-package-list">
        {packages.map((pkg, index) => <PackageRow key={pkg.name} pkg={pkg} index={index} joinable={joinable} />)}
      </div>
    </section>
  )
}

export default function MaintenancePackagesPage() {
  return (
    <main className="ngms-maintenance-brut">
      <div className="ngms-mp-topline">
        <Link href="/" className="ngms-mp-wordmark" aria-label="NextGen home">NEXT<span>GEN</span><b>.</b></Link>
        <nav className="ngms-mp-nav" aria-label="Maintenance page navigation">
          <Link href="/">HOME</Link>
          <Link href="/services">SERVICES</Link>
          <Link href="#packages" aria-current="page">MAINTENANCE PLANS</Link>
          <Link href="/portfolio">PROJECTS</Link>
          <Link href="/contact">CONTACT</Link>
        </nav>
        <Link className="ngms-mp-top-cta" href="#join">START A PLAN <span>↗</span></Link>
      </div>

      <section className="ngms-mp-hero">
        <div className="ngms-mp-hero__headline">
          <p className="ngms-mp-kicker">HELDERBERG BASIN / NGMS—2026 / PROPERTY CARE SYSTEMS</p>
          <h1>MAINTENANCE<br />PLANS<span className="ngms-mp-period">.</span></h1>
          <div className="ngms-mp-hero__bottom">
            <p><i aria-hidden="true" /> PREVENT PROBLEMS. PROTECT YOUR PROPERTY. SAVE MONEY.</p>
            <Link href="#packages">EXPLORE OUR PLANS <span>↗</span></Link>
          </div>
        </div>
        <div className="ngms-mp-hero__field-panel">
          <div className="ngms-mp-field-copy">
            <p className="ngms-mp-kicker">NGMS / FIELD OPERATIONS</p>
            <h2>PROACTIVE<br />PROPERTY CARE</h2>
            <p>CLEAN. MAINTAIN. INSPECT. REPAIR. PROTECT.</p>
          </div>
          <div className="ngms-mp-field-stats">
            <span><b>↓</b> LOWER COSTS</span><span><b>◇</b> LONGER LIFESPAN</span><span><b>↗</b> PROPERTY VALUE</span>
          </div>
        </div>
        <div className="ngms-mp-hero__visual">
          <div className="ngms-mp-hero__visual-top"><span>OUR PLANS / 01—03</span><span>STRAND · SOMERSET WEST</span></div>
          <div className="ngms-mp-architecture" aria-hidden="true">
            <div className="ngms-mp-architecture__block ngms-mp-architecture__block--one" />
            <div className="ngms-mp-architecture__block ngms-mp-architecture__block--two" />
            <div className="ngms-mp-architecture__block ngms-mp-architecture__block--three" />
            <div className="ngms-mp-architecture__line" />
            <div className="ngms-mp-architecture__target">↗</div>
          </div>
          <div className="ngms-mp-hero__visual-caption"><strong>MAINTAIN<br />WHAT MATTERS.</strong><span>01 INSPECT<br />02 MAINTAIN<br />03 PROTECT</span></div>
        </div>
        <div className="ngms-mp-hero__side-note">MAINTENANCE SYSTEMS / 001</div>
      </section>

      <div className="ngms-mp-manifesto">
        <span className="ngms-mp-manifesto__year">NGMS / 2026</span>
        <p>WE DON’T WAIT FOR THINGS TO BREAK.<br /><strong>WE PLAN. WE MAINTAIN. WE DELIVER.</strong></p>
        <a href="#packages" aria-label="Scroll to packages">↓</a>
        <Link href="#join">AVAILABLE FOR NEW PLANS <span>●</span></Link>
      </div>

      <div id="packages" className="ngms-mp-selected">
        <aside className="ngms-mp-selected__aside">
          <p className="ngms-mp-kicker">01 / RECURRING CARE</p>
          <h2>SELECTED<br />PACKAGES</h2>
          <p>Scheduled property care, designed around your site, season and budget.</p>
          <a href="#seasonal">SEE SEASONAL OPTIONS <span>↘</span></a>
        </aside>
        <div className="ngms-mp-selected__content">
          <PackageSection id="recurring" eyebrow="01—03 / RECURRING PLANS" title="CARE THAT COMES BACK." description="Regular visits keep small maintenance tasks from turning into costly repairs. Choose your service rhythm." packages={RECURRING_PACKAGES} joinable />
          <p className="ngms-mp-note">Panel counts above 20 are quoted at the standard per-panel rate. All plans can be tailored during a free site visit; scope and pricing are confirmed before your first visit.</p>
        </div>
      </div>

      <section className="ngms-mp-signup" id="join">
        <div className="ngms-mp-signup__copy">
          <p className="ngms-mp-kicker">02 / GET ON THE SCHEDULE</p>
          <h2>BUILT AROUND<br /><span>YOUR PROPERTY.</span></h2>
          <p>Choose a plan and we’ll confirm your first visit. We’ll also remind you when your next service is due.</p>
          <div className="ngms-mp-signup__sticker" aria-hidden="true">✳</div>
        </div>
        <div className="ngms-mp-signup__form"><PlanSignupForm /></div>
      </section>

      <PackageSection id="seasonal" eyebrow="03 / SEASONAL COMBOS" title="BUILT FOR THE CAPE." description="Winter rain and summer sun bring different maintenance priorities. These one-off combinations help you prepare for the season ahead." packages={SEASONAL_COMBOS} />
      <p className="ngms-mp-note ngms-mp-note--wide">Once-off project pricing. Final scope is confirmed on-site. Ask about combining a seasonal combo with a recurring plan for an additional discount.</p>

      <PackageSection id="commercial" eyebrow="04 / COMMERCIAL & BODY CORPORATE" title="ONE SITE. ONE POINT OF CONTACT." description="Volume-priced property care for security complexes, body corporates and light commercial sites." packages={COMMERCIAL_COMBOS} />
      <p className="ngms-mp-note ngms-mp-note--wide">Pricing shown reflects a typical mid-size site. Larger complexes and multi-building sites are quoted after a free walk-through.</p>

      <section className="ngms-mp-services">
        <div className="ngms-mp-services__intro">
          <p className="ngms-mp-kicker">05 / OUR CAPABILITIES</p>
          <h2>MORE THAN<br />A CHECKLIST<span>.</span></h2>
          <p>One local team for solar cleaning and the maintenance jobs that keep your property working as it should.</p>
        </div>
        <div className="ngms-mp-services__list">
          {[
            ['01', 'SOLAR PANEL CLEANING', 'Soft-wash cleaning, before-and-after photos and practical maintenance scheduling.'],
            ['02', 'EXTERIOR & HIGH-PRESSURE CLEANING', 'Refresh driveways, entrances, walls and outdoor areas.'],
            ['03', 'GUTTERS & WATERPROOFING', 'Keep water moving correctly and catch potential leak points early.'],
            ['04', 'PAINTING & HANDYMAN WORK', 'Planned touch-ups and minor repairs to help protect your property.'],
            ['05', 'BODY CORPORATE & COMMERCIAL', 'Coordinated maintenance for shared spaces and multi-building sites.'],
          ].map(([number, title, description]) => (
            <details className="ngms-mp-service" key={number}>
              <summary><span>{number}</span><strong>{title}</strong><b aria-hidden="true">＋</b></summary>
              <p>{description}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="ngms-mp-final-cta">
        <div className="ngms-mp-final-cta__red"><p>LET’S KEEP IT<br />IN GOOD SHAPE.</p><Link href="#join" aria-label="Start a maintenance plan">↗</Link></div>
        <div className="ngms-mp-final-cta__main">
          <p className="ngms-mp-kicker">NEXTGEN MAINTENANCE SOLUTIONS / WESTERN CAPE</p>
          <h2>YOUR PROPERTY.<br />OUR NEXT PROJECT<span>.</span></h2>
          <div className="ngms-mp-final-cta__links">
            <Link href="#join">START A PLAN ↗</Link>
            <a href="https://wa.me/27631387945" target="_blank" rel="noopener noreferrer">WHATSAPP US ↗</a>
            <Link href="/price-list">VIEW PRICE LIST ↗</Link>
          </div>
        </div>
      </section>

      <div className="ngms-mp-footerline"><span>ONE CALL. ALL SOLUTIONS.</span><span>STRAND / GORDON’S BAY / SOMERSET WEST</span><Link href="/contact">CONTACT NGMS ↗</Link></div>
    </main>
  )
}
