import type { Metadata } from 'next'
import Link from 'next/link'
import { SITE, waLink } from '@/lib/site'

export const metadata: Metadata = {
  title: 'WhatsApp NextGen | Property Maintenance Enquiries',
  description:
    'Contact NextGen Solar Clean & Maintenance Solutions directly on WhatsApp for property maintenance, repairs and service enquiries.',
  alternates: { canonical: '/whatsapp' },
  openGraph: {
    title: 'WhatsApp NextGen',
    description: 'One call. All solutions. Chat to our maintenance team.',
  },
}

const MESSAGE =
  "Hi NextGen, I found your website and would like to enquire about your maintenance services."

export default function WhatsAppPage() {
  return (
    <main className="min-h-[75vh] bg-[#0A0B0D] px-5 py-20 text-white sm:py-28">
      <section className="mx-auto flex max-w-5xl flex-col items-start border border-white/15 bg-white/[0.035] p-7 sm:p-12 lg:p-16">
        <p className="mb-5 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.24em] text-[#FF6A00]">
          <span aria-hidden="true" className="h-[2px] w-8 bg-[#FF6A00]" />
          NextGen Maintenance Solutions
        </p>

        <h1 className="max-w-4xl font-heading text-5xl font-extrabold uppercase leading-[0.9] tracking-[-0.045em] sm:text-7xl lg:text-8xl">
          Let’s talk
          <br />
          <span className="text-[#FF6A00]">on WhatsApp.</span>
        </h1>

        <p className="mt-7 max-w-2xl text-base leading-relaxed text-white/70 sm:text-lg">
          Need a repair, property maintenance or a service quotation? Send our
          team a message. Tell us what needs attention and, where possible,
          include your area and a few photos.
        </p>

        <a
          href={waLink(MESSAGE)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-9 inline-flex min-h-14 items-center justify-center gap-3 border-2 border-[#FF6A00] bg-[#FF6A00] px-7 py-4 font-heading text-sm font-bold uppercase tracking-wider text-black transition hover:-translate-y-0.5 hover:bg-[#ff8126] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#FF6A00]"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6 fill-current">
            <path d="M20.52 3.48A11.82 11.82 0 0 0 12.1 0C5.55 0 .22 5.33.22 11.88c0 2.09.55 4.13 1.6 5.93L.12 24l6.34-1.66a11.9 11.9 0 0 0 5.64 1.43h.01c6.55 0 11.88-5.33 11.88-11.88 0-3.17-1.23-6.15-3.47-8.41ZM12.1 21.75h-.01a9.9 9.9 0 0 1-5.04-1.38l-.36-.21-3.76.99 1-3.67-.24-.38a9.86 9.86 0 0 1-1.52-5.22c0-5.47 4.46-9.93 9.94-9.93a9.87 9.87 0 0 1 7.03 2.91 9.87 9.87 0 0 1 2.91 7.04c0 5.48-4.46 9.93-9.95 9.93Zm5.45-7.44c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.95 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.47-.89-.8-1.49-1.78-1.67-2.08-.17-.3-.02-.46.13-.61.14-.13.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.38-.03-.53-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.49s1.07 2.89 1.22 3.09c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.08 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35Z" />
          </svg>
          Start WhatsApp chat
          <span aria-hidden="true">↗</span>
        </a>

        <div className="mt-12 grid w-full gap-4 border-t border-white/15 pt-8 sm:grid-cols-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#FF6A00]">Call the team</p>
            <a className="mt-2 inline-block text-lg font-semibold text-white hover:text-[#FF6A00]" href={`tel:${SITE.phone}`}>
              {SITE.phoneDisplay}
            </a>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#FF6A00]">Email</p>
            <a className="mt-2 inline-block break-all text-lg font-semibold text-white hover:text-[#FF6A00]" href={`mailto:${SITE.email}`}>
              {SITE.email}
            </a>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold uppercase tracking-wide text-white/65">
          <Link href="/" className="transition hover:text-[#FF6A00]">Home</Link>
          <Link href="/services" className="transition hover:text-[#FF6A00]">Our services</Link>
          <Link href="/contact" className="transition hover:text-[#FF6A00]">Contact</Link>
        </div>
      </section>
    </main>
  )
}
