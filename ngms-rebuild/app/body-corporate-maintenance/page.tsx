import type { Metadata } from "next";
import Link from "next/link";
import { PublicShell } from "@/components/PublicShell";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Body Corporate Maintenance",
  description: "One maintenance contact for body corporate properties, security complexes and shared spaces across the Helderberg Basin.",
};

const benefits = [
  { n: "01", title: "ONE POINT OF CONTACT", text: "Coordinate maintenance work for your property through one contact." },
  { n: "02", title: "MULTI-TRADE SOLUTIONS", text: "Painting, waterproofing, paving, cleaning, plumbing, electrical and more." },
  { n: "03", title: "RELIABLE & PROFESSIONAL", text: "Clear communication and agreed work scopes before the job starts." },
  { n: "04", title: "WRITTEN QUOTES & UPDATES", text: "Keep trustees, managers and residents informed about work and next steps." },
];
const services = [
  { n: "01", title: "High-pressure cleaning", text: "Maintain entrances, communal walkways, parking areas and outdoor surfaces.", meta: "COMMON AREAS" },
  { n: "02", title: "Painting & maintenance", text: "Plan practical upkeep for façades, boundary walls and shared spaces.", meta: "PROPERTY CARE" },
  { n: "03", title: "Paving & repairs", text: "Address communal paving, entrances, paths and outdoor defects.", meta: "REPAIRS & FINISHES" },
];
const steps = [
  { n: "01", title: "Assess the property", text: "Bring recurring defects, planned maintenance and repair priorities together." },
  { n: "02", title: "Agree the scope", text: "Review a written quote with clear work items before anything is approved." },
  { n: "03", title: "Coordinate the work", text: "Use one contact to help keep communication, scheduling and trade coordination straightforward." },
  { n: "04", title: "Review completion", text: "Confirm completed work and note any follow-up requirements." },
];
const corpWa = "https://wa.me/27631387945?text=" + encodeURIComponent("Hi NextGen, I'd like to request a body corporate maintenance assessment. Please contact me to discuss the property and required scope.");

