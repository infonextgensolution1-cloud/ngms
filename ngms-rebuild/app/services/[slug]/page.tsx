import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CTASection, PublicShell } from "@/components/PublicShell";
import { services, site } from "@/lib/site";

export function generateStaticParams() {
  return services.map((service) => ({ slug: service.slug }));
}
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const service = services.find((item) => item.slug === slug);
  return {
    title: service?.name ?? "Service",
    description: service?.tagline ?? "NGMS maintenance service",
    alternates: { canonical: "/services/" + slug },
  };
}

const serviceIncludes = [
  "Soft-wash cleaning using non-abrasive methods",
  "No abrasive pads or high pressure applied to the panel glass",
  "Visual check for visible damage or loose mounting",
  "Before-and-after photos where site conditions allow",
  "Cleaning frequency guidance based on roof and surroundings",
];
const solarTiers = [
  ["Up to 10 panels", "from R550"],
  ["11–20 panels", "from R950"],
  ["21–30 panels", "from R1 350"],
  ["31–40 panels", "from R1 700"],
  ["41+ panels", "from R50 / panel"],
];
const solarFaqs = [
  { q: "How often should solar panels be cleaned in the Helderberg?", a: "Many homes start with a clean every 4–6 months. Coastal salt, trees, pollen and dusty roads can change how quickly panels gather dirt, so the right schedule depends on the site." },
  { q: "Will cleaning affect my solar warranty?", a: "We describe our approach as soft-wash and non-abrasive. Manufacturer instructions and site conditions still apply, so let us know if your system has specific cleaning requirements." },
  { q: "Can you clean panels on a steep or high roof?", a: "Access and roof pitch are assessed before confirming a quote. The job only proceeds when the access and safety requirements can be addressed." },
  { q: "What does the price include?", a: "The listed rates are starting prices excluding VAT. Panel count, access and location may affect the final quote. We confirm scope and pricing before work begins." },
];

