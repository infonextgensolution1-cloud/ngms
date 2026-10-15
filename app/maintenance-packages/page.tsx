import Link from 'next/link'
import PlanSignupForm from '@/components/PlanSignupForm'
import { COMMERCIAL_COMBOS, RECURRING_PACKAGES, SEASONAL_COMBOS, type Package } from '@/lib/packages'

export const metadata = {
  alternates: { canonical: '/maintenance-packages' },
  title: 'Property Maintenance Plans | NextGen Maintenance Solutions',
  description: "Straightforward recurring, seasonal and commercial property maintenance plans across Strand, Gordon's Bay and Somerset West.",
}

function PlanCard({ pkg, index, recurring = false }: { pkg: Package; index: number; recurring?: boolean }) {
  return (
    <article className={`ngms-mp2-card ${pkg.featured ? 'ngms-mp2-card--featured' : ''}`}>
      <div className="ngms-mp2-card__top">
        <span className="ngms-mp2-number">{String(index + 1).padStart(2, '0')}</span>
        {pkg.featured ? <span className="ngms-mp2-badge">{pkg.badge || 'Recommended'}</span> : null}
      </div>
      <p className="ngms-mp2-eyebrow">{pkg.frequency}</p>
      <h3>{pkg.name}</h3>
      <p className="ngms-mp2-price">{pkg.price}<span> / {pkg.unit.replace(/^per /, '').replace(/^once-off project$/, 'project')}</span></p>
      <div className="ngms-mp2-rule" />
      <p className="ngms-mp2-included">WHAT’S INCLUDED</p>
      <ul>{pkg.features.map((feature) => <li key={feature}><span aria-hidden="true">↗</span>{feature}</li>)}</ul>
      <Link className="ngms-mp2-card__link" href={recurring ? '#join-plan' : '/quote?service=Property%20Maintenance'}>
        {recurring ? 'CHOOSE THIS PLAN' : 'REQUEST A QUOTE'} <span aria-hidden="true">↗</span>
      </Link>
    </article>
  )
}

function PlanSection({ id, index, eyebrow, title, intro, packages, recurring = false }: {
  id: string; index: string; eyebrow: string; title: string; intro: string; packages: Package[]; recurring?: boolean
}) {
  return (
    <section id={id} className="ngms-mp2-section">
      <div className="ngms-mp2-section__head">
        <p className="ngms-mp2-eyebrow"><span>{index}</span> / {eyebrow}</p>
        <h2>{title}</h2>
        <p>{intro}</p>
      </div>
      <div className="ngms-mp2-grid">
        {packages.map((pkg, i) => <PlanCard key={pkg.name} pkg={pkg} index={i} recurring={recurring} />)}
      </div>
    </section>
  )
}

