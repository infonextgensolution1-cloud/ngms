import Image from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { SITE, whatsappLink } from '@/lib/site'
import { serviceIcon } from '@/lib/service-icons'
import { SOLAR_TIERS } from '@/lib/solar-pricing'
import { FAQS } from '@/lib/faqs'
import SolarRoiCalculator from '@/components/SolarRoiCalculator'

// Homepage sections (Solar Forge). Photos come from Admin → Media, so every
// image here is managed there; each block still looks finished with no photo.

export type Photo = { src: string; caption: string }

function PhotoFill({ photo, sizes, className = '' }: { photo?: Photo; sizes: string; className?: string }) {
  if (!photo?.src) return <div className={`absolute inset-0 bg-graphite ${className}`} />
  return <Image src={photo.src} alt={photo.caption} fill sizes={sizes} quality={70} unoptimized={photo.src.includes(".supabase.co/storage/")} className={`object-cover ${className}`} />
}

function SectionHead({ kicker, title, intro, action }: { kicker: string; title: ReactNode; intro?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-6 mb-10">
      <div className="max-w-2xl">
        <p className="kicker">{kicker}</p>
        <h2 className="text-3xl sm:text-4xl lg:text-[2.75rem] leading-[1.05]">{title}</h2>
        {intro && <p className="text-mist mt-4 text-base sm:text-lg leading-relaxed">{intro}</p>}
      </div>
      {action}
    </div>
  )
}

