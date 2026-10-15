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
          </>
        ) : (
          <p className="text-mist text-xs mt-3">
            Prices exclude VAT. Most jobs are priced from WhatsApp photos, usually the same day; bigger jobs get a free
            site visit and a written quote.
          </p>
        )}

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