export default function BodyCorporateMaintenancePage() {
  return (
    <PublicShell active="/body-corporate-maintenance">
      <main id="main-content" className="v4-corporate-page">
        <section className="v4-corporate-hero">
          <div className="container v4-corporate-hero-grid">
            <div className="v4-corporate-copy">
              <p className="v4-page-kicker"><span>01</span> / SHARED PROPERTY CARE</p>
              <h1>A SINGLE<br />MAINTENANCE<br />CONTACT FOR<br /><span>BODY CORPORATES.</span></h1>
              <p>Coordinate property maintenance without managing a different contractor for every issue. NGMS provides a single point of contact for multi-trade work across the Helderberg Basin.</p>
              <div className="v4-corporate-actions"><a href={corpWa} target="_blank" rel="noreferrer" className="button button-orange">Request an assessment ↗</a><Link href="/quote?service=body-corporate-maintenance" className="button button-outline">Request online quote ↗</Link></div>
              <div className="v4-corporate-proof"><span>HELDERBERG BASIN</span><span>WRITTEN QUOTES</span><span>MULTI-TRADE CARE</span></div>
            </div>
            <div className="v4-corporate-art" aria-label="Body corporate property care graphic">
              <div className="v4-corporate-art-top"><span>NGMS / FIELD SUPPORT</span><span>WESTERN CAPE</span></div>
              <div className="v4-corporate-art-frame"><div className="v4-corporate-art-grid"><i /><i /><i /><i /><i /><i /></div><div className="v4-corporate-art-copy"><small>ONE CALL. ALL SOLUTIONS.</small><strong>WELL<br />MAINTAINED.<br /><em>BETTER MANAGED.</em></strong></div></div>
              <div className="v4-corporate-art-orange">PROPERTY<br />MAINTENANCE<br /><b>01 — 04</b></div>
              <span className="v4-corporate-vertical">BODY CORPORATE / 001</span>
            </div>
          </div>
        </section>

        <section className="v4-corporate-benefits">
          <div className="container">
            <div className="v4-section-heading"><div><p className="v4-page-kicker"><span>02</span> / WHY NGMS</p><h2>GOOD WORK.<br /><span>CLEAR RESULTS.</span></h2></div><p>Make shared-property maintenance easier to plan, quote and coordinate with a practical multi-trade contact.</p></div>
            <div className="v4-corporate-benefit-grid">{benefits.map((b) => <article key={b.n}><span>{b.n} / NGMS</span><h3>{b.title}</h3><p>{b.text}</p></article>)}</div>
          </div>
        </section>

        <section className="v4-corporate-services">
          <div className="container">
            <div className="v4-section-heading"><div><p className="v4-page-kicker"><span>03</span> / WHAT WE COORDINATE</p><h2>ONE PROPERTY.<br /><span>MANY TRADES.</span></h2></div><p>Start with the maintenance list and the site priorities. The agreed scope depends on access, condition and the work required.</p></div>
            <div className="v4-corporate-service-grid">{services.map((item) => <article key={item.n}><div className="v4-corporate-service-meta"><span>{item.n} /</span><span>{item.meta}</span></div><h3>{item.title}</h3><p>{item.text}</p><a href={corpWa} target="_blank" rel="noreferrer">Discuss this service <span aria-hidden="true">↗</span></a></article>)}</div>
          </div>
        </section>

        <section className="v4-corporate-process">
          <div className="container v4-corporate-process-grid">
            <div className="v4-corporate-process-intro"><p className="v4-page-kicker"><span>04</span> / A STRAIGHTFORWARD PROCESS</p><h2>FROM REPAIR LIST<br />TO <span>READY.</span></h2><p>Know what is being reviewed, what has been quoted and what needs approval before work proceeds.</p><a href={corpWa} target="_blank" rel="noreferrer" className="button button-orange">Start a conversation ↗</a></div>
            <div className="v4-process-steps">{steps.map((step) => <article key={step.n}><span>{step.n}</span><div><h3>{step.title}</h3><p>{step.text}</p></div><b aria-hidden="true">↗</b></article>)}</div>
          </div>
        </section>

        <section className="v4-corporate-plans">
          <div className="container v4-corporate-plan-grid">
            <div><p className="v4-page-kicker"><span>05</span> / PLANNED UPKEEP</p><h2>KEEP SHARED<br /><span>SPACES READY.</span></h2><p>Recurring or seasonal work can be grouped into a plan that suits the property. Larger complexes and multi-building sites are quoted once the scope has been reviewed.</p><Link href="/maintenance-packages#commercial" className="button button-orange">View maintenance plans ↗</Link></div>
            <div className="v4-corporate-plan-preview"><span>NGMS / COMMERCIAL</span><h3>Body Corporate Essentials</h3><strong>From R3 200 <small>/ per visit</small></strong><ul><li>Communal or rooftop solar cleaning (scoped to the site)</li><li>Common-area wash for entrances and walkways</li><li>Gutter clean and site safety walk-through</li><li>Written scope and agreed work schedule</li></ul><p>Indicative starting price. Final scope and pricing must be confirmed for the property.</p></div>
          </div>
        </section>

        <section className="v4-corporate-final">
          <div className="container v4-corporate-final-inner"><div><p className="v4-page-kicker"><span>06</span> / START WITH THE PROPERTY</p><h2>LESS CHASING.<br /><span>MORE GETTING DONE.</span></h2><p>Share the location, your maintenance priorities and any access requirements. NGMS can review the request and confirm the next step.</p></div><div className="v4-corporate-final-actions"><a href={corpWa} target="_blank" rel="noreferrer" className="button button-orange">WhatsApp NGMS ↗</a><a href={"tel:" + site.phoneHref} className="button button-outline">Call {site.phoneDisplay}</a><small>Serving {site.serviceArea}.</small></div></div>
        </section>
      </main>
    </PublicShell>
  );
}