export default function MaintenancePackagesPage() {
  return (
    <main className="ngms-maintenance-v2">
      <header className="ngms-mp2-header">
        <Link href="/" className="ngms-mp2-brand" aria-label="NextGen home">NEXTGEN<span>®</span><b>.</b></Link>
        <nav aria-label="Main navigation">
          <Link href="/services">SERVICES</Link>
          <Link href="#plans">PLANS</Link>
          <Link href="#commercial">BODY CORPORATES</Link>
          <Link href="/contact">CONTACT</Link>
        </nav>
        <Link href="#join-plan" className="ngms-mp2-header-cta">BUILD MY PLAN <span>↗</span></Link>
      </header>

      <section className="ngms-mp2-hero">
        <div className="ngms-mp2-hero__copy">
          <p className="ngms-mp2-eyebrow"><span className="ngms-mp2-dot" /> PROPERTY CARE / HELDERBERG BASIN</p>
          <h1>MAINTAIN<br />WHAT <em>MATTERS.</em></h1>
          <p className="ngms-mp2-lead">A better way to look after your property. Planned maintenance, clear scopes and one trusted local team — without juggling a different contractor for every job.</p>
          <div className="ngms-mp2-actions">
            <Link href="#plans" className="ngms-mp2-button">EXPLORE PLANS <span>↘</span></Link>
            <Link href="/quote" className="ngms-mp2-textlink">REQUEST A SITE ASSESSMENT ↗</Link>
          </div>
          <div className="ngms-mp2-hero__meta"><span>STRAND</span><i /> <span>GORDON’S BAY</span><i /> <span>SOMERSET WEST</span></div>
        </div>
        <div className="ngms-mp2-hero__visual" aria-label="Property maintenance editorial graphic">
          <div className="ngms-mp2-visual__top"><span>NGMS / MAINTENANCE SYSTEMS</span><span>001—026</span></div>
          <div className="ngms-mp2-visual__art" aria-hidden="true">
            <div className="ngms-mp2-block ngms-mp2-block--a" />
            <div className="ngms-mp2-block ngms-mp2-block--b" />
            <div className="ngms-mp2-block ngms-mp2-block--c" />
            <div className="ngms-mp2-cross">+</div>
            <div className="ngms-mp2-vertical">PLAN / MAINTAIN / PROTECT</div>
          </div>
          <div className="ngms-mp2-visual__bottom"><strong>ONE CALL.<br />ALL SOLUTIONS.</strong><span>PREVENTIVE CARE<br />RECURRING VISITS<br />LOCAL CREWS</span></div>
        </div>
        <div className="ngms-mp2-hero__index">NGMS / 01</div>
      </section>

      <section className="ngms-mp2-proof" aria-label="How our maintenance plans work">
        <div><span>01</span><p>INSPECT THE PROPERTY</p></div>
        <div><span>02</span><p>AGREE THE SCOPE</p></div>
        <div><span>03</span><p>KEEP IT IN GOOD SHAPE</p></div>
        <p className="ngms-mp2-proof__note">No guesswork. We confirm the scope and price before work begins.</p>
      </section>

      <section id="plans" className="ngms-mp2-intro">
        <div><p className="ngms-mp2-eyebrow"><span>01</span> / RECURRING CARE</p><h2>GOOD MAINTENANCE<br />IS <em style={{ color: "#1A1A1A" }}>PLANNED.</em></h2></div>
        <p>Choose a regular service rhythm that suits your property. Each plan can be discussed during a free site assessment, with final scope confirmed before the first visit.</p>
      </section>
      <div className="ngms-mp2-packages">
        <PlanSection id="recurring" index="01" eyebrow="RECURRING PLANS" title="CARE THAT COMES BACK." intro="Scheduled visits for solar cleaning and practical exterior maintenance." packages={RECURRING_PACKAGES} recurring />
        <p className="ngms-mp2-note">Panel counts above 20 are quoted separately. Plan inclusions and final pricing are confirmed for your property before booking.</p>
      </div>

      <section id="join-plan" className="ngms-mp2-signup">
        <div className="ngms-mp2-signup__copy">
          <p className="ngms-mp2-eyebrow"><span>02</span> / START WITH YOUR PROPERTY</p>
          <h2 style={{ color: "#1A1A1A" }}>LET’S MAKE<br />A PLAN.</h2>
          <p>Tell us how to reach you and choose the recurring plan you want to discuss. We’ll follow up to confirm the details and your first visit.</p>
          <div className="ngms-mp2-signup__foot"><span>FREE SITE ASSESSMENT</span><span>WRITTEN QUOTES</span><span>LOCAL TEAM</span></div>
        </div>
        <div className="ngms-mp2-signup__form"><PlanSignupForm /></div>
      </section>

      <PlanSection id="seasonal" index="03" eyebrow="SEASONAL COMBOS" title="READY FOR THE SEASON." intro="One-off combinations built around Cape weather and the jobs properties commonly need before or after seasonal changes." packages={SEASONAL_COMBOS} />
      <div className="ngms-mp2-note ngms-mp2-note--wide">Seasonal pricing is indicative. We confirm site conditions and the final scope before booking.</div>

      <section id="commercial" className="ngms-mp2-commercial">
        <div className="ngms-mp2-commercial__head"><p className="ngms-mp2-eyebrow"><span>04</span> / SHARED & COMMERCIAL SITES</p><h2>ONE SITE.<br /><em>ONE CONTACT.</em></h2><p>Coordinated property care for body corporates, security complexes and light commercial sites — with a clear scope and a single point of contact.</p><Link href="/body-corporate-maintenance" className="ngms-mp2-textlink">BODY CORPORATE SERVICES ↗</Link></div>
        <div className="ngms-mp2-commercial__plans"><PlanSection id="commercial-plans" index="04" eyebrow="COMMERCIAL PLANS" title="BUILT FOR SHARED SPACES." intro="Starting points for site-specific maintenance quotes." packages={COMMERCIAL_COMBOS} /></div>
      </section>

      <section className="ngms-mp2-services">
        <div className="ngms-mp2-services__head"><p className="ngms-mp2-eyebrow"><span>05</span> / WHAT WE COORDINATE</p><h2>MORE THAN<br />A CHECKLIST<span>.</span></h2><p>One point of contact for the maintenance jobs that keep a property safe, presentable and working as it should.</p></div>
        <div className="ngms-mp2-services__list">
          {[
            ['01', 'SOLAR PANEL CLEANING', 'Careful cleaning and practical repeat scheduling.'],
            ['02', 'GUTTERS & WATERPROOFING', 'Help keep water moving and identify potential leak points early.'],
            ['03', 'EXTERIOR & HIGH-PRESSURE CLEANING', 'Refresh driveways, entrances, walls and outdoor areas.'],
            ['04', 'PAINTING & HANDYMAN WORK', 'Planned touch-ups and minor repairs.'],
            ['05', 'PAVING, PLUMBING & ELECTRICAL', 'Coordinated trade services through one point of contact.'],
          ].map(([number, title, description]) => <details className="ngms-mp2-service" key={number}><summary><span>{number}</span><strong>{title}</strong><b aria-hidden="true">＋</b></summary><p>{description}</p></details>)}
        </div>
      </section>

      <section className="ngms-mp2-final">
        <div className="ngms-mp2-final__stamp">NGMS<br /><span>2026</span></div>
        <p className="ngms-mp2-eyebrow">NEXTGEN MAINTENANCE SOLUTIONS / WESTERN CAPE</p>
        <h2>YOUR PROPERTY.<br /><em>OUR NEXT PROJECT.</em></h2>
        <div className="ngms-mp2-final__links"><Link href="#join-plan">START A PLAN ↗</Link><a href="https://wa.me/27631387945" target="_blank" rel="noopener noreferrer">WHATSAPP US ↗</a><Link href="/price-list">VIEW PRICE LIST ↗</Link></div>
      </section>
      <footer className="ngms-mp2-footer"><span>ONE CALL. ALL SOLUTIONS.</span><span>STRAND / GORDON’S BAY / SOMERSET WEST</span><Link href="/contact">CONTACT NGMS ↗</Link></footer>
    </main>
  )
}
