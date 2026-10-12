import Link from 'next/link'
import { site, waLink } from '@/lib/site'

const services = [
  { number: '01', title: 'RESIDENTIAL SOLAR CLEANING', description: 'Careful panel cleaning for homes across the Helderberg Basin.' },
  { number: '02', title: 'RECURRING MAINTENANCE PLANS', description: 'Planned repeat visits based on your property, panel count and conditions.' },
  { number: '03', title: 'BODY CORPORATE & COMPLEXES', description: 'One point of contact for shared properties and multi-building sites.' },
  { number: '04', title: 'COMMERCIAL ARRAY CLEANING', description: 'Panel-count and access-based quotes for larger installations.' },
]

const standards = [
  { number: '01', title: 'CLEAR QUOTES', body: 'Know the scope and price before the work is booked.' },
  { number: '02', title: 'CAREFUL CLEANING', body: 'Non-abrasive methods suited to the panel surface.' },
  { number: '03', title: 'LOCAL SERVICE', body: 'Serving Strand, Gordon’s Bay, Somerset West and the Helderberg Basin.' },
  { number: '04', title: 'PHOTO UPDATES', body: 'Before-and-after photos can be provided for your records.' },
]

const tiers = [
  { size: '01–10 PANELS', price: 'R550+', note: 'Small home systems' },
  { size: '11–20 PANELS', price: 'R950+', note: 'Most family homes' },
  { size: '21–40 PANELS', price: 'R1 350+', note: 'Larger residential arrays' },
  { size: '41+ PANELS', price: 'R50 / PANEL', note: 'Volume pricing' },
]

const faqs = [
  { q: 'How often should panels be cleaned?', a: 'Many Helderberg homes benefit from a review every 4–6 months. Coastal salt, dust, pollen and bird activity can change how quickly an array needs attention.' },
  { q: 'Is there a callout fee?', a: 'There is no callout fee within the Helderberg Basin. A R350 callout applies outside the area, including Overberg visits.' },
  { q: 'Do you install solar panels?', a: 'No. This service is for solar panel cleaning and maintenance planning, not solar installation or electrical repairs.' },
]

function ArrowCircle({ children = '↗' }: { children?: React.ReactNode }) {
  return <span aria-hidden="true" className="inline-grid h-9 w-9 shrink-0 place-items-center rounded-full border border-black/70 text-lg transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5">{children}</span>
}

function WhatsAppMark() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.65 14.94L2 22l5.2-1.36A10 10 0 1 0 12 2Zm5.77 14.36c-.24.68-1.4 1.25-1.94 1.3-.5.04-1.13.08-1.82-.11-.42-.12-.96-.31-1.65-.61-2.9-1.26-4.78-4.2-4.93-4.4-.14-.2-1.18-1.57-1.18-3 0-1.42.74-2.12 1-2.41.26-.29.7-.42 1.12-.42.14 0 .26 0 .37.01.33.01.49.03.7.54l.86 2.1c.09.2.11.37.02.58-.1.21-.14.34-.3.52-.14.16-.3.36-.43.48-.14.14-.28.29-.12.56.16.28.72 1.19 1.55 1.93 1.07.95 1.97 1.25 2.25 1.39.28.14.44.12.6-.07.16-.2.7-.81.89-1.09.19-.28.38-.23.64-.14.26.09 1.67.79 1.96.93.28.14.47.21.54.33.07.12.07.68-.17 1.36Z"/></svg>
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.19em] text-neutral-600 sm:text-xs">{children}</p>
}

