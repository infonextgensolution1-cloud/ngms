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
  title: "Services | NextGen Maintenance Solutions",
  description: "Solar panel cleaning and 11 more property maintenance trades coordinated by one local team across Strand, Gordon's Bay and Somerset West.",
};

const PRICING: Record<string, string> = {
  "solar-panel-cleaning": "From R550", painting: "From R75/m²", waterproofing: "From R180/m²",
  paving: "From R280/m²", plumbing: "From R850", electrical: "From R950",
  "pool-fibre-lining": "From R450/m²", "high-pressure-cleaning": "From R25/m²",
  "rubble-removal": "From R1 800/load", "steelwork-welding": "From R650/hour",
  handyman: "From R380/hour", "subcontractor-work": "Custom quote",
};
const FALLBACK_IMAGES: Record<string, string> = {
  "solar-panel-cleaning": "https://dfwwpqtsbaytfqptancj.supabase.co/storage/v1/object/public/gallery-photos/1788906733722-ig0pgfcjwv.jpg",
};
const HERO_IMAGE = FALLBACK_IMAGES["solar-panel-cleaning"];

export default async function ServicesPage() {
  const dbImages = await getServiceImages();
  const images = { ...FALLBACK_IMAGES, ...dbImages };
  return (
    <main className="bg-[#080808] text-[#F4F3EF]">
      <section className="relative isolate overflow-hidden border-b-[5px] border-[#B4F000] bg-[#080808]">
        <div className="absolute inset-y-0 right-0 -z-20 hidden w-[48%] lg:block">
          <Image src={HERO_IMAGE} alt="" fill priority sizes="48vw" unoptimized className="object-cover opacity-65 grayscale" />
        </div>
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,#080808_0%,#080808_50%,rgba(8,8,8,.55)_100%)]" />
        <div className="mx-auto grid min-h-[570px] max-w-[1440px] gap-10 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[1.1fr_.9fr] lg:items-end lg:px-12">
          <div>
            <p className="mb-6 flex items-center gap-3 font-mono text-[11px] uppercase tracking-[.22em] text-[#B4F000]"><span className="h-2 w-2 rounded-full bg-[#B4F000]" /> NGMS / SERVICE DIRECTORY / HELDERBERG</p>
            <h1 className="max-w-4xl text-[clamp(3.6rem,8.7vw,8.2rem)] font-black uppercase leading-[.78] tracking-[-.075em]">One call.<br/><span className="text-[#B4F000]">All</span> solutions.</h1>
            <p className="mt-8 max-w-xl text-base leading-relaxed text-white/70 sm:text-lg">Twelve practical maintenance trades. One accountable local team. From solar panel cleaning to planned property repairs, keep the work coordinated and the next step clear.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/quote" className="inline-flex min-h-12 items-center gap-5 bg-[#FE7733] px-5 py-3 text-sm font-extrabold uppercase text-black transition hover:bg-[#B4F000]">Request a quote <span aria-hidden>↗</span></Link>
              <Link href="#service-range" className="inline-flex min-h-12 items-center gap-5 border border-white/40 px-5 py-3 text-sm font-bold uppercase transition hover:border-[#B4F000] hover:text-[#B4F000]">Explore services <span aria-hidden>↓</span></Link>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:pb-2">
            <div className="flex aspect-square flex-col justify-between bg-[#D8D8D5] p-4 text-black sm:p-5"><span className="font-mono text-[10px]">01 / COVERAGE</span><strong className="text-4xl font-black sm:text-5xl">12</strong><span className="text-xs font-bold uppercase">Maintenance trades</span></div>
            <div className="flex aspect-square flex-col justify-between bg-[#FE7733] p-4 text-black sm:p-5"><span className="font-mono text-[10px]">02 / PLANNING</span><span className="text-4xl font-black sm:text-5xl">↗</span><span className="text-xs font-bold uppercase">Written quotes</span></div>
            <div className="col-span-2 flex min-h-[130px] flex-col justify-between bg-[#B4F000] p-4 text-black sm:col-span-1 sm:aspect-square sm:p-5"><span className="font-mono text-[10px]">03 / LOCAL TEAM</span><strong className="text-2xl font-black uppercase leading-none sm:text-3xl">Helderberg<br/>Basin</strong><span className="text-xs font-bold uppercase">Free site assessment</span></div>
          </div>
        </div>
      </section>

      <section className="bg-[#DADAD7] px-5 py-14 text-[#171717] sm:px-8 sm:py-20 lg:px-12">
        <div className="mx-auto grid max-w-[1440px] gap-8 lg:grid-cols-[.9fr_1.1fr] lg:items-end">
          <div><p className="mb-4 font-mono text-xs font-bold uppercase tracking-[.2em]">01 / A better way to maintain</p><h2 className="max-w-2xl text-5xl font-black uppercase leading-[.86] tracking-[-.06em] sm:text-7xl">The right trade.<br/><span className="text-[#FE4B13]">One contact.</span></h2></div>
          <p className="max-w-2xl text-base leading-relaxed text-black/75 sm:text-lg">Book one job or coordinate several. We assess your property, agree the scope and provide a written quote before work starts. Serving Strand, Gordon’s Bay, Somerset West and the wider Helderberg area.</p>
        </div>
      </section>

      <section id="service-range" className="scroll-mt-20 bg-[#DADAD7] px-5 pb-16 sm:px-8 sm:pb-24 lg:px-12">
        <div className="mx-auto max-w-[1440px]">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-black/25 pb-4"><div><p className="font-mono text-xs font-bold uppercase tracking-[.2em]">02 / Service directory</p><h2 className="mt-2 text-3xl font-black uppercase leading-none tracking-[-.045em] sm:text-5xl">Find the service you need.</h2></div><span className="font-mono text-xs uppercase">12 services / 01 team</span></div>
          <article className="mb-4 grid overflow-hidden border border-black/20 bg-[#F4F3EF] text-black md:grid-cols-[1.05fr_.95fr]">
            <div className="relative min-h-[260px] bg-[#242424]">
              <Image src={images["solar-panel-cleaning"] || HERO_IMAGE} alt="Solar panel cleaning service" fill sizes="(max-width: 768px) 100vw, 50vw" unoptimized className="object-cover" />
              <span className="absolute left-4 top-4 bg-[#B4F000] px-3 py-2 font-mono text-[10px] font-bold uppercase text-black">Featured / 01</span>
            </div>
            <div className="flex flex-col justify-between p-6 sm:p-9"><div><p className="font-mono text-xs font-bold uppercase tracking-[.18em] text-[#D84318]">Solar panel cleaning</p><h3 className="mt-4 text-4xl font-black uppercase leading-[.9] tracking-[-.05em] sm:text-6xl">Let the sun<br/>do its job.</h3><p className="mt-4 max-w-lg text-sm leading-relaxed text-black/70">Professional solar panel cleaning to remove dust and seasonal pollen, with repeat visits planned around your property.</p></div><div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-black/20 pt-4"><strong className="text-lg">{PRICING["solar-panel-cleaning"]}</strong><Link href="/services/solar-panel-cleaning" className="inline-flex items-center gap-3 bg-[#FE4B13] px-4 py-3 text-xs font-extrabold uppercase text-black hover:bg-[#B4F000]">Explore service ↗</Link></div></div>
          </article>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {SERVICES.map((s, i) => (
              <article key={s.slug} className="group flex min-w-0 flex-col border border-black/20 bg-[#F4F3EF] p-4 text-[#171717] transition hover:-translate-y-1 hover:border-[#FE4B13] sm:p-5">
                <div className="mb-4 flex items-center justify-between"><span className="font-mono text-xs font-bold">SERVICE / {String(i + 1).padStart(2,"0")}</span><span className="flex h-10 w-10 items-center justify-center rounded-full border border-black/20 text-xl transition group-hover:border-[#FE4B13] group-hover:bg-[#FE4B13]" aria-hidden>↗</span></div>
                <div className="mb-4 min-w-0 flex-1"><ServiceCard s={s} price={PRICING[s.slug]} image={images[s.slug]} index={i} /></div>
                <Link href={`/services/${s.slug}`} className="flex min-h-11 items-center justify-between border-t border-black/20 pt-3 text-xs font-extrabold uppercase tracking-wide hover:text-[#D84318]"><span>View service details</span><span aria-hidden>↗</span></Link>
              </article>
            ))}
          </div>
          <div className="mt-5 border border-black/20 bg-[#B4F000] p-4 text-black sm:p-5"><TrustBadges /></div>
        </div>
      </section>

      <section className="bg-[#080808] px-5 py-16 text-white sm:px-8 sm:py-24 lg:px-12">
        <div className="mx-auto grid max-w-[1440px] gap-8 lg:grid-cols-[1fr_.8fr] lg:items-end"><div><p className="font-mono text-xs font-bold uppercase tracking-[.2em] text-[#FE7733]">03 / Start with a plan</p><h2 className="mt-5 max-w-3xl text-5xl font-black uppercase leading-[.85] tracking-[-.06em] sm:text-7xl">Good work starts<br/><span className="text-[#B4F000]">with a clear plan.</span></h2><p className="mt-5 max-w-2xl text-white/65">Tell us what your property needs. We’ll help identify the right service, confirm the scope and provide a written quote.</p></div><div className="flex flex-wrap gap-3 lg:justify-end"><Link href="/quote" className="inline-flex min-h-12 items-center gap-4 bg-[#FE7733] px-5 py-3 text-sm font-extrabold uppercase text-black hover:bg-[#B4F000]">Request a site assessment ↗</Link><Link href="/contact" className="inline-flex min-h-12 items-center border border-white/40 px-5 py-3 text-sm font-bold uppercase hover:border-[#B4F000] hover:text-[#B4F000]">Contact NGMS ↗</Link></div></div>
      </section>
      <section className="bg-[#DADAD7] px-5 py-12 text-black sm:px-8 lg:px-12"><div className="mx-auto max-w-[1440px]"><HowItWorks /></div></section>
    </main>
  );
}
