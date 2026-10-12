import Link from 'next/link'
import { site, waLink } from '@/lib/site'

const tiers = [
  { size: '01–10 PANELS', price: 'R550+', note: 'Small home systems' },
  { size: '11–20 PANELS', price: 'R950+', note: 'Most family homes' },
  { size: '21–40 PANELS', price: 'R1 350+', note: 'Large residential arrays' },
  { size: '41+ PANELS', price: 'R50 / PANEL', note: 'Volume pricing' },
]

const steps = [
  { n: '01', title: 'SEND YOUR DETAILS', body: 'Tell us your suburb and panel count. A roof photo helps us quote accurately.' },
  { n: '02', title: 'GET A FIXED QUOTE', body: 'We confirm the scope and price before any work begins.' },
  { n: '03', title: 'CLEAN. CHECK. REPORT.', body: 'We clean carefully and can share before-and-after photos of the work.' },
]

const faqs = [
  { q: 'How often should panels be cleaned?', a: 'Many Helderberg homes benefit from a clean every 4–6 months. Coastal salt, wind-blown dust and seasonal pollen can build up between visits.' },
  { q: 'Is the cleaning safe for my panels?', a: 'We use a gentle, non-abrasive cleaning approach. We avoid harsh chemicals, abrasive pads and high pressure on panel glass.' },
  { q: 'Is there a callout fee?', a: 'There is no callout fee within the Helderberg Basin. A R350 callout applies outside the area, including Overberg visits.' },
]

function WhatsAppMark() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.65 14.94L2 22l5.2-1.36A10 10 0 1 0 12 2Zm5.77 14.36c-.24.68-1.4 1.25-1.94 1.3-.5.04-1.13.08-1.82-.11-.42-.12-.96-.31-1.65-.61-2.9-1.26-4.78-4.2-4.93-4.4-.14-.2-1.18-1.57-1.18-3 0-1.42.74-2.12 1-2.41.26-.29.7-.42 1.12-.42.14 0 .26 0 .37.01.33.01.49.03.7.54l.86 2.1c.09.2.11.37.02.58-.1.21-.14.34-.3.52-.14.16-.3.36-.43.48-.14.14-.28.29-.12.56.16.28.72 1.19 1.55 1.93 1.07.95 1.97 1.25 2.25 1.39.28.14.44.12.6-.07.16-.2.7-.81.89-1.09.19-.28.38-.23.64-.14.26.09 1.67.79 1.96.93.28.14.47.21.54.33.07.12.07.68-.17 1.36Z"/></svg>
}

function SectionLabel({ n, children }: { n: string; children: React.ReactNode }) {
  return <div className="mb-5 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.18em] text-neutral-600"><span className="grid h-8 w-8 place-items-center rounded-sm bg-[#ff642b] text-black">{n}</span><span>{children}</span></div>
}

