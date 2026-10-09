import Link from 'next/link'
import { ArrowDownRight, ArrowUpRight, Check, CalendarDays, MessageCircle, ShieldCheck, Wrench } from 'lucide-react'
import NgmsIcon from '@/components/NgmsIcon'
import PlanSignupForm from '@/components/PlanSignupForm'
import { COMMERCIAL_COMBOS, RECURRING_PACKAGES, SEASONAL_COMBOS, type Package } from '@/lib/packages'

export const metadata = {
  alternates: { canonical: '/maintenance-packages' },
  title: 'Maintenance Packages | NextGen Solar Clean & Maintenance Solutions',
  description:
    "Recurring, seasonal and commercial property maintenance packages from NextGen Solar Clean & Maintenance Solutions — Strand, Gordon's Bay, Somerset West.",
}

function SectionLabel({ index, children, light = false }: { index: string; children: React.ReactNode; light?: boolean }) {
  return (
    <div className={`flex items-center gap-3 text-xs uppercase tracking-[.18em] font-bold ${light ? 'text-[#D94324]' : 'text-[#F04427]'}`}>
      <span className={`inline-flex h-7 w-7 items-center justify-center border ${light ? 'border-[#D94324]' : 'border-[#F04427]'}`}>{index}</span>
      <span>{children}</span>
    </div>
  )
}

