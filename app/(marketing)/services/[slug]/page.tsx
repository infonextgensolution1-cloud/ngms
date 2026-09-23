import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SERVICES, getService } from "@/lib/services";
import { SUBURBS } from "@/lib/suburbs";
import { SOLAR_TIERS, SOLAR_SUBURB_TO_LOCATION } from "@/lib/solar-pricing";
import { whatsappLink } from "@/lib/site";
import TrustBadges from "@/components/TrustBadges";

export function generateStaticParams() {
  return SERVICES.map((s) => ({ slug: s.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const s = getService(params.slug);
  if (!s) return {};
  return { title: s.metaTitle || s.name, description: s.metaDescription || s.description };
}

export default function ServiceDetailPage({ params }: { params: { slug: string } }) {
  const s = getService(params.slug);
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

  return (
    <section>
      <div className="bg-graphite border-b border-line py-14 px-4 text-center">
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
              Prices exclude VAT. No callout fee in Strand, Gordon&rsquo;s Bay or Somerset West &mdash; R350 in the
              Overberg. Maintenance plan (every 4&ndash;6 months) gets 15% off with priority booking.
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
          <p className="text-mist text-xs mt-3">Prices exclude VAT. Free written quote after a site visit.</p>
        )}

        {s.faqs.length > 0 && (
          <div className="mt-8 space-y-4">
            <h2 className="text-xl mb-3">FAQs</h2>
            {s.faqs.map((f) => (
              <div key={f.question} className="border-t border-line pt-4">
                <p className="font-semibold text-paper">{f.question}</p>
                <p className="text-mist text-sm mt-1">{f.answer}</p>
              </div>
            ))}
          </div>
        )}

        <p className="mt-8">
          <Link href={`/quote?service=${encodeURIComponent(s.name)}`} className="btn-quote">Get A Quote</Link>
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
