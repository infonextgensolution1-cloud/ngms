import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SERVICES, getService } from "@/lib/services";
import { SUBURBS, getSuburb } from "@/lib/suburbs";
import { SITE } from "@/lib/site";

// One thin, genuinely local page per service x suburb combination —
// catches long-tail searches like "solar panel cleaning strand" or
// "waterproofing gordon's bay" that a single generic services page won't rank for.
export function generateStaticParams() {
  return SERVICES.flatMap((s) => SUBURBS.map((sub) => ({ slug: s.slug, suburb: sub.slug })));
}

export function generateMetadata({
  params,
}: {
  params: { slug: string; suburb: string };
}): Metadata {
  const s = getService(params.slug);
  const sub = getSuburb(params.suburb);
  if (!s || !sub) return {};
  return {
    title: `${s.name} in ${sub.name}`,
    description: `${s.name} in ${sub.name}, ${sub.region} — ${s.price}. Free written quote from NextGen Solar & Maintenance Solutions.`,
  };
}

export default function ServiceSuburbPage({
  params,
}: {
  params: { slug: string; suburb: string };
}) {
  const s = getService(params.slug);
  const sub = getSuburb(params.suburb);
  if (!s || !sub) return notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: s.name,
    provider: {
      "@type": "LocalBusiness",
      name: SITE.legalName,
      telephone: SITE.phone,
      email: SITE.email,
    },
    areaServed: {
      "@type": "Place",
      name: `${sub.name}, Western Cape, South Africa`,
    },
    description: s.summary,
  };

  const otherSuburbs = SUBURBS.filter((x) => x.slug !== sub.slug);

  return (
    <section>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="bg-graphite border-b border-line py-14 px-4 text-center">
        <p className="kicker">{sub.region}</p>
        <h1 className="text-3xl md:text-5xl">
          {s.name} in {sub.name}
        </h1>
        <p className="text-mist mt-2">{s.tag} · {s.price}</p>
      </div>

      <div className="wrap max-w-[720px] py-10">
        <p className="text-mist leading-relaxed">{s.summary}</p>
        <p className="text-mist leading-relaxed mt-4">{sub.blurb}</p>
        <p className="text-mist leading-relaxed mt-4">{s.body}</p>

        <h2 className="text-xl mt-8 mb-3">Pricing guide</h2>
        <ul className="space-y-2">
          {s.pricingNotes.map((p) => (
            <li key={p} className="card !py-3 !px-4 text-sm text-mist">{p}</li>
          ))}
        </ul>
        <p className="text-mist text-xs mt-3">Prices exclude VAT. Free written quote after a site visit.</p>
        <p className="text-orange text-sm font-semibold mt-2">{sub.calloutNote}</p>

        {s.seasonalNote && (
          <p className="mt-6 border border-line rounded-lg p-4 text-sm text-mist">
            <span className="text-orange font-semibold">Seasonal note: </span>
            {s.seasonalNote}
          </p>
        )}

        <p className="mt-8">
          <Link
            href={`/quote?service=${encodeURIComponent(s.name)}&area=${encodeURIComponent(sub.name)}`}
            className="btn"
          >
            Get A Quote for {sub.name}
          </Link>
        </p>

        <div className="mt-12 pt-8 border-t border-line">
          <h2 className="text-lg mb-3">{s.name} in other areas we serve</h2>
          <div className="flex flex-wrap gap-2">
            {otherSuburbs.map((o) => (
              <Link
                key={o.slug}
                href={`/services/${s.slug}/${o.slug}`}
                className="text-sm px-3 py-1.5 rounded-full border border-line text-mist hover:border-orange hover:text-orange transition-colors"
              >
                {o.name}
              </Link>
            ))}
          </div>
          <p className="mt-6">
            <Link href={`/services/${s.slug}`} className="text-blue font-bold">
              ← Back to {s.name} overview
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
