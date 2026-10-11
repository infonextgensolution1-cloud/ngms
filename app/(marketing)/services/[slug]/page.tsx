import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SERVICES, getService } from "@/lib/services";
import { SUBURBS } from "@/lib/suburbs";
import { SOLAR_TIERS, SOLAR_SUBURB_TO_LOCATION } from "@/lib/solar-pricing";
import { whatsappLink } from "@/lib/site";
import TrustBadges from "@/components/TrustBadges";
import NgmsIcon from "@/components/NgmsIcon";
import { GoogleReviews } from "@/components/home/HomeSections";

export function generateStaticParams() {
  return SERVICES.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const s = getService(slug);
  if (!s) return {};
  return {
    title: s.metaTitle || s.name,
    description: s.metaDescription || s.description,
    alternates: { canonical: `/services/${s.slug}` },
  };
}

export default async function ServiceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const s = getService(slug);
  if (!s) return notFound();
  const isSolar = s.slug === "solar-panel-cleaning";
  const relatedServices = SERVICES.filter((item) => item.slug !== s.slug).slice(0, 5);
  const areaHref = (sub: string) =>
    isSolar && SOLAR_SUBURB_TO_LOCATION[sub]
      ? `/solar-panel-cleaning/${SOLAR_SUBURB_TO_LOCATION[sub]}`
      : `/services/${s.slug}/${sub}`;
  const areaLinks = isSolar
    ? [
        { slug: "strand", name: "Strand" },
        { slug: "gordons-bay", name: "Gordon's Bay" },
        { slug: "somerset-west", name: "Somerset West" },
        { slug: "kleinmond", name: "Kleinmond" },
        { slug: "grabouw", name: "Grabouw & Elgin" },
        { slug: "bot-river", name: "Bot River" },
      ]
    : SUBURBS;

  return (
    <main className="ngms-service-reference">
      <section className="nsr-top" aria-labelledby="nsr-title">
        <div className="nsr-intro">
          <p className="nsr-kicker">NEXTGEN MAINTENANCE SOLUTIONS / 01</p>
          <h1 id="nsr-title">{s.name.toUpperCase()}</h1>
          <p className="nsr-description">{s.description}</p>
          <Link className="nsr-round-link" href={`/quote?service=${encodeURIComponent(s.name)}`} aria-label={`Request a quote for ${s.name}`}>↙</Link>
        </div>
        <div className="nsr-service-list">
          <div className="nsr-list-heading"><span>MY SERVICES</span><span>EXPLORE NGMS ↗</span></div>
          {relatedServices.map((item, i) => (
            <Link className="nsr-service-row" key={item.slug} href={`/services/${item.slug}`}>
              <span className="nsr-row-arrow">↗</span>
              <strong>{item.name.toUpperCase()}</strong>
              <span className="nsr-row-index">0{i + 1}</span>
            </Link>
          ))}
          <div className="nsr-feature-strip">
            <span className="nsr-feature-badge">↗</span>
            <div><b>{s.tagline}</b><small>LOCAL PROPERTY CARE / HELDERBERG BASIN</small></div>
          </div>
        </div>
      </section>

      <TrustBadges />

      <section className="nsr-details" aria-labelledby="nsr-included">
        <div className="nsr-details-heading">
          <span className="nsr-kicker">THE WORK / 02</span>
          <h2 id="nsr-included">BUILT AROUND<br />WHAT YOU NEED.</h2>
          <p>{s.tagline} Clear scope, practical workmanship and a written quote before work begins.</p>
        </div>
        <div className="nsr-inclusions">
          <h3>WHAT’S INCLUDED</h3>
          {s.whatsIncluded.map((item, i) => (
            <div className="nsr-inclusion-row" key={item}><span>0{i + 1}</span><p>{item}</p><b>↗</b></div>
          ))}
          {isSolar ? (
            <div className="nsr-pricing">
              <h3>SOLAR CLEANING PRICING</h3>
              {SOLAR_TIERS.map((tier) => <div className="nsr-price-row" key={tier.size}><span>{tier.size}</span><strong>{tier.price}</strong></div>)}
              <p>Prices exclude VAT. No callout fee in Strand, Gordon’s Bay or Somerset West. Outside the Helderberg Basin, a R350 callout may apply. Maintenance plans (every 4–6 months) receive 15% off with priority booking.</p>
              <a className="nsr-text-link" href={whatsappLink("Hi NextGen, I'd like a solar panel cleaning quote. I have ___ panels. Photo attached.")}>WHATSAPP A PHOTO FOR A QUOTE ↗</a>
            </div>
          ) : (
            <p className="nsr-pricing-note">Prices exclude VAT. Most jobs can be assessed from WhatsApp photos; larger projects receive a site assessment and written quote.</p>
          )}
        </div>
      </section>

      {s.faqs.length > 0 && <section className="nsr-faq" aria-labelledby="nsr-faq-title">
        <div><p className="nsr-kicker">GOOD TO KNOW / 03</p><h2 id="nsr-faq-title">QUESTIONS.<br />ANSWERED.</h2></div>
        <div>{s.faqs.map((faq) => <details className="nsr-faq-item" key={faq.question}><summary>{faq.question}<span>＋</span></summary><p>{faq.answer}</p></details>)}</div>
      </section>}

      <section className="nsr-reviews">
        <div className="nsr-reviews-heading"><span className="nsr-kicker">CUSTOMER FEEDBACK / 04</span><div><h2>GOOD WORK.<br />GOOD WORD.</h2><p>See real feedback from customers and share your own experience.</p></div></div>
        <GoogleReviews />
      </section>

      <section className="nsr-areas">
        <p>HELDERVERG BASIN <i>✳</i> STRAND <i>✳</i> GORDON’S BAY <i>✳</i> SOMERSET WEST</p>
        <h2>LOCAL SERVICE.<br /><span>BUILT ON TRUST.</span></h2>
        <p className="nsr-area-copy">Areas we serve for {s.name.toLowerCase()}</p>
        <div className="nsr-area-links">{areaLinks.map((area) => <Link key={area.slug} href={areaHref(area.slug)}>{area.name} ↗</Link>)}</div>
      </section>

      <section className="nsr-contact">
        <p className="nsr-kicker">HAVE A PROJECT IN MIND?</p>
        <span className="nsr-contact-star" aria-hidden="true">✳</span>
        <h2>ANYTHING IN MIND?<br />LET’S TALK.</h2>
        <Link className="nsr-contact-cta" href={`/quote?service=${encodeURIComponent(s.name)}`}>TELL US WHAT YOU NEED <span>↗</span></Link>
        <div className="nsr-contact-word" aria-hidden="true">CONTACT<span /></div>
      </section>
    </main>
  );
}
