import type { ReactNode } from 'react'
import ContactForm from '@/components/ContactForm'
import NgmsIcon from '@/components/NgmsIcon'

const CONTACT_TITLE = 'Contact NextGen Solar Clean & Maintenance | Strand, Gordon’s Bay, Somerset West'
const CONTACT_DESC = 'Call, WhatsApp or send an enquiry to NextGen Solar Clean & Maintenance Solutions — Strand, Gordon’s Bay, Somerset West and the Overberg.'

export const metadata = {
  title: CONTACT_TITLE,
  description: CONTACT_DESC,
  alternates: { canonical: '/contact' },
  openGraph: { title: CONTACT_TITLE, description: CONTACT_DESC, url: '/contact' },
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
      className="group flex min-w-0 items-center justify-between gap-4 border border-white/15 bg-white/[0.035] px-4 py-4 transition duration-200 hover:-translate-y-1 hover:border-[#FF6A00] hover:bg-white/[0.07] sm:px-5"
    >
      <span className="min-w-0">
        <span className="block font-heading text-lg font-bold uppercase tracking-wide text-white sm:text-xl">{label}</span>
        <span className="block break-all text-sm text-white/65">{value}</span>
      </span>
      <span className="flex h-12 w-12 shrink-0 items-center justify-center border border-white/15 bg-black/30 text-white transition group-hover:border-[#FF6A00] group-hover:text-[#FF6A00]">
        {icon}
      </span>
    </a>
  )
}

