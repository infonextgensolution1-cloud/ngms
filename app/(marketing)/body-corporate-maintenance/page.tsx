import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  alternates: { canonical: '/body-corporate-maintenance' },
  title: 'Body Corporate Maintenance | NextGen Maintenance Solutions',
  description: 'Coordinated maintenance for body corporates, trustees and managing agents across Strand, Gordon’s Bay and Somerset West.',
}

const services = [
  ['01', 'Painting & waterproofing', 'Protect shared walls, façades and common areas from weather and wear.'],
  ['02', 'Paving & pressure cleaning', 'Keep entrances, walkways and shared outdoor spaces presentable.'],
  ['03', 'Gutters & roofline care', 'Routine clearing and maintenance to help reduce water-related damage.'],
  ['04', 'Plumbing & electrical', 'Coordinate maintenance requests and trade support where required.'],
  ['05', 'Common-area repairs', 'Practical handyman work, steelwork and minor repairs.'],
  ['06', 'Solar panel cleaning', 'Professional cleaning for installed solar panels—no installation.'],
]
const steps = [
  ['01', 'Walk the site', 'Discuss priorities, access, problem areas and maintenance needs.'],
  ['02', 'Written quotation', 'Receive a clear scope and pricing before work is approved.'],
  ['03', 'Coordinate work', 'One point of contact keeps communication and scheduling straightforward.'],
  ['04', 'Review completion', 'Confirm completed work and identify follow-up requirements.'],
]

