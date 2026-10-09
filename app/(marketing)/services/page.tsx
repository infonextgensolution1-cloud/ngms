import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import ServiceCard from "@/components/ServiceCard";
import TrustBadges from "@/components/TrustBadges";
import HowItWorks from "@/components/HowItWorks";
import { SERVICES } from "@/lib/services";
import { getServiceImages } from "@/lib/queries";

export const revalidate = 60;

export const metadata: Metadata = {
  alternates: { canonical: "/services" },
  title: "Services",
  description:
    "12 trade services, one team — solar panel cleaning, painting, waterproofing, paving, plumbing, electrical and more across Strand, Gordon's Bay and Somerset West.",
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

const FALLBACK_IMAGES: Record<string, string> = {
  "solar-panel-cleaning":
    "https://dfwwpqtsbaytfqptancj.supabase.co/storage/v1/object/public/gallery-photos/1788906733722-ig0pgfcjwv.jpg",
};

const SERVICE_HERO_IMAGE =
  "https://dfwwpqtsbaytfqptancj.supabase.co/storage/v1/object/public/gallery-photos/1788906733722-ig0pgfcjwv.jpg";

export default async function ServicesPage() {
  const dbImages = await getServiceImages();
  const images = { ...FALLBACK_IMAGES, ...dbImages };

  return (
    <main className="ngms-services-page">
      <section className="ngms-services-hero relative isolate overflow-hidden bg-jet text-paper">
        <div className="absolute inset-0 -z-20">
          <Image
            src={SERVICE_HERO_IMAGE}
            alt=""
            fill
            priority
            sizes="100vw"
            unoptimized
            className="object-cover object-center"
          />
        </div>
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-jet via-jet/85 to-jet/25" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-jet/95 via-jet/10 to-jet/40" />
        <div className="mx-auto flex min-h-[580px] max-w-7xl flex-col justify-end px-5 pb-12 pt-24 sm:min-h-[660px] sm:px-8 sm:pb-16 lg:min-h-[720px] lg:px-12 lg:pb-20">
          <p className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.24em] text-orange">
            <span className="h-2 w-2 bg-orange" aria-hidden />
            One accountable team · Helderberg Basin
          </p>
          <h1 className="max-w-4xl font-heading text-5xl font-bold uppercase leading-[0.88] tracking-[-0.045em] sm:text-7xl lg:text-8xl">
            One call.
            <span className="block text-paper">All solutions.</span>
            <span className="block text-transparent [-webkit-text-stroke:1px_rgba(255,255,255,.72)]">
              Built for your property.
            </span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-white/80 sm:text-lg">
            Solar panel cleaning and 11 more maintenance trades, coordinated by one local team
            serving Strand, Gordon&apos;s Bay and Somerset West.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link href="/quote" className="btn btn-quote">
              Get a quote <span aria-hidden>↗</span>
            </Link>
            <Link href="#service-range" className="btn btn-outline border-white/50 text-white hover:border-orange">
              Explore services <span aria-hidden>↓</span>
            </Link>
          </div>
          <div className="mt-12 grid max-w-3xl grid-cols-3 border border-white/20 bg-black/25 backdrop-blur-sm">
            {[
              ["12", "maintenance trades"],
              ["FREE", "site assessment"],
              ["LOCAL", "Helderberg team"],
            ].map(([value, label]) => (
              <div key={label} className="border-r border-white/15 px-3 py-4 last:border-r-0 sm:px-5">
                <p className="font-heading text-xl font-bold uppercase sm:text-2xl">{value}</p>
                <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-white/65 sm:text-xs">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="ngms-services-intro bg-fog px-5 py-16 text-graphite sm:px-8 sm:py-24 lg:px-12">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-2 lg:items-end">
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-ember-deep">A coordinated approach</p>
            <h2 className="max-w-2xl font-heading text-5xl font-bold uppercase leading-[0.9] tracking-[-0.04em] sm:text-6xl lg:text-7xl">
              One team.
              <span className="block text-transparent [-webkit-text-stroke:1px_rgba(37,40,43,.55)]">Every detail.</span>
            </h2>
          </div>
          <div className="max-w-xl lg:justify-self-end">
            <p className="text-base leading-relaxed text-slate sm:text-lg">
              From a seasonal solar panel clean to planned property maintenance, NGMS brings
              practical trades together under one point of contact — with a free site assessment
              and a written quote before work starts.
            </p>
            <Link href="/quote" className="mt-5 inline-flex items-center gap-2 border-b-2 border-orange pb-1 text-sm font-bold uppercase tracking-wide text-graphite">
              Plan your next job <span aria-hidden>↗</span>
            </Link>
          </div>
        </div>
      </section>

      <section id="service-range" className="ngms-services-range bg-fog px-5 pb-16 sm:px-8 sm:pb-24 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="mb-7 grid gap-3 border-b border-concrete pb-4 sm:grid-cols-[1fr_auto] sm:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-ember-deep">The service range</p>
              <h2 className="mt-2 font-heading text-3xl font-bold uppercase sm:text-4xl">Practical work. Properly managed.</h2>
            </div>
            <p className="text-sm text-slate">12 trades · One point of contact</p>
          </div>

          <div className="ngms-services-featured-grid grid gap-4 lg:grid-cols-[1.35fr_1fr]">
            <article className="ngms-services-featured relative isolate flex min-h-[320px] flex-col justify-end overflow-hidden bg-graphite p-6 text-white sm:min-h-[420px] sm:p-9">
              {images["solar-panel-cleaning"] ? (
                <div className="absolute inset-0 -z-20">
                  <Image
                    src={images["solar-panel-cleaning"]}
                    alt="Solar panel cleaning service"
                    fill
                    sizes="(max-width: 1024px) 100vw, 58vw"
                    unoptimized={images["solar-panel-cleaning"].includes(".supabase.co/storage/")}
                    className="object-cover"
                  />
                </div>
              ) : null}
              <div className="absolute inset-0 -z-10 bg-gradient-to-t from-jet via-jet/65 to-jet/10" />
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange">Featured service</p>
              <h3 className="mt-3 max-w-xl font-heading text-4xl font-bold uppercase leading-[0.92] sm:text-5xl">
                Solar panel cleaning
              </h3>
              <p className="mt-3 max-w-lg text-sm leading-relaxed text-white/80">
                Remove built-up dust and seasonal pollen with a professional clean for your solar array.
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-4">
                <span className="text-sm font-bold">{PRICING["solar-panel-cleaning"]}</span>
                <Link href="/services/solar-panel-cleaning" className="inline-flex items-center gap-2 border-b border-orange pb-1 text-xs font-bold uppercase tracking-wide">
                  Explore service <span aria-hidden>↗</span>
                </Link>
              </div>
            </article>
            <div className="ngms-services-secondary grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              {[
                { title: "Painting", text: "Interior, exterior and boundary finishes.", slug: "painting" },
                { title: "Waterproofing", text: "Protect roofs, balconies and vulnerable surfaces.", slug: "waterproofing" },
                { title: "Paving", text: "Neat paving work for entrances, paths and outdoor areas.", slug: "paving" },
              ].map((item, i) => (
                <Link
                  key={item.slug}
                  href={`/services/${item.slug}`}
                  className="ngms-service-feature-row group flex min-h-[104px] items-center justify-between gap-4 border border-concrete bg-paper px-4 py-4 transition-colors hover:border-orange sm:px-5"
                >
                  <div className="flex items-start gap-3">
                    <span className="pt-1 text-xs font-bold text-ember-deep">0{i + 1}</span>
                    <div>
                      <h3 className="font-heading text-xl font-bold uppercase leading-tight sm:text-2xl">{item.title}</h3>
                      <p className="mt-1 text-sm text-slate">{item.text}</p>
                    </div>
                  </div>
                  <span className="shrink-0 text-xl transition-transform group-hover:translate-x-1" aria-hidden>↗</span>
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <TrustBadges />
          </div>
          <div className="ngms-service-cards mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {SERVICES.map((s, i) => (
              <div key={s.slug} className="ngms-service-tile border border-concrete bg-paper p-5 text-graphite sm:p-6">
                <div className="mb-4 flex items-start justify-between gap-4">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-ember-deep">Service {String(i + 1).padStart(2, "0")}</p>
                  <span className="text-lg" aria-hidden>↗</span>
                </div>
                <div className="mb-5">
                  <ServiceCard s={s} price={PRICING[s.slug]} image={images[s.slug]} index={i} />
                </div>
                <Link href={`/services/${s.slug}`} className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-graphite hover:text-ember-deep">
                  View service details <span aria-hidden>↗</span>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-jet px-5 py-16 text-white sm:px-8 sm:py-24 lg:px-12">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-orange">Your property. One call.</p>
            <h2 className="max-w-3xl font-heading text-4xl font-bold uppercase leading-[0.92] sm:text-6xl">
              Maintenance that works around you.
            </h2>
            <p className="mt-5 max-w-2xl text-white/70">
              Serving homeowners, body corporates, security complexes and light commercial properties
              across Strand, Gordon&apos;s Bay and Somerset West.
            </p>
          </div>
          <Link href="/quote" className="btn btn-quote w-fit">Request a site assessment <span aria-hidden>↗</span></Link>
        </div>
      </section>

      <section className="bg-fog px-5 py-12 text-graphite sm:px-8 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <HowItWorks />
        </div>
      </section>
    </main>
  );
}
