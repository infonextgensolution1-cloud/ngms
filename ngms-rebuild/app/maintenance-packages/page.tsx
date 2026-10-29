import type { Metadata } from "next";
import Link from "next/link";
import { PublicShell } from "@/components/PublicShell";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Maintenance Packages",
  description: "Recurring, seasonal and shared-property maintenance packages from NGMS across Strand, Gordon's Bay, Somerset West and the Helderberg.",
};

type Plan = {
  name: string;
  cadence: string;
  price: string;
  unit: string;
  features: string[];
  badge?: string;
};
const recurring: Plan[] = [
  { name: "Basic Care", cadence: "Every 6 months", price: "from R850", unit: "per visit", features: ["Solar panel clean (up to 20 panels)", "Gutter check and flush", "General exterior visual inspection", "15% off solar cleaning rate", "Priority booking"] },
  { name: "Standard Care", cadence: "Every 4 months", price: "from R1 450", unit: "per visit", badge: "Most popular", features: ["Solar panel clean (up to 20 panels)", "Gutter clean and flush", "High-pressure wash for a driveway or entrance area", "Minor handyman fixes (up to 30 minutes)", "15% off solar cleaning rate", "Priority booking"] },
  { name: "Complete Care", cadence: "Every 3 months", price: "from R2 200", unit: "per visit", features: ["Solar panel clean (up to 20 panels)", "Gutter clean and flush", "Full exterior high-pressure wash", "Handyman hour included", "Annual waterproofing inspection", "Priority booking and faster response"] },
];
const seasonal: Plan[] = [
  { name: "Pre-Winter Storm-Ready", cadence: "March – May", price: "from R2 150", unit: "once-off project", features: ["Roof and gutter inspection and clean", "Waterproofing leak-point check and minor patch up to 5 m²", "Interior touch-up painting up to 15 m²", "Follow-up call-out if a leak appears within 30 days"] },
  { name: "Summer Refresh", cadence: "September – April", price: "from R2 950", unit: "once-off project", badge: "Peak season pick", features: ["Exterior high-pressure wash", "Solar panel clean up to 20 panels", "Exterior touch-up painting up to 15 m²", "Paving joint and crack check"] },
  { name: "Pool & Entertaining Combo", cadence: "September – April", price: "from R2 250", unit: "once-off project", features: ["Pool fibre lining check and minor patch up to 3 m²", "High-pressure wash for pool deck and entrance", "Solar panel clean up to 10 panels", "Two-hour handyman slot for pre-season touch-ups"] },
];
const commercial: Plan[] = [
  { name: "Body Corporate Essentials", cadence: "Quarterly", price: "from R3 200", unit: "per visit", features: ["Communal or rooftop solar arrays up to 40 panels", "Common-area wash for entrances and walkways", "Gutter clean up to four downpipe runs", "Site safety walk-through and minor electrical check"] },
  { name: "Security Complex Care", cadence: "Twice a year", price: "from R4 800", unit: "per visit", badge: "Most requested", features: ["Volume-priced solar cleaning for unit arrays", "Perimeter wall and boundary wash", "Common-area exterior paint touch-up", "Shared-lighting electrical safety check", "Priority response for the season"] },
  { name: "Light Commercial Facade", cadence: "Quarterly", price: "from R2 800", unit: "per visit", features: ["Storefront and exterior high-pressure wash", "Paint touch-up around entrance or signage", "Gutter and roof check", "Rubble and waste clearance where needed"] },
];

