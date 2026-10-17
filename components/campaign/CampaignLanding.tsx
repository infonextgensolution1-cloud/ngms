import Image from "next/image";
import Link from "next/link";
import { getCampaignService } from "@/lib/campaigns";
import type { CampaignConfig } from "@/lib/campaigns";
import { site, whatsappLink } from "@/lib/site";
import type { GalleryPhoto } from "@/lib/queries";

function waMessage(serviceName: string) {
  return `Hi NextGen, I'd like a ${serviceName.toLowerCase()} quote. I'm in the Helderberg Basin. I'll send photos of the job now.`;
}

export default function CampaignLanding({
  config,
  service,
  heroImage,
  proofPhotos,
}: {
  config: CampaignConfig;
  service: NonNullable<ReturnType<typeof getCampaignService>>;
  heroImage?: string;
  proofPhotos: GalleryPhoto[];
}) {
  const whatsapp = whatsappLink(waMessage(service.name));

  return (
    <main className="bg-jet">
      <section className="relative isolate overflow-hidden border-b border-darkgrey min-h-[620px] flex items-end">
        {heroImage ? (
          <Image
            src={heroImage}
            alt={`${service.name} by NextGen in the Helderberg Basin`}
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-55"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-jet via-jet/80 to-jet/25" />
        <div className="relative z-10 wrap w-full py-14 md:py-20">
          <div className="max-w-4xl">
            <p className="kicker">{config.eyebrow}</p>
            <h1 className="text-4xl sm:text-5xl lg:text-7xl leading-[0.95] max-w-4xl">{config.headline}</h1>
            <p className="text-mist text-base sm:text-lg md:text-xl leading-relaxed mt-6 max-w-3xl">{config.subheadline}</p>
            <div className="flex flex-col sm:flex-row gap-3 mt-8">
              <Link href={`/quote?service=${encodeURIComponent(service.name)}&campaign=${config.slug}`} className="btn-quote">
                {config.primaryCta}
              </Link>
              <a href={whatsapp} target="_blank" rel="noreferrer" className="btn-wa">
                {config.secondaryCta}
              </a>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-8 max-w-3xl">
              {config.proof.map((item) => (
                <div key={item} className="card !bg-jet/80 !border-darkgrey backdrop-blur-sm !p-4">
                  <p className="text-sm font-semibold text-paper">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {config.offer ? (
        <section className="bg-orange text-jet">
          <div className="wrap py-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <p className="font-heading font-bold uppercase tracking-wide text-sm">{config.offer.label}</p>
              <p className="font-semibold mt-1">{config.offer.detail}</p>
            </div>
            <Link href={`/quote?service=${encodeURIComponent(service.name)}&campaign=${config.slug}`} className="btn-jet shrink-0">
              Claim on quote
            </Link>
          </div>
        </section>
      ) : null}

      <section className="wrap py-14 md:py-20">
        <div className="max-w-3xl">
          <p className="kicker">Why this matters</p>
          <h2 className="text-3xl md:text-5xl">A job is only as good as what happens before the finish.</h2>
          <p className="text-mist leading-relaxed mt-5">{service.description}</p>
        </div>
        <div className="grid md:grid-cols-2 gap-8 mt-12">
          <div className="panel p-6 md:p-8">
            <p className="kicker">Common problems</p>
            <ul className="mt-4 space-y-3">
              {config.painPoints.map((item) => (
                <li key={item} className="flex gap-3 text-mist">
                  <span className="text-orange font-bold" aria-hidden="true">+</span>{item}
                </li>
              ))}
            </ul>
          </div>
          <div className="panel p-6 md:p-8">
            <p className="kicker">The NextGen approach</p>
            <ul className="mt-4 space-y-3">
              {config.outcomes.map((item) => (
                <li key={item} className="flex gap-3 text-mist">
                  <span className="text-blue font-bold" aria-hidden="true">✓</span>{item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {proofPhotos.length > 0 ? (
        <section className="bg-graphite border-y border-darkgrey">
          <div className="wrap py-14">
            <div className="flex items-end justify-between gap-4 mb-7">
              <div>
                <p className="kicker">Proof of work</p>
                <h2 className="text-3xl md:text-4xl">Recent {service.name.toLowerCase()} work.</h2>
              </div>
              <Link href="/projects" className="btn-outline hidden sm:inline-flex">View projects</Link>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {proofPhotos.slice(0, 6).map((photo, index) => (
                <figure key={`${photo.image_url}-${index}`} className="group overflow-hidden rounded-card border border-darkgrey bg-cardgrey">
                  <div className="relative aspect-[4/3]">
                    <Image src={photo.image_url} alt={photo.caption || `${service.name} completed work`} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
                  </div>
                  {photo.caption ? <figcaption className="p-3 text-sm text-mist">{photo.caption}</figcaption> : null}
                </figure>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {config.slug === "solar" ? (
        <section className="wrap py-14">
          <div className="panel p-6 md:p-8">
            <p className="kicker">Current solar pricing</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3 mt-5">
              {[
                ["Up to 10 panels", "from R550"],
                ["11–20 panels", "from R950"],
                ["21–30 panels", "from R1 350"],
                ["31–40 panels", "from R1 700"],
                ["41+ panels", "from R50/panel"],
              ].map(([size, price]) => (
                <div key={size} className="card !p-4">
                  <p className="text-mist text-sm">{size}</p>
                  <p className="text-orange font-heading font-bold text-xl mt-2">{price}</p>
                </div>
              ))}
            </div>
            <p className="text-mist text-xs mt-4">No callout fee in Strand, Gordon’s Bay or Somerset West. R350 callout applies outside the Helderberg service area.</p>
          </div>
        </section>
      ) : null}

      <section className="bg-graphite border-y border-darkgrey">
        <div className="wrap py-14 md:py-20">
          <p className="kicker">How it works</p>
          <h2 className="text-3xl md:text-5xl">From first message to finished job.</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
            {config.process.map((step, index) => (
              <div key={step} className="card">
                <span className="text-orange font-heading text-2xl">0{index + 1}</span>
                <p className="font-semibold mt-3">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="wrap py-14 md:py-20">
        <div className="grid lg:grid-cols-[1fr_auto] gap-10 items-end">
          <div>
            <p className="kicker">Built for local properties</p>
            <h2 className="text-3xl md:text-5xl">One call. All solutions.</h2>
            <p className="text-mist mt-4 max-w-2xl leading-relaxed">
              NextGen serves homes, body corporates, security complexes and light commercial properties across the Helderberg Basin. If the job crosses trades, you still have one point of contact.
            </p>
            <div className="flex flex-wrap gap-2 mt-5">
              {config.audience.map((item) => <span key={item} className="px-3 py-1.5 rounded-full border border-darkgrey text-mist text-sm">{item}</span>)}
            </div>
          </div>
          <div className="panel p-6 min-w-[280px]">
            <p className="text-mist text-sm">Core service area</p>
            <p className="font-heading text-xl mt-2">Strand · Gordon’s Bay · Somerset West</p>
            <p className="text-mist text-sm mt-3">No callout fee in the Helderberg Basin. Extended areas are quoted with the applicable R350 callout.</p>
          </div>
        </div>
      </section>

      <section className="bg-orange text-jet">
        <div className="wrap py-12 md:py-16 text-center">
          <p className="font-heading font-bold uppercase tracking-[0.18em] text-sm">Ready when you are</p>
          <h2 className="text-3xl md:text-5xl mt-2">Tell us what needs doing.</h2>
          <p className="max-w-2xl mx-auto mt-4 text-jet/80">Send photos on WhatsApp or request a written quote. We’ll take it from there.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-3 mt-7">
            <Link href={`/quote?service=${encodeURIComponent(service.name)}&campaign=${config.slug}`} className="btn-jet">Request a quote</Link>
            <a href={whatsapp} target="_blank" rel="noreferrer" className="btn-outline-jet">WhatsApp NextGen</a>
          </div>
          <p className="mt-5 text-sm font-semibold">{site.phoneDisplay} · {site.email}</p>
        </div>
      </section>
    </main>
  );
}
