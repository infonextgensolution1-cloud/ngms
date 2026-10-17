import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SERVICES, getService } from "@/lib/services";
import { SUBURBS } from "@/lib/suburbs";
import { SOLAR_TIERS, SOLAR_SUBURB_TO_LOCATION } from "@/lib/solar-pricing";
import { whatsappLink } from "@/lib/site";
import { getServiceImages } from "@/lib/queries";
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
  const serviceImages = await getServiceImages();
  const image = serviceImages[s.slug] || (s.slug === "solar-panel-cleaning"
    ? "https://dfwwpqtsbaytfqptancj.supabase.co/storage/v1/object/public/gallery-photos/1788906733722-ig0pgfcjwv.jpg"
    : null);
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
            <div className="ngms-solar-editorial__service-image" role="img" aria-label="Monochrome solar panel cleaning and rooftop maintenance visual">
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
            <div><p>MON–SAT / 07:00–17:00</p><a href="tel:+27631387945">+27 63 138 7945</a></div>
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
    <main className="ngms-service-detail-reference">
      <section className="ngms-sd-hero">
        {image ? (
          <div className="ngms-sd-hero__image" aria-hidden="true">
            <Image src={image} alt="" fill priority sizes="(max-width: 768px) 100vw, 100vw" unoptimized />
          </div>
        ) : null}
        <div className="ngms-sd-hero__veil" aria-hidden="true" />
        <div className="ngms-sd-hero__inner">
          <div className="ngms-sd-hero__copy">
            <Link href="/services" className="ngms-sd-back">← All services</Link>
            <p className="ngms-sd-eyebrow"><span /> NGMS · Helderberg Basin</p>
            <h1>{s.name}</h1>
            <p className="ngms-sd-tagline">{s.tagline}</p>
            <p className="ngms-sd-summary">{s.description}</p>
            <div className="ngms-sd-actions">
              <Link href={`/quote?service=${encodeURIComponent(s.name)}`} className="ngms-sd-button ngms-sd-button--orange">Request a quote <span aria-hidden>↗</span></Link>
              <a href={whatsappLink(`Hi NextGen, I'd like a quote for ${s.name.toLowerCase()}.`)} className="ngms-sd-button ngms-sd-button--outline">WhatsApp us <span aria-hidden>↗</span></a>
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
      <section className="ngms-sd-intro">
        <div className="ngms-sd-section-label"><span>01</span><span>THE SERVICE</span></div>
        <div className="ngms-sd-intro__body">
          <h2>Practical work.<br /><em>Properly managed.</em></h2>
          <div><p>{s.description}</p><p>One local point of contact, clear communication and a written quote before work starts. We coordinate the details so you can focus on the property.</p></div>
        </div>
      </section>

        <h2 className="text-xl mt-8 mb-3">What&rsquo;s included</h2>
        <ul className="space-y-2">
          {s.whatsIncluded.map((p) => (
            <li key={p} className="card !py-3 !px-4 text-sm text-mist">{p}</li>
          ))}
        </ul>
        {isSolar ? (
          <>
            <h2 className="text-xl mt-8 mb-3">Pricing</h2>
            <div className="overflow-x-auto rounded-card border border-line">
              <table className="w-full text-sm">
                <tbody>
                  {SOLAR_TIERS.map((t) => (
                    <tr key={t.size} className="border-t border-line first:border-t-0">
                      <td className="px-4 py-3 text-mist">{t.size}</td>
                      <td className="px-4 py-3 font-bold text-orange">{t.price}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-mist text-xs mt-3">
              No callout fee in Strand, Gordon&rsquo;s Bay or Somerset West &mdash; R350 callout
              outside the Helderberg (Overberg, Stellenbosch, Paarl, Worcester, Cape Town). Maintenance plan (every 4&ndash;6 months) gets 15% off with priority booking.
            </p>
            <div className="card mt-6 text-center">
              <p className="font-semibold text-paper">No site visit needed for most homes</p>
              <p className="text-mist text-sm mt-1">
                WhatsApp us a photo of your roof and the number of panels &mdash; we&rsquo;ll send a fixed price, usually
                the same day.
              </p>
              <a
                href={whatsappLink("Hi NextGen, I'd like a solar panel cleaning quote. I have ___ panels. Photo attached.")}
                className="btn-wa inline-block mt-4"
              >
                WhatsApp a photo for a quote
              </a>
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
      {isSolar ? (
        <section className="ngms-sd-pricing">
          <div className="ngms-sd-section-label"><span>03</span><span>STRAIGHTFORWARD PRICING</span></div>
          <div className="ngms-sd-pricing__layout">
            <div><p className="ngms-sd-eyebrow">Solar panel cleaning</p><h2>Know where<br />you stand.</h2><p>Send a roof photo and your panel count on WhatsApp. We’ll confirm a price for your property, usually the same day.</p><a className="ngms-sd-text-link" href={whatsappLink("Hi NextGen, I'd like a solar panel cleaning quote. I have ___ panels. Photo attached.")}>Send a photo for a quote ↗</a></div>
            <div className="ngms-sd-price-table"><div className="ngms-sd-price-table__head"><span>Panel / job size</span><span>Price</span></div>{SOLAR_TIERS.map((tier) => <div className="ngms-sd-price-table__row" key={tier.size}><span>{tier.size}</span><strong>{tier.price}</strong></div>)}<p>Prices exclude VAT. No callout fee in Strand, Gordon’s Bay or Somerset West. R350 callout outside the Helderberg Basin. Maintenance plans every 4–6 months qualify for 15% off and priority booking.</p></div>
          </div>
        </section>
      ) : (
        <section className="ngms-sd-pricing ngms-sd-pricing--simple">
          <div className="ngms-sd-section-label"><span>03</span><span>QUOTING & DELIVERY</span></div>
          <div className="ngms-sd-pricing__layout"><div><p className="ngms-sd-eyebrow">Scope before work</p><h2>Quote first.<br />Work agreed.</h2></div><div className="ngms-sd-quote-note"><p>Prices exclude VAT. Many jobs can be assessed from WhatsApp photos. Larger or more complex work receives a site assessment and a written quote before work begins.</p><Link href={`/quote?service=${encodeURIComponent(s.name)}`} className="ngms-sd-text-link">Tell us about your job ↗</Link></div></div>
        </section>
      )}

      {s.faqs.length > 0 ? <section className="ngms-sd-faq"><div className="ngms-sd-section-label"><span>04</span><span>COMMON QUESTIONS</span></div><div className="ngms-sd-faq__layout"><h2>Good to<br />know.</h2><div>{s.faqs.map((faq) => <details className="ngms-sd-faq-item" key={faq.question}><summary>{faq.question}<span aria-hidden>+</span></summary><p>{faq.answer}</p></details>)}</div></div></section> : null}

      <section className="ngms-sd-areas"><div><p className="ngms-sd-eyebrow">Close to home</p><h2>Serving the<br /><em>Helderberg Basin.</em></h2><p>Local maintenance support for homes, complexes and light commercial properties.</p></div><div className="ngms-sd-area-links">{areaLinks.map((sub) => <Link key={sub.slug} href={areaHref(sub.slug)}>{sub.name}<span aria-hidden>↗</span></Link>)}</div></section>

      <section className="ngms-sd-final"><div><p className="ngms-sd-eyebrow">NEXT STEP / 05</p><h2>Let's get it<br /><em>sorted.</em></h2><p>Tell us what your property needs. We’ll help define the scope and next steps.</p></div><div className="ngms-sd-final__actions"><Link href={`/quote?service=${encodeURIComponent(s.name)}`} className="ngms-sd-button ngms-sd-button--orange">Get a written quote <span aria-hidden>↗</span></Link><Link href="/services" className="ngms-sd-button ngms-sd-button--outline">Explore all services <span aria-hidden>↗</span></Link></div></section>
    </main>
  );
}
