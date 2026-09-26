import Image from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { whatsappLink } from '@/lib/site'
import { serviceIcon } from '@/lib/service-icons'

// Homepage building blocks — "folder tab" layout (light sand/chalk ground,
// black + Solar Orange tiles, real job photos from Supabase).

export type Photo = { src: string; caption: string }

const GROUND_LIGHT = '#F4F4F2' // paper
const GROUND_DARK = '#0A0A0A' // jet

/* ---------- small pieces ---------- */

// Cuts a slanted "folder tab" notch out of a card's top-right corner.
// `ground` must match the section background behind the card.
function TabNotch({ ground, width = '42%' }: { ground: string; width?: string }) {
  return (
    <span
      aria-hidden
      className="absolute right-0 top-0 h-4 z-10"
      style={{ width, background: ground, clipPath: 'polygon(0 0, 100% 0, 100% 100%, 16px 100%)' }}
    />
  )
}

function PhotoFill({ photo, sizes, className = '', priority = false }: { photo?: Photo; sizes: string; className?: string; priority?: boolean }) {
  if (!photo?.src) {
    return <div className={`absolute inset-0 bg-graphite ${className}`} />
  }
  return (
    <Image
      src={photo.src}
      alt={photo.caption}
      fill
      sizes={sizes}
      quality={70}
      priority={priority}
      className={`object-cover ${className}`}
    />
  )
}

// Orange "tape" strip laid across a photo, like a label stuck on site.
function Tape({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={`absolute z-10 bg-orange text-jet font-heading font-bold uppercase tracking-wide text-xs sm:text-sm px-3 py-1 shadow-md ${className}`}
    >
      {children}
    </span>
  )
}

/* ---------- output chart (illustrative soiling curve) ---------- */

// Typical 5 kW home system in the Helderberg: ~24 kWh/day clean, losing
// up to ~10% as dust and salt build up, recovering after each clean.
const CURVE = [24, 23.2, 22.4, 21.6, 24, 23.2, 22.4, 21.7, 24, 23.3, 22.6, 21.9]
const MONTHS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D']
const CLEANS = [4, 8]

function OutputChart() {
  const W = 320
  const H = 170
  const left = 30
  const right = 10
  const top = 14
  const bottom = 24
  const yMin = 20.5
  const yMax = 24.6
  const x = (i: number) => left + (i * (W - left - right)) / (CURVE.length - 1)
  const y = (v: number) => top + ((yMax - v) * (H - top - bottom)) / (yMax - yMin)

  // Step up at each clean: drop to the dirty value, then jump back to clean.
  let d = `M ${x(0)} ${y(CURVE[0])}`
  for (let i = 1; i < CURVE.length; i++) {
    if (CLEANS.includes(i)) {
      d += ` L ${x(i)} ${y(CURVE[i - 1] - 0.4)} L ${x(i)} ${y(CURVE[i])}`
    } else {
      d += ` L ${x(i)} ${y(CURVE[i])}`
    }
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Illustrative chart: solar output drops about 10%, from 24 to 21.6 kWh a day, as panels get dirty, and jumps back after each clean">
      {[21.6, 24].map((t) => (
        <g key={t}>
          <line x1={left} x2={W - right} y1={y(t)} y2={y(t)} stroke="#0A0A0A" strokeOpacity={t === 24 ? 0.35 : 0.1} strokeDasharray={t === 24 ? '4 4' : undefined} />
          <text x={left - 6} y={y(t) + 4} textAnchor="end" fontSize="10" fill="#6B6D72">
            {t}
          </text>
        </g>
      ))}
      <path d={d} fill="none" stroke="#0A0A0A" strokeWidth="2.25" strokeLinejoin="round" />
      {CLEANS.map((i) => (
        <g key={i}>
          <circle cx={x(i)} cy={y(CURVE[i])} r="5.5" fill="#F57C1B" stroke="#0A0A0A" strokeWidth="1.5" />
        </g>
      ))}
      <text x={x(CLEANS[0]) + 8} y={y(24) - 4} fontSize="9" fontWeight="700" fill="#0A0A0A" letterSpacing="0.08em">
        CLEAN
      </text>
      {MONTHS.map((m, i) => (
        <text key={i} x={x(i)} y={H - 6} textAnchor="middle" fontSize="9" fill="#6B6D72">
          {m}
        </text>
      ))}
    </svg>
  )
}

/* ---------- HERO ---------- */