function packageWhatsApp(name: string) {
  return "https://wa.me/27631387945?text=" + encodeURIComponent("Hi NextGen, I'd like to discuss the " + name + " maintenance package. Please help me confirm suitability, scope and availability.");
}
function PlanCard({ plan, index }: { plan: Plan; index: number }) {
  return (
    <article className="v4-plan-card">
      <div className="v4-plan-card-top"><span>{String(index + 1).padStart(2, "0")} / NGMS PLAN</span>{plan.badge ? <span className="v4-plan-badge">{plan.badge}</span> : <span className="v4-plan-mark" aria-hidden="true">✳</span>}</div>
      <p className="v4-plan-cadence">{plan.cadence}</p>
      <h3>{plan.name}</h3>
      <div className="v4-plan-price"><strong>{plan.price}</strong><span>{plan.unit} · VAT excluded</span></div>
      <ul>{plan.features.map((feature) => <li key={feature}><span aria-hidden="true">✓</span>{feature}</li>)}</ul>
      <a className="v4-plan-link" href={packageWhatsApp(plan.name)} target="_blank" rel="noreferrer">Discuss this plan <span aria-hidden="true">↗</span></a>
    </article>
  );
}

export default function MaintenancePackagesPage() {
  return (
    <PublicShell active="/maintenance-packages">
      <main id="main-content" className="v4-packages-page">
        <section className="v4-packages-hero">
          <div className="container v4-packages-hero-grid">
            <div className="v4-packages-hero-copy">
              <p className="v4-page-kicker"><span>01</span> / PLANNED MAINTENANCE</p>
              <h1>PLANNED<br />MAINTENANCE<span>.</span></h1>
              <p>Reliable property upkeep across Strand, Gordon’s Bay and Somerset West. One point of contact for recurring care, seasonal jobs and shared properties.</p>
              <div className="v4-hero-actions"><a className="button button-orange" href="#recurring">Explore plans <span aria-hidden="true">↘</span></a><a className="button button-dark-outline" href={packageWhatsApp("maintenance")} target="_blank" rel="noreferrer">Discuss a plan ↗</a></div>
              <div className="v4-hero-location">STRAND / HELDERBERG / WESTERN CAPE</div>
            </div>
            <div className="v4-maintenance-collage" aria-label="NGMS maintenance services visual">
              <div className="v4-collage-panel v4-collage-solar"><img src="/brand-assets/panels-closeup.webp" alt="Solar panels as part of scheduled property maintenance" /><span>SOLAR PANEL CLEANING</span></div>
              <div className="v4-collage-panel v4-collage-home"><img src="/brand-assets/house-array.webp" alt="Property and solar array maintenance" /></div>
              <div className="v4-collage-orange"><strong>PLAN.<br />MAINTAIN.<br />PROTECT.</strong><small>ONE LOCAL CONTACT</small></div>
              <span className="v4-collage-vertical">MAINTENANCE / 001</span>
              <a className="v4-collage-link" href="#recurring">EXPLORE MAINTENANCE PLANS ↘</a>
            </div>
          </div>
          <div className="container v4-value-grid">
            <a href="#recurring"><span>01 /</span><strong>Made around your property</strong><p>Practical maintenance shaped around your site and priorities.</p><b aria-hidden="true">↗</b></a>
            <a href="#seasonal"><span>02 /</span><strong>Seasonal, not last-minute</strong><p>Prepare for rain, refresh for summer and plan ahead.</p><b aria-hidden="true">↗</b></a>
            <a href="#commercial"><span>03 /</span><strong>One coordinated team</strong><p>Bring multiple maintenance trades together through one contact.</p><b aria-hidden="true">↗</b></a>
            <a className="v4-value-dark" href="#join"><span>04 /</span><strong>Clear scope. Clear quote.</strong><p>Confirm work items, price and timing before a visit.</p><b aria-hidden="true">↗</b></a>
          </div>
        </section>

        <section id="recurring" className="v4-package-section">
          <div className="container">
            <div className="v4-section-heading"><div><p className="v4-page-kicker"><span>02</span> / RECURRING PLANS</p><h2>KEEP AHEAD<br />OF THE WORK<span>.</span></h2></div><p>Choose a repeat schedule that fits your property. Package scope, access and final pricing are confirmed with NGMS before work starts.</p></div>
            <div className="v4-plan-grid">{recurring.map((plan, i) => <PlanCard key={plan.name} plan={plan} index={i} />)}</div>
            <p className="v4-small-note">Starting prices are indicative and exclude VAT. Final pricing depends on property size, access, panel count and the confirmed job scope.</p>
          </div>
        </section>

        <section id="seasonal" className="v4-seasonal-section">
          <div className="container">
            <div className="v4-section-heading"><div><p className="v4-page-kicker"><span>03</span> / SEASONAL COMBINATIONS</p><h2>READY FOR<br />THE SEASON<span>.</span></h2></div><p>Combine the jobs that make sense for your property and the time of year instead of leaving everything until it becomes urgent.</p></div>
            <div className="v4-plan-grid">{seasonal.map((plan, i) => <PlanCard key={plan.name} plan={plan} index={i} />)}</div>
          </div>
        </section>

        <section id="commercial" className="v4-commercial-section">
          <div className="container">
            <div className="v4-section-heading"><div><p className="v4-page-kicker"><span>04</span> / SHARED & COMMERCIAL PROPERTIES</p><h2>ONE TEAM.<br />ONE PLAN<span>.</span></h2></div><p>Volume-conscious maintenance for body corporates, security complexes and light commercial sites, coordinated through a single contact.</p></div>
            <div className="v4-plan-grid">{commercial.map((plan, i) => <PlanCard key={plan.name} plan={plan} index={i} />)}</div>
            <p className="v4-small-note">Larger complexes and multi-building sites are quoted after the scope and property requirements have been reviewed.</p>
            <div className="v4-corporate-link"><div><p className="v4-page-kicker"><span>↗</span> BODY CORPORATE MAINTENANCE</p><h3>Manage the property.<br /><span>Not ten contractors.</span></h3></div><Link className="button button-orange" href="/body-corporate-maintenance">Explore body corporate care ↗</Link></div>
          </div>
        </section>

        <section id="join" className="v4-plan-join">
          <div className="container v4-plan-join-grid">
            <div><p className="v4-page-kicker"><span>05</span> / START A PLAN</p><h2>MAKE UPKEEP<br /><span>AUTOMATIC.</span></h2><p>Tell us which property needs attention and what kind of schedule you have in mind. We’ll review the details and confirm a suitable scope and price.</p><a href={packageWhatsApp("a recurring maintenance plan")} target="_blank" rel="noreferrer" className="button button-orange">Start on WhatsApp ↗</a><small>Direct contact: <a href={"tel:" + site.phoneHref}>{site.phoneDisplay}</a></small></div>
            <div className="v4-plan-form-wrap"><div className="v4-preview-notice"><strong>Online plan request — preview only</strong><p>This rebuild form is not connected to live submission storage yet. Do not enter personal or customer information here. Use the WhatsApp link to contact NGMS.</p></div><form><fieldset disabled><legend>Plan details</legend><label>Maintenance type<select defaultValue=""><option value="">Choose a plan</option><option>Recurring maintenance</option><option>Seasonal care</option><option>Body corporate</option><option>Commercial property</option></select></label><label>Your name<input placeholder="Full name" /></label><label>Property / suburb<input placeholder="Suburb or town" /></label><label>What needs attention?<textarea rows={3} placeholder="Briefly describe the property and work" /></label><button type="button" className="v4-disabled-submit">PREVIEW ONLY — NOT LIVE</button></fieldset></form></div>
          </div>
        </section>
        <section className="v4-packages-bottom"><div className="container"><p className="v4-page-kicker"><span>06</span> / NGMS PROPERTY CARE</p><h2>ONE CALL.<br /><span>ALL SOLUTIONS.</span></h2><p>For one-off jobs or a maintenance plan, start with the property, the work required and the outcome you need.</p><div className="v4-hero-actions"><Link className="button button-orange" href="/services">Explore services ↗</Link><Link className="button button-outline" href="/body-corporate-maintenance">Body corporate maintenance ↗</Link></div></div></section>
      </main>
    </PublicShell>
  );
}
