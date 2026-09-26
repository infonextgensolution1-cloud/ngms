import type { ReactNode } from 'react'
import ContactForm from '@/components/ContactForm'
import NgmsIcon from '@/components/NgmsIcon'

export const metadata = {
  title: 'Contact Us | NGSMS',
  description: 'Get in touch with NextGen Solar & Maintenance Solutions — Strand, Gordon’s Bay, Somerset West.',
}

const AREAS = [
  'Strand',
  'Gordon’s Bay',
  'Somerset West',
  'Helderberg Basin',
  'Overberg',
  'Stellenbosch',
  'Paarl',
  'Worcester',
  'Cape Town',
]

function ContactCard({
  href,
  label,
  value,
  icon,
  external,
}: {
  href: string
  label: string
  value: string
  icon: ReactNode
  external?: boolean
}) {
  return (
    <a
      href={href}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      className="btn-touch group flex items-center justify-between gap-4 rounded-card px-5 py-4 transition"
    >
      <span className="min-w-0">
        <span className="glow-white block font-heading text-xl font-bold uppercase tracking-wide text-white">{label}</span>
        <span className="block break-all text-sm text-mist">{value}</span>
      </span>
      <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-darkgrey bg-jet transition group-hover:border-orange">
        {icon}
      </span>
    </a>
  )
}

export default function ContactPage() {
  return (
    <main className="bg-jet">
      {/* Hero */}
      <section
        className="relative overflow-hidden bg-jet px-4 pb-4 pt-16 text-center sm:pt-24"
        style={{
          backgroundImage:
            'radial-gradient(ellipse at 50% 0%, rgba(245,124,27,0.20), transparent 62%), linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)',
          backgroundSize: 'auto, 56px 56px, 56px 56px',
        }}
      >
        <p className="kicker animate-fade-up">Get in touch</p>
        <h1 className="animate-fade-up font-heading text-7xl font-bold leading-[0.9] text-paper sm:text-8xl lg:text-9xl">
          Contact <span className="text-mist">us.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-mist">
          One call for all your property maintenance needs across the Helderberg Basin.
        </p>
      </section>

      {/* Contact details + enquiry form */}
      <section className="wrap grid gap-10 py-12 lg:grid-cols-2 lg:gap-14 lg:py-16">
        <div>
          <p className="kicker">★ Helderberg-based team</p>
          <h2 className="font-heading text-4xl font-bold leading-none text-paper sm:text-6xl">
            Get in touch with NGSMS!
          </h2>
          <p className="mt-4 max-w-md text-mist">
            Message us on WhatsApp, call, or send an enquiry. We reply the same day &mdash; usually within a few
            hours.
          </p>

          <div className="mt-8 grid gap-3">
            <ContactCard href="tel:+27631387945" label="Call" value="063 138 7945" icon={<NgmsIcon name="phone" index={0} className="h-9 w-9" />} />
            <ContactCard
              href="https://wa.me/27631387945"
              label="WhatsApp"
              value="063 138 7945"
              icon={<NgmsIcon name="fast-reply" index={1} className="h-9 w-9" />}
              external
            />
            <ContactCard href="tel:+27627007509" label="Bookings" value="062 700 7509" icon={<NgmsIcon name="calendar" index={2} className="h-9 w-9" />} />
            <ContactCard
              href="mailto:info.nextgensolution1@gmail.com"
              label="Email"
              value="info.nextgensolution1@gmail.com"
              icon={<NgmsIcon name="mail" index={3} className="h-9 w-9" />}
            />
          </div>
        </div>

        <div className="rounded-card border-2 border-[#C4560A] bg-graphite p-6 sm:p-8">
          <h2 className="mb-6 font-heading text-3xl font-bold uppercase text-paper">General enquiries</h2>
          <ContactForm />
        </div>
      </section>

      {/* Areas + map */}
      <section className="border-t border-darkgrey bg-jet py-14">
        <div className="mx-auto max-w-4xl px-4">
          <p className="kicker mb-4 block text-center">Areas we serve</p>
          <div className="mb-6 flex flex-wrap justify-center gap-3">
            {AREAS.map((a) => (
              <span key={a} className="rounded-full border border-darkgrey bg-cardgrey px-4 py-2 text-sm text-paper">
                {a}
              </span>
            ))}
          </div>
          <div className="mb-10 rounded-card border-2 border-[#C4560A] bg-graphite px-5 py-4 text-center">
            <p className="font-heading text-xl font-bold uppercase text-orange">R350 callout fee outside the Helderberg</p>
            <p className="mt-1 text-sm text-mist">
              Applies to the Overberg, Stellenbosch, Paarl, Worcester and Cape Town. No callout fee in Strand,
              Gordon’s Bay or Somerset West.
            </p>
          </div>
          <div className="overflow-hidden rounded-card border border-darkgrey">
            <iframe
              title="NGSMS service area — Helderberg Basin"
              src="https://maps.google.com/maps?q=Somerset+West,+Western+Cape&z=11&output=embed"
              className="h-80 w-full"
              loading="lazy"
            />
          </div>
        </div>
      </section>

      {/* Big number strip */}
      <section className="border-t border-darkgrey bg-graphite">
        <div className="wrap grid gap-8 py-14 lg:grid-cols-2 lg:items-end">
          <div>
            <p className="kicker">Prefer to talk?</p>
            <a
              href="tel:+27631387945"
              className="block font-heading text-6xl font-bold leading-none text-paper transition hover:text-orange sm:text-8xl"
            >
              063 138 7945
            </a>
            <a
              href="mailto:info.nextgensolution1@gmail.com"
              className="mt-4 block break-all font-heading text-xl font-bold text-paper transition hover:text-orange sm:text-3xl"
            >
              info.nextgensolution1@gmail.com
            </a>
          </div>
          <div className="lg:text-right">
            <p className="mb-4 text-lg text-mist">
              Serving Strand, Gordon’s Bay, Somerset West and the Helderberg Basin — plus the Overberg,
              Stellenbosch, Paarl, Worcester and Cape Town
            </p>
            <a
              href="/quote"
              className="inline-block rounded-full btn-glow px-9 py-3 font-heading text-base font-bold uppercase tracking-wide transition"
            >
              Get a Free Quote
            </a>
          </div>
        </div>
      </section>
    </main>
  )
}
