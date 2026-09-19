import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SERVICES, getService } from "@/lib/services";

export function generateStaticParams() {
  return SERVICES.map((s) => ({ slug: s.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const s = getService(params.slug);
  if (!s) return {};
  return { title: s.name, description: s.summary };
}

export default function ServiceDetailPage({ params }: { params: { slug: string } }) {
  const s = getService(params.slug);
  if (!s) return notFound();

  return (
    <section>
      <div className="bg-graphite border-b border-line py-14 px-4 text-center">
        <p className="kicker">Service</p>
        <h1 className="text-3xl md:text-5xl">{s.name}</h1>
        <p className="text-mist mt-2">{s.tag} · {s.price}</p>
      </div>
      <div className="wrap max-w-[720px] py-10">
        <p className="text-mist leading-relaxed">{s.summary}</p>
        <p className="text-mist leading-relaxed mt-4">{s.body}</p>

        <h2 className="text-xl mt-8 mb-3">Pricing guide</h2>
        <ul className="space-y-2">
          {s.pricingNotes.map((p) => (
            <li key={p} className="card !py-3 !px-4 text-sm text-mist">{p}</li>
          ))}
        </ul>
        <p className="text-mist text-xs mt-3">Prices exclude VAT. Free written quote after a site visit.</p>

        {s.seasonalNote && (
          <p className="mt-6 border border-line rounded-lg p-4 text-sm text-mist">
            <span className="text-orange font-semibold">Seasonal note: </span>
            {s.seasonalNote}
          </p>
        )}

        <p className="mt-8">
          <Link href={`/quote?service=${encodeURIComponent(s.name)}`} className="btn">Get A Quote</Link>
        </p>
      </div>
    </section>
  );
}