export default function FormulaSolarLandingPage() {
  const whatsapp = waLink("Hi NextGen, I'd like a solar panel cleaning quote.\n\nSuburb: \nNumber of panels: \n\n(via Helderberg solar page)")
  return (
    <main id="main-content" className="overflow-hidden bg-black text-black">
      <section className="relative mx-auto mt-3 max-w-[1440px] overflow-hidden rounded-[22px] bg-[#f5f2ed] px-5 py-8 sm:mt-5 sm:px-10 sm:py-12 lg:min-h-[610px] lg:px-14">
        <div className="relative z-10 max-w-2xl">
          <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-neutral-600">NEXTGEN / SOLAR SERVICE / HELDERBERG</p>
          <h1 className="mt-7 max-w-xl text-4xl font-black uppercase leading-[0.94] tracking-[-0.055em] sm:text-6xl lg:text-7xl">Clean panels.<br/>Clear performance.</h1>
          <p className="mt-6 max-w-lg text-base leading-relaxed text-neutral-700 sm:text-lg">Professional solar panel cleaning for Strand, Gordon’s Bay and Somerset West. A careful clean for the solar investment you already own.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/quote?service=solar-panel-cleaning" className="inline-flex min-h-12 items-center justify-center gap-3 rounded-sm border-2 border-[#ff642b] bg-[#ff642b] px-5 py-3 text-sm font-black uppercase tracking-wide transition hover:-translate-y-0.5 hover:bg-black hover:text-white">Get a solar quote <span aria-hidden="true">↗</span></Link>
            <a href={whatsapp} target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-sm border-2 border-black px-5 py-3 text-sm font-black uppercase tracking-wide transition hover:bg-black hover:text-white"><WhatsAppMark/> WhatsApp us</a>
          </div>
        </div>
        <div aria-hidden="true" className="pointer-events-none absolute -right-4 top-10 select-none font-black leading-[0.72] tracking-[-0.1em] text-[#ff642b] opacity-95 sm:right-4 sm:top-8 lg:right-12 lg:top-0"><span className="block text-[18rem] sm:text-[25rem] lg:text-[34rem]">01</span></div>
        <div className="relative z-10 mt-12 flex flex-wrap items-center gap-2 lg:absolute lg:bottom-8 lg:left-14 lg:mt-0">
          <span className="rounded-sm bg-[#ff642b] px-3 py-2 font-mono text-sm font-black uppercase">NG / 001</span>
          <span className="border border-black/30 px-3 py-2 font-mono text-xs uppercase">Coastal care</span>
          <span className="border border-black/30 px-3 py-2 font-mono text-xs uppercase">Residential + commercial</span>
        </div>
      </section>

      <section className="mx-auto mt-3 grid max-w-[1440px] gap-3 sm:mt-4 lg:grid-cols-[1.15fr_.85fr]">
        <div className="relative overflow-hidden rounded-[22px] bg-[#b8b8b8] p-6 sm:p-10 lg:min-h-[390px]">
          <SectionLabel n="01">THE NEXTGEN STANDARD</SectionLabel>
          <h2 className="max-w-2xl text-3xl font-black uppercase leading-[0.98] tracking-[-0.04em] sm:text-5xl">Your panels work hard.<br/>Keep them clean.</h2>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-neutral-800">Salt spray, dust, pollen and bird mess can build up on exposed panels. We provide a straightforward, careful cleaning service with clear pricing and no guesswork.</p>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="border-t-2 border-black pt-3"><p className="text-2xl font-black">01</p><p className="mt-1 text-xs font-bold uppercase tracking-wide">Gentle cleaning</p></div>
            <div className="border-t-2 border-black pt-3"><p className="text-2xl font-black">02</p><p className="mt-1 text-xs font-bold uppercase tracking-wide">Clear pricing</p></div>
            <div className="col-span-2 border-t-2 border-black pt-3 sm:col-span-1"><p className="text-2xl font-black">03</p><p className="mt-1 text-xs font-bold uppercase tracking-wide">Photo updates available</p></div>
          </div>
        </div>
        <div className="rounded-[22px] bg-[#f5f2ed] p-6 sm:p-10">
          <SectionLabel n="02">STRAIGHT-UP PRICING</SectionLabel>
          <h2 className="text-3xl font-black uppercase leading-none tracking-[-0.04em] sm:text-4xl">Choose your array.</h2>
          <p className="mt-3 text-sm text-neutral-600">Starting prices in ZAR. Final price confirmed before work starts.</p>
          <div className="mt-6 divide-y divide-black/15 border-y border-black/15">
            {tiers.map((tier) => <div key={tier.size} className="flex items-center justify-between gap-4 py-4"><div><p className="font-mono text-xs font-bold tracking-wide">{tier.size}</p><p className="mt-1 text-xs text-neutral-600">{tier.note}</p></div><p className="shrink-0 text-right text-lg font-black sm:text-xl">{tier.price}</p></div>)}
          </div>
          <p className="mt-4 text-xs leading-relaxed text-neutral-600">Prices exclude VAT where applicable. Roof access and array layout may affect the final quote.</p>
          <Link href="/quote?service=solar-panel-cleaning" className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-sm bg-black px-4 py-3 text-sm font-black uppercase tracking-wide text-white transition hover:bg-[#ff642b] hover:text-black">Request my fixed quote ↗</Link>
        </div>
      </section>

      <section className="mx-auto mt-3 max-w-[1440px] rounded-[22px] bg-[#f5f2ed] p-6 sm:mt-4 sm:p-10 lg:p-14">
        <SectionLabel n="03">HOW IT WORKS</SectionLabel>
        <div className="grid gap-3 md:grid-cols-3">
          {steps.map((step) => <article key={step.n} className="group min-h-52 border-2 border-black/15 p-5 transition hover:-translate-y-1 hover:border-[#ff642b] sm:p-7"><p className="font-mono text-sm font-bold text-[#ff642b]">{step.n} / PROCESS</p><h3 className="mt-8 text-xl font-black uppercase tracking-tight">{step.title}</h3><p className="mt-3 text-sm leading-relaxed text-neutral-700">{step.body}</p></article>)}
        </div>
      </section>

      <section className="mx-auto mt-3 grid max-w-[1440px] gap-3 sm:mt-4 lg:grid-cols-[.8fr_1.2fr]">
        <div className="rounded-[22px] bg-[#ff642b] p-6 sm:p-10">
          <SectionLabel n="04">LOCAL SERVICE AREA</SectionLabel>
          <h2 className="text-3xl font-black uppercase leading-[0.95] tracking-[-0.04em] sm:text-5xl">Built for the<br/>coastal basin.</h2>
          <p className="mt-5 max-w-md text-sm leading-relaxed">Local knowledge for coastal salt, wind-blown dust and seasonal pollen. No callout fee within the Helderberg Basin.</p>
          <div className="mt-7 flex flex-wrap gap-2">{['Strand','Gordon’s Bay','Somerset West','Helderberg'].map((area) => <span key={area} className="border border-black/40 px-3 py-2 text-xs font-bold uppercase">{area}</span>)}</div>
          <p className="mt-5 text-xs font-bold uppercase">Overberg visits: R350 callout</p>
        </div>
        <div className="rounded-[22px] bg-[#b8b8b8] p-6 sm:p-10">
          <SectionLabel n="05">GOOD TO KNOW</SectionLabel>
          <div className="divide-y divide-black/15">
            {faqs.map((faq) => <details key={faq.q} className="group py-4"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-black uppercase sm:text-lg"><span>{faq.q}</span><span className="text-xl transition group-open:rotate-45">+</span></summary><p className="mt-3 max-w-3xl text-sm leading-relaxed text-neutral-800">{faq.a}</p></details>)}
          </div>
        </div>
      </section>

      <section className="mx-auto mb-3 mt-3 max-w-[1440px] overflow-hidden rounded-[22px] bg-[#f5f2ed] p-6 sm:mb-5 sm:mt-4 sm:p-10 lg:p-14">
        <div className="flex flex-col justify-between gap-7 md:flex-row md:items-end">
          <div><p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-neutral-600">NEXTGEN MAINTENANCE SOLUTIONS / 2026</p><h2 className="mt-4 max-w-3xl text-4xl font-black uppercase leading-[0.92] tracking-[-0.055em] sm:text-6xl">Ready for a cleaner<br/>solar setup?</h2><p className="mt-5 max-w-xl text-neutral-700">One call. All solutions. Start with a free solar cleaning quote.</p></div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/quote?service=solar-panel-cleaning" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-sm bg-[#ff642b] px-5 py-3 text-sm font-black uppercase transition hover:bg-black hover:text-white">Get a free quote ↗</Link>
            <a href={whatsapp} target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-sm border-2 border-black px-5 py-3 text-sm font-black uppercase transition hover:bg-black hover:text-white"><WhatsAppMark/> WhatsApp</a>
          </div>
        </div>
        <div className="mt-10 flex flex-wrap justify-between gap-3 border-t border-black/15 pt-4 text-xs font-bold uppercase tracking-wide text-neutral-600"><span>ONE CALL. ALL SOLUTIONS.</span><span>Strand · Gordon’s Bay · Somerset West</span><a className="text-black underline underline-offset-4" href={`tel:${site.phone}`}>Call NextGen</a></div>
      </section>
    </main>
  )
}
