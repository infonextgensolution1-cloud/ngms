import type { ReactNode } from 'react'
import ContactForm from '@/components/ContactForm'

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

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

const PhoneIcon = () => (
  <Icon>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </Icon>
)

const ChatIcon = () => (
  <Icon>
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </Icon>
)

const CalendarIcon = () => (
  <Icon>
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
  </Icon>
)

const MailIcon = () => (
  <Icon>
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <path d="M22 6l-10 7L2 6" />
  </Icon>
)

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
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-orange text-jet transition group-hover:bg-orange-dark">
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
            <ContactCard href="tel:+27631387945" label="Call" value="063 138 7945" icon={<PhoneIcon />} />
            <ContactCard
              href="https://wa.me/27631387945"
              label="WhatsApp"
              value="063 138 7945"
              icon={<ChatIcon />}
              external
            />
            <ContactCard href="tel:+27627007509" label="Bookings" value="062 700 7509" icon={<CalendarIcon />} />
            <ContactCard
              href="mailto:info.nextgensolution1@gmail.com"
              label="Email"
              value="info.nextgensolution1@gmail.com"
              icon={<MailIcon />}
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
          <div className="mb-10 flex flex-wrap justify-center gap-3">
            {AREAS.map((a) => (
              <span key={a} className="rounded-full border border-darkgrey bg-cardgrey px-4 py-2 text-sm text-paper">
                {a}
              </span>
            ))}
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
