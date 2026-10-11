import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SERVICES, getService } from "@/lib/services";
import { SUBURBS } from "@/lib/suburbs";
import { SOLAR_TIERS, SOLAR_SUBURB_TO_LOCATION } from "@/lib/solar-pricing";
import { whatsappLink } from "@/lib/site";
import TrustBadges from "@/components/TrustBadges";
import NgmsIcon from "@/components/NgmsIcon";
import { getGoogleReviews } from "@/lib/google-reviews";

export function generateStaticParams() {
  return SERVICES.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const s = getService(slug);
  if (!s) return {};
  return {
    title: s.metaTitle || s.name,
    description: s.metaDescription || s.description,
    alternates: { canonical: `/services/${s.slug}` },
  };
}

export default async function ServiceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const s = getService(slug);
  if (!s) return notFound();
  const isSolar = s.slug === "solar-panel-cleaning";
  // Solar has richer per-town pages — link straight to them instead of the thin duplicates.
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
    <section>
      <div className="bg-graphite border-b border-line py-14 px-4 text-center">
        <div className="group flex w-fit mx-auto mb-5 rounded-2xl bg-jet border border-darkgrey p-3 hover:border-orange transition-colors">
          <NgmsIcon name={s.slug} className="h-14 w-14 md:h-16 md:w-16" />
        </div>
        <p className="kicker">Service</p>
        <h1 className="text-3xl md:text-5xl">{s.name}</h1>
        <p className="text-mist mt-2">{s.tagline}</p>
      </div>

      <TrustBadges />

      <div className="wrap max-w-[720px] py-10">
        <p className="text-mist leading-relaxed">{s.description}</p>

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
              Prices exclude VAT. No callout fee in Strand, Gordon&rsquo;s Bay or Somerset West &mdash; R350 callout
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
          </>
        ) : (
          <p className="text-mist text-xs mt-3">
            Prices exclude VAT. Most jobs are priced from WhatsApp photos, usually the same day; bigger jobs get a free
            site visit and a written quote.
          </p>
        )}

        {s.faqs.length > 0 && (
          <div className="mt-8 space-y-4">
            <h2 className="text-xl mb-3">Questions</h2>
            {s.faqs.map((f) => (
              <div key={f.question} className="border-t border-line pt-4">
                <p className="font-semibold text-paper">{f.question}</p>
                <p className="text-mist text-sm mt-1">{f.answer}</p>
              </div>
            ))}
          </div>
        )}

        <p className="mt-8">
          <Link href={`/quote?service=${encodeURIComponent(s.name)}`} className="btn-quote">Get a quote</Link>
        </p>

        <div className="mt-12 pt-8 border-t border-line">
          <h2 className="text-lg mb-3">Areas we serve for {s.name.toLowerCase()}</h2>
          <div className="flex flex-wrap gap-2">
            {areaLinks.map((sub) => (
              <Link
                key={sub.slug}
                href={areaHref(sub.slug)}
                className="text-sm px-3 py-1.5 rounded-full border border-line text-mist hover:border-orange hover:text-orange transition-colors"
              >
                {sub.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
