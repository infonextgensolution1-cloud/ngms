import type { Metadata } from 'next'
import Link from 'next/link'
import { getSlotPhotos } from '@/lib/queries'

export const metadata: Metadata = {
  alternates: { canonical: '/body-corporate-maintenance' },
  title: 'Body Corporate Maintenance | NextGen Solar Clean & Maintenance Solutions',
  description: 'One maintenance contact for body corporate properties across Strand, Gordon’s Bay, Somerset West and the Helderberg Basin.',
}

const services = [
  { n: '01', title: 'High-pressure cleaning', detail: 'Keep entrances, communal walkways and parking areas clean and well maintained.', image: '' },
  { n: '02', title: 'Painting & maintenance', detail: 'Protect façades, boundary walls and shared spaces with practical upkeep.', image: '' },
  { n: '03', title: 'Paving & repairs', detail: 'Maintain communal paving, entrances, paths and outdoor areas.', image: '' },
]
const benefits = [
  ['01', 'ONE POINT OF CONTACT', 'All maintenance work coordinated for your property.'],
  ['02', 'MULTI-TRADE SOLUTIONS', 'Painting, waterproofing, paving, plumbing, electrical and more.'],
  ['03', 'RELIABLE & PROFESSIONAL', 'Clear communication and quality workmanship.'],
  ['04', 'WRITTEN QUOTES & REPORTS', 'Detailed scopes, quotes and progress updates.'],
]
const steps = [
  ['01', 'Assess the property', 'Bring recurring defects, planned maintenance and repair lists together.'],
  ['02', 'Agree the scope', 'Receive a written quote with clear work items before anything is approved.'],
  ['03', 'Coordinate the work', 'One contact helps keep communication, scheduling and trade coordination straightforward.'],
  ['04', 'Review completion', 'Confirm completed work and identify any follow-up requirements.'],
]
const wa = 'https://wa.me/27631387945?text=Hi%20NextGen%2C%20I%27d%20like%20a%20quote%20for%20body%20corporate%20maintenance.%0AWhat%20I%20need%3A%20'