function SolarCleaningPage() {
  return (
    <PublicShell active="/services">
      <main id="main-content" className="v4-solar-page">
        <section className="v4-solar-opening">
          <div className="v4-solar-opening-left">
            <p className="v4-page-kicker"><span>01</span> / NGMS SERVICES</p>
            <h1>MY<br />SERVICES<span>.</span></h1>
            <p>Solar panel cleaning and property maintenance. Practical service for homes and businesses across the Helderberg Basin.</p>
            <a href="#solar-service" className="v4-scroll-link">↘ <span>EXPLORE THIS SERVICE</span></a>
          </div>
          <div className="v4-solar-opening-right">
            <div className="v4-solar-title-row"><div><p className="v4-page-kicker">SOLAR SPECIALIST / PROPERTY CARE</p><h2>SOLAR PANEL CLEANING</h2><p>Keep every panel earning its keep.</p></div><span className="v4-solar-index">NGMS / 001</span></div>
            <nav className="v4-service-switcher" aria-label="Other NGMS services">
              {services.filter((item) => item.slug !== "solar-panel-cleaning").slice(0, 6).map((item, index) => <Link href={"/services/" + item.slug} key={item.slug}><span>{String(index + 2).padStart(2, "0")} / {item.name}</span><b aria-hidden="true">↗</b></Link>)}
            </nav>
            <div className="v4-solar-banner">
              <img src="/brand-assets/panels-closeup.webp" alt="Solar panels in daylight" />
              <div><p>HELDERBERG BASIN / WESTERN CAPE</p><h3>CLEAN ENERGY.<br /><span>CLEAR RESULTS.</span></h3><a href="/quote?service=solar-panel-cleaning" aria-label="Request a solar panel cleaning quote">↗</a></div>
            </div>
          </div>
        </section>

        <section className="v4-solar-feedback">
          <div className="v4-solar-feedback-intro"><p className="v4-page-kicker"><span>02</span> / CLIENT EXPERIENCE</p><h2>CLIENTS<br />FEEDBACK<span>.</span></h2><p>Professional work. Clear communication. Respect for your property.</p><Link href="/portfolio" className="v4-text-link">VIEW PROJECTS ↗</Link></div>
          <div className="v4-solar-promise-grid">
            <article><span>✳</span><strong>LOCAL SERVICE</strong><p>Serving Strand, Gordon’s Bay and Somerset West with practical maintenance support.</p></article>
            <article><span>✳</span><strong>CLEAR QUOTES</strong><p>Written quotations and straightforward communication before work begins.</p></article>
            <article><span>✳</span><strong>CAREFUL WORK</strong><p>Non-abrasive solar cleaning methods and care for your property.</p></article>
            <article><span>✳</span><strong>ONE CALL</strong><p>Solar cleaning plus multiple property-maintenance trades under one point of contact.</p></article>
          </div>
        </section>

        <section className="v4-solar-talk">
          <div><p className="v4-page-kicker"><span>03</span> / START A PROJECT</p><h2>ANYTHING IN MIND?<br /><span>LET’S TALK.</span></h2></div>
          <Link href="/quote?service=solar-panel-cleaning" className="button button-orange">LET’S TALK ↗</Link>
          <div className="v4-solar-marquee" aria-hidden="true">RELIABLE PROPERTY CARE ✳ HELDERBERG BASIN ✳ SOLAR PANEL CLEANING ✳</div>
        </section>

        <section className="v4-contact-strip">
          <div className="v4-contact-heading"><p className="v4-page-kicker"><span>04</span> / CONTACT NEXTGEN</p><h2>CONTACT<span>.</span></h2></div>
          <div className="v4-contact-item"><strong>ONE CALL. ALL SOLUTIONS.</strong><span>Property maintenance and solar cleaning.</span></div>
          <div className="v4-contact-item"><strong>STRAND · GORDON’S BAY</strong><span>SOMERSET WEST · HELDERBERG</span></div>
          <div className="v4-contact-item"><strong>EMAIL</strong><a href="mailto:info.nextgensolution1@gmail.com">INFO.NEXTGENSOLUTION1@GMAIL.COM</a></div>
          <div className="v4-contact-item"><strong>CALL / WHATSAPP</strong><a href={"tel:" + site.phoneHref}>{site.phoneDisplay}</a></div>
        </section>

        <section id="solar-service" className="v4-solar-detail">
          <div className="container v4-solar-detail-grid">
            <div className="v4-solar-detail-copy"><p className="v4-page-kicker"><span>05</span> / THE SERVICE</p><h2>KEEP YOUR<br /><span>PANELS CLEAR.</span></h2><p>Dust, pollen, coastal salt and bird droppings can build up on solar panels and sit between the glass and the sun. NGMS provides professional solar panel cleaning across the Helderberg Basin using a gentle, non-abrasive approach.</p><p>Coastal properties can gather salt and dust quickly. A site-appropriate cleaning schedule helps you keep the installation attended to instead of waiting until build-up is obvious.</p><a className="button button-orange" href="/quote?service=solar-panel-cleaning">GET A QUOTE ↗</a><div className="v4-solar-detail-note"><span>FIELD NOTE / 001</span><strong>Scope first. Clear next steps.</strong><p>We confirm panel count, roof access, location, timing and price before starting the work.</p></div></div>
            <div className="v4-solar-details-list"><div className="v4-solar-list-heading"><h3>WHAT’S INCLUDED</h3><span>01 — 05</span></div>{serviceIncludes.map((item, index) => <div className="v4-solar-included-row" key={item}><span>{String(index + 1).padStart(2, "0")}</span><p>{item}</p><b aria-hidden="true">↗</b></div>)}
              <div className="v4-price-table-wrap"><div className="v4-solar-list-heading"><h3>STRAIGHTFORWARD PRICING</h3><span>ZAR / STARTING RATES</span></div>{solarTiers.map(([size, price]) => <div className="v4-price-row" key={size}><span>{size}</span><strong>{price}</strong></div>)}<p className="v4-price-note">Starting prices exclude VAT. No call-out fee in Strand, Gordon’s Bay or Somerset West. A R350 call-out fee applies outside the Helderberg Basin. Confirm the final scope and quote before work begins.</p></div>
            </div>
          </div>
        </section>

        <section className="v4-solar-faq">
          <div className="container v4-solar-faq-grid"><div><p className="v4-page-kicker"><span>06</span> / GOOD TO KNOW</p><h2>COMMON<br />QUESTIONS<span>?</span></h2><p>Clear answers about the service, site access and starting prices.</p></div><div className="v4-faq-list">{solarFaqs.map((faq, i) => <details key={faq.q}><summary><span>{String(i + 1).padStart(2, "0")}</span><strong>{faq.q}</strong><b aria-hidden="true">+</b></summary><p>{faq.a}</p></details>)}</div></div>
        </section>

        <section className="v4-solar-areas"><div className="container v4-solar-areas-grid"><div><p className="v4-page-kicker"><span>07</span> / SERVICE AREA</p><h2>LOCAL KNOWLEDGE.<br /><span>PRACTICAL SERVICE.</span></h2><p>NGMS supports properties across the Helderberg and surrounding Western Cape areas. Confirm availability, travel requirements and scope when requesting a quote.</p></div><div className="v4-area-list">{["Strand", "Gordon’s Bay", "Somerset West", "Kleinmond", "Grabouw & Elgin", "Bot River"].map((area) => <a href="/quote?service=solar-panel-cleaning" key={area}><span>{area}</span><b aria-hidden="true">↗</b></a>)}</div></div></section>
        <CTASection title="LESS CHASING. MORE GETTING DONE." text="Share your panel count, location and access details. NGMS can review the request and confirm the next step." />
      </main>
    </PublicShell>
  );
}

export default async function ServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const service = services.find((item) => item.slug === slug);
  if (!service) notFound();
  if (slug === "solar-panel-cleaning") return <SolarCleaningPage />;
  return (
    <PublicShell active="/services">
      <main id="main-content">
        <section className="page-intro"><div className="container"><p className="eyebrow">NGMS SERVICE / {service.slug.toUpperCase()}</p><h1>{service.name.toUpperCase()}.</h1><p className="page-intro-copy">{service.tagline} {service.description}</p></div></section>
        <section className="page-section"><div className="container detail-grid"><div className="detail-panel"><p className="eyebrow">HOW TO GET STARTED</p><h2>START WITH<br /><span>THE SCOPE.</span></h2><p>Share the site location, what needs attention, preferred timing and useful details. NGMS can review the request and confirm the next step.</p><ul className="check-list"><li>Describe the required work</li><li>Include access or site constraints</li><li>Use an approved contact channel for photos</li><li>Confirm pricing and timing before work starts</li></ul><Link className="button button-orange" href={"/quote?service=" + service.slug}>Request this service ↗</Link></div><div className="detail-aside"><span className="big-number">NGMS / {String(services.findIndex((item) => item.slug === slug) + 1).padStart(2, "0")}</span><h3>Scope first.<br />Clear next steps.</h3><p>Pricing, travel, materials and suitability can depend on the job. This page makes no unverified price or completion promise.</p><Link className="text-link" href="/services">BACK TO ALL SERVICES ↗</Link></div></div></section>
        <CTASection title={"REQUEST " + service.name.toUpperCase() + "."} text="Send the details so the job can be reviewed and scoped." />
      </main>
    </PublicShell>
  );
}
