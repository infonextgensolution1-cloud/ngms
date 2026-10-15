import Link from 'next/link'
import { FAQS } from '@/lib/faqs'

export const metadata = {
  alternates: { canonical: '/faq' },
  title: 'FAQ | NextGen Solar Clean & Maintenance Solutions',
  description:
    'Straight answers about NextGen Maintenance Solutions pricing, bookings, solar panel cleaning, maintenance packages and service areas.',
}

export default function FaqPage() {
  return (
    <main className="bg-[#F7F4EF] text-[#171717]">
      {/* Editorial hero: oversized type, restrained orange graphic and precise metadata. */}
      <section className="relative isolate mx-auto min-h-[590px] max-w-[1440px] overflow-hidden bg-[#F7F4EF] px-5 pb-10 pt-6 sm:px-10 lg:min-h-[650px] lg:px-16 lg:pt-8">
        <div className="flex items-center justify-between border-b border-[#D7D3CD] pb-4 text-[10px] font-bold uppercase tracking-[0.16em] sm:text-xs">
          <Link href="/" aria-label="NextGen Maintenance Solutions home" className="text-base font-black tracking-[-0.08em] sm:text-lg">
            NGMS<span className="text-[#FF6A00]">.</span>
          </Link>
          <span className="hidden sm:inline">One call. All solutions.</span>
          <Link href="/contact" className="transition-colors hover:text-[#D94F00]">Contact ↗</Link>
        </div>

        <div className="relative grid min-h-[500px] items-center gap-8 py-12 lg:min-h-[550px] lg:grid-cols-[1.1fr_0.9fr] lg:py-16">
          <div className="relative z-10">
            <p className="mb-6 flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.22em] text-[#55534F]">
              <span className="h-[2px] w-8 bg-[#FF6A00]" />
              The NGMS field guide / 01
            </p>
            <h1 className="normal-case max-w-[850px] text-[clamp(4rem,10vw,9rem)] font-semibold leading-[0.79] tracking-[-0.085em] text-[#111111]">
              Good work.
              <span className="mt-3 block">Straight</span>
              <span className="block text-[#AAA7A1]">answers.</span>
            </h1>
            <p className="mt-8 max-w-md text-base leading-relaxed text-[#55534F] sm:text-lg">
              Clear answers about our services, pricing and the way we work — before you book.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a href="#questions" className="inline-flex min-h-12 items-center gap-5 bg-[#171717] px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-white transition-colors hover:bg-[#FF6A00]">
                Browse questions <span aria-hidden="true" className="text-lg text-[#FF6A00]">↓</span>
              </a>
              <span className="text-xs text-[#77736D]">Updated for local homeowners & property managers</span>
            </div>
          </div>

          <div className="relative mx-auto flex min-h-[280px] w-full max-w-[470px] items-center justify-center lg:min-h-[390px]" aria-hidden="true">
            <div className="absolute right-2 top-2 hidden border-l-2 border-[#FF6A00] pl-3 text-[10px] font-bold uppercase leading-tight tracking-[0.18em] text-[#333333] sm:block">
              Local service<br />Clear process<br />No guesswork
            </div>
            <div className="relative flex h-[230px] w-[230px] items-center justify-center rounded-full border-[12px] border-[#FF6A00] sm:h-[300px] sm:w-[300px] sm:border-[15px] lg:h-[340px] lg:w-[340px]">
              <span className="select-none text-[190px] font-semibold leading-none tracking-[-0.1em] text-[#FF6A00] sm:text-[250px]">?</span>
              <span className="absolute -bottom-4 right-0 flex h-14 w-14 items-center justify-center bg-[#FF6A00] text-2xl font-light text-white sm:h-16 sm:w-16">↘</span>
            </div>
            <div className="absolute bottom-0 left-0 max-w-[150px] font-mono text-[10px] uppercase leading-relaxed tracking-wide text-[#77736D] sm:text-xs">
              Strand / Somerset West<br />Gordon’s Bay / Helderberg
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-[#D7D3CD] pt-4 font-mono text-[10px] uppercase tracking-[0.12em] text-[#77736D]">
          <span>NextGen Maintenance Solutions</span>
          <span>{String(FAQS.length).padStart(2, '0')} answers / scroll to explore</span>
        </div>
      </section>

      {/* FAQ index: quiet neutral grid with clear, keyboard-accessible disclosures. */}
      <section id="questions" className="scroll-mt-20 border-t border-[#D7D3CD] bg-[#E5E2DD] px-5 py-14 sm:px-10 sm:py-20 lg:px-16">
        <div className="mx-auto grid max-w-[1280px] gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:gap-16">
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#B83E00]">FAQ / Index</p>
            <h2 className="normal-case mt-4 max-w-sm text-4xl font-semibold leading-[0.95] tracking-[-0.06em] text-[#171717] sm:text-6xl">
              The details matter.
            </h2>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-[#55534F] sm:text-base">
              From your first quote to the final handover, here’s what to expect.
            </p>
            <div className="mt-8 border-t border-[#C6C1B9] pt-4">
              <p className="font-mono text-xs uppercase tracking-wide text-[#77736D]">Need a specific answer?</p>
              <a href="https://wa.me/27631387945" target="_blank" rel="noreferrer" aria-label="Ask NextGen a question on WhatsApp" className="mt-3 inline-flex items-center gap-3 text-sm font-bold text-[#171717] transition-colors hover:text-[#B83E00]">
                <span className="flex h-9 w-9 items-center justify-center border border-[#FF6A00] bg-[#171717] text-lg text-[#B7FF00]" aria-hidden="true">◉</span>
                Ask us on WhatsApp ↗
              </a>
            </div>
          </aside>

          <div className="border-t border-[#BDB8B0]">
            {FAQS.map((item, index) => (
              <details key={item.q} className="group border-b border-[#BDB8B0]">
                <summary className="flex min-h-[82px] cursor-pointer list-none items-center gap-4 py-5 outline-none sm:gap-6 [&::-webkit-details-marker]:hidden">
                  <span className="w-8 shrink-0 font-mono text-xs text-[#B83E00] sm:w-10">{String(index + 1).padStart(2, '0')}</span>
                  <span className="flex-1 pr-2 text-base font-semibold leading-snug tracking-[-0.025em] text-[#171717] sm:text-xl">{item.q}</span>
                  <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center border border-[#BDB8B0] text-xl font-light text-[#171717] transition-all duration-200 group-open:rotate-45 group-open:border-[#FF6A00] group-open:bg-[#FF6A00] group-open:text-white">+</span>
                </summary>
                <div className="grid grid-cols-[2rem_1fr] gap-4 pb-7 sm:grid-cols-[2.5rem_1fr] sm:gap-6">
                  <span aria-hidden="true" className="mt-1 h-[2px] w-6 bg-[#FF6A00]" />
                  <p className="max-w-2xl text-sm leading-7 text-[#55534F] sm:text-base">{item.a}</p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final conversion band keeps the primary orange accent controlled. */}
      <section className="bg-[#171717] px-5 py-16 text-white sm:px-10 sm:py-20 lg:px-16">
        <div className="mx-auto flex max-w-[1280px] flex-col justify-between gap-8 sm:flex-row sm:items-end">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#FF6A00]">Still unsure?</p>
            <h2 className="normal-case mt-3 max-w-2xl text-4xl font-semibold leading-[0.95] tracking-[-0.06em] text-white sm:text-6xl">
              Let’s talk through your project.
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-[#C4C1BB] sm:text-base">
              Tell us what needs doing. We’ll help you work out the next step.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a href="https://wa.me/27631387945" target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center gap-3 border border-[#FF6A00] bg-[#101010] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[#262626]" aria-label="Chat to NextGen on WhatsApp">
              <span className="text-lg text-[#B7FF00]" aria-hidden="true">◉</span>
              WhatsApp
            </a>
            <Link href="/contact" className="inline-flex min-h-12 items-center gap-4 bg-[#FF6A00] px-5 py-3 text-sm font-bold text-[#171717] transition-colors hover:bg-[#E85E00]">
              Request a quote <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </div>
        <div className="mx-auto mt-12 flex max-w-[1280px] justify-between border-t border-white/15 pt-4 font-mono text-[10px] uppercase tracking-[0.12em] text-[#888782]">
          <span>One call. All solutions.</span>
          <Link href="/" className="transition-colors hover:text-white">Back to NGMS ↑</Link>
        </div>
      </section>
    </main>
  )
}
