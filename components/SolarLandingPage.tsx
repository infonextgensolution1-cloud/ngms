import Link from 'next/link'
import TrustStrip from '@/components/TrustStrip'
import { getBeforeAfter } from '@/lib/queries'
import { getService } from '@/lib/services'
import { site, waLink } from '@/lib/site'

// Shared conversion-focused layout for every solar page
// (/solar-panel-cleaning-helderberg, /solar-maintenance-somerset-west,
// /solar-cleaning-gordons-bay-overberg and /solar-panel-cleaning/[location]).
//
// Conversion goal: a WhatsApp quote request with panel count + suburb.
// Secondary: a phone call. Every CTA on this page points at one of those two.
// Clicks are already tracked site-wide by components/ClickTracking.tsx
// (whatsapp_click / call_click / quote_link_click, tagged with the page path).
//
// A/B TESTING: change ONE thing at a time — start with HEADLINE below,
// then the CTA wording, then the benefit order. Run each for 2–4 weeks.

const HEADLINE = 'More power from the panels you already paid for.'

export type SolarLandingProps = {
  town: string
  areaLine: string
  heading: string
  intro: string
  nearby: string[]
  localAngle?: string
  callout?: string
  otherAreas?: { slug: string; town: string }[]
}

const tiers = [
  { size: 'Up to 10 panels', price: 'from R550' },
  { size: '11–20 panels', price: 'from R950' },
  { size: '21–30 panels', price: 'from R1 350' },
  { size: '31–40 panels', price: 'from R1 700' },
  { size: '41+ panels', price: 'from R50/panel' },
]

const benefits = [
  {
    title: 'Get your output back',
    body: 'Salt, dust and pollen build a film you can’t see from the ground. A proper clean lets the sun back in, so you lean less on Eskom.',
  },
  {
    title: 'Safe for your panels',
    body: 'Purified water and soft brushes only. No harsh chemicals, no abrasive pads, no high pressure on the glass.',
  },
  {
    title: 'Price before we arrive',
    body: 'Tiered pricing by panel count. Send us your numbers and you get a fixed price, not a surprise on the day.',
  },
  {
    title: 'Set it and forget it',
    body: 'Go on a maintenance plan every 4–6 months and every clean is 15% off, with priority booking.',
  },
]

const steps = [
  { n: '1', title: 'WhatsApp us', body: 'Send your panel count, suburb and a photo of the roof if you have one.' },
  { n: '2', title: 'Get a fixed price', body: 'We come back with a price and a date that suits you.' },
  { n: '3', title: 'We clean', body: 'Your panels are cleaned safely and you’re back to full sun.' },
]

const faqs = [
  {
    q: 'How often should solar panels be cleaned?',
    a: 'Every 4–6 months for most Helderberg homes. Coastal salt, summer wind-blown dust and spring pollen build up faster here than inland, and that film costs you output before you notice it.',
  },
  {
    q: 'Will cleaning damage my panels?',
    a: 'No. We use purified water and soft-brush methods — no harsh chemicals, no abrasive pads, no high pressure on the panel face. Safe for all major panel brands.',
  },
  {
    q: 'Do you charge a callout fee?',
    a: 'Not in Strand, Gordon’s Bay or Somerset West. Outside that zone, including the Overberg, it’s a flat R350.',
  },
  {
    q: 'Do you clean commercial and farm installations?',
    a: 'Yes. Larger systems are quoted after a site visit, with volume pricing from R50/panel on 41+ panel arrays.',
  },
]

function WhatsAppIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M12 2a10 10 0 0 0-8.65 14.94L2 22l5.2-1.36A10 10 0 1 0 12 2Zm5.77 14.36c-.24.68-1.4 1.25-1.94 1.3-.5.04-1.13.08-1.82-.11-.42-.12-.96-.31-1.65-.61-2.9-1.26-4.78-4.2-4.93-4.4-.14-.2-1.18-1.57-1.18-3 0-1.42.74-2.12 1-2.41.26-.29.7-.42 1.12-.42.14 0 .26 0 .37.01.33.01.49.03.7.54l.86 2.1c.09.2.11.37.02.58-.1.21-.14.34-.3.52-.14.16-.3.36-.43.48-.14.14-.28.29-.12.56.16.28.72 1.19 1.55 1.93 1.07.95 1.97 1.25 2.25 1.39.28.14.44.12.6-.07.16-.2.7-.81.89-1.09.19-.28.38-.23.64-.14.26.09 1.67.79 1.96.93.28.14.47.21.54.33.07.12.07.68-.17 1.36Z" />
    </svg>
  )
}

