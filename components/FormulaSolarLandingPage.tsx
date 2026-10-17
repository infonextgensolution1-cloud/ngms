import Link from 'next/link'
import { site, waLink } from '@/lib/site'
import { getGalleryPhotos, getSlotPhotos } from '@/lib/queries'

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

function Eyebrow({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  return <p className={`mb-4 text-[10px] font-bold uppercase tracking-[0.19em] sm:text-xs ${dark ? 'text-white/70' : 'text-black/65'}`}>{children}</p>
}

export default async function FormulaSolarLandingPage() {
  const whatsapp = waLink("Hi NextGen, I'd like a solar panel cleaning quote.\n\nSuburb: \nNumber of panels: \n\n(via Helderberg solar page)")
  const [slotPhotos, galleryPhotos] = await Promise.all([getSlotPhotos(['hero_solar']), getGalleryPhotos(24)])
  const solarPhoto = slotPhotos.hero_solar ?? galleryPhotos.find((photo) => photo.service_slug === 'solar-panel-cleaning') ?? galleryPhotos[0]
  return (
    <main id="main-content" className="ngms-solar-fusion overflow-hidden bg-black p-2 text-black sm:p-3">
      <section className="relative mx-auto mb-2 grid max-w-[1440px] gap-8 overflow-hidden rounded-[24px] border-b-[6px] border-black bg-[#F3F0EA] px-5 py-9 sm:mb-3 sm:px-10 sm:py-14 lg:min-h-[550px] lg:grid-cols-[.8fr_1.2fr] lg:gap-12 lg:px-14">
        <div className="flex flex-col items-start">
          <Eyebrow>FORMULA 01 / NGMS SOLAR DIVISION / HELDERBERG</Eyebrow>
          <h1 className="max-w-2xl font-sans font-black text-5xl uppercase leading-[0.91] tracking-[-0.075em] sm:text-7xl lg:text-[6.5rem]">CLEAN<br/>PANELS.<br/><span className="text-[#F47721]">CLEAR</span><br/>MIND.</h1>
          <p className="mt-6 max-w-sm text-sm leading-relaxed text-black/75 sm:text-base">Solar panel cleaning and planned property care for homes, complexes and businesses across Strand, Gordon’s Bay and Somerset West.</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/quote?service=solar-panel-cleaning" className="inline-flex min-h-12 items-center gap-3 bg-black px-5 py-3 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-[#F47721] hover:text-black">Get a quote <span>↗</span></Link>
            <a href={whatsapp} target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center gap-2 border border-black px-4 py-3 text-xs font-bold uppercase tracking-wide transition hover:bg-white"><WhatsAppMark/> WhatsApp</a>
          </div>
          <div className="mt-auto hidden pt-12 text-[10px] font-bold uppercase tracking-[0.16em] text-black/65 lg:block">ONE CALL. ALL SOLUTIONS. / 2026</div>
        </div>
        <div className="group relative flex min-h-[270px] items-center justify-center overflow-hidden border border-black/10 bg-[#5e5e5e] sm:min-h-[390px] lg:min-h-[450px]">
          {solarPhoto?.image_url ? (
            <>
              <img src={solarPhoto.image_url} alt={solarPhoto.caption || 'Solar panel cleaning in the Helderberg Basin'} className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]" />
              <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/5 to-black/70" />
            </>
          ) : (
            <div aria-hidden="true" className="absolute inset-0 bg-[#b9b9b9]" />
          )}
          <div className="absolute left-5 right-5 top-5 flex justify-between font-mono text-[10px] uppercase tracking-widest text-white drop-shadow"><span>FIELD NOTES / 001</span><span>NGMS</span></div>
          <div aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 select-none font-mono text-[10rem] font-black leading-none tracking-[-0.12em] text-[#F47721]/85 drop-shadow-[0_2px_12px_rgba(0,0,0,0.25)] sm:text-[16rem] lg:text-[20rem]">{solarPhoto?.image_url ? "01" : "NG"}</div>
          <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between gap-4 border-t border-white/50 pt-4 text-white">
            <div><p className="text-xs font-bold uppercase tracking-wide drop-shadow">SOLAR PANEL CLEANING</p><p className="mt-1 text-[10px] uppercase tracking-widest text-white/90 drop-shadow">Strand · Gordon’s Bay · Somerset West</p></div>
            <Link href="/maintenance-packages" aria-label="Explore maintenance packages" className="group"><ArrowCircle/></Link>
          </div>
        </div>
      </section>

      <section className="mx-auto mb-2 grid max-w-[1440px] gap-8 border-b-[6px] border-black bg-[#F3F0EA] px-5 py-10 sm:mb-3 sm:px-10 sm:py-14 lg:grid-cols-[.65fr_1.35fr] lg:px-14">
        <div>
          <Eyebrow>01 / WHAT WE DO</Eyebrow>
          <h2 className="text-[#202020] text-3xl font-black leading-[0.98] tracking-[-0.055em] sm:text-5xl">MY SERVICES.<br/>YOUR PROPERTY.</h2>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-black/75">A focused service with clear communication, practical planning and no unnecessary fuss.</p>
          <div className="mt-8 hidden lg:block"><span className="inline-grid h-20 w-20 rotate-[-45deg] place-items-center rounded-full border border-black text-4xl">↘</span></div>
        </div>
        <div className="relative min-w-0">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.16em] text-black/60">Swipe / scroll to explore</p>
          <div aria-label="Solar cleaning services carousel" className="flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain pb-4 [scrollbar-color:#F47721_#D5D5D0] [scrollbar-width:thin]">
            {services.map((service, index) => <Link href={service.number === '02' ? '/maintenance-packages' : '/quote?service=solar-panel-cleaning'} key={service.number} className={`group flex min-h-[260px] w-[82%] shrink-0 snap-start flex-col justify-between border border-black/25 p-5 transition duration-300 hover:-translate-y-1 hover:border-[#F47721] hover:bg-[#F47721] sm:w-[48%] lg:w-[46%] ${index === 1 ? 'bg-[#F47721]' : index === 3 ? 'bg-[#1A1A1A] text-white hover:text-black' : 'bg-[#F3F0EA]'}`}>
              <div className="flex items-start justify-between gap-4"><span className="font-mono text-4xl font-light tracking-[-0.08em]">{service.number}</span><span className="text-xs uppercase tracking-widest opacity-60">NGMS / SOLAR</span></div>
              <div><h3 className="max-w-xs text-xl font-bold uppercase leading-[0.98] tracking-[-0.04em] sm:text-2xl">{service.title}</h3><p className="mt-3 max-w-sm text-xs leading-relaxed opacity-75 sm:text-sm">{service.description}</p></div>
              <div className="flex items-center justify-between border-t border-current/20 pt-3"><span className="text-[10px] font-bold uppercase tracking-widest">Explore service</span><ArrowCircle/></div>
            </Link>)}
          </div>
          <div className="mt-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-black/55"><span className="h-px w-8 bg-[#F47721]"></span>Drag horizontally / use trackpad</div>
        </div>
      </section>

      <section className="mx-auto mb-2 max-w-[1440px] border-b-[6px] border-black bg-[#F3F0EA] px-5 py-10 sm:mb-3 sm:px-10 sm:py-14 lg:px-14">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div><Eyebrow>02 / THE NEXTGEN STANDARD</Eyebrow><h2 className="max-w-2xl text-[#202020] text-4xl font-black leading-[0.94] tracking-[-0.06em] sm:text-6xl">GOOD WORK.<br/>NO GUESSWORK.</h2></div>
          <p className="max-w-sm text-sm leading-relaxed text-black/75">A professional experience means knowing what’s included, what it costs and what happens next.</p>
        </div>
        <div aria-label="NextGen service standards carousel" className="mt-8 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-4 [scrollbar-color:#F47721_#D5D5D0] [scrollbar-width:thin]">
          {standards.map((item, index) => <article key={item.number} className={`group min-h-44 w-[78%] shrink-0 snap-start border border-black/25 p-5 transition duration-300 hover:-translate-y-1 hover:border-[#F47721] sm:w-[42%] lg:w-[24%] ${index === 1 ? 'bg-[#F47721]' : index === 3 ? 'bg-[#1A1A1A] text-white hover:text-black' : 'bg-[#F3F0EA]'}`}><div className="flex items-center justify-between"><span className="font-mono text-3xl font-light tracking-[-0.08em]">{item.number}</span><span className="text-xl">↗</span></div><h3 className="mt-8 text-sm font-bold uppercase">{item.title}</h3><p className="mt-2 text-xs leading-relaxed opacity-75">{item.body}</p></article>)}
        </div>
      </section>

      <section className="mx-auto mb-2 grid max-w-[1440px] gap-8 border-b-[6px] border-black bg-[#F3F0EA] px-5 py-10 sm:mb-3 sm:px-10 sm:py-14 lg:grid-cols-[.7fr_1.3fr] lg:px-14">
        <div><Eyebrow>03 / PRICE GUIDE</Eyebrow><h2 className="text-[#202020] text-4xl font-black leading-[0.94] tracking-[-0.06em] sm:text-6xl">CLEAR<br/>PRICING.</h2><p className="mt-4 max-w-xs text-sm leading-relaxed text-black/75">Starting prices for residential arrays. We confirm your exact scope and price before booking.</p><Link href="/price-list" className="mt-6 inline-flex items-center gap-3 border-b border-black pb-2 text-xs font-bold uppercase">Full price list <span>↗</span></Link></div>
        <div className="border-t border-black/25">
          {tiers.map((tier) => <div key={tier.size} className="grid grid-cols-[1fr_auto] items-center gap-4 border-b border-black/25 py-4 sm:py-5"><div><p className="font-mono text-[10px] font-bold tracking-widest">{tier.size}</p><p className="mt-1 text-xs text-black/75">{tier.note}</p></div><p className="text-lg font-black tracking-tight sm:text-2xl">{tier.price}</p></div>)}
          <p className="mt-3 text-[10px] leading-relaxed text-black/65">Prices exclude VAT where applicable. Access, site layout and final panel count can affect the quote.</p>
        </div>
      </section>

      <section className="mx-auto mb-2 max-w-[1440px] border-b-[6px] border-black bg-[#F3F0EA] px-5 py-10 sm:mb-3 sm:px-10 sm:py-14 lg:px-14">
        <div className="grid gap-8 lg:grid-cols-[.7fr_1.3fr]">
          <div><Eyebrow>04 / MAINTENANCE PLANS</Eyebrow><h2 className="text-[#202020] text-4xl font-black leading-[0.94] tracking-[-0.06em] sm:text-6xl">CARE THAT<br/>COMES BACK.</h2><p className="mt-4 max-w-sm text-sm leading-relaxed text-black/75">Keep solar cleaning and property maintenance on a sensible schedule, with a single local point of contact.</p><Link href="/maintenance-packages" className="mt-6 inline-flex items-center gap-3 bg-[#F47721] px-5 py-3 text-xs font-bold uppercase transition hover:bg-black hover:text-white">Explore maintenance plans <span>↗</span></Link></div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Link href="/maintenance-packages#recurring" className="group border border-black/25 p-5 transition hover:bg-white/30"><p className="font-mono text-[10px]">01 / REPEAT VISITS</p><h3 className="mt-8 text-lg font-bold uppercase">Recurring care</h3><p className="mt-2 text-xs leading-relaxed text-black/75">Planned cleaning and maintenance to suit your property.</p><span className="mt-6 inline-block text-xl transition group-hover:translate-x-1">↗</span></Link>
            <Link href="/maintenance-packages#commercial" className="group border border-black/25 p-5 transition hover:bg-white/30"><p className="font-mono text-[10px]">02 / MANAGED SITES</p><h3 className="mt-8 text-lg font-bold uppercase">Complexes & business</h3><p className="mt-2 text-xs leading-relaxed text-black/75">Coordinated service for body corporates and light commercial properties.</p><span className="mt-6 inline-block text-xl transition group-hover:translate-x-1">↗</span></Link>
          </div>
        </div>
      </section>

      <section className="mx-auto mb-2 grid max-w-[1440px] gap-8 border-b-[6px] border-black bg-[#F3F0EA] px-5 py-10 sm:mb-3 sm:px-10 sm:py-14 lg:grid-cols-[.7fr_1.3fr] lg:px-14">
        <div><Eyebrow>05 / BEFORE YOU BOOK</Eyebrow><h2 className="text-[#202020] text-4xl font-black leading-[0.94] tracking-[-0.06em] sm:text-5xl">GOOD TO<br/>KNOW.</h2><p className="mt-4 text-sm text-black/75">Quick answers to common questions.</p></div>
        <div className="border-t border-black/20">{faqs.map((faq) => <details key={faq.q} className="group border-b border-black/20 py-4"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-bold uppercase sm:text-base"><span>{faq.q}</span><span className="text-xl group-open:rotate-45">+</span></summary><p className="mt-3 max-w-2xl text-sm leading-relaxed text-black/75">{faq.a}</p></details>)}</div>
      </section>

      <section className="relative mx-auto mb-2 max-w-[1440px] overflow-hidden rounded-[24px] bg-[#F3F0EA] px-5 pb-10 pt-12 sm:mb-3 sm:px-10 sm:pb-14 sm:pt-16 lg:px-14">
        <div className="relative z-10 text-center"><Eyebrow>HAVE A PROJECT IN MIND?</Eyebrow><h2 className="text-4xl font-black leading-[0.92] tracking-[-0.07em] sm:text-7xl lg:text-[8rem]">LET’S TALK<span className="text-[#F47721]">.</span></h2><p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-black/75 sm:text-base">Tell us about your panels or property. We’ll help you work out the right next step.</p><div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row"><Link href="/quote?service=solar-panel-cleaning" className="inline-flex min-h-12 items-center justify-center gap-3 bg-black px-6 py-3 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-[#F47721] hover:text-black">Request a quote <span>↗</span></Link><a href={whatsapp} target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center justify-center gap-2 border border-black px-5 py-3 text-xs font-bold uppercase transition hover:bg-white/40"><WhatsAppMark/> Message NextGen</a></div></div>
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 select-none text-[12rem] font-black leading-none tracking-[-0.1em] text-black/[0.035] sm:text-[20rem]">NGMS</div>
      </section>

      <footer className="bg-black px-5 pb-8 pt-8 text-white sm:px-10 sm:pt-12 lg:px-14">
        <div className="mx-auto grid max-w-[1440px] gap-8 md:grid-cols-[1fr_1fr_1fr]">
          <div><Link href="/" className="text-2xl font-black tracking-[-0.08em]">NEXTGEN<span className="text-[#F47721]">.</span></Link><p className="mt-4 max-w-xs text-xs leading-relaxed text-white/70">One call. All solutions. Solar panel cleaning and property maintenance across the Helderberg Basin.</p><div className="mt-5 flex gap-3 text-xs font-bold uppercase"><a href="https://www.facebook.com/p/Nextgen-Solar-Maintenance-Solutions-61590183304623/" target="_blank" rel="noreferrer" className="border border-white/30 px-3 py-2 hover:border-[#F47721]">Facebook ↗</a><a href={whatsapp} target="_blank" rel="noreferrer" className="border border-white/30 px-3 py-2 hover:border-[#F47721]">WhatsApp ↗</a></div></div>
          <div><Eyebrow dark>CONTACT</Eyebrow><a href={`tel:${site.phone}`} className="block text-xl font-black hover:text-[#F47721]">063 138 7945</a><p className="mt-2 text-xs text-white/70">Mon–Sat / 07:00–19:00</p><p className="mt-4 text-xs text-white/70">Strand · Gordon’s Bay · Somerset West</p></div>
          <div><Eyebrow dark>QUICK LINKS</Eyebrow><div className="grid grid-cols-2 gap-3 text-xs uppercase text-white/75"><Link href="/maintenance-packages" className="hover:text-[#F47721]">Maintenance plans ↗</Link><Link href="/price-list" className="hover:text-[#F47721]">Price list ↗</Link><Link href="/portfolio" className="hover:text-[#F47721]">Projects ↗</Link><Link href="/contact" className="hover:text-[#F47721]">Contact ↗</Link></div></div>
        </div>
        <div className="mx-auto mt-9 flex max-w-[1440px] flex-wrap justify-between gap-3 border-t border-white/15 pt-4 text-[10px] uppercase tracking-widest text-white/40"><span>© 2026 NextGen Solar Clean & Maintenance Solutions</span><span>ONE CALL. ALL SOLUTIONS.</span></div>
      </footer>
    </main>
  )
}