export default async function Page() {
  const assignedPhotos = await getSlotPhotos(['body_corporate_hero', 'body_corporate_cleaning', 'body_corporate_painting', 'body_corporate_paving'])
  const heroPhoto = assignedPhotos.body_corporate_hero?.image_url ?? ''
  const projectPhotos = [assignedPhotos.body_corporate_cleaning, assignedPhotos.body_corporate_painting, assignedPhotos.body_corporate_paving]
  return (
    <main className="bg-[#f2f1ed] text-[#101112]">
      <div className="mx-auto max-w-[1500px] px-3 py-3 sm:px-5 sm:py-5">
        <div className="overflow-hidden border border-[#292929] bg-white shadow-[0_20px_70px_rgba(0,0,0,.12)]">
          <header className="grid grid-cols-2 items-stretch bg-[#080909] text-white sm:grid-cols-[1fr_auto_auto_auto]">
            <Link href="/" aria-label="NextGen Solar Clean & Maintenance Solutions home" className="flex flex-col justify-center px-5 py-4 sm:px-8">
              <span className="text-2xl font-black leading-none tracking-[-0.06em] sm:text-3xl">NEXT<span className="text-[#ff4b1b]">GEN</span></span>
              <span className="mt-1 text-[9px] font-bold tracking-[0.18em]">MAINTENANCE SOLUTIONS</span>
            </Link>
            <Link href="/services" className="flex items-center justify-center border-l border-white/15 px-4 py-4 text-[10px] font-bold uppercase tracking-[0.12em] hover:bg-white hover:text-black">Services</Link>
            <Link href="/portfolio" className="flex items-center justify-center border-l border-white/15 px-4 py-4 text-[10px] font-bold uppercase tracking-[0.12em] hover:bg-white hover:text-black">Projects</Link>
            <Link href="/quote" className="col-span-2 flex items-center justify-between gap-5 bg-[#ff4b1b] px-5 py-4 text-xs font-black uppercase tracking-[0.08em] text-black transition hover:bg-white sm:col-span-1 sm:px-6">Request a quote <span aria-hidden="true">↗</span></Link>
          </header>

          <section className="grid bg-[#080909] text-white lg:grid-cols-[.92fr_1.08fr]">
            <div className="flex flex-col justify-center px-5 py-8 sm:px-9 sm:py-10 lg:px-12 lg:py-12">
              <div>
                <p className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-[#ff653b]"><span className="h-1.5 w-8 bg-[#ff4b1b]" /> Body corporate maintenance</p>
                <h1 className="mt-5 max-w-[560px] text-[clamp(1.45rem,2.7vw,2.8rem)] font-black uppercase leading-[.98] tracking-[-.035em] [text-wrap:balance] break-normal">A single maintenance contact for <span className="text-[#ff4b1b]">body corporate properties.</span></h1>
                <p className="mt-6 max-w-xl text-sm leading-relaxed text-white/80 sm:text-base">Coordinate property maintenance without managing a different contractor for every issue. NextGen provides a single point of contact for multi-trade work across the Helderberg Basin.</p>
                <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <a href={wa} target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center justify-between gap-5 bg-[#ff4b1b] px-5 py-4 text-[11px] font-black uppercase tracking-[.06em] text-black transition hover:bg-white sm:min-w-[350px]">☏ WhatsApp: request a body corporate assessment <span>↗</span></a>
                  <Link href="/quote" className="inline-flex min-h-12 items-center justify-between gap-5 border border-white/70 px-5 py-4 text-[11px] font-bold uppercase tracking-[.08em] text-white transition hover:border-[#ff4b1b] hover:text-[#ff704d] sm:min-w-[230px]">Request online quote <span>→</span></Link>
                </div>
                <p className="mt-5 text-[11px] font-medium text-white/65">Helderberg Basin <span className="mx-2 text-[#ff4b1b]">•</span> Free site assessment <span className="mx-2 text-[#ff4b1b]">•</span> Written quotes</p>
              </div>
              <div className="mt-10 grid grid-cols-3 gap-3 border-t border-white/20 pt-5">
                { [['ONE', 'Point of contact'], ['MULTI-TRADE', 'Coordinated solutions'], ['LOCAL', 'Helderberg Basin']].map(([big,small]) => <div key={small}><p className="text-lg font-black tracking-tight sm:text-2xl">{big}</p><p className="mt-1 max-w-[130px] text-[9px] uppercase leading-snug tracking-[.1em] text-white/55 sm:text-[10px]">{small}</p></div>) }
              </div>
            </div>
            <div className="relative min-h-[360px] overflow-hidden border-t border-white/15 bg-[#292a2a] sm:min-h-[500px] lg:min-h-[680px] lg:border-l lg:border-t-0">
              <div className="absolute inset-0 bg-cover bg-center" role="img" aria-label="Modern multi-unit residential complex with landscaped shared areas" style={{backgroundImage: heroPhoto ? 'linear-gradient(90deg,rgba(8,9,9,.35),rgba(8,9,9,.03) 60%),linear-gradient(0deg,rgba(8,9,9,.58),transparent 52%),url("' + heroPhoto + '")' : 'linear-gradient(135deg,#292a2a,#111313)'}} />
              {!heroPhoto && <div className="absolute inset-0 flex items-center justify-center p-6"><span className="border border-white/50 bg-black/45 px-4 py-3 text-center text-xs font-bold uppercase tracking-[.12em] text-white">Choose hero photo in Admin → Media → Maintenance projects</span></div>}
              <div className="absolute left-5 top-5 border border-white/60 bg-black/25 px-3 py-2 text-[9px] font-bold uppercase tracking-[.16em] sm:left-8 sm:top-8">NGMS / Property care</div>
              <div className="absolute bottom-6 left-5 right-5 flex items-end justify-between gap-5 sm:bottom-9 sm:left-8 sm:right-8">
                <div><p className="text-[10px] font-black uppercase tracking-[.18em] text-[#ff704d]">One trusted maintenance partner</p><p className="mt-2 text-3xl font-black uppercase leading-[.9] tracking-[-.055em] sm:text-5xl">Well maintained.<br/>Better managed.</p></div>
                <a href="#selected-projects" aria-label="Explore maintenance services" className="flex h-12 w-12 shrink-0 items-center justify-center bg-[#ff4b1b] text-2xl font-bold text-black transition hover:bg-white">↓</a>
              </div>
            </div>
          </section>

          <section aria-label="Service benefits" className="grid grid-cols-2 border-b border-[#d0cfca] bg-[#f7f7f5] md:grid-cols-4">
            {benefits.map(([n,title,detail]) => <article key={n} className="border-b border-r border-[#deddd8] p-4 sm:p-6 md:border-b-0">
              <span className="text-2xl font-black text-[#ff4b1b]">{n === '01' ? '⌂' : n === '02' ? '✣' : n === '03' ? '✓' : '▤'}</span>
              <h2 className="mt-3 text-xs font-black uppercase leading-tight tracking-[-.02em] sm:text-sm">{title}</h2><p className="mt-2 text-xs leading-relaxed text-[#555653]">{detail}</p>
            </article>)}
          </section>

          <section id="selected-projects" className="px-5 py-10 sm:px-9 sm:py-14 lg:px-12">
            <div className="grid gap-6 md:grid-cols-[1fr_.55fr] md:items-end">
              <div><p className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[.18em]"><span className="h-1.5 w-8 bg-[#ff4b1b]"/> 01 / Selected services</p><h2 className="mt-5 text-4xl font-black uppercase leading-[.85] tracking-[-.065em] sm:text-6xl">Good work.<br/>Clear results.</h2><p className="mt-4 max-w-xl text-sm leading-relaxed text-[#4f504e] sm:text-base">Real NGMS project photography, uploaded through Admin → Media, can be featured here with its service category and project description.</p><Link href="/services" className="mt-5 inline-flex border-b-2 border-[#ff4b1b] pb-2 text-xs font-black uppercase tracking-[.1em] hover:text-[#e23c13]">Explore all services <span className="ml-4">→</span></Link></div>
              <p className="border-l-2 border-[#ff4b1b] pl-4 text-xs font-bold uppercase leading-relaxed tracking-[.08em] text-[#555653]">Well maintained properties.<br/>Happier residents.</p>
            </div>
            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {services.map((service, index) => { const photo = projectPhotos[index]; const image = photo?.image_url || ''; const title = photo?.caption?.trim() || service.title; return <article key={service.n} className="group min-w-0">
                <div className="relative aspect-[1.2/1] overflow-hidden bg-[#d4d3cf]">{image ? <div role="img" aria-label={title} className="absolute inset-0 bg-cover bg-center transition duration-500 group-hover:scale-[1.04]" style={{backgroundImage: `url('${image}')`}}/> : <div className="absolute inset-0 flex items-center justify-center bg-[#e2e0da] px-6 text-center text-xs font-bold uppercase tracking-widest text-[#77756f]">Upload this position in Admin → Media → Maintenance projects</div>}<span className="absolute left-3 top-3 bg-[#ff4b1b] px-2 py-1 text-[10px] font-black text-black">{service.n}</span></div>
                <h3 className="mt-4 border-l-[3px] border-[#ff4b1b] pl-3 text-base font-black uppercase leading-tight tracking-[-.025em]">{title}</h3><p className="mt-2 pl-4 text-sm leading-relaxed text-[#555653]">{photo?.service_slug ? `NGMS project · ${photo.service_slug.replace(/-/g, ' ')}` : service.detail}</p>
              </article> })}
            </div>
          </section>

          <section className="grid bg-[#090a0a] text-white md:grid-cols-[1.1fr_.9fr]">
            <div className="px-5 py-10 sm:px-9 sm:py-12 lg:px-12">
              <p className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[.18em] text-[#ff704d]"><span className="h-1.5 w-8 bg-[#ff4b1b]"/> 02 / Assessment</p>
              <h2 className="mt-5 max-w-2xl text-4xl font-black uppercase leading-[.86] tracking-[-.065em] sm:text-6xl">Start with a<br/><span className="text-[#ff4b1b]">free site assessment.</span></h2>
              <p className="mt-5 max-w-xl text-sm leading-relaxed text-white/75 sm:text-base">Bring recurring defects, planned maintenance and repair lists together. NextGen can assess the property and provide a written quote with clear recommendations.</p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap"><a href={wa} target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center justify-between gap-5 bg-[#ff4b1b] px-5 py-4 text-[11px] font-black uppercase tracking-[.06em] text-black transition hover:bg-white">☏ WhatsApp: request an assessment <span>↗</span></a><Link href="/quote" className="inline-flex min-h-12 items-center justify-between gap-5 border border-white/70 px-5 py-4 text-[11px] font-bold uppercase tracking-[.08em] transition hover:border-[#ff4b1b] hover:text-[#ff704d]">Request online quote <span>→</span></Link></div>
            </div>
            <div className="flex flex-col justify-center gap-4 border-t border-white/15 px-5 py-8 sm:px-9 md:border-l md:border-t-0 lg:px-12">
              {['Free site assessment','Written quotes','Multi-trade maintenance','No callout fee in the Helderberg Basin'].map(item => <p key={item} className="flex items-center gap-3 text-sm sm:text-base"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#ff4b1b] font-black text-black">✓</span>{item}</p>)}
              <p className="mt-4 text-xs uppercase leading-relaxed tracking-[.1em] text-white/55">Serving Strand · Gordon’s Bay · Somerset West · Helderberg Basin</p>
            </div>
          </section>
          <footer className="flex flex-col justify-between gap-3 bg-[#f7f7f5] px-5 py-5 text-[10px] font-bold uppercase tracking-[.13em] text-[#555653] sm:flex-row sm:px-8"><span>NextGen Solar Clean & Maintenance Solutions</span><span>ONE CALL. ALL SOLUTIONS.</span><Link href="/" className="hover:text-[#ff4b1b]">Back to home ↑</Link></footer>
        </div>
      </div>
    </main>
  )
}