export default function Page() {
  return <main className="bg-[#f1f0eb] text-[#111111]">
    <div className="mx-auto max-w-[1500px] px-3 py-3 sm:px-6 sm:py-6 lg:px-8"><div className="overflow-hidden border border-[#252525] bg-[#f8f7f3]">
      <header className="grid grid-cols-2 border-b border-[#252525] sm:grid-cols-[1fr_auto_auto_auto]">
        <Link href="/" aria-label="NextGen home" className="flex items-center px-4 py-4 text-lg font-black tracking-[0.15em] sm:px-6">NGMS<span className="ml-2 text-[#ed4b26]">↗</span></Link>
        <Link href="/services" className="flex items-center justify-center border-l border-[#252525] px-3 py-4 text-[10px] font-bold uppercase tracking-[0.14em] hover:bg-[#ed4b26] hover:text-white sm:px-5">Services</Link>
        <Link href="/portfolio" className="flex items-center justify-center border-l border-[#252525] px-3 py-4 text-[10px] font-bold uppercase tracking-[0.14em] hover:bg-[#ed4b26] hover:text-white sm:px-5">Projects</Link>
        <Link href="/quote" className="col-span-2 flex items-center justify-between border-t border-[#252525] bg-[#ed4b26] px-4 py-3 text-xs font-bold uppercase tracking-[0.12em] text-white hover:bg-[#c93618] sm:col-span-1 sm:border-l sm:border-t-0 sm:px-5">Request a site assessment ↗</Link>
      </header>
      <section className="grid grid-cols-1 bg-[#101214] text-white lg:grid-cols-[0.8fr_1.2fr]">
        <div className="flex flex-col justify-between p-5 sm:p-9 lg:p-12"><div>
          <p className="text-[10px] font-bold uppercase tracking-[0.23em] text-[#ff704d]">Property care / Body corporates</p>
          <h1 className="mt-10 text-[clamp(3.5rem,9vw,7.5rem)] font-black uppercase leading-[0.78] tracking-[-0.085em]">COMPLEX<br/>CARE<span className="text-[#ed4b26]">.</span></h1>
          <p className="mt-6 max-w-sm text-3xl font-bold uppercase leading-[0.95] tracking-[-0.045em] text-[#c6c6c2]">Built on trust.<br/>Maintained with care.</p>
          <p className="mt-6 max-w-md text-sm leading-relaxed text-white/75">A dependable maintenance point of contact for trustees, managing agents and residential complexes across the Helderberg Basin.</p>
          <div className="mt-7 flex flex-wrap gap-3"><Link href="/quote" className="inline-flex min-h-12 items-center gap-5 bg-[#ed4b26] px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-white hover:bg-white hover:text-[#111111]">Request site assessment ↗</Link>
          <a href="https://wa.me/27631387945?text=Hi%20NGMS%2C%20I%27d%20like%20to%20discuss%20maintenance%20for%20our%20complex." aria-label="Contact NGMS on WhatsApp" className="inline-flex h-12 w-12 items-center justify-center border border-[#ed4b26] text-[#25D366] hover:bg-white/10"><svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6 fill-current"><path d="M20.52 3.48A11.8 11.8 0 0 0 12.1 0C5.55 0 .22 5.33.22 11.88c0 2.1.55 4.16 1.6 5.98L.12 24l6.3-1.65a11.9 11.9 0 0 0 5.68 1.45h.01c6.55 0 11.88-5.33 11.88-11.88 0-3.17-1.24-6.15-3.47-8.44Z"/></svg></a></div></div>
          <div className="mt-12 grid grid-cols-3 border-t border-white/20 pt-4">{[['01','Point of contact'],['Multi','Trade coordination'],['Local','Helderberg Basin']].map(([v,l])=><div key={l}><p className="text-xl font-black">{v}</p><p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-white/60">{l}</p></div>)}</div>
        </div>
        <div className="relative min-h-[420px] overflow-hidden border-t border-white/20 bg-[#3b3c3b] lg:min-h-[650px] lg:border-l lg:border-t-0"><div className="absolute inset-0 bg-cover bg-center" style={{backgroundImage:"linear-gradient(180deg,rgba(8,9,11,.05),rgba(8,9,11,.8)),url('https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1800&q=85')"}}/><div className="absolute left-5 top-5 border border-white/60 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white sm:left-8 sm:top-8">NGMS / Property maintenance</div><div className="absolute bottom-5 left-5 right-5 flex items-end justify-between gap-4 text-white sm:bottom-8 sm:left-8 sm:right-8"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#ff704d]">A better maintained property</p><p className="mt-2 text-3xl font-black uppercase leading-[0.9] tracking-[-0.05em] sm:text-5xl">One roof.<br/>Many solutions.</p></div><a href="#services" className="flex h-12 w-12 shrink-0 items-center justify-center bg-[#ed4b26] text-2xl" aria-label="Explore services">↓</a></div></div>
      </section>
      <section className="border-b border-[#252525] px-5 py-10 sm:px-9 sm:py-14 lg:px-12"><div className="grid gap-5 md:grid-cols-[1fr_.75fr] md:items-end"><div><p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#ed4b26]">01 / One roof, built for life</p><h2 className="mt-4 text-4xl font-black uppercase leading-[0.86] tracking-[-0.07em] sm:text-6xl">A smarter way<br/>to maintain a <span className="text-[#ed4b26]">complex.</span></h2></div><div><p className="text-sm leading-relaxed text-[#505050]">Shared properties need consistent upkeep, dependable communication and a clear view of the work being done. NGMS helps coordinate practical maintenance across multiple trades through one point of contact.</p><p className="mt-4 text-xs font-bold uppercase tracking-[0.12em]">For trustees · Managing agents · Residents’ associations</p></div></div>
        <div id="services" className="mt-8 grid gap-px border border-[#b9b7b0] bg-[#b9b7b0] sm:grid-cols-2 xl:grid-cols-3">{services.map(([n,t,d])=><article key={n} className="group flex min-h-44 flex-col bg-[#f8f7f3] p-5 transition hover:bg-white sm:p-6"><div className="flex items-center justify-between"><span className="text-xs font-black tracking-[0.15em] text-[#ed4b26]">{n}</span><span className="text-xl">↗</span></div><h3 className="mt-5 text-xl font-black uppercase leading-[0.95] tracking-[-0.04em]">{t}</h3><p className="mt-3 text-sm leading-relaxed text-[#555555]">{d}</p></article>)}</div>
      </section>
      <section className="grid bg-[#111214] text-white md:grid-cols-[.8fr_1.2fr]"><div className="p-5 sm:p-9 lg:p-12"><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#ff704d]">02 / How we work</p><h2 className="mt-5 text-4xl font-black uppercase leading-[0.85] tracking-[-0.07em] sm:text-6xl">Structure<br/>creates <span className="text-[#ed4b26]">clarity.</span></h2><p className="mt-5 max-w-sm text-sm leading-relaxed text-white/65">A straightforward process keeps scope, communication and next steps clear for your committee or managing agent.</p></div><div className="grid grid-cols-1 border-t border-white/20 sm:grid-cols-2 md:border-l md:border-t-0">{steps.map(([n,t,d])=><article key={n} className="border-b border-white/20 p-5 sm:p-7"><p className="text-xs font-black tracking-[0.18em] text-[#ff704d]">{n} / STEP</p><h3 className="mt-4 text-xl font-black uppercase">{t}</h3><p className="mt-2 text-sm leading-relaxed text-white/65">{d}</p></article>)}</div></section>
      <section className="grid border-t border-[#252525] bg-[#f1f0eb] md:grid-cols-[1fr_auto]"><div className="p-6 sm:p-10"><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#ed4b26]">03 / Start a conversation</p><h2 className="mt-3 text-4xl font-black uppercase leading-[0.88] tracking-[-0.07em] sm:text-6xl">Your complex.<br/>A clearer plan.</h2><p className="mt-4 max-w-xl text-sm leading-relaxed text-[#555555]">Tell us about your property and the work that needs attention. We’ll help establish the next step and provide a written quote based on the agreed scope.</p><p className="mt-4 text-xs font-bold uppercase tracking-[0.12em] text-[#555555]">Strand · Gordon’s Bay · Somerset West · Helderberg Basin</p></div><div className="flex flex-col justify-center gap-3 bg-[#ed4b26] p-6 sm:min-w-64 sm:p-10"><Link href="/quote" className="flex items-center justify-between gap-6 border border-white/70 px-4 py-4 text-xs font-bold uppercase tracking-[0.12em] text-white hover:bg-white hover:text-[#111111]">Request site assessment ↗</Link><a href="https://wa.me/27631387945?text=Hi%20NGMS%2C%20please%20contact%20me%20about%20body%20corporate%20maintenance." className="flex items-center justify-between gap-6 border border-white/70 px-4 py-4 text-xs font-bold uppercase tracking-[0.12em] text-white hover:bg-white hover:text-[#111111]">WhatsApp NGMS <span className="text-[#25D366]">●</span></a></div></section>
      <footer className="flex flex-col justify-between gap-3 border-t border-[#252525] px-5 py-5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#555555] sm:flex-row sm:px-8"><span>NextGen Maintenance Solutions</span><span>One Call. All Solutions.</span><Link href="/" className="hover:text-[#ed4b26]">Back to home ↑</Link></footer>
    </div></div>
}
