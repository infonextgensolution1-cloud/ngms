import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SERVICES, getService } from "@/lib/services";
import { SUBURBS } from "@/lib/suburbs";

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

  return (
    <section>
      <div className="bg-graphite border-b border-line py-14 px-4 text-center">
        <p className="kicker">Service</p>
        <h1 className="text-3xl md:text-5xl">{s.name}</h1>
        <p className="text-mist mt-2">{s.tagline}</p>
      </div>
      <div className="wrap max-w-[720px] py-10">
        <p className="text-mist leading-relaxed">{s.description}</p>

        <h2 className="text-xl mt-8 mb-3">What&rsquo;s included</h2>
        <ul className="space-y-2">
          {s.whatsIncluded.map((p) => (
            <li key={p} className="card !py-3 !px-4 text-sm text-mist">{p}</li>
          ))}
        </ul>
        <p className="text-mist text-xs mt-3">Prices exclude VAT. Free written quote after a site visit.</p>

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
          <Link href={`/quote?service=${encodeURIComponent(s.name)}`} className="btn">Get A Quote</Link>
        </p>

        <div className="mt-12 pt-8 border-t border-line">
          <h2 className="text-lg mb-3">Areas we serve for {s.name.toLowerCase()}</h2>
          <div className="flex flex-wrap gap-2">
            {SUBURBS.map((sub) => (
              <Link
                key={sub.slug}
                href={`/services/${s.slug}/${sub.slug}`}
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