function Check() {
  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5 shrink-0 text-blue mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M4 10.5l4 4 8-9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/* ---------- SERVICES ---------- */

export function ServicesOverview({
  services,
  images,
}: {
  services: { slug: string; name: string; tagline: string }[]
  images: Record<string, string>
}) {
  return (
    <section className="bg-jet text-paper py-16 sm:py-24 px-4" aria-labelledby="services-title">
      <div className="max-w-6xl mx-auto">
        <SectionHead
          kicker="What we do"
          title={<span id="services-title">Twelve trades. One point of contact.</span>}
          intro="From the roof to the pool, one team quotes, schedules and finishes the work — so you are not coordinating five different contractors."
          action={
            <Link href="/services" className="btn-outline">
              All services
            </Link>
          }
        />
        <div className="mb-7 grid grid-cols-2 sm:grid-cols-4 gap-2" aria-label="Service categories">
          {[
            ['Property', 'Solar, plumbing, electrical'],
            ['Exterior', 'Painting, paving, waterproofing'],
            ['Cleaning', 'Solar, pressure washing, gutters'],
            ['Repairs', 'Steelwork, handyman, rubble removal'],
          ].map(([label, sub]) => (
            <div key={label} className="rounded-panel border border-darkgrey bg-cardgrey/60 px-3 py-3">
              <span className="block font-heading font-semibold text-sm text-paper">{label}</span>
              <span className="block mt-1 text-[11px] leading-snug text-mist">{sub}</span>
            </div>
          ))}
        </div>
        <ul className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {services.map((s, i) => {
            const img = images[s.slug]
            const icon = serviceIcon(s.slug, 'dark')
            const feature = i === 0
            // The last tile spans two columns so the grid closes cleanly (1 feature + 11 tiles).
            const wide = !feature && i === services.length - 1 && services.length % 2 === 0
            return (
              <li key={s.slug} className={feature ? 'col-span-2 row-span-2' : wide ? 'col-span-2' : ''}>
                <Link
                  href={`/services/${s.slug}`}
                  className={`group relative flex h-full flex-col justify-end overflow-hidden rounded-panel border border-darkgrey bg-cardgrey ${
                    feature ? 'min-h-[340px] sm:min-h-[460px]' : 'min-h-[190px] sm:min-h-[220px]'
                  }`}
                >
                  {img && (
                    <>
                      <PhotoFill
                        photo={{ src: img, caption: '' }}
                        sizes={feature ? '(max-width: 1024px) 100vw, 50vw' : '(max-width: 1024px) 50vw, 25vw'}
                        className="transition-transform duration-700 ease-out group-hover:scale-[1.05] opacity-80"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-jet via-jet/60 to-jet/10" />
                    </>
                  )}
                  {icon && (
                    <span aria-hidden className="absolute left-3 top-3 rounded-btn bg-jet/70 p-1.5 backdrop-blur-sm border border-white/10">
                      <img src={icon} alt="" className={feature ? 'h-10 w-10' : 'h-7 w-7'} />
                    </span>
                  )}
                  <span className="relative p-4 sm:p-5">
                    <span className={`block font-heading font-semibold leading-tight ${feature ? 'text-2xl sm:text-3xl' : 'text-base sm:text-lg'}`}>
                      {s.name}
                    </span>
                    <span className={`mt-1 text-paper/70 text-xs sm:text-sm ${feature ? 'block' : 'hidden sm:block'}`}>{s.tagline}</span>
                    {feature && <span className="mt-2 inline-flex rounded-full bg-orange px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-jet">Flagship</span>}
                    <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-blue">
                      View service
                      <span aria-hidden className="transition-transform group-hover:translate-x-1">&rarr;</span>
                    </span>
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}

/* ---------- SOLAR FEATURE ---------- */

export function SolarFeature({ photo }: { photo?: Photo }) {
  return (
    <section className="band-light bg-fog py-16 sm:py-24 px-4" aria-labelledby="solar-title">
      <div className="max-w-6xl mx-auto grid gap-10 lg:grid-cols-12 lg:items-start">
        <div className="lg:col-span-7 min-w-0">
          <p className="kicker">Flagship service · Solar</p>
          <h2 id="solar-title" className="text-3xl sm:text-4xl lg:text-[2.75rem] leading-[1.05]">
            The Solar Forge flagship: clean panels. Clear proof. A measurable next step.
          </h2>
          <p className="text-slate mt-4 text-base sm:text-lg leading-relaxed max-w-xl">
            Salt spray, dust, pollen and bird droppings build up on Helderberg roofs. We clean panels with a gentle soft
            wash — no abrasive pads and no high pressure on the glass — and check the array while we&rsquo;re up there.
          </p>

          <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-panel bg-graphite">
            <PhotoFill photo={photo} sizes="(max-width: 1024px) 100vw, 55vw" />
            {photo?.caption && (
              <p className="absolute left-3 bottom-3 rounded-btn bg-jet/75 backdrop-blur px-3 py-1.5 text-xs text-paper">{photo.caption}</p>
            )}
          </div>

          <ul className="mt-8 grid sm:grid-cols-2 gap-x-6 gap-y-3 text-graphite">
            {[
              'Soft-wash method, safe for the glass',
              'Visual check for cracks, loose mounts and wiring',
              'Before-and-after photos on every job',
              'Cleaning interval advice for your roof',
            ].map((t) => (
              <li key={t} className="flex gap-2.5">
                <Check />
                <span>{t}</span>
              </li>
            ))}
          </ul>

          <div className="mt-10 rounded-panel border border-concrete bg-paper overflow-hidden">
            <table className="w-full text-sm">
              <caption className="text-left px-4 pt-4 pb-2 text-xs uppercase tracking-[0.16em] font-semibold text-slate">
                Starting prices · excl. VAT
              </caption>
              <tbody>
                {SOLAR_TIERS.map((t) => (
                  <tr key={t.size} className="border-t border-concrete">
                    <th scope="row" className="text-left font-medium px-4 py-2.5 text-graphite">{t.size}</th>
                    <td className="text-right px-4 py-2.5 font-heading font-semibold text-graphite">{t.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-slate text-xs mt-2">
            No callout fee in Strand, Gordon&rsquo;s Bay and Somerset West. R350 callout further afield. Firm price after we
            confirm roof access and panel count.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/quote?service=Solar%20Panel%20Cleaning" className="btn-quote">
              Get a solar cleaning quote
            </Link>
            <Link href="/roi-calculator" className="btn bg-paper border border-concrete text-graphite hover:bg-fog">
              Calculate your cleaning ROI
            </Link>
          </div>
        </div>

        <div className="lg:col-span-5 min-w-0 lg:sticky lg:top-24">
          <SolarRoiCalculator />
        </div>
      </div>
    </section>
  )
}

/* ---------- WHY NGMS ---------- */

const REASONS = [
  {
    title: 'One team, twelve trades',
    body: 'Solar, painting, waterproofing, plumbing, electrical and more, coordinated by one Helderberg crew.',
  },
  {
    title: 'Written, fixed quotes',
    body: 'A written quote before we start. What we quote is what you pay — no surprise line items.',
  },
  {
    title: 'Owner on site',
    body: 'The business is run hands-on by the owner, so the person who quotes is the person accountable for the work.',
  },
  {
    title: 'Planned around Cape weather',
    body: 'Painting, waterproofing and paving are scheduled around winter rain so coatings and joints cure properly.',
  },
  {
    title: 'Photos when it’s done',
    body: 'Before-and-after photos on completion, so you can see the work even if you weren’t home.',
  },
  {
    title: 'Fast WhatsApp replies',
    body: 'Send a photo and we come back with a price — most quote requests are answered the same day.',
  },
]

export function WhyNgms({ photo }: { photo?: Photo }) {
  return (
    <section className="bg-graphite text-paper py-16 sm:py-24 px-4 border-y border-darkgrey" aria-labelledby="why-title">
      <div className="max-w-6xl mx-auto grid gap-10 lg:grid-cols-12 lg:items-center">
        <div className="lg:col-span-5 relative aspect-[4/5] sm:aspect-[16/10] lg:aspect-[4/5] overflow-hidden rounded-panel border border-darkgrey">
          <PhotoFill photo={photo} sizes="(max-width: 1024px) 100vw, 40vw" />
          <div className="absolute inset-0 bg-gradient-to-t from-jet/80 via-transparent" />
          <p className="absolute left-4 right-4 bottom-4 text-sm text-paper/90">{photo?.caption ?? 'Helderberg Basin'}</p>
        </div>
        <div className="lg:col-span-7">
          <p className="kicker">Why NextGen</p>
          <h2 id="why-title" className="text-3xl sm:text-4xl lg:text-[2.75rem] leading-[1.05]">
            Maintenance you don&rsquo;t have to chase.
          </h2>
          <ul className="mt-10 grid sm:grid-cols-2 gap-px bg-darkgrey rounded-panel overflow-hidden border border-darkgrey">
            {REASONS.map((r, i) => (
              <li key={r.title} className="bg-cardgrey p-5">
                <p className="font-heading text-xs text-blue font-semibold tracking-[0.18em]">{String(i + 1).padStart(2, '0')}</p>
                <h3 className="text-base mt-2 normal-case tracking-normal font-heading font-semibold">{r.title}</h3>
                <p className="text-mist text-sm mt-1.5 leading-relaxed">{r.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}

/* ---------- RECENT WORK ---------- */

export function RecentWork({ photos }: { photos: Photo[] }) {
  if (photos.length === 0) return null
  return (
    <section className="bg-jet text-paper py-16 sm:py-24" aria-labelledby="work-title">
      <div className="max-w-6xl mx-auto px-4">
        <SectionHead
          kicker="Recent work"
          title={<span id="work-title">Real jobs across the Helderberg.</span>}
          action={
            <div className="flex gap-3">
              <Link href="/portfolio" className="btn-outline">
                Projects
              </Link>
              <Link href="/gallery" className="btn-outline">
                Gallery
              </Link>
            </div>
          }
        />
      </div>
      <ul
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory px-4 pb-4 max-w-6xl mx-auto [scrollbar-width:thin]"
        aria-label="Recent job photos — scroll sideways for more"
      >
        {photos.map((p, i) => {
          const [what, where] = p.caption.split(/\s+[—-]\s+/)
          return (
            <li key={p.src + i} className="relative snap-start shrink-0 w-[78%] sm:w-[44%] lg:w-[31%] aspect-[4/5] overflow-hidden rounded-panel border border-darkgrey bg-graphite group">
              <PhotoFill photo={p} sizes="(max-width: 640px) 78vw, (max-width: 1024px) 44vw, 31vw" className="transition-transform duration-700 group-hover:scale-[1.04]" />
              <div className="absolute inset-x-0 bottom-0 p-4 pt-16 bg-gradient-to-t from-jet/95 to-transparent">
                <p className="font-heading font-semibold leading-snug">{what}</p>
                <p className="text-xs text-mist mt-0.5">{where ?? 'Helderberg'}</p>
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

/* ---------- SERVICE AREAS + FAQ ---------- */

const CORE_AREAS = ["Strand", "Gordon's Bay", 'Somerset West']
const EXTENDED_AREAS = ['Kleinmond', 'Grabouw & Elgin', 'Bot River', 'Stellenbosch', 'Paarl', 'Worcester', 'Cape Town']

export function AreasAndFaq() {
  const faqs = FAQS.slice(0, 6)
  return (
    <section className="bg-jet text-paper py-16 sm:py-24 px-4 border-t border-darkgrey">
      <div className="max-w-6xl mx-auto grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-5" aria-labelledby="areas-title">
          <p className="kicker">Service area</p>
          <h2 id="areas-title" className="text-3xl sm:text-4xl leading-[1.05]">
            Based in the Helderberg Basin.
          </h2>
          <div className="panel p-5 mt-8">
            <p className="text-xs uppercase tracking-[0.16em] text-mist font-semibold">No callout fee</p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {CORE_AREAS.map((a) => (
                <li key={a} className="rounded-btn border border-blue/40 bg-blue/10 px-3 py-1.5 text-sm font-medium">{a}</li>
              ))}
            </ul>
            <p className="text-xs uppercase tracking-[0.16em] text-mist font-semibold mt-6">R350 callout</p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {EXTENDED_AREAS.map((a) => (
                <li key={a} className="rounded-btn border border-darkgrey px-3 py-1.5 text-sm text-paper/85">{a}</li>
              ))}
            </ul>
          </div>
          <ul className="mt-6 space-y-2 text-sm">
            {[
              ['/property-maintenance/strand', 'Property maintenance in Strand'],
              ['/property-maintenance/somerset-west', 'Property maintenance in Somerset West'],
              ['/property-maintenance/gordons-bay', "Property maintenance in Gordon's Bay"],
            ].map(([href, label]) => (
              <li key={href}>
                <Link href={href} className="text-mist hover:text-blue">
                  {label} &rarr;
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-7" aria-labelledby="faq-title">
          <p className="kicker">FAQ</p>
          <h2 id="faq-title" className="text-3xl sm:text-4xl leading-[1.05]">
            Good to know.
          </h2>
          <div className="mt-8 divide-y divide-darkgrey border-y border-darkgrey">
            {faqs.map((f) => (
              <details key={f.q} className="group">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 font-medium text-paper hover:text-blue [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <span aria-hidden className="text-blue text-xl leading-none transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="pb-5 -mt-1 text-mist leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
          <Link href="/faq" className="inline-block mt-5 text-sm font-semibold text-blue hover:underline">
            All questions &rarr;
          </Link>
        </div>
      </div>
    </section>
  )
}

/* ---------- FINAL CTA ---------- */

export function FinalCta({ photo }: { photo?: Photo }) {
  return (
    <section className="relative isolate overflow-hidden bg-jet text-paper px-4 py-20 sm:py-28" aria-labelledby="cta-title">
      <div className="absolute inset-0 -z-10" aria-hidden>
        {photo?.src && <Image src={photo.src} alt="" fill sizes="100vw" quality={60} unoptimized={photo.src.includes(".supabase.co/storage/")} className="object-cover opacity-35" />}
        <div className="absolute inset-0 bg-gradient-to-r from-jet via-jet/85 to-jet/50" />
      </div>
      <div className="max-w-6xl mx-auto">
        <p className="kicker">Get started</p>
        <h2 id="cta-title" className="text-3xl sm:text-5xl leading-[1.02] max-w-2xl">
          Tell us what needs doing. We&rsquo;ll take it from there.
        </h2>
        <p className="text-paper/80 mt-5 max-w-xl text-base sm:text-lg">
          Send a photo on WhatsApp or fill in the quote form. Most requests get a price the same day.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link href="/quote" className="btn-quote !px-7 !py-3.5">
            Request a quote
          </Link>
          <a href={whatsappLink("Hi NextGen, I'd like a quote please.")} target="_blank" rel="noopener noreferrer" className="btn-wa !px-7 !py-3.5">
            WhatsApp {SITE.phoneDisplay}
          </a>
          <Link href="/body-corporate-maintenance" className="text-sm text-paper/80 hover:text-blue px-2 py-3">
            Body corporate? Book a site walk-through &rarr;
          </Link>
        </div>
      </div>
    </section>
  )
}
