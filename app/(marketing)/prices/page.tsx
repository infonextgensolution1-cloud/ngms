import Link from "next/link";
import type { Metadata } from "next";
import { SERVICES } from "@/lib/services";

export const metadata: Metadata = {
  title: "Price List",
  description: "Starting rates for Strand, Gordon's Bay & Somerset West. All prices exclude VAT.",
};

const PRICING: Record<string, string> = {
  "solar-panel-cleaning": "From R550",
  painting: "From R75/m²",
  waterproofing: "From R180/m²",
  paving: "From R280/m²",
  plumbing: "From R850",
  electrical: "From R950",
  "pool-fibre-lining": "From R450/m²",
  "high-pressure-cleaning": "From R25/m²",
  "rubble-removal": "From R1 800/load",
  "steelwork-welding": "From R650/hour",
  handyman: "From R380/hour",
  "subcontractor-work": "Custom quote",
};

export default function PricesPage() {
  return (
    <section>
      <div className="bg-graphite border-b border-darkgrey py-14 px-4 text-center">
        <p className="text-orange text-xs tracking-[0.2em] uppercase font-bold mb-3 font-heading">Catalog</p>
        <h1 className="font-heading font-bold text-4xl md:text-5xl text-paper uppercase">Price List</h1>
        <p className="text-mist mt-3">
          Starting rates for Strand, Gordon&rsquo;s Bay &amp; Somerset West. All prices exclude VAT.
        </p>
      </div>
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="grid gap-3">
          {SERVICES.map((s) => (
            <div
              key={s.slug}
              className="bg-cardgrey border border-darkgrey rounded-card p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
            >
              <div>
                <h3 className="font-heading font-semibold text-paper">{s.name}</h3>
                <p className="text-mist text-sm">{s.tagline}</p>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <span className="text-orange font-heading font-bold text-sm">{PRICING[s.slug]}</span>
                <Link href={`/services/${s.slug}`} className="text-blue text-sm font-semibold">
                  Details →
                </Link>
              </div>
            </div>
          ))}
        </div>
        <p className="text-mist text-sm mt-8">
          NGX10 — 10% off your first booking on any service except solar panel cleaning. Free written quote after a
          site visit. Free callout inside the Helderberg Basin; R350 out-of-basin callout for the Overberg.
        </p>
        <p className="mt-6">
          <Link
            href="/quote"
            className="inline-block bg-purple hover:bg-purple-dark text-white font-bold text-sm px-6 py-3 rounded-btn"
          >
            Get A Quote
          </Link>
        </p>
      </div>
    </section>
  );
}
