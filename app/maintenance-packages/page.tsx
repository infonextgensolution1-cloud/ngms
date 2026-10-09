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
    <div className={`flex items-center gap-3 text-xs uppercase tracking-[.18em] font-bold ${light ? 'text-[#B83E00]' : 'text-orange'}`}>
      <span className={`inline-flex h-7 w-7 items-center justify-center border ${light ? 'border-[#B83E00]' : 'border-orange'}`}>{index}</span>
      <span>{children}</span>
    </div>
  )
}

function PackageGrid({ packages, joinable = false, light = false }: { packages: Package[]; joinable?: boolean; light?: boolean }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {packages.map((pkg, i) => (
        <article
          key={pkg.name}
          className={`group relative flex min-w-0 flex-col border p-5 sm:p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_38px_rgba(0,0,0,.14)] ${light ? 'bg-[#F7F4EF] text-[#171717] border-[#BDB9B1] hover:border-[#FF6A00]' : 'bg-[#171717] text-white border-[#3A3A3A] hover:border-[#FF6A00]'} ${pkg.featured ? 'ring-1 ring-[#FF6A00]' : ''}`}
        >
          <div className="absolute right-0 top-0 h-1 w-16 bg-[#FF6A00] transition-all duration-300 group-hover:w-full" />
          <div className="flex items-start justify-between gap-4">
            <div className={`flex h-12 w-12 items-center justify-center border ${light ? 'border-[#BDB9B1] bg-white' : 'border-[#454545] bg-[#101010]'}`}>
              <NgmsIcon name={pkg.icon} index={i} className="h-9 w-9" />
            </div>
            {pkg.featured && (
              <span className="border border-[#FF6A00] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.12em] text-[#FF6A00]">
                {pkg.badge || 'Featured'}
              </span>
            )}
          </div>
          <p className={`mt-6 text-xs font-bold uppercase tracking-[.15em] ${light ? 'text-[#B83E00]' : 'text-[#FF6A00]'}`}>{pkg.frequency}</p>
          <h3 className="mt-2 text-2xl font-bold uppercase leading-tight tracking-[-.035em]">{pkg.name}</h3>
          <div className={`mt-5 border-t pt-4 ${light ? 'border-[#D2CEC6]' : 'border-[#393939]'}`}>
            <p className="text-3xl font-bold tracking-[-.04em]">{pkg.price}</p>
            <p className={`mt-1 text-xs ${light ? 'text-[#625F59]' : 'text-[#C4C1BB]'}`}>{pkg.unit} · VAT excl.</p>
          </div>
          <ul className="mt-5 flex-1 space-y-3">
            {pkg.features.map((feature) => (
              <li key={feature} className="flex items-start gap-2.5 text-sm leading-snug">
                <Check aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-[#FF6A00]" strokeWidth={2.5} />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
          <Link
            href={joinable ? '#join' : '/quote'}
            className="mt-7 inline-flex min-h-12 items-center justify-between gap-3 border-2 border-[#FF6A00] bg-[#FF6A00] px-4 py-3 font-bold uppercase tracking-wide text-sm text-[#111111] transition-colors hover:bg-[#D94F00] hover:border-[#D94F00] hover:text-white"
          >
            <span>{joinable ? 'Choose this plan' : 'Request this package'}</span>
            <ArrowUpRight aria-hidden="true" className="h-5 w-5 shrink-0" />
          </Link>
        </article>
      ))}
    </div>
  )
}

export default function MaintenancePackagesPage() {
  return (
    <main className="bg-[#F7F4EF] text-[#171717]">
      <section className="relative isolate overflow-hidden bg-[#111111] px-4 py-14 text-white sm:py-20 lg:py-24">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-20 top-[-6rem] h-[28rem] w-[28rem] rounded-full border border-[#FF6A00]/40 sm:right-[-4rem] sm:h-[38rem] sm:w-[38rem]" />
          <div className="absolute -right-8 top-[-2rem] h-[22rem] w-[22rem] rounded-full border border-[#FF6A00]/25 sm:right-8 sm:h-[29rem] sm:w-[29rem]" />
          <div className="absolute right-[22%] top-[20%] hidden h-3 w-3 bg-[#FF6A00] sm:block" />
          <div className="absolute bottom-0 left-0 h-1 w-2/3 bg-[#FF6A00]" />
          <div className="absolute bottom-8 right-8 hidden font-mono text-[10px] uppercase tracking-[.3em] text-white/40 lg:block">NGMS / FIELD CARE / 01—04</div>
        </div>
        <div className="relative mx-auto grid max-w-7xl items-end gap-10 lg:grid-cols-[1.2fr_.8fr]">
          <div>
            <SectionLabel index="01">Planned care. Fewer surprises.</SectionLabel>
            <h1 className="mt-8 max-w-4xl text-5xl font-bold uppercase leading-[.88] tracking-[-.065em] text-white sm:text-7xl lg:text-[6.5rem]">
              Maintenance
              <span className="block text-[#FF6A00]">that works.</span>
            </h1>
            <p className="mt-7 max-w-xl text-base leading-relaxed text-[#D7D3CD] sm:text-lg">
              One reliable point of contact for property upkeep across Strand, Gordon’s Bay and Somerset West.
              Choose a recurring plan, prepare for the season, or maintain a whole complex.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="#recurring" className="inline-flex min-h-12 items-center gap-3 border-2 border-[#FF6A00] bg-[#FF6A00] px-5 py-3 text-sm font-bold uppercase tracking-wide text-[#111111] hover:bg-[#D94F00] hover:text-white">
                Explore plans <ArrowDownRight aria-hidden="true" className="h-5 w-5" />
              </Link>
              <Link href="/quote" className="inline-flex min-h-12 items-center gap-3 border border-white/50 px-5 py-3 text-sm font-bold uppercase tracking-wide text-white hover:border-[#FF6A00] hover:text-[#FF6A00]">
                Get a tailored quote <ArrowUpRight aria-hidden="true" className="h-5 w-5" />
              </Link>
            </div>
          </div>
          <div className="relative max-w-xl border border-white/20 bg-[#1B1B1B] p-5 sm:p-7 lg:justify-self-end">
            <div className="mb-7 flex items-center justify-between border-b border-white/20 pb-4">
              <span className="text-xs font-bold uppercase tracking-[.2em] text-[#FF6A00]">The NGMS approach</span>
              <span className="font-mono text-xs text-white/45">01 / 03</span>
            </div>
            <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-6">
              <CalendarDays className="h-6 w-6 text-[#FF6A00]" aria-hidden="true" />
              <div><h2 className="text-lg font-bold uppercase">Scheduled, not scrambled</h2><p className="mt-1 text-sm leading-relaxed text-[#C4C1BB]">Plan visits around your property and the Western Cape seasons.</p></div>
              <ShieldCheck className="h-6 w-6 text-[#FF6A00]" aria-hidden="true" />
              <div><h2 className="text-lg font-bold uppercase">Scope agreed upfront</h2><p className="mt-1 text-sm leading-relaxed text-[#C4C1BB]">Confirm the work and price before the first visit.</p></div>
              <Wrench className="h-6 w-6 text-[#FF6A00]" aria-hidden="true" />
              <div><h2 className="text-lg font-bold uppercase">One point of contact</h2><p className="mt-1 text-sm leading-relaxed text-[#C4C1BB]">Solar panel cleaning and multiple property maintenance trades, coordinated simply.</p></div>
            </div>
            <div className="mt-7 flex items-center gap-3 border-t border-white/20 pt-4 text-xs uppercase tracking-[.15em] text-white/55">
              <span className="h-2 w-2 bg-[#FF6A00]" /> Helderberg Basin · Western Cape
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#D7D3CD] px-4 py-5 text-[#171717]">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 sm:grid-cols-4">
          {[['01', 'Recurring property care'], ['02', 'Seasonal maintenance'], ['03', 'Complex & commercial'], ['04', 'Written quotes']].map(([n, label]) => (
            <div key={n} className="flex items-center gap-3 border-l-2 border-[#FF6A00] pl-3 py-1">
              <span className="font-mono text-xs text-[#B83E00]">{n}</span><span className="text-xs font-bold uppercase tracking-wide sm:text-sm">{label}</span>
            </div>
          ))}
        </div>
      </section>

      <section id="recurring" className="scroll-mt-20 bg-[#F7F4EF] px-4 py-14 sm:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-9 grid gap-5 md:grid-cols-[.85fr_1.15fr] md:items-end">
            <div><SectionLabel index="02" light>Recurring plans</SectionLabel><h2 className="mt-5 text-4xl font-bold uppercase leading-[.92] tracking-[-.055em] sm:text-6xl">Keep ahead<br />of the work.</h2></div>
            <p className="max-w-2xl text-base leading-relaxed text-[#55534E] md:justify-self-end">Choose the visit frequency that fits your property. Plans combine practical maintenance services so you can budget ahead and reduce last-minute call-outs.</p>
          </div>
          <PackageGrid packages={RECURRING_PACKAGES} joinable light />
          <p className="mt-6 max-w-3xl text-xs leading-relaxed text-[#625F59]">Panel counts above 20 are quoted at the standard per-panel rate. Every plan can be tailored during a free site assessment; exact scope and pricing are confirmed before the first visit.</p>
        </div>
      </section>

      <section id="join" className="scroll-mt-20 border-y border-[#3A3A3A] bg-[#171717] px-4 py-14 text-white sm:py-20">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[.8fr_1.2fr] lg:items-start">
          <div><SectionLabel index="03">Start a plan</SectionLabel><h2 className="mt-5 text-4xl font-bold uppercase leading-[.92] tracking-[-.055em] sm:text-6xl">Make upkeep<br /><span className="text-[#FF6A00]">automatic.</span></h2><p className="mt-5 max-w-md leading-relaxed text-[#C4C1BB]">Send through your details and we’ll confirm the plan and first visit with you.</p><div className="mt-7 border-l-2 border-[#FF6A00] pl-4 text-sm text-[#D7D3CD]">No guesswork. We confirm the scope before work begins.</div></div>
          <div className="border border-[#424242] bg-[#111111] p-4 sm:p-6"><PlanSignupForm /></div>
        </div>
      </section>

      <section className="bg-[#D7D3CD] px-4 py-14 sm:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-9 grid gap-5 md:grid-cols-[.85fr_1.15fr] md:items-end">
            <div><SectionLabel index="04" light>Seasonal combinations</SectionLabel><h2 className="mt-5 text-4xl font-bold uppercase leading-[.92] tracking-[-.055em] sm:text-6xl">Built for<br />Cape weather.</h2></div>
            <p className="max-w-2xl text-base leading-relaxed text-[#55534E] md:justify-self-end">Prepare for winter rain or refresh your property for summer. These once-off combinations bring the right jobs together in one coordinated visit.</p>
          </div>
          <PackageGrid packages={SEASONAL_COMBOS} light />
          <p className="mt-6 text-xs leading-relaxed text-[#625F59]">Once-off project pricing; final scope confirmed on-site. Ask whether a seasonal combination can be paired with a recurring plan.</p>
        </div>
      </section>

      <section className="bg-[#111111] px-4 py-14 text-white sm:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-9 grid gap-5 md:grid-cols-[.85fr_1.15fr] md:items-end">
            <div><SectionLabel index="05">For shared properties</SectionLabel><h2 className="mt-5 text-4xl font-bold uppercase leading-[.92] tracking-[-.055em] sm:text-6xl">One team.<br /><span className="text-[#FF6A00]">One plan.</span></h2></div>
            <p className="max-w-2xl text-base leading-relaxed text-[#C4C1BB] md:justify-self-end">Volume-conscious maintenance for body corporates, security complexes and light commercial sites — with a single point of contact for coordinated work.</p>
          </div>
          <PackageGrid packages={COMMERCIAL_COMBOS} />
          <p className="mt-6 text-xs leading-relaxed text-[#C4C1BB]">Prices reflect typical starting scopes. Larger complexes and multi-building sites are quoted after a site walk-through.</p>
        </div>
      </section>

      <section className="bg-[#F7F4EF] px-4 py-14 text-[#171717] sm:py-20">
        <div className="mx-auto grid max-w-7xl gap-6 border-y-2 border-[#171717] py-8 md:grid-cols-[1fr_auto] md:items-center">
          <div><p className="text-xs font-bold uppercase tracking-[.18em] text-[#B83E00]">Not sure where to start?</p><h2 className="mt-3 text-3xl font-bold uppercase leading-tight tracking-[-.04em] sm:text-5xl">Let’s plan your maintenance.</h2><p className="mt-3 max-w-2xl text-[#55534E]">Request a quote or ask us about the right package for your home, complex or business.</p></div>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/quote" className="inline-flex min-h-12 items-center gap-3 border-2 border-[#FF6A00] bg-[#FF6A00] px-5 py-3 text-sm font-bold uppercase text-[#111111] hover:bg-[#D94F00] hover:text-white">Request a quote <ArrowUpRight aria-hidden="true" className="h-5 w-5" /></Link>
            <a href="https://wa.me/27631387945" aria-label="Contact NextGen Maintenance Solutions on WhatsApp" title="WhatsApp NextGen Maintenance Solutions" className="inline-flex h-12 w-12 items-center justify-center border-2 border-[#171717] text-[#171717] transition-colors hover:border-[#25D366] hover:text-[#25D366]"><MessageCircle aria-hidden="true" className="h-6 w-6" /></a>
            <Link href="/price-list" className="inline-flex min-h-12 items-center border border-[#8A867F] px-4 py-3 text-sm font-bold uppercase hover:border-[#FF6A00] hover:text-[#B83E00]">Full price list</Link>
          </div>
        </div>
        <p className="mx-auto mt-5 max-w-7xl text-[11px] uppercase tracking-[.12em] text-[#77736D]">NextGen Maintenance Solutions · One Call. All Solutions. · Strand / Gordon’s Bay / Somerset West</p>
      </section>
    </main>
  )
}