export default function FormulaSolarLandingPage() {
  const whatsapp = waLink("Hi NextGen, I'd like a solar panel cleaning quote.\n\nSuburb: \nNumber of panels: \n\n(via Helderberg solar page)")
  return (
    <main id="main-content" className="overflow-hidden bg-[#c5c5c5] text-black">
      <section className="relative mx-auto grid max-w-[1440px] gap-8 border-b border-black/15 px-5 py-9 sm:px-10 sm:py-14 lg:min-h-[550px] lg:grid-cols-[.8fr_1.2fr] lg:gap-12 lg:px-14">
        <div className="flex flex-col items-start">
          <Eyebrow>NEXTGEN / SOLAR CARE / HELDERBERG BASIN</Eyebrow>
          <h1 className="max-w-2xl text-5xl font-semibold leading-[0.91] tracking-[-0.065em] sm:text-7xl lg:text-[6.5rem]">CLEAN<br/>PANELS.<br/><span className="text-[#f0442d]">CLEAR</span><br/>MIND.</h1>
          <p className="mt-6 max-w-sm text-sm leading-relaxed text-neutral-700 sm:text-base">Solar panel cleaning and planned property care for homes, complexes and businesses across Strand, Gordon’s Bay and Somerset West.</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/quote?service=solar-panel-cleaning" className="inline-flex min-h-12 items-center gap-3 bg-black px-5 py-3 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-[#f0442d] hover:text-black">Get a quote <span>↗</span></Link>
            <a href={whatsapp} target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center gap-2 border border-black px-4 py-3 text-xs font-bold uppercase tracking-wide transition hover:bg-white"><WhatsAppMark/> WhatsApp</a>
          </div>
          <div className="mt-auto hidden pt-12 text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-600 lg:block">ONE CALL. ALL SOLUTIONS. / 2026</div>
        </div>
        <div className="relative flex min-h-[270px] items-center justify-center overflow-hidden border border-black/10 bg-[#b9b9b9] sm:min-h-[390px] lg:min-h-[450px]">
          <div className="absolute left-5 top-5 flex w-[calc(100%-2.5rem)] justify-between font-mono text-[10px] uppercase tracking-widest text-neutral-700"><span>FIELD NOTES / 001</span><span>NGMS</span></div>
          <div aria-hidden="true" className="select-none text-[12rem] font-black leading-none tracking-[-0.12em] text-[#f0442d] sm:text-[19rem] lg:text-[24rem]">01</div>
          <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between gap-4 border-t border-black/25 pt-4">
            <div><p className="text-xs font-bold uppercase tracking-wide">SOLAR PANEL CLEANING</p><p className="mt-1 text-[10px] uppercase tracking-widest text-neutral-700">Strand · Gordon’s Bay · Somerset West</p></div>
            <Link href="/maintenance-packages" aria-label="Explore maintenance packages" className="group"><ArrowCircle/></Link>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1440px] gap-8 border-b border-black/15 px-5 py-10 sm:px-10 sm:py-14 lg:grid-cols-[.65fr_1.35fr] lg:px-14">
        <div>
          <Eyebrow>01 / WHAT WE DO</Eyebrow>
          <h2 className="text-3xl font-semibold leading-[0.98] tracking-[-0.055em] sm:text-5xl">MY SERVICES.<br/>YOUR PROPERTY.</h2>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-neutral-700">A focused service with clear communication, practical planning and no unnecessary fuss.</p>
          <div className="mt-8 hidden lg:block"><span className="inline-grid h-20 w-20 rotate-[-45deg] place-items-center rounded-full border border-black text-4xl">↘</span></div>
        </div>
        <div className="border-t border-black/20">
          {services.map((service) => <Link href={service.number === '02' ? '/maintenance-packages' : '/quote?service=solar-panel-cleaning'} key={service.number} className="group grid grid-cols-[2rem_1fr_auto] items-center gap-3 border-b border-black/20 py-5 transition hover:bg-white/20 sm:grid-cols-[3rem_1fr_auto] sm:gap-5 sm:py-6"><span className="font-mono text-[10px] text-neutral-600">{service.number}</span><div><h3 className="text-sm font-bold uppercase tracking-tight sm:text-lg">{service.title}</h3><p className="mt-1 max-w-xl text-xs leading-relaxed text-neutral-700 sm:text-sm">{service.description}</p></div><ArrowCircle/></Link>)}
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] border-b border-black/15 px-5 py-10 sm:px-10 sm:py-14 lg:px-14">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div><Eyebrow>02 / THE NEXTGEN STANDARD</Eyebrow><h2 className="max-w-2xl text-4xl font-semibold leading-[0.94] tracking-[-0.06em] sm:text-6xl">GOOD WORK.<br/>NO GUESSWORK.</h2></div>
          <p className="max-w-sm text-sm leading-relaxed text-neutral-700">A professional experience means knowing what’s included, what it costs and what happens next.</p>
        </div>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {standards.map((item) => <article key={item.number} className="group min-h-40 border border-black/25 p-4 transition hover:-translate-y-1 hover:bg-[#f0442d] sm:p-5"><div className="flex items-center justify-between"><span className="font-mono text-[10px]">{item.number} / 04</span><span className="text-xl">↗</span></div><h3 className="mt-8 text-sm font-bold uppercase">{item.title}</h3><p className="mt-2 text-xs leading-relaxed text-neutral-700 group-hover:text-black">{item.body}</p></article>)}
        </div>
      </section>

      <section className="mx-auto grid max-w-[1440px] gap-8 border-b border-black/15 px-5 py-10 sm:px-10 sm:py-14 lg:grid-cols-[.7fr_1.3fr] lg:px-14">
        <div><Eyebrow>03 / PRICE GUIDE</Eyebrow><h2 className="text-4xl font-semibold leading-[0.94] tracking-[-0.06em] sm:text-6xl">CLEAR<br/>PRICING.</h2><p className="mt-4 max-w-xs text-sm leading-relaxed text-neutral-700">Starting prices for residential arrays. We confirm your exact scope and price before booking.</p><Link href="/price-list" className="mt-6 inline-flex items-center gap-3 border-b border-black pb-2 text-xs font-bold uppercase">Full price list <span>↗</span></Link></div>
        <div className="border-t border-black/25">
          {tiers.map((tier) => <div key={tier.size} className="grid grid-cols-[1fr_auto] items-center gap-4 border-b border-black/25 py-4 sm:py-5"><div><p className="font-mono text-[10px] font-bold tracking-widest">{tier.size}</p><p className="mt-1 text-xs text-neutral-700">{tier.note}</p></div><p className="text-lg font-semibold tracking-tight sm:text-2xl">{tier.price}</p></div>)}
          <p className="mt-3 text-[10px] leading-relaxed text-neutral-600">Prices exclude VAT where applicable. Access, site layout and final panel count can affect the quote.</p>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] border-b border-black/15 px-5 py-10 sm:px-10 sm:py-14 lg:px-14">
        <div className="grid gap-8 lg:grid-cols-[.7fr_1.3fr]">
          <div><Eyebrow>04 / MAINTENANCE PLANS</Eyebrow><h2 className="text-4xl font-semibold leading-[0.94] tracking-[-0.06em] sm:text-6xl">CARE THAT<br/>COMES BACK.</h2><p className="mt-4 max-w-sm text-sm leading-relaxed text-neutral-700">Keep solar cleaning and property maintenance on a sensible schedule, with a single local point of contact.</p><Link href="/maintenance-packages" className="mt-6 inline-flex items-center gap-3 bg-[#f0442d] px-5 py-3 text-xs font-bold uppercase transition hover:bg-black hover:text-white">Explore maintenance plans <span>↗</span></Link></div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Link href="/maintenance-packages#recurring" className="group border border-black/25 p-5 transition hover:bg-white/30"><p className="font-mono text-[10px]">01 / REPEAT VISITS</p><h3 className="mt-8 text-lg font-bold uppercase">Recurring care</h3><p className="mt-2 text-xs leading-relaxed text-neutral-700">Planned cleaning and maintenance to suit your property.</p><span className="mt-6 inline-block text-xl transition group-hover:translate-x-1">↗</span></Link>
            <Link href="/maintenance-packages#commercial" className="group border border-black/25 p-5 transition hover:bg-white/30"><p className="font-mono text-[10px]">02 / MANAGED SITES</p><h3 className="mt-8 text-lg font-bold uppercase">Complexes & business</h3><p className="mt-2 text-xs leading-relaxed text-neutral-700">Coordinated service for body corporates and light commercial properties.</p><span className="mt-6 inline-block text-xl transition group-hover:translate-x-1">↗</span></Link>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1440px] gap-8 border-b border-black/15 px-5 py-10 sm:px-10 sm:py-14 lg:grid-cols-[.7fr_1.3fr] lg:px-14">
        <div><Eyebrow>05 / BEFORE YOU BOOK</Eyebrow><h2 className="text-4xl font-semibold leading-[0.94] tracking-[-0.06em] sm:text-5xl">GOOD TO<br/>KNOW.</h2><p className="mt-4 text-sm text-neutral-700">Quick answers to common questions.</p></div>
        <div className="border-t border-black/20">{faqs.map((faq) => <details key={faq.q} className="group border-b border-black/20 py-4"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-bold uppercase sm:text-base"><span>{faq.q}</span><span className="text-xl group-open:rotate-45">+</span></summary><p className="mt-3 max-w-2xl text-sm leading-relaxed text-neutral-700">{faq.a}</p></details>)}</div>
      </section>

      <section className="relative mx-auto max-w-[1440px] overflow-hidden px-5 pb-10 pt-12 sm:px-10 sm:pb-14 sm:pt-16 lg:px-14">
        <div className="relative z-10 text-center"><Eyebrow>HAVE A PROJECT IN MIND?</Eyebrow><h2 className="text-4xl font-semibold leading-[0.92] tracking-[-0.07em] sm:text-7xl lg:text-[8rem]">LET’S TALK<span className="text-[#f0442d]">.</span></h2><p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-neutral-700 sm:text-base">Tell us about your panels or property. We’ll help you work out the right next step.</p><div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row"><Link href="/quote?service=solar-panel-cleaning" className="inline-flex min-h-12 items-center justify-center gap-3 bg-black px-6 py-3 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-[#f0442d] hover:text-black">Request a quote <span>↗</span></Link><a href={whatsapp} target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center justify-center gap-2 border border-black px-5 py-3 text-xs font-bold uppercase transition hover:bg-white/40"><WhatsAppMark/> Message NextGen</a></div></div>
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 select-none text-[12rem] font-black leading-none tracking-[-0.1em] text-black/[0.035] sm:text-[20rem]">NGMS</div>
      </section>

      <footer className="bg-black px-5 pb-8 pt-8 text-white sm:px-10 sm:pt-12 lg:px-14">
        <div className="mx-auto grid max-w-[1440px] gap-8 md:grid-cols-[1fr_1fr_1fr]">
          <div><Link href="/" className="text-2xl font-black tracking-[-0.08em]">NEXTGEN<span className="text-[#f0442d]">.</span></Link><p className="mt-4 max-w-xs text-xs leading-relaxed text-white/60">One call. All solutions. Solar panel cleaning and property maintenance across the Helderberg Basin.</p><div className="mt-5 flex gap-3 text-xs font-bold uppercase"><a href="https://www.facebook.com/p/Nextgen-Solar-Maintenance-Solutions-61590183304623/" target="_blank" rel="noreferrer" className="border border-white/30 px-3 py-2 hover:border-[#f0442d]">Facebook ↗</a><a href={whatsapp} target="_blank" rel="noreferrer" className="border border-white/30 px-3 py-2 hover:border-[#f0442d]">WhatsApp ↗</a></div></div>
          <div><Eyebrow>CONTACT</Eyebrow><a href={`tel:${site.phone}`} className="block text-xl font-semibold hover:text-[#f0442d]">063 138 7945</a><p className="mt-2 text-xs text-white/60">Mon–Sat / 07:00–17:00</p><p className="mt-4 text-xs text-white/60">Strand · Gordon’s Bay · Somerset West</p></div>
          <div><Eyebrow>QUICK LINKS</Eyebrow><div className="grid grid-cols-2 gap-3 text-xs uppercase text-white/75"><Link href="/maintenance-packages" className="hover:text-[#f0442d]">Maintenance plans ↗</Link><Link href="/price-list" className="hover:text-[#f0442d]">Price list ↗</Link><Link href="/portfolio" className="hover:text-[#f0442d]">Projects ↗</Link><Link href="/contact" className="hover:text-[#f0442d]">Contact ↗</Link></div></div>
        </div>
        <div className="mx-auto mt-9 flex max-w-[1440px] flex-wrap justify-between gap-3 border-t border-white/15 pt-4 text-[10px] uppercase tracking-widest text-white/40"><span>© 2026 NextGen Maintenance Solutions</span><span>ONE CALL. ALL SOLUTIONS.</span></div>
      </footer>
    </main>
  )
}