function PackageGrid({ packages, joinable = false }: { packages: Package[]; joinable?: boolean }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {packages.map((pkg, i) => (
        <article
          key={pkg.name}
          className={`group relative flex min-w-0 flex-col overflow-hidden border border-[#DEDDE1] bg-white p-5 text-[#28282D] transition-all duration-300 hover:-translate-y-1 hover:border-[#F04427] hover:shadow-[0_18px_38px_rgba(35,35,40,.09)] sm:p-6 ${pkg.featured ? 'ring-1 ring-[#F04427]' : ''}`}
        >
          <div className="absolute right-0 top-0 h-1 w-16 bg-[#F04427] transition-all duration-300 group-hover:w-full" />
          <div className="flex items-start justify-between gap-4">
            <div className="flex h-12 w-12 items-center justify-center border border-[#E1E0E4] bg-[#F7F7F9]">
              <NgmsIcon name={pkg.icon} index={i} className="h-9 w-9" />
            </div>
            {pkg.featured && <span className="border border-[#F04427] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.12em] text-[#D94324]">{pkg.badge || 'Featured'}</span>}
          </div>
          <p className="mt-6 text-xs font-bold uppercase tracking-[.15em] text-[#D94324]">{pkg.frequency}</p>
          <h3 className="mt-2 text-2xl font-bold uppercase leading-tight tracking-[-.035em]">{pkg.name}</h3>
          <div className="mt-5 border-t border-[#E1E0E4] pt-4">
            <p className="text-3xl font-bold tracking-[-.04em]">{pkg.price}</p>
            <p className="mt-1 text-xs text-[#777780]">{pkg.unit} · VAT excl.</p>
          </div>
          <ul className="mt-5 flex-1 space-y-3">
            {pkg.features.map((feature) => <li key={feature} className="flex items-start gap-2.5 text-sm leading-snug"><Check aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-[#F04427]" strokeWidth={2.5} /><span>{feature}</span></li>)}
          </ul>
          <Link href={joinable ? '#join' : '/quote'} className="mt-7 inline-flex min-h-12 items-center justify-between gap-3 border border-[#28282D] px-4 py-3 text-sm font-bold uppercase tracking-wide text-[#28282D] transition-colors hover:border-[#F04427] hover:bg-[#F04427] hover:text-white">
            <span>{joinable ? 'Choose this plan' : 'Request this package'}</span><ArrowUpRight aria-hidden="true" className="h-5 w-5 shrink-0" />
          </Link>
        </article>
      ))}
    </div>
  )
}

export default function MaintenancePackagesPage() {
  return (
    <main id="main-content" className="overflow-hidden bg-[#F4F3F7] text-[#29292F]">
      <section className="relative isolate mx-auto max-w-[1440px] overflow-hidden border-x border-[#E0DFE5] bg-[#F4F3F7] px-4 sm:px-7 lg:px-10">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute inset-x-0 top-[44%] border-t border-[#E4E2E8]" />
          <div className="absolute left-1/2 top-[-10rem] h-[36rem] w-[36rem] -translate-x-1/2 rounded-full border border-[#E6E4EA] sm:top-[-13rem] sm:h-[49rem] sm:w-[49rem]" />
          <div className="absolute left-1/2 top-[-10rem] h-[36rem] w-[36rem] -translate-x-1/2 rounded-full border border-[#E9E7ED] sm:top-[-13rem] sm:h-[49rem] sm:w-[49rem]" />
          <div className="absolute left-[49.8%] top-0 h-[44%] border-l border-[#E5E3E9]" />
          <div className="absolute right-[16%] top-0 hidden h-[44%] w-px origin-top rotate-[48deg] bg-[#E6E4EA] sm:block" />
          <div className="absolute bottom-0 left-0 h-px w-full bg-[#DE DDE3]" />
        </div>

        <div className="relative z-10 grid min-h-[620px] grid-cols-2 grid-rows-[auto_1fr] sm:min-h-[690px]">
          <div className="col-span-2 flex items-start justify-between gap-4 border-b border-[#E0DFE5] py-5 sm:py-6">
            <nav aria-label="Maintenance page sections" className="flex flex-col gap-1.5 text-[10px] uppercase tracking-[.1em] text-[#7E7D85] sm:text-xs">
              <a className="transition-colors hover:text-[#F04427]" href="#recurring">Maintenance plans</a>
              <a className="transition-colors hover:text-[#F04427]" href="#seasonal">Seasonal care</a>
              <a className="transition-colors hover:text-[#F04427]" href="#commercial">Complexes</a>
              <a className="transition-colors hover:text-[#F04427]" href="#join">Contact</a>
            </nav>
            <p className="pt-1 text-center text-[10px] font-semibold tracking-[.08em] text-[#4E4D55] sm:text-sm">NextGen Maintenance Solutions<span className="text-[#F04427]">.</span></p>
            <Link href="/quote" className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[#29292F] px-4 py-2 text-[10px] font-bold uppercase tracking-wide text-white transition-transform hover:scale-[1.03] sm:px-5 sm:text-xs">
              Get a quote <span className="text-[#F04427]">●</span>
            </Link>
          </div>

          <div className="col-span-2 flex min-h-[420px] flex-col justify-end border-b border-[#E0DFE5] py-12 sm:min-h-[470px] sm:py-16 lg:col-span-1 lg:pr-8">
            <div className="mb-4 flex items-start gap-3 sm:mb-6">
              <span className="mt-1 text-xs font-semibold text-[#F04427]">01 / 04</span>
              <p className="max-w-[135px] text-[10px] leading-relaxed text-[#777780] sm:text-xs">Property care.<br />Planned around you.<br />Made straightforward.</p>
            </div>
            <h1 className="max-w-[760px] text-[clamp(3.2rem,9vw,7.7rem)] font-medium uppercase leading-[.82] tracking-[-.085em] text-[#29292F]">
              Planned<br />Maintenance<span className="text-[#F04427]">.</span>
            </h1>
            <p className="mt-6 max-w-lg text-sm leading-relaxed text-[#686770] sm:mt-8 sm:text-base">Reliable property upkeep across Strand, Gordon’s Bay and Somerset West. One point of contact for recurring care, seasonal jobs and shared properties.</p>
            <div className="mt-7 flex flex-wrap gap-3 lg:hidden">
              <Link href="#recurring" className="inline-flex min-h-12 items-center gap-3 bg-[#F04427] px-5 py-3 text-xs font-bold uppercase text-white">Explore plans <ArrowDownRight className="h-4 w-4" /></Link>
              <Link href="/quote" className="inline-flex min-h-12 items-center gap-3 border border-[#29292F] px-5 py-3 text-xs font-bold uppercase">Request a quote <ArrowUpRight className="h-4 w-4" /></Link>
            </div>
          </div>

          <div className="relative col-span-2 hidden min-h-[470px] items-end justify-center border-b border-[#E0DFE5] pb-8 lg:col-span-1 lg:flex">
            <Link href="#recurring" aria-label="Explore maintenance plans" className="group relative mb-3 flex h-40 w-40 flex-col items-center justify-center rounded-full bg-[#F04427] text-center text-white shadow-[0_10px_28px_rgba(240,68,39,.12)] transition-transform duration-300 hover:scale-105 xl:h-48 xl:w-48">
              <span className="max-w-[120px] text-xs font-semibold uppercase leading-snug tracking-wide xl:text-sm">Explore maintenance plans</span>
              <ArrowDownRight aria-hidden="true" className="mt-3 h-6 w-6 transition-transform group-hover:translate-x-1 group-hover:translate-y-1" />
            </Link>
            <span className="absolute bottom-7 right-3 text-[10px] uppercase tracking-[.14em] text-[#85848D]">Strand / Helderberg / Western Cape</span>
          </div>
        </div>

        <div className="relative z-10 py-5 sm:py-7">
          <div className="mb-5 flex items-center justify-between">
            <span className="text-2xl font-light text-[#F04427]">+</span>
            <span className="text-[10px] uppercase tracking-[.14em] text-[#85848D] sm:text-xs">How we keep things running</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { n: '01/', title: 'Made around your property', body: 'Practical maintenance plans shaped around your site and priorities.', href: '#recurring', dark: false },
              { n: '02/', title: 'Seasonal, not last-minute', body: 'Prepare for rain, refresh for summer and plan work in advance.', href: '#seasonal', dark: false },
              { n: '03/', title: 'One coordinated team', body: 'Bring multiple maintenance trades together through one contact.', href: '#commercial', dark: false },
              { n: '04/', title: 'Clear scope. Clear quote.', body: 'Confirm the work and price before the first visit.', href: '#join', dark: true },
            ].map((item) => (
              <a key={item.n} href={item.href} className={`group flex min-h-[180px] flex-col justify-between p-5 transition-transform duration-300 hover:-translate-y-1 sm:min-h-[205px] sm:p-6 [clip-path:polygon(0_1.7rem,1.7rem_0,100%_0,100%_100%,0_100%)] ${item.dark ? 'bg-[#29292F] text-white' : 'bg-[#FBFAFC] text-[#29292F]'}`}>
                <div className="flex items-start justify-between"><span className={`text-xs font-medium ${item.dark ? 'text-white/45' : 'text-[#B9B8C0]'}`}>{item.n}</span><ArrowUpRight aria-hidden="true" className={`h-4 w-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1 ${item.dark ? 'text-[#F04427]' : 'text-[#9C9BA3]'}`} /></div>
                <div><h2 className="max-w-[240px] text-lg font-semibold leading-tight tracking-[-.035em] sm:text-xl">{item.title}</h2><p className={`mt-2 max-w-[260px] text-xs leading-relaxed sm:text-sm ${item.dark ? 'text-white/65' : 'text-[#777780]'}`}>{item.body}</p></div>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section id="recurring" className="scroll-mt-20 bg-[#F4F3F7] px-4 py-14 sm:px-7 sm:py-20 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="mb-9 grid gap-5 md:grid-cols-[.85fr_1.15fr] md:items-end">
            <div><SectionLabel index="02" light>Recurring plans</SectionLabel><h2 className="mt-5 text-4xl font-medium uppercase leading-[.9] tracking-[-.07em] sm:text-6xl">Keep ahead<br />of the work<span className="text-[#F04427]">.</span></h2></div>
            <p className="max-w-2xl text-base leading-relaxed text-[#686770] md:justify-self-end">Choose the visit frequency that fits your property. Plans combine practical maintenance services so you can budget ahead and reduce last-minute call-outs.</p>
          </div>
          <PackageGrid packages={RECURRING_PACKAGES} joinable />
          <p className="mt-6 max-w-3xl text-xs leading-relaxed text-[#777780]">Panel counts above 20 are quoted at the standard per-panel rate. Every plan can be tailored during a free site assessment; exact scope and pricing are confirmed before the first visit.</p>
        </div>
      </section>

      <section id="join" className="scroll-mt-20 border-y border-[#DE DDE3] bg-[#29292F] px-4 py-14 text-white sm:px-7 sm:py-20 lg:px-10">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[.8fr_1.2fr] lg:items-start">
          <div><SectionLabel index="03">Start a plan</SectionLabel><h2 className="mt-5 text-4xl font-medium uppercase leading-[.9] tracking-[-.07em] sm:text-6xl">Make upkeep<br /><span className="text-[#F04427]">automatic.</span></h2><p className="mt-5 max-w-md leading-relaxed text-white/65">Send through your details and we’ll confirm the plan and first visit with you.</p><div className="mt-7 border-l-2 border-[#F04427] pl-4 text-sm text-white/75">No guesswork. We confirm the scope before work begins.</div></div>
          <div className="border border-white/15 bg-[#33333A] p-4 sm:p-6"><PlanSignupForm /></div>
        </div>
      </section>

      <section id="seasonal" className="scroll-mt-20 bg-[#E9E8ED] px-4 py-14 sm:px-7 sm:py-20 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="mb-9 grid gap-5 md:grid-cols-[.85fr_1.15fr] md:items-end">
            <div><SectionLabel index="04" light>Seasonal combinations</SectionLabel><h2 className="mt-5 text-4xl font-medium uppercase leading-[.9] tracking-[-.07em] sm:text-6xl">Built for<br />Cape weather<span className="text-[#F04427]">.</span></h2></div>
            <p className="max-w-2xl text-base leading-relaxed text-[#686770] md:justify-self-end">Prepare for winter rain or refresh your property for summer. These once-off combinations bring the right jobs together in one coordinated visit.</p>
          </div>
          <PackageGrid packages={SEASONAL_COMBOS} />
          <p className="mt-6 text-xs leading-relaxed text-[#777780]">Once-off project pricing; final scope confirmed on-site. Ask whether a seasonal combination can be paired with a recurring plan.</p>
        </div>
      </section>

      <section id="commercial" className="scroll-mt-20 bg-[#F4F3F7] px-4 py-14 sm:px-7 sm:py-20 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="mb-9 grid gap-5 md:grid-cols-[.85fr_1.15fr] md:items-end">
            <div><SectionLabel index="05" light>For shared properties</SectionLabel><h2 className="mt-5 text-4xl font-medium uppercase leading-[.9] tracking-[-.07em] sm:text-6xl">One team.<br />One plan<span className="text-[#F04427]">.</span></h2></div>
            <p className="max-w-2xl text-base leading-relaxed text-[#686770] md:justify-self-end">Volume-conscious maintenance for body corporates, security complexes and light commercial sites — with a single point of contact for coordinated work.</p>
          </div>
          <PackageGrid packages={COMMERCIAL_COMBOS} />
          <p className="mt-6 text-xs leading-relaxed text-[#777780]">Prices reflect typical starting scopes. Larger complexes and multi-building sites are quoted after a site walk-through.</p>
        </div>
      </section>

      <section className="bg-[#F4F3F7] px-4 pb-14 sm:px-7 sm:pb-20 lg:px-10">
        <div className="mx-auto grid max-w-7xl gap-6 border-y border-[#DAD9E0] py-8 md:grid-cols-[1fr_auto] md:items-center">
          <div><p className="text-xs font-bold uppercase tracking-[.18em] text-[#D94324]">Not sure where to start?</p><h2 className="mt-3 text-3xl font-medium uppercase leading-tight tracking-[-.06em] sm:text-5xl">Let’s plan your maintenance.</h2><p className="mt-3 max-w-2xl text-[#686770]">Request a quote or ask us about the right package for your home, complex or business.</p></div>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/quote" className="inline-flex min-h-12 items-center gap-3 bg-[#F04427] px-5 py-3 text-sm font-bold uppercase text-white hover:bg-[#D94324]">Request a quote <ArrowUpRight aria-hidden="true" className="h-5 w-5" /></Link>
            <a href="https://wa.me/27631387945" aria-label="Contact NextGen Maintenance Solutions on WhatsApp" title="WhatsApp NextGen Maintenance Solutions" className="inline-flex h-12 w-12 items-center justify-center border border-[#29292F] text-[#29292F] transition-colors hover:border-[#25D366] hover:text-[#25D366]"><MessageCircle aria-hidden="true" className="h-6 w-6" /></a>
            <Link href="/price-list" className="inline-flex min-h-12 items-center border border-[#B7B6BF] px-4 py-3 text-sm font-bold uppercase hover:border-[#F04427] hover:text-[#D94324]">Full price list</Link>
          </div>
        </div>
        <p className="mx-auto mt-5 max-w-7xl text-[11px] uppercase tracking-[.12em] text-[#85848D]">NextGen Maintenance Solutions · One Call. All Solutions. · Strand / Gordon’s Bay / Somerset West</p>
      </section>
    </main>
  )
}
