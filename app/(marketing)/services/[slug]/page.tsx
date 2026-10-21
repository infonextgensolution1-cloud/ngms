import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SERVICES, getService } from "@/lib/services";
import { SUBURBS } from "@/lib/suburbs";
import { SOLAR_TIERS, SOLAR_SUBURB_TO_LOCATION } from "@/lib/solar-pricing";
import { whatsappLink } from "@/lib/site";
import { getServiceImages, getSlotPhotos } from "@/lib/queries";
import { FALLBACK_SERVICE_IMAGES } from "@/lib/fallback-images";
import TrustBadges from "@/components/TrustBadges";
import NgmsIcon from "@/components/NgmsIcon";
import { GoogleReviews } from "@/components/home/HomeSections";
import { getGoogleReviews } from "@/lib/google-reviews";

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
  const [serviceImages, solarSlotPhotos] = await Promise.all([
    getServiceImages(),
    getSlotPhotos(isSolar ? ["solar_service_feature"] : []),
  ]);
  const image = serviceImages[s.slug] || FALLBACK_SERVICE_IMAGES[s.slug] || null;
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

  if (isSolar) {
    const google = await getGoogleReviews();
    const serviceRows = SERVICES.filter((item) => item.slug !== s.slug).slice(0, 6);
    const realReviews = google.reviews.filter((review) => review.text || review.authorName).slice(0, 4);
    return (
      <section className="ngms-solar-editorial">
        <div className="ngms-solar-editorial__services">
          <div className="ngms-solar-editorial__side">
            <p className="ngms-solar-editorial__eyebrow">01 / NGMS SERVICES</p>
            <h1>MY<br />SERVICES</h1>
            <p>End-to-end solar panel cleaning and property maintenance. Safe, reliable work for homes and businesses across the Helderberg Basin.</p>
            <a className="ngms-solar-editorial__round-arrow" href="#solar-details" aria-label="Explore solar panel cleaning details">↙</a>
          </div>
          <div className="ngms-solar-editorial__service-list">
            <p className="ngms-solar-editorial__eyebrow">SOLAR SPECIALIST / PROPERTY CARE</p>
            <h2>{s.name}</h2>
            <p className="ngms-solar-editorial__intro">{s.tagline}</p>
            <div className="ngms-solar-editorial__rows">
              {serviceRows.map((item, index) => (
                <Link key={item.slug} href={`/services/${item.slug}`} className="ngms-solar-editorial__row">
                  <span className="ngms-solar-editorial__row-icon" aria-hidden="true">↗</span>
                  <span>{item.name}</span>
                  <span className="ngms-solar-editorial__row-index">{String(index + 2).padStart(2, "0")}</span>
                </Link>
              ))}
            </div>
            <div className="ngms-solar-editorial__service-image" aria-label="Solar panel cleaning feature photo">
              <Image
                src={solarSlotPhotos.solar_service_feature?.image_url || "https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=1600&q=85"}
                alt={solarSlotPhotos.solar_service_feature?.caption || "Solar panels in bright sunlight — illustrative stock photo"}
                fill
                sizes="(max-width: 760px) 100vw, 52vw"
                quality={82}
                unoptimized={(solarSlotPhotos.solar_service_feature?.image_url || "").includes(".supabase.co/storage/")}
                className="ngms-solar-editorial__service-photo"
              />
              <div className="ngms-solar-editorial__service-image-overlay" aria-hidden="true" />
              {solarSlotPhotos.solar_service_feature?.is_stock && <span className="absolute left-3 top-3 z-20 bg-black/80 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-white">Illustrative stock photo</span>}
              <span>HELDERBERG BASIN / WESTERN CAPE</span>
              <strong>CLEAN ENERGY.<br />CLEAR RESULTS.</strong>
              <Link href="/quote?service=Solar%20Panel%20Cleaning" aria-label="Request a solar panel cleaning quote">↗</Link>
            </div>
          </div>
        </div>
        <div className="ngms-solar-editorial__feedback">
          <div className="ngms-solar-editorial__feedback-heading">
            <p className="ngms-solar-editorial__eyebrow">02 / CLIENT FEEDBACK</p>
            <h2>CLIENTS<br />FEEDBACK</h2>
            <p>Professional work. Clear communication. Respect for your property.</p>
            {google.reviewsUri ? <a href={google.reviewsUri} target="_blank" rel="noreferrer">READ GOOGLE REVIEWS ↗</a> : null}
          </div>
          <div className="ngms-solar-editorial__review-grid">
            {realReviews.length > 0 ? realReviews.map((review, index) => (
              <article className="ngms-solar-editorial__review" key={`${review.authorName ?? "client"}-${index}`}>
                <div className="ngms-solar-editorial__review-top">
                  <span className="ngms-solar-editorial__avatar">{(review.authorName || "NG").slice(0, 1).toUpperCase()}</span>
                  <div><strong>{review.authorName || "Google customer"}</strong><span>{review.relativePublishTimeDescription || "Google review"}</span></div>
                </div>
                <p className="ngms-solar-editorial__stars" aria-label={`${review.rating ?? 5} out of 5 stars`}>{"★".repeat(Math.max(0, Math.min(5, review.rating ?? 5)))}</p>
                <p className="ngms-solar-editorial__review-text">{review.text}</p>
              </article>
            )) : (
              [
                ["LOCAL SERVICE", "Serving Strand, Gordon’s Bay and Somerset West with practical maintenance support."],
                ["CLEAR QUOTES", "Written quotations and straightforward communication before work begins."],
                ["CAREFUL WORK", "Non-abrasive solar panel cleaning methods and respect for your property."],
                ["ONE CALL", "Solar cleaning plus multiple property maintenance trades under one point of contact."]
              ].map(([title, description]) => (
                <article className="ngms-solar-editorial__review ngms-solar-editorial__proof" key={title}>
                  <span className="ngms-solar-editorial__proof-mark">✳</span>
                  <strong>{title}</strong>
                  <p className="ngms-solar-editorial__review-text">{description}</p>
                </article>
              ))
            )}
          </div>
        </div>
        <div className="ngms-solar-editorial__talk">
          <p className="ngms-solar-editorial__eyebrow">03 / START A PROJECT</p>
          <h2>Anything in Mind?<br /><span>Let’s Talk</span></h2>
          <a className="ngms-solar-editorial__talk-dot" href="/quote?service=Solar%20Panel%20Cleaning">LET’S TALK <span>↗</span></a>
          <div className="ngms-solar-editorial__ticker" aria-hidden="true">
            <span>RELIABLE PROPERTY CARE</span><b>✳</b><span>HELDERBERG BASIN</span><b>✳</b><span>SOLAR PANEL CLEANING</span><b>✳</b>
          </div>
        </div>
        <div className="ngms-solar-editorial__contact">
          <p className="ngms-solar-editorial__eyebrow">04 / CONTACT NEXTGEN</p>
          <div className="ngms-solar-editorial__contact-title">CONTACT<span>.</span></div>
          <div className="ngms-solar-editorial__contact-bottom">
            <div><p>ONE CALL. ALL SOLUTIONS.</p><a href={whatsappLink("Hi NextGen, I'd like a solar panel cleaning quote. I have ___ panels. Photo attached.")}>WHATSAPP FOR A QUOTE ↗</a></div>
            <div><p>STRAND · GORDON’S BAY<br />SOMERSET WEST · HELDERBERG</p><a href="mailto:info.nextgensolution1@gmail.com">INFO.NEXTGENSOLUTION1@GMAIL.COM</a></div>
            <div><p>MON–SAT / 07:00–19:00</p><a href="tel:+27631387945">+27 63 138 7945</a></div>
          </div>
        </div>
        <div className="ngms-solar-editorial__details" id="solar-details">
          <div className="ngms-solar-editorial__details-copy">
            <p className="ngms-solar-editorial__eyebrow">05 / THE SERVICE</p>
            <h2>KEEP YOUR<br /><span>PANELS CLEAR.</span></h2>
            <p>{s.description}</p>
            <Link className="ngms-solar-editorial__detail-cta" href="/quote?service=Solar%20Panel%20Cleaning">GET A QUOTE ↗</Link>
          </div>
          <div className="ngms-solar-editorial__details-data">
            <h3>WHAT’S INCLUDED</h3>
            {s.whatsIncluded.map((item, index) => <div className="ngms-solar-editorial__included" key={item}><span>{String(index + 1).padStart(2, "0")}</span><p>{item}</p><span>↗</span></div>)}
            <h3 className="ngms-solar-editorial__pricing-title">STRAIGHTFORWARD PRICING</h3>
            <div className="ngms-solar-editorial__pricing">
              {SOLAR_TIERS.map((tier) => <div key={tier.size}><span>{tier.size}</span><strong>{tier.price}</strong></div>)}
            </div>
            <p className="ngms-solar-editorial__pricing-note">Prices exclude VAT. No callout fee in Strand, Gordon’s Bay or Somerset West. R350 callout outside the Helderberg Basin.</p>
          </div>
        </div>
        {s.faqs.length > 0 ? <div className="ngms-solar-editorial__faq">
          <p className="ngms-solar-editorial__eyebrow">06 / GOOD TO KNOW</p>
          <h2>COMMON<br />QUESTIONS<span>?</span></h2>
          <div>{s.faqs.map((faq) => <article key={faq.question}><h3>{faq.question}</h3><p>{faq.answer}</p></article>)}</div>
        </div> : null}
        <div className="ngms-solar-editorial__areas">
          <p className="ngms-solar-editorial__eyebrow">07 / SERVICE AREA</p>
          <h2>LOCAL KNOWLEDGE.<br />PRACTICAL SERVICE.</h2>
          <div>{areaLinks.map((sub) => <Link key={sub.slug} href={areaHref(sub.slug)}>{sub.name} <span>↗</span></Link>)}</div>
        </div>
      </section>
    );
  }

  return (
    <main className="ngms-service-detail-reference">
      <section className="ngms-sd-hero">
        {image ? <div className="ngms-sd-hero__image" aria-hidden="true"><Image src={image} alt="" fill priority sizes="(max-width: 768px) 100vw, 100vw" unoptimized /><span className="absolute right-4 top-4 z-20 bg-black/75 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-white">Illustrative stock photo</span></div> : null}
        <div className="ngms-sd-hero__veil" aria-hidden="true" />
        <div className="ngms-sd-hero__inner">
          <div className="ngms-sd-hero__copy">
            <Link href="/services" className="ngms-sd-back">← All services</Link>
            <p className="ngms-sd-eyebrow"><span /> NGMS · Helderberg Basin</p>
            <h1>{s.name}</h1>
            <p className="ngms-sd-tagline">{s.tagline}</p>
            <p className="ngms-sd-summary">{s.description}</p>
            <div className="ngms-sd-actions">
              <Link href={`/quote?service=${encodeURIComponent(s.name)}`} className="ngms-sd-button ngms-sd-button--orange">Request a quote <span aria-hidden="true">↗</span></Link>
              <a href={whatsappLink(`Hi NextGen, I'd like a quote for ${s.name.toLowerCase()}.`)} className="ngms-sd-button ngms-sd-button--outline">WhatsApp us <span aria-hidden="true">↗</span></a>
            </div>
            <div className="ngms-sd-proof"><span>01 / LOCAL TEAM</span><span>02 / WRITTEN QUOTES</span><span>03 / ONE POINT OF CONTACT</span></div>
          </div>
          <div className="ngms-sd-hero__visual" aria-hidden="true">
            <div className="ngms-sd-icon-frame"><NgmsIcon name={s.slug} className="h-20 w-20 md:h-28 md:w-28" /></div>
            <span className="ngms-sd-visual-label">PROPERTY CARE / {String(SERVICES.findIndex((item) => item.slug === s.slug) + 1).padStart(2, "0")}</span>
          </div>
        </div>
        <div className="ngms-sd-hero__foot"><span>ONE CALL. ALL SOLUTIONS.</span><span>STRAND · GORDON'S BAY · SOMERSET WEST</span></div>
      </section>

      <div className="ngms-sd-trust"><TrustBadges /></div>

      <section className="ngms-sd-intro">
        <div className="ngms-sd-section-label"><span>01</span><span>THE SERVICE</span></div>
        <div className="ngms-sd-intro__body">
          <h2>Practical work.<br /><em>Properly managed.</em></h2>
          <div><p>{s.description}</p><p>One local point of contact, clear communication and a written quote before work starts. We coordinate the details so you can focus on the property.</p></div>
        </div>
      </section>

      <section className="ngms-sd-pricing">
        <div className="ngms-sd-section-label"><span>02</span><span>{isSolar ? "STRAIGHTFORWARD PRICING" : "SCOPE & DELIVERY"}</span></div>
        {isSolar ? (
          <div className="ngms-sd-pricing__layout">
            <div><p className="ngms-sd-eyebrow">Solar panel cleaning</p><h2>Know where<br />you stand.</h2><p>Send a roof photo and your panel count on WhatsApp. We’ll confirm a price for your property, usually the same day.</p><a className="ngms-sd-text-link" href={whatsappLink("Hi NextGen, I'd like a solar panel cleaning quote. I have ___ panels. Photo attached.")}>Send a photo for a quote ↗</a></div>
            <div className="ngms-sd-price-table"><div className="ngms-sd-price-table__head"><span>Panel / job size</span><span>Price</span></div>{SOLAR_TIERS.map((tier) => <div className="ngms-sd-price-table__row" key={tier.size}><span>{tier.size}</span><strong>{tier.price}</strong></div>)}<p>Prices exclude VAT. No callout fee in Strand, Gordon’s Bay or Somerset West. R350 callout outside the Helderberg Basin. Maintenance plans every 4–6 months qualify for 15% off and priority booking.</p></div>
          </div>
        ) : (
          <div className="ngms-sd-pricing__layout"><div><p className="ngms-sd-eyebrow">Scope before work</p><h2>Quote first.<br />Work agreed.</h2></div><div className="ngms-sd-quote-note"><p>Prices exclude VAT. Many jobs can be assessed from WhatsApp photos. Larger or more complex work receives a site assessment and a written quote before work begins.</p><Link href={`/quote?service=${encodeURIComponent(s.name)}`} className="ngms-sd-text-link">Tell us about your job ↗</Link></div></div>
        )}
      </section>

      <section className="ngms-sd-included">
        <div className="ngms-sd-section-label"><span>03</span><span>WHAT'S INCLUDED</span></div>
        <div>{s.whatsIncluded.map((item, index) => <div className="ngms-sd-inclusion-row" key={item}><span>{String(index + 1).padStart(2, "0")}</span><p>{item}</p><b aria-hidden="true">↗</b></div>)}</div>
      </section>

      {s.faqs.length > 0 ? <section className="ngms-sd-faq"><div className="ngms-sd-section-label"><span>04</span><span>COMMON QUESTIONS</span></div><div className="ngms-sd-faq__layout"><h2>Good to<br />know.</h2><div>{s.faqs.map((faq) => <details className="ngms-sd-faq-item" key={faq.question}><summary>{faq.question}<span aria-hidden="true">+</span></summary><p>{faq.answer}</p></details>)}</div></div></section> : null}

      <section className="ngms-sd-areas"><div><p className="ngms-sd-eyebrow">Close to home</p><h2>Serving the<br /><em>Helderberg Basin.</em></h2><p>Local maintenance support for homes, complexes and light commercial properties.</p></div><div className="ngms-sd-area-links">{areaLinks.map((sub) => <Link key={sub.slug} href={areaHref(sub.slug)}>{sub.name}<span aria-hidden="true">↗</span></Link>)}</div></section>

      <section className="ngms-sd-final"><div><p className="ngms-sd-eyebrow">NEXT STEP / 05</p><h2>Let's get it<br /><em>sorted.</em></h2><p>Tell us what your property needs. We’ll help define the scope and next steps.</p></div><div className="ngms-sd-final__actions"><Link href={`/quote?service=${encodeURIComponent(s.name)}`} className="ngms-sd-button ngms-sd-button--orange">Get a written quote <span aria-hidden="true">↗</span></Link><Link href="/services" className="ngms-sd-button ngms-sd-button--outline">Explore all services <span aria-hidden="true">↗</span></Link></div></section>
    </main>
  );
}
