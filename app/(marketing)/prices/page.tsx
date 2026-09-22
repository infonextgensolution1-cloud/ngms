import Link from "next/link";
import type { Metadata } from "next";
import { SERVICES } from "@/lib/services";

export const metadata: Metadata = {
  title: "Price List",
  description: "Starting rates for Strand, Gordon's Bay & Somerset West. All prices exclude VAT.",
};

export default function PricesPage() {
  return (
    <section>
      <div className="bg-graphite border-b border-line py-14 px-4 text-center">
        <p className="kicker">Catalog</p>
        <h1 className="text-3xl md:text-5xl">Price List</h1>
        <p className="text-mist mt-2">Starting rates for Strand, Gordon&rsquo;s Bay &amp; Somerset West. All prices exclude VAT.</p>
      </div>
      <div className="wrap py-10">
        <div className="grid gap-3">
          {SERVICES.map((s) => (
            <div key={s.slug} className="card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h3 className="text-base">{s.name}</h3>
                <p className="text-mist text-sm">{s.tagline}</p>
              </div>
              <div className="flex items-center gap-4">
                <Link href={`/services/${s.slug}`} className="text-blue text-sm font-semibold">Details →</Link>
              </div>
            </div>
          ))}
        </div>
        <p className="text-mist text-sm mt-8">
          NGX10 — 10% off your first booking on any service except solar panel cleaning. Free written quote after a
          site visit. Free callout inside the Helderberg Basin; R350 out-of-basin callout for the Overberg.
        </p>
        <p className="mt-6">
          <Link href="/quote" className="btn">Get A Quote</Link>
        </p>
      </div>
    </section>
  );
}
