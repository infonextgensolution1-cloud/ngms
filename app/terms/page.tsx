import Link from 'next/link'
import { SITE } from '@/lib/site'

export const metadata = {
  title: 'Terms & Conditions | NGSMS',
  description:
    'Terms and conditions for quotes, bookings and work by NextGen Solar Clean & Maintenance Solutions in the Helderberg Basin and Overberg.',
}

// Plain wording, based on the terms printed on every NGSMS quote (lib/quote-terms.ts).
// If those change, update this page too.
const SECTIONS: { title: string; points: React.ReactNode[] }[] = [
  {
    title: 'Quotes and pricing',
    points: [
      'Quotes are free. For most jobs we do a site visit first and then send a written quote.',
      'All prices are in South African Rand and exclude VAT.',
      'A quote is valid until the date shown on it.',
      'Any work outside the scope of the quote is priced and agreed in writing before it starts.',
    ],
  },
  {
    title: 'Deposit and payment',
    points: [
      'A deposit confirms your booking. The percentage is shown on your quote, and the balance is payable on completion.',
      'Work is scheduled once the deposit reflects in our account.',
      'Please use your quote number as the payment reference.',
    ],
  },
  {
    title: 'Callout fees and service area',
    points: [
      'Callouts inside the Helderberg Basin (Strand, Gordon’s Bay and Somerset West) are free.',
      'A flat R350 callout fee applies outside the Helderberg Basin, including the Overberg (Kleinmond, Grabouw, Elgin and Bot River).',
    ],
  },
  {
    title: 'Weather and scheduling',
    points: [
      'Exterior painting, waterproofing and paving may be rescheduled for rain at no extra cost.',
      'Cape winter rain can move start dates. We will let you know as early as we can and agree a new date with you.',
    ],
  },
  {
    title: '10% first-booking discount',
    points: [
      <>
        Use code <strong className="text-paper">NGX10</strong> for 10% off your first booking on any service except
        solar panel cleaning.
      </>,
      'Mention the code when you request your quote so we can apply it.',
    ],
  },
]

export default function TermsPage() {
  return (
    <main className="bg-jet">
      <section className="bg-jet text-white py-10 sm:py-14 px-4 text-center">
        <p className="text-blue font-bold text-sm uppercase tracking-wide mb-2 font-heading">NGSMS</p>
        <h1 className="font-heading text-4xl sm:text-6xl font-bold text-paper">Terms &amp; Conditions</h1>
        <p className="text-mist text-lg max-w-xl mx-auto mt-4">
          How quotes, bookings and work run at NextGen Solar Clean &amp; Maintenance Solutions.
        </p>
      </section>

      <section className="bg-graphite py-10 sm:py-14 px-4 border-y border-darkgrey">
        <div className="max-w-3xl mx-auto space-y-6">
          {SECTIONS.map((s) => (
            <div key={s.title} className="bg-cardgrey border border-darkgrey rounded-card p-6 sm:p-8">
              <h2 className="font-heading text-xl sm:text-2xl font-bold text-paper mb-3">{s.title}</h2>
              <ul className="list-disc pl-5 space-y-2 text-mist text-base sm:text-lg leading-relaxed">
                {s.points.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            </div>
          ))}

          <div className="bg-cardgrey border border-darkgrey rounded-card p-6 sm:p-8">
            <h2 className="font-heading text-xl sm:text-2xl font-bold text-paper mb-3">Questions</h2>
            <p className="text-mist text-base sm:text-lg leading-relaxed">
              Call or WhatsApp{' '}
              <a href={`tel:${SITE.phone}`} className="text-orange hover:underline">
                {SITE.phoneDisplay}
              </a>{' '}
              or email{' '}
              <a href={`mailto:${SITE.email}`} className="text-orange hover:underline break-all">
                {SITE.email}
              </a>
              .
            </p>
          </div>

          <p className="text-mist text-sm text-center">
            Last updated September 2026.{' '}
            <Link href="/quote" className="text-orange hover:underline">
              Get a free quote
            </Link>
          </p>
        </div>
      </section>
    </main>
  )
}