export default function ContactPage() {
  return (
    <main className="bg-[#0A0B0D] text-white">
      {/* Cinematic industrial hero */}
      <section className="relative isolate flex min-h-[560px] items-end overflow-hidden sm:min-h-[650px] lg:min-h-[710px]">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-20 bg-cover bg-center"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=2200&q=85')" }}
        />
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-r from-[#08090B] via-[#08090B]/85 to-[#08090B]/25" />
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-t from-[#08090B]/95 via-transparent to-black/25" />
        <div className="wrap w-full pb-14 pt-28 sm:pb-20 lg:pb-24">
          <p className="mb-5 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.24em] text-[#FF6A00]">
            <span className="h-[2px] w-8 bg-[#FF6A00]" /> NextGen Maintenance Solutions · Helderberg
          </p>
          <h1 className="max-w-4xl font-heading text-6xl font-extrabold uppercase leading-[0.82] tracking-[-0.055em] sm:text-8xl lg:text-[8.5rem]">
            One call.
            <br />
            <span className="text-white">All solutions.</span>
            <br />
            <span className="text-transparent" style={{ WebkitTextStroke: '1px rgba(255,255,255,.68)' }}>LET’S TALK.</span>
          </h1>
          <p className="mt-7 max-w-xl text-base leading-relaxed text-white/75 sm:text-lg">
            Property maintenance, handled by one local team. Tell us what needs attention and we’ll help you plan the next step.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#contact-form" className="inline-flex min-h-12 items-center gap-3 border-2 border-[#FF6A00] bg-[#FF6A00] px-6 py-3 font-heading text-sm font-bold uppercase tracking-wide text-black transition hover:-translate-y-0.5 hover:bg-[#ff8126]">
              Send an enquiry <span aria-hidden="true">↗</span>
            </a>
            <a href="https://wa.me/27631387945" target="_blank" rel="noopener noreferrer" aria-label="Contact NextGen on WhatsApp" className="inline-flex min-h-12 items-center justify-center border-2 border-white/35 bg-black/25 px-5 text-[#B7FF00] transition hover:border-[#B7FF00]">
              <NgmsIcon name="fast-reply" index={1} className="h-6 w-6" />
            </a>
          </div>
          <div className="mt-12 grid max-w-2xl grid-cols-3 border border-white/15 bg-black/25 backdrop-blur-sm">
            <div className="border-r border-white/15 px-3 py-4 sm:px-5"><p className="font-heading text-xl font-bold uppercase sm:text-2xl">Local</p><p className="mt-1 text-[10px] uppercase tracking-wider text-white/55 sm:text-xs">Helderberg team</p></div>
            <div className="border-r border-white/15 px-3 py-4 sm:px-5"><p className="font-heading text-xl font-bold uppercase sm:text-2xl">12+</p><p className="mt-1 text-[10px] uppercase tracking-wider text-white/55 sm:text-xs">Service categories</p></div>
            <div className="px-3 py-4 sm:px-5"><p className="font-heading text-xl font-bold uppercase sm:text-2xl">One</p><p className="mt-1 text-[10px] uppercase tracking-wider text-white/55 sm:text-xs">Point of contact</p></div>
          </div>
        </div>
      </section>

      {/* Warm editorial contact section */}
      <section className="bg-[#F2EEE7] py-14 text-[#111214] sm:py-20 lg:py-24">
        <div className="wrap">
          <div className="mb-10 grid gap-6 lg:mb-14 lg:grid-cols-2 lg:items-end">
            <div>
              <p className="mb-4 text-xs font-bold uppercase tracking-[0.22em] text-[#C4560A]">01 / Start a conversation</p>
              <h2 className="font-heading text-5xl font-extrabold uppercase leading-[0.88] tracking-tight sm:text-7xl">Tell us what<br /><span className="text-transparent" style={{ WebkitTextStroke: '1px #8E8A83' }}>needs fixing.</span></h2>
            </div>
            <p className="max-w-lg text-base leading-relaxed text-[#56534E] lg:justify-self-end">
              From a small repair to planned property maintenance, contact NextGen for a clear conversation about your project and the right next step.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-12">
            <div className="bg-[#111214] p-5 text-white sm:p-8">
              <p className="mb-5 text-xs font-bold uppercase tracking-[0.2em] text-[#FF6A00]">Direct contact</p>
              <div className="grid gap-3">
                <ContactCard href="tel:+27631387945" label="Call our team" value="063 138 7945" icon={<NgmsIcon name="phone" index={0} className="h-7 w-7" />} />
                <ContactCard href="https://wa.me/27631387945" label="WhatsApp" value="Message us directly" icon={<NgmsIcon name="fast-reply" index={1} className="h-7 w-7" />} external />
                <ContactCard href="mailto:nextgensolarmaintenance@gmail.com" label="Email" value="nextgensolarmaintenance@gmail.com" icon={<NgmsIcon name="mail" index={3} className="h-7 w-7" />} />
              </div>
              <div className="mt-8 border-t border-white/15 pt-5">
                <p className="text-xs uppercase tracking-[0.18em] text-white/45">Business hours</p>
                <p className="mt-2 font-heading text-xl font-bold uppercase">Monday – Saturday</p>
                <p className="text-sm text-white/65">07:00 – 17:00</p>
              </div>
            </div>

            <div id="contact-form" className="scroll-mt-24 border border-[#D8D1C6] bg-white p-5 sm:p-8 lg:p-10">
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#C4560A]">02 / Project enquiry</p>
              <h2 className="mb-2 font-heading text-3xl font-extrabold uppercase sm:text-4xl">How can we help?</h2>
              <p className="mb-7 max-w-lg text-sm leading-relaxed text-[#68645E]">Share a few details below. Our existing enquiry form will route your message through the current NGMS workflow.</p>
              <ContactForm />
            </div>
          </div>
        </div>
      </section>

      {/* Service area */}
      <section className="bg-[#0A0B0D] py-14 sm:py-20">
        <div className="wrap">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <div>
              <p className="mb-4 text-xs font-bold uppercase tracking-[0.22em] text-[#FF6A00]">03 / Where we work</p>
              <h2 className="font-heading text-4xl font-extrabold uppercase leading-[0.9] sm:text-6xl">Local knowledge.<br /><span className="text-white/35">Reliable service.</span></h2>
              <p className="mt-5 max-w-md leading-relaxed text-white/60">Based in the Helderberg Basin, serving homeowners, body corporates, security complexes and light commercial properties.</p>
              <div className="mt-7 border-l-2 border-[#FF6A00] bg-white/[0.04] p-5">
                <p className="font-heading text-xl font-bold uppercase text-[#FF6A00]">R350 callout outside Helderberg</p>
                <p className="mt-2 text-sm leading-relaxed text-white/60">Applies to the Overberg, Stellenbosch, Paarl, Worcester and Cape Town. No callout fee in Strand, Gordon’s Bay or Somerset West.</p>
              </div>
            </div>
            <div>
              <div className="mb-5 flex flex-wrap gap-2">
                {AREAS.map((area) => <span key={area} className="border border-white/15 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-white/75">{area}</span>)}
              </div>
              <div className="overflow-hidden border border-white/15 bg-[#17191C]">
                <iframe title="NextGen service area — Helderberg Basin" src="https://maps.google.com/maps?q=Somerset+West,+Western+Cape&z=11&output=embed" className="h-72 w-full grayscale sm:h-96" loading="lazy" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Strong close */}
      <section className="border-t border-white/10 bg-[#F2EEE7] py-12 text-[#111214] sm:py-16">
        <div className="wrap flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#C4560A]">NextGen Maintenance Solutions</p>
            <p className="font-heading text-4xl font-extrabold uppercase leading-[0.9] sm:text-6xl">One call.<br />All solutions.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a href="tel:+27631387945" className="inline-flex min-h-12 items-center border-2 border-[#111214] px-5 py-3 font-heading text-sm font-bold uppercase transition hover:bg-[#111214] hover:text-white">Call 063 138 7945</a>
            <a href="/quote" className="inline-flex min-h-12 items-center gap-3 border-2 border-[#FF6A00] bg-[#FF6A00] px-5 py-3 font-heading text-sm font-bold uppercase text-black transition hover:bg-[#ff8126]">Request a quote <span aria-hidden="true">↗</span></a>
          </div>
        </div>
      </section>
    </main>
  )
}
