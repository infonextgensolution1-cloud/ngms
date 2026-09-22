import type { Metadata } from "next";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with NextGen Solar & Maintenance Solutions.",
};

export default function ContactPage() {
  return (
    <section>
      <div className="bg-graphite border-b border-line py-14 px-4 text-center">
        <p className="kicker">Get in touch</p>
        <h1 className="text-3xl md:text-5xl">Contact {SITE.shortName}</h1>
      </div>
      <div className="wrap py-10 max-w-[800px] grid sm:grid-cols-2 gap-4">
        <a className="card" href={`tel:${SITE.phone}`}>
          <h3 className="text-lg">{SITE.phoneDisplay}</h3>
          <p className="text-mist">Call or WhatsApp</p>
        </a>
        <a className="card" href={`mailto:${SITE.email}`}>
          <h3 className="text-base break-all">{SITE.email}</h3>
          <p className="text-mist">Email the desk</p>
        </a>
        <div className="card sm:col-span-2">
          <h3 className="text-lg">Service area</h3>
          <p className="text-mist mt-2">Strand · Gordon&rsquo;s Bay · Somerset West</p>
          <p className="text-mist mt-1">
            Also taking work in the Overberg (Kleinmond, Grabouw, Elgin, Bot River) — R350 out-of-basin
            callout fee applies.
          </p>
          <p className="text-mist mt-1">Mon – Sat: 07:00 – 18:00</p>
        </div>
      </div>
    </section>
  );
}