export default async function SolarLandingPage({
  town,
  areaLine,
  heading,
  intro,
  nearby,
  localAngle,
  callout,
  otherAreas,
}: SolarLandingProps) {
  const allBeforeAfter = await getBeforeAfter()
  const solarPairs = allBeforeAfter.filter((p) => p.service_slug === 'solar-panel-cleaning')
  const beforeAfter = solarPairs.length > 0 ? solarPairs : allBeforeAfter

  const solar = getService('solar-panel-cleaning')

  const areaName = town.replace(/^the /i, '')
  // Pre-filled message: the client only fills in the blanks, and the
  // "(via … page)" tag tells you which landing page the lead came from.
  const waHref = waLink(
    `Hi NGSMS, I'd like a solar panel cleaning quote.\n\nSuburb: \nNumber of panels: \n\n(via ${areaName} solar page)`
  )
  const telHref = `tel:${site.phone}`

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  }

  const primaryBtn = 'btn-wa py-3.5'
  const secondaryBtn =
    'inline-flex items-center justify-center gap-2 border border-mist text-paper font-heading font-semibold px-6 py-3.5 rounded-btn hover:border-orange hover:text-orange transition-colors'

  return (
    <main className="bg-jet pb-20 md:pb-0">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      {/* 1. HERO — benefit headline + one clear action */}
      <section className="bg-jet text-white pt-14 pb-12 text-center px-4">
        <h1 className="max-w-3xl mx-auto">
          <span className="block text-orange font-bold text-sm mb-3 uppercase tracking-wide font-heading">
            {heading}
          </span>
          <span className="block font-heading text-4xl sm:text-6xl font-bold text-paper leading-tight">
            {HEADLINE}
          </span>
        </h1>
        <p className="text-mist text-lg max-w-2xl mx-auto mt-5">{intro}</p>

        <div className="flex gap-3 justify-center flex-wrap mt-8">
          <a href={waHref} target="_blank" rel="noreferrer" className={primaryBtn}>
            <WhatsAppIcon />
            Get My Free Quote on WhatsApp
          </a>
          <a href={telHref} className={secondaryBtn}>
            Call {site.phoneDisplay}
          </a>
        </div>
        <p className="text-mist text-sm mt-4">Send your panel count and suburb · No obligation · Prices excl. VAT</p>

        <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2 mt-8 text-sm text-paper">
          <li>
            <span className="text-orange mr-1.5">✓</span>
            {callout ? callout : 'Free callout in Strand, Gordon’s Bay & Somerset West'}
          </li>
          <li>
            <span className="text-orange mr-1.5">✓</span>Purified water, soft brush
          </li>
          <li>
            <span className="text-orange mr-1.5">✓</span>From R550
          </li>
        </ul>
        <p className="text-xs tracking-widest text-mist uppercase mt-8">{areaLine}</p>
      </section>

      {/* 2. BENEFITS — outcomes, not features */}
      <section className="bg-graphite py-14 border-y border-darkgrey px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-paper mb-8 text-center">
            Why {areaName} homeowners book us
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {benefits.map((b) => (
              <div key={b.title} className="bg-cardgrey border border-darkgrey rounded-card p-6">
                <h3 className="font-heading text-lg font-semibold mb-2 text-paper">{b.title}</h3>
                <p className="text-mist text-sm">{b.body}</p>
              </div>
            ))}
          </div>
          <p className="text-center mt-8">
            <Link href="/roi-calculator" className="text-orange font-semibold hover:underline">
              See what dirty panels could be costing you &rarr;
            </Link>
          </p>
        </div>
      </section>

      {/* 3. SOCIAL PROOF — real before/after photos + real reviews */}
      <TrustStrip beforeAfter={beforeAfter} />

      {/* 4. HOW IT WORKS — remove friction, then ask again */}
      <section className="bg-jet py-14 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-paper mb-8">Booking takes two minutes</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 text-left">
            {steps.map((s) => (
              <div key={s.n} className="bg-cardgrey border border-darkgrey rounded-card p-6">
                <span className="inline-flex w-9 h-9 items-center justify-center rounded-full bg-orange text-white font-heading font-bold mb-3">
                  {s.n}
                </span>
                <h3 className="font-heading font-semibold text-paper mb-1">{s.title}</h3>
                <p className="text-mist text-sm">{s.body}</p>
              </div>
            ))}
          </div>
          <a href={waHref} target="_blank" rel="noreferrer" className={`${primaryBtn} mt-8`}>
            <WhatsAppIcon />
            Start on WhatsApp
          </a>
        </div>
      </section>

      {/* 5. PRICING */}
      <section className="bg-graphite py-14 border-y border-darkgrey px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-paper mb-2">
            Solar cleaning prices in {areaName}
          </h2>
          <p className="text-mist text-sm mb-6">
            {callout
              ? `${callout} `
              : 'No callout fee in Strand, Gordon’s Bay or Somerset West — flat R350 outside that zone. '}
            All prices exclude VAT.
          </p>
          <div className="overflow-x-auto rounded-card border border-darkgrey">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-jet text-left">
                  <th className="px-4 py-3 font-heading font-semibold text-paper">System size</th>
                  <th className="px-4 py-3 font-heading font-semibold text-paper">Price</th>
                </tr>
              </thead>
              <tbody>
                {tiers.map((t) => (
                  <tr key={t.size} className="border-t border-darkgrey bg-cardgrey">
                    <td className="px-4 py-3 text-mist">{t.size}</td>
                    <td className="px-4 py-3 font-bold text-orange">{t.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-mist text-sm mt-4">
            On a maintenance plan (every 4–6 months) you get <span className="text-orange font-bold">15% off</span>{' '}
            every clean plus priority booking.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href={waHref} target="_blank" rel="noreferrer" className={primaryBtn}>
              <WhatsAppIcon />
              Get My Exact Price
            </a>
          </div>

          {solar && solar.whatsIncluded.length > 0 && (
            <div className="mt-10">
              <h3 className="font-heading text-xl font-bold text-paper mb-3">What’s included</h3>
              <ul className="space-y-2 text-mist text-sm">
                {solar.whatsIncluded.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="text-orange">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      {/* 6. LOCAL ANGLE (location pages only) */}
      {localAngle && (
        <section className="bg-jet py-14 px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="font-heading text-2xl sm:text-3xl font-bold text-paper mb-3">
              Why panels get dirty faster in {areaName}
            </h2>
            <p className="text-mist">{localAngle}</p>
          </div>
        </section>
      )}

      {/* 7. FAQ — answer the last objections */}
      <section className={`${localAngle ? 'bg-graphite border-y border-darkgrey' : 'bg-jet'} py-14 px-4`}>
        <div className="max-w-3xl mx-auto">
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-paper mb-6">Common questions</h2>
          <div className="space-y-4">
            {faqs.map((f) => (
              <div key={f.q} className="bg-cardgrey border border-darkgrey rounded-card p-5">
                <h3 className="font-heading font-semibold text-paper mb-2">{f.q}</h3>
                <p className="text-mist text-sm">{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. SERVICE AREA */}
      <section className="bg-jet py-12 px-4 text-center">
        <h2 className="font-heading text-xl font-bold text-paper mb-3">Where we work near {areaName}</h2>
        <p className="text-mist text-sm max-w-2xl mx-auto">{nearby.join(' · ')}</p>
        {otherAreas && otherAreas.length > 0 && (
          <p className="text-mist text-sm max-w-2xl mx-auto mt-4">
            Also serving:{' '}
            {otherAreas.map((a, i) => (
              <span key={a.slug}>
                <Link href={`/solar-panel-cleaning/${a.slug}`} className="text-orange hover:underline">
                  {a.town}
                </Link>
                {i < otherAreas.length - 1 ? ' · ' : ''}
              </span>
            ))}
          </p>
        )}
      </section>

      {/* 9. FINAL CTA */}
      <section className="bg-graphite text-center py-14 px-4 border-t border-darkgrey">
        <h2 className="font-heading text-2xl sm:text-3xl font-bold mb-3 text-paper">
          Getting less out of your system than you used to?
        </h2>
        <p className="text-mist text-lg mb-6 max-w-xl mx-auto">
          Send us your panel count on WhatsApp and we’ll come back with a fixed price.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <a href={waHref} target="_blank" rel="noreferrer" className={primaryBtn}>
            <WhatsAppIcon />
            Get My Free Quote on WhatsApp
          </a>
          <Link href="/quote?service=solar-panel-cleaning" className={secondaryBtn}>
            Prefer a form? Request online
          </Link>
        </div>
      </section>

      {/* STICKY MOBILE CTA — right padding leaves room for the site-wide WhatsApp button */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-jet/95 backdrop-blur border-t border-darkgrey pl-3 pr-24 py-3 flex gap-2">
        <a
          href={telHref}
          className="flex-1 inline-flex items-center justify-center border border-mist text-paper font-heading font-semibold text-sm py-3 rounded-btn"
        >
          Call
        </a>
        <a
          href={waHref}
          target="_blank"
          rel="noreferrer"
          className="btn-wa flex-[2] gap-1.5"
        >
          <WhatsAppIcon className="w-4 h-4" />
          Free Quote
        </a>
      </div>
    </main>
  )
}
