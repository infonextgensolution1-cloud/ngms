'use client'

import Link from 'next/link'
import { waLink } from '@/lib/site'

export type SegmentLandingConfig = {
  slug:string; eyebrow:string; title:string; intro:string; offer:string; offerDetail:string
  proof:string[]; services:string[]; local:string; cta:string; quoteHref?:string
  relatedLinks?:{label:string;href:string}[]
}

export default function SegmentLandingPage({config}:{config:SegmentLandingConfig}) {
  const waHref=waLink("Hi NextGen, I'd like a quote for "+config.eyebrow.toLowerCase()+".\nWhat I need: \n(via "+config.slug+" landing page)")
  return <main className="bg-jet text-paper">
    <section className="border-b border-darkgrey bg-jet px-4 pb-16 pt-14 sm:pt-20"><div className="mx-auto max-w-6xl">
      <p className="mb-4 font-heading text-sm font-bold uppercase tracking-[0.18em] text-orange">{config.eyebrow}</p>
      <div className="grid gap-10 lg:grid-cols-[1.15fr_.85fr] lg:items-end"><div>
        <h1 className="max-w-4xl font-heading text-4xl font-bold leading-[1.05] sm:text-6xl">{config.title}</h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-mist">{config.intro}</p>
        <div className="mt-8 flex flex-wrap gap-3"><a href={waHref} target="_blank" rel="noreferrer" className="btn-wa px-6 py-3.5">WhatsApp: {config.cta}</a>{config.quoteHref?<Link href={config.quoteHref} className="inline-flex items-center justify-center rounded-btn border border-mist px-6 py-3.5 font-heading font-semibold text-paper hover:border-orange hover:text-orange">Request online quote</Link>:null}</div>
        <p className="mt-4 text-sm text-mist">Helderberg Basin · Free site assessment · Written quotes</p>
      </div><div className="rounded-card border border-darkgrey bg-cardgrey p-6 shadow-2xl">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-orange">Segment offer</p><h2 className="mt-3 font-heading text-2xl font-bold">{config.offer}</h2><p className="mt-3 text-sm leading-6 text-mist">{config.offerDetail}</p>
        <div className="mt-6 grid gap-3">{config.proof.map(x=><div key={x} className="rounded-btn border border-darkgrey bg-jet/70 px-4 py-3 text-sm"><span className="mr-2 text-orange">✓</span>{x}</div>)}</div>
      </div></div>
    </div></section>
    <section className="border-b border-darkgrey bg-graphite px-4 py-14"><div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[.8fr_1.2fr]"><div>
      <p className="font-heading text-sm font-bold uppercase tracking-[0.16em] text-orange">Built for this customer</p><h2 className="mt-3 font-heading text-3xl font-bold">One contact. The right trade. A clear next step.</h2><p className="mt-4 text-mist">{config.local}</p>
    </div><div><h2 className="font-heading text-2xl font-bold">What NextGen can coordinate</h2><div className="mt-5 grid gap-3 sm:grid-cols-2">{config.services.map(x=><div key={x} className="rounded-card border border-darkgrey bg-cardgrey p-5"><p className="font-semibold">{x}</p></div>)}</div></div></div></section>
    <section className="bg-jet px-4 py-14"><div className="mx-auto max-w-5xl"><div className="grid gap-5 md:grid-cols-3">{[['01','Tell us what needs attention','Use WhatsApp to send the property area, the problem and photos if useful.'],['02','Assess and quote','We assess the work required and provide a written quote for the agreed scope.'],['03','Book the work','Once the scope is approved, schedule the work through one point of contact.']].map(([n,t,b])=><div key={n} className="rounded-card border border-darkgrey bg-cardgrey p-6"><p className="text-3xl font-bold text-orange">{n}</p><h3 className="mt-3 font-heading text-xl font-bold">{t}</h3><p className="mt-2 text-sm leading-6 text-mist">{b}</p></div>)}</div></div></section>
    {config.relatedLinks?.length?<section className="border-t border-darkgrey bg-graphite px-4 py-12"><div className="mx-auto max-w-6xl"><h2 className="font-heading text-xl font-bold">Explore related NGMS services</h2><div className="mt-4 flex flex-wrap gap-3">{config.relatedLinks.map(x=><Link key={x.href} href={x.href} className="rounded-btn border border-darkgrey bg-cardgrey px-4 py-3 text-sm font-semibold hover:border-orange hover:text-orange">{x.label}</Link>)}</div></div></section>:null}
    <section className="border-t border-darkgrey bg-cardgrey px-4 py-16 text-center"><p className="font-heading text-sm font-bold uppercase tracking-[0.16em] text-orange">ONE CALL. ALL SOLUTIONS.</p><h2 className="mx-auto mt-3 max-w-3xl font-heading text-3xl font-bold sm:text-4xl">Ready to scope the work?</h2><p className="mx-auto mt-4 max-w-2xl text-mist">Send the property details on WhatsApp. We’ll use the information to start the quote conversation.</p><a href={waHref} target="_blank" rel="noreferrer" className="btn-wa mt-7 px-7 py-4">WhatsApp NextGen</a></section>
  </main>
}