export function HeroBento({ solar, avatars, feature }: { solar?: Photo; avatars: Photo[]; feature?: Photo }) {
  return (
    <section className="bg-paper text-jet px-4 pt-8 pb-10 sm:pt-12 sm:pb-14">
      <div className="max-w-6xl mx-auto grid gap-4 lg:grid-cols-12">
        {/* Headline */}
        <div className="lg:col-span-7 flex flex-col justify-center py-2">
          <p className="font-heading font-bold uppercase tracking-[0.2em] text-xs sm:text-sm text-ember-deep mb-4">
            Solar panel cleaning · Helderberg Basin
          </p>
          <h1 className="font-heading font-bold leading-[0.92] text-[3rem] sm:text-[4.5rem] lg:text-[5rem] tracking-[-0.035em] animate-fade-up">
            <span className="block">Dirty panels</span>
            <span className="block">can cost you</span>
            <span className="block text-orange">up to 10%</span>
            <span className="block">output.</span>
          </h1>
          <div className="mt-6 grid sm:grid-cols-[1fr_auto] gap-6 items-end">
            <p className="text-[#3A3C40] text-base sm:text-lg max-w-md">
              Dust, salt spray and bird droppings can cut panel output by up to 10%. We wash it back with purified water
              and soft brushes — Strand, Somerset West and Gordon&apos;s Bay, from R550.
            </p>
          </div>
          <div className="flex gap-3 mt-7 flex-wrap">
            <Link href="/quote?service=Solar%20Panel%20Cleaning" className="btn-quote-hero">
              Get a free quote &rarr;
            </Link>
            <a
              href={whatsappLink("Hi NextGen, I'd like a quote for solar panel cleaning please.")}
              className="btn-wa-price"
              target="_blank"
              rel="noreferrer"
            >
              WhatsApp us about price
            </a>
          </div>
        </div>

        {/* Output chart card */}
        <div className="lg:col-span-5 relative bg-white rounded-2xl p-5 pt-8 shadow-[0_1px_0_rgba(10,10,10,0.06)] border border-[#E2E2DE]">
          <TabNotch ground={GROUND_LIGHT} width="38%" />
          <div className="absolute -top-1 left-5 h-[74px] w-[74px] rounded-full bg-jet text-paper flex flex-col items-center justify-center z-20">
            <span className="text-[9px] uppercase tracking-widest text-mist">From</span>
            <span className="font-heading font-extrabold text-xl leading-none">R550</span>
          </div>
          <div className="pl-[88px] min-h-[62px]">
            <p className="font-heading font-bold uppercase text-sm leading-tight">What dirt does to a 5 kW system</p>
            <p className="text-xs text-[#6B6D72] mt-1">kWh per day, cleaned every 4 months</p>
          </div>
          <div className="mt-3">
            <OutputChart />
          </div>
          <p className="text-[10px] uppercase tracking-widest text-slate mt-1">Illustrative · coastal soiling rate</p>
        </div>

        {/* Orange photo tile */}
        <Link
          href="/services/solar-panel-cleaning"
          className="group lg:col-span-7 relative overflow-hidden rounded-2xl bg-orange sm:min-h-[300px] flex flex-col sm:flex-row"
        >
          <div
            aria-hidden
            className="absolute inset-0 opacity-25"
            style={{ backgroundImage: 'repeating-linear-gradient(-55deg, transparent 0 14px, rgba(255,255,255,0.55) 14px 16px)' }}
          />
          <div className="relative h-56 sm:h-auto sm:w-[44%] shrink-0 m-3 mb-0 sm:mb-3 rounded-xl overflow-hidden">
            <PhotoFill photo={solar} sizes="(max-width: 640px) 100vw, (max-width: 1024px) 45vw, 30vw" priority className="transition-transform duration-500 group-hover:scale-105" />
          </div>
          <div className="relative flex-1 p-5 sm:p-6 flex flex-col justify-between gap-5">
            <div className="text-right">
              <p className="font-heading font-extrabold text-6xl sm:text-7xl leading-none text-jet">10%</p>
              <p className="text-jet/80 text-xs sm:text-sm font-semibold mt-1">of output lost to dirty panels</p>
            </div>
            <div>
              <p className="font-heading font-bold uppercase text-jet text-lg sm:text-xl leading-tight">
                Purified-water soft wash
              </p>
              <p className="text-jet/80 text-sm mt-1">Warranty-safe. Before &amp; after photos on every job.</p>
              <span className="inline-flex items-center gap-2 mt-3 font-heading font-bold uppercase text-xs tracking-widest text-jet">
                How we clean <span aria-hidden className="transition-transform group-hover:translate-x-1">&rarr;</span>
              </span>
            </div>
          </div>
        </Link>

        {/* Sand "one call" tile */}
        <div className="lg:col-span-5 grid grid-cols-2 gap-4">
          <div className="relative rounded-2xl bg-concrete p-5 pt-7 flex flex-col justify-between min-h-[260px]">
            <TabNotch ground={GROUND_LIGHT} width="40%" />
            <p className="font-heading font-bold uppercase text-xl leading-[1.05]">
              One call.
              <br />
              <span className="underline decoration-orange decoration-[3px] underline-offset-4">Twelve trades.</span>
            </p>
            <div>
              <div className="flex -space-x-3">
                {avatars.slice(0, 3).map((p, i) => (
                  <span key={i} className="relative h-11 w-11 rounded-full overflow-hidden border-2 border-concrete bg-graphite">
                    <PhotoFill photo={p} sizes="44px" />
                  </span>
                ))}
              </div>
              <Link href="/services" className="mt-3 inline-block text-[10px] uppercase tracking-widest font-bold leading-tight hover:text-ember-deep">
                Painting, paving,
                <br />
                waterproofing &amp; more &rarr;
              </Link>
            </div>
          </div>
          <div className="relative rounded-2xl overflow-hidden bg-jet min-h-[260px]">
            <PhotoFill photo={feature} sizes="(max-width: 1024px) 50vw, 20vw" className="grayscale" />
            <div className="absolute inset-0 bg-gradient-to-t from-jet/85 via-jet/10 to-transparent" />
            <p className="absolute left-3 right-3 bottom-3 text-paper text-[11px] uppercase tracking-widest font-bold leading-snug">
              {feature?.caption ?? 'Recent job'}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- PHOTO REEL (taped job photos) ---------- */

export function JobReel({ photos }: { photos: Photo[] }) {
  if (photos.length === 0) return null
  return (
    <section className="bg-fog text-jet py-14 sm:py-16">
      <div className="max-w-6xl mx-auto px-4 flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <p className="font-heading font-bold uppercase tracking-[0.2em] text-xs text-ember-deep mb-2">Recent work</p>
          <h2 className="font-heading font-extrabold text-4xl sm:text-5xl leading-[0.95]">
            Real jobs, <span className="italic">real roofs</span>
          </h2>
        </div>
        <Link href="/gallery" className="font-heading font-bold uppercase text-xs tracking-widest hover:text-ember-deep">
          Full gallery &rarr;
        </Link>
      </div>
      <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory px-4 pb-2 max-w-6xl mx-auto [scrollbar-width:none]">
        {photos.map((p, i) => {
          const [what, where] = p.caption.split(/\s+[—-]\s+/)
          return (
            <figure
              key={p.src + i}
              className="relative snap-start shrink-0 w-[72%] sm:w-[42%] lg:w-[30%] aspect-[3/4] rounded-[28px] overflow-hidden bg-jet border-[6px] border-jet"
            >
              <PhotoFill photo={p} sizes="(max-width: 640px) 72vw, (max-width: 1024px) 42vw, 30vw" className="rounded-[22px]" />
              <Tape className={i % 2 === 0 ? 'left-4 top-10 -rotate-6' : 'right-4 top-14 rotate-3'}>{what}</Tape>
              <figcaption className="absolute left-0 right-0 bottom-0 p-4 pt-10 bg-gradient-to-t from-jet/90 to-transparent text-paper">
                <span className="text-[11px] uppercase tracking-widest font-bold">{where ?? 'Helderberg'}</span>
              </figcaption>
            </figure>
          )
        })}
      </div>
    </section>
  )
}

/* ---------- MISSION (dark) ---------- */

export function MissionBand({ photo, side }: { photo?: Photo; side?: Photo }) {
  return (
    <section className="bg-jet text-paper py-16 sm:py-20 px-4 border-y border-darkgrey">
      <div className="max-w-6xl mx-auto grid gap-4 lg:grid-cols-12">
        <div className="lg:col-span-5 relative rounded-2xl bg-cardgrey border border-darkgrey p-6 pt-9 flex flex-col justify-between min-h-[320px]">
          <TabNotch ground={GROUND_DARK} width="45%" />
          <div>
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-orange text-jet mb-6" aria-hidden>
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 8l7-3 9 3-9 3-7-3Z" strokeLinejoin="round" />
                <path d="M4 8v8l7 3 9-3V8" strokeLinejoin="round" />
              </svg>
            </span>
            <h2 className="font-heading font-extrabold text-3xl sm:text-4xl leading-[0.95]">
              Main mission: <span className="text-orange">your roof earns, not rusts.</span>
            </h2>
            <p className="text-mist mt-4 max-w-md">
              We&apos;re a Helderberg crew run by the owner on site. Every job gets a written quote, a fixed start
              date planned around Cape weather, and photos when it&apos;s done — so you never have to chase us.
            </p>
          </div>
          <ul className="mt-8 grid grid-cols-3 gap-3 text-center">
            {[
              ['12', 'trades'],
              ['Mon–Sat', '07:00–18:00'],
              ['Same day', 'quotes'],
            ].map(([a, b]) => (
              <li key={a} className="border-t border-darkgrey pt-3">
                <p className="font-heading font-bold text-lg text-paper">{a}</p>
                <p className="text-[10px] uppercase tracking-widest text-mist">{b}</p>
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-7 grid grid-cols-5 gap-4">
          <div className="col-span-5 sm:col-span-3 relative rounded-2xl overflow-hidden min-h-[320px] bg-graphite">
            <PhotoFill photo={photo} sizes="(max-width: 640px) 100vw, 40vw" />
            <div className="absolute inset-0 bg-gradient-to-t from-jet/80 to-transparent" />
            <div className="absolute left-4 top-4 h-16 w-16 rounded-full bg-jet/90 flex flex-col items-center justify-center border border-darkgrey">
              <span className="text-[9px] uppercase tracking-widest text-mist">Area</span>
              <span className="font-heading font-bold text-sm">Helderberg</span>
            </div>
            <p className="absolute left-4 right-4 bottom-4 font-heading font-bold uppercase text-lg leading-tight">
              {photo?.caption ?? 'Painting, waterproofing & repairs'}
            </p>
          </div>
          {/* The 10% first-booking offer now lives in the DiscountPopup on the homepage */}
          <div className="col-span-5 sm:col-span-2 grid gap-4">
            <div className="relative rounded-2xl overflow-hidden min-h-[240px] sm:min-h-[150px] bg-graphite">
              <PhotoFill photo={side} sizes="(max-width: 640px) 100vw, 25vw" className="grayscale" />
              <div className="absolute inset-0 bg-jet/35" />
              <p className="absolute left-4 bottom-3 right-4 text-[11px] uppercase tracking-widest font-bold">
                {side?.caption ?? 'Complex maintenance'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- SERVICES (photo tiles) ---------- */

export function ServicePhotoGrid({
  services,
  images,
}: {
  services: { slug: string; name: string; tagline: string }[]
  images: Record<string, string>
}) {
  return (
    <section className="bg-paper text-jet py-16 sm:py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div>
            <p className="font-heading font-bold uppercase tracking-[0.2em] text-xs text-ember-deep mb-2">What we do</p>
            <h2 className="font-heading font-extrabold text-4xl sm:text-5xl leading-[0.95]">
              Everything your property needs
            </h2>
          </div>
          <Link href="/services" className="btn bg-jet text-paper hover:bg-orange hover:text-jet">
            All 12 services &rarr;
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {services.map((s, i) => {
            const img = images[s.slug]
            const big = i === 0
            const icon = serviceIcon(s.slug, img ? 'dark' : 'light')
            return (
              <Link
                key={s.slug}
                href={`/services/${s.slug}`}
                className={`group relative overflow-hidden rounded-2xl ${img ? 'bg-jet' : 'bg-concrete'} ${
                  big ? 'col-span-2 row-span-2 min-h-[320px]' : 'min-h-[150px] sm:min-h-[190px]'
                }`}
              >
                <TabNotch ground={GROUND_LIGHT} width={big ? '35%' : '40%'} />
                {img ? (
                  <>
                    <PhotoFill
                      photo={{ src: img, caption: s.name }}
                      sizes={big ? '(max-width: 768px) 100vw, 50vw' : '(max-width: 768px) 50vw, 25vw'}
                      className="transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-jet/90 via-jet/20 to-transparent" />
                  </>
                ) : (
                  <div aria-hidden className="absolute -right-6 -bottom-6 h-24 w-24 rounded-full border-[10px] border-orange/30" />
                )}
                {icon && (
                  <span
                    aria-hidden
                    className={`absolute left-3 top-3 z-10 ${img ? 'rounded-xl bg-jet/70 p-1.5 backdrop-blur-sm' : ''}`}
                  >
                    <img src={icon} alt="" className={big ? 'h-12 w-12 sm:h-14 sm:w-14' : 'h-9 w-9 sm:h-10 sm:w-10'} />
                  </span>
                )}
                <div className={`absolute left-0 right-0 bottom-0 p-4 ${img ? 'text-paper' : 'text-jet'}`}>
                  <p className={`font-heading font-bold uppercase leading-tight ${big ? 'text-2xl sm:text-3xl' : 'text-base sm:text-lg'}`}>
                    {s.name}
                  </p>
                  <p className={`text-xs mt-1 ${img ? 'text-paper/75' : 'text-slate'} ${big ? 'sm:text-sm' : 'hidden sm:block'}`}>
                    {s.tagline}
                  </p>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* ---------- SOCIAL-POST TRIO (closing CTA) ---------- */

export function PostTrio({ left, right }: { left?: Photo; right?: Photo }) {
  const Post = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
    <div className={`rounded-xl bg-white p-2.5 shadow-sm border border-[#E2E2DE] ${className}`}>
      <div className="flex items-center justify-between px-1 pb-2">
        <span className="flex items-center gap-2 text-[11px] font-bold text-jet">
          <span className="h-5 w-5 rounded-full bg-orange inline-block" aria-hidden /> nextgen.solar
        </span>
        <span className="text-mist text-sm leading-none" aria-hidden>···</span>
      </div>
      {children}
    </div>
  )

  return (
    <section className="bg-fog py-16 sm:py-20 px-4">
      <div className="max-w-6xl mx-auto grid gap-4 sm:grid-cols-3">
        <Post>
          <div className="relative aspect-square rounded-lg overflow-hidden bg-jet">
            <PhotoFill photo={left} sizes="(max-width: 640px) 100vw, 33vw" />
            <div className="absolute inset-0 bg-jet/45" />
            <p className="absolute left-4 top-4 right-4 font-heading font-extrabold text-paper text-3xl leading-[0.9]">
              START THIS
              <br />
              <span className="italic">SEASON</span>
              <br />
              CLEAN.
            </p>
            <Tape className="right-3 bottom-8 rotate-[-4deg]">Pollen season is here</Tape>
          </div>
        </Post>

        <Post>
          <Link
            href="/quote"
            className="group relative aspect-square rounded-lg bg-orange p-5 flex flex-col justify-between overflow-hidden"
            style={{ backgroundImage: 'linear-gradient(rgba(10,10,10,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(10,10,10,0.07) 1px, transparent 1px)', backgroundSize: '28px 28px' }}
          >
            <p className="font-heading font-bold text-jet text-[2rem] leading-[0.95] tracking-[-0.03em] uppercase">
              Dirty panels?
              <br />
              Up to 10%
              <br />
              output lost.
            </p>
            <div className="flex items-end justify-between gap-3">
              <p className="text-jet text-sm font-semibold max-w-[14rem]">Free quote, usually same day. From R550 for up to 10 panels.</p>
              <span className="h-11 w-11 shrink-0 rounded-full bg-jet text-paper flex items-center justify-center transition-transform group-hover:translate-x-1" aria-hidden>
                &rarr;
              </span>
            </div>
          </Link>
        </Post>

        <Post>
          <div className="relative aspect-square rounded-lg overflow-hidden bg-jet">
            <PhotoFill photo={right} sizes="(max-width: 640px) 100vw, 33vw" className="grayscale contrast-125" />
            <div className="absolute inset-0 bg-gradient-to-t from-jet/80 to-transparent" />
            <p className="absolute left-4 bottom-4 right-4 font-heading font-extrabold text-paper text-3xl leading-[0.9]">
              ONE CALL.
              <br />
              <span className="italic">ALL SOLUTIONS.</span>
            </p>
          </div>
        </Post>
      </div>

      <div className="max-w-6xl mx-auto mt-10 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-heading font-bold uppercase text-jet text-xl">
            Strand · Somerset West · Gordon&apos;s Bay · Overberg · Stellenbosch · Paarl · Worcester · Cape Town
          </p>
          <p className="mt-1 text-sm font-bold uppercase tracking-wide text-ember-deep">
            R350 callout fee outside the Helderberg
          </p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <Link href="/quote" className="btn-quote">
            Get a free quote
          </Link>
          <a href={whatsappLink()} className="btn-wa" target="_blank" rel="noreferrer">
            WhatsApp 063 138 7945
          </a>
        </div>
      </div>
    </section>
  )
}
