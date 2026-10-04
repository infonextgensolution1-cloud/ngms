import Link from 'next/link'
import { SITE } from '@/lib/site'

export const metadata = {
  alternates: { canonical: '/privacy' },
  title: 'Privacy Policy (POPIA) | NextGen Solar Clean & Maintenance',
  description:
    'How NextGen Solar Clean & Maintenance Solutions collects, uses, stores and protects your personal information under the Protection of Personal Information Act (POPIA).',
}

// POPIA privacy notice (section 18 notification). Keep this in step with what the
// site and admin actually do — if a form, processor or storage region changes,
// update the matching section below.
//
// Facts this page relies on (check before editing):
//   - Leads, quotes, jobs, invoices and the customer portal: Supabase, region us-east-1 (USA)
//   - Site hosting and server functions: Vercel, functions in dub1 (Ireland)
//   - Lead notifications and auto-replies: Resend (email)
//   - Admin "draft a reply"/quote helpers: Anthropic (Claude API)
//   - Quote photos: PRIVATE Supabase bucket "public-leads"; staff-only, viewed via signed links
//   - Analytics: Vercel Web Analytics + Speed Insights (cookie-free); live-visitor
//     presence via Supabase Realtime stores nothing
const SECTIONS: { title: string; body: React.ReactNode[] }[] = [
  {
    title: 'Who we are',
    body: [
      <>
        {SITE.name} (&ldquo;NextGen&rdquo;, &ldquo;we&rdquo;) is a property maintenance business based in Strand,
        Western Cape. We are the <strong className="text-paper">responsible party</strong> for the personal information
        described here.
      </>,
      <>
        Our <strong className="text-paper">Information Officer</strong> is the owner of the business. Contact:{' '}
        <a href={`mailto:${SITE.email}`} className="text-blue hover:underline break-all">{SITE.email}</a> or{' '}
        <a href={`tel:${SITE.phone}`} className="text-blue hover:underline">{SITE.phoneDisplay}</a>.
      </>,
    ],
  },
  {
    title: 'What we collect',
    body: [
      <>
        <strong className="text-paper">When you ask for a quote or contact us</strong> (website forms, WhatsApp, phone
        or email): your name, phone number, email address (optional), area or suburb, the service you need, job details
        and any photos you choose to send.
      </>,
      <>
        <strong className="text-paper">When you become a client:</strong> your property address, quotes, invoices,
        payments, job schedules and before-and-after job photos.
      </>,
      <>
        <strong className="text-paper">If you sign up for a maintenance plan:</strong> your contact details, plan
        choice and reminder preferences.
      </>,
      <>
        <strong className="text-paper">When you browse the site:</strong> anonymous usage statistics (pages viewed,
        device type, referring site and taps on the WhatsApp, call and quote buttons). We do not use advertising
        cookies or tracking cookies, and these statistics do not identify you.
      </>,
    ],
  },
  {
    title: 'Why we use it',
    body: [
      'To reply to your enquiry, prepare a quote and arrange site visits.',
      'To schedule, carry out and document the work, and to invoice and receive payment.',
      'To send service reminders you have asked for (for example, your next solar panel clean).',
      'To keep the business records the law requires, such as tax records.',
      'To understand which pages and services people use, so we can improve the website.',
      'We only use your information for these purposes, or for a purpose compatible with them. We do not sell or rent your personal information.',
    ],
  },
  {
    title: 'Legal basis',
    body: [
      'We process your information with your consent (for example, the consent tick box on our forms), because it is needed to quote for or perform work you asked for, to meet legal obligations, or for our legitimate interest in running and improving the business.',
      'You can withdraw your consent at any time. This does not affect processing that already happened, or information we must keep by law.',
    ],
  },
  {
    title: 'Direct marketing',
    body: [
      'We only send service reminders or offers by email or WhatsApp if you opted in, or if you are an existing client and the message is about similar services.',
      'Every reminder email has an unsubscribe link. You can also tell us on WhatsApp or by email, and we will stop.',
    ],
  },
  {
    title: 'Who we share it with',
    body: [
      'We use trusted service providers (operators) who process information on our behalf and under our instructions:',
      <>
        <strong className="text-paper">Supabase</strong> — database and file storage for enquiries, quotes, jobs,
        invoices and the client portal.
      </>,
      <>
        <strong className="text-paper">Vercel</strong> — website hosting and anonymous website statistics.
      </>,
      <>
        <strong className="text-paper">Resend</strong> — sending enquiry notifications and confirmation emails.
      </>,
      <>
        <strong className="text-paper">Meta (WhatsApp)</strong> — when you message us on WhatsApp.
      </>,
      <>
        <strong className="text-paper">Anthropic</strong> — an AI assistant that helps us draft replies and quote line
        items in our admin system. We review everything before it is sent.
      </>,
      'We may also share information with our own team members working on your job, or where the law requires it. We do not share it with anyone else for their own marketing.',
    ],
  },
  {
    title: 'Information sent outside South Africa',
    body: [
      'Some of our service providers store or process information outside South Africa: our database is hosted in the United States, the website runs on servers in Ireland, and our email and AI providers are based in the United States.',
      'We only use providers that are bound by data-protection terms giving protection substantially similar to POPIA, as required by section 72 of the Act.',
    ],
  },
  {
    title: 'Photos',
    body: [
      'Photos you upload with a quote request are stored privately. Only signed-in NextGen staff can view them, through short-lived links. Please photograph the job only, and avoid people, car number plates, documents or anything personal.',
      'Before-and-after photos of your property may be used on our website or social media only without your name or address, unless you agree otherwise. Ask us and we will remove any photo of your property.',
    ],
  },
  {
    title: 'How long we keep it',
    body: [
      'Enquiries that do not become a job are deleted within 12 months of your last contact with us.',
      'Records of quotes, invoices and payments are kept for at least five years, as South African tax law requires.',
      'Maintenance-plan reminder details are kept until you unsubscribe or cancel the plan.',
    ],
  },
  {
    title: 'How we protect it',
    body: [
      'Your information is stored in access-controlled systems. Only signed-in NextGen staff can view enquiries and client records; the public website can only submit new enquiries, not read them.',
      'Connections to the website and our systems are encrypted (HTTPS). If we become aware of a security compromise affecting your information, we will notify you and the Information Regulator as POPIA requires.',
    ],
  },
  {
    title: 'Your rights',
    body: [
      'You may ask us what personal information we hold about you, and ask us to correct, update or delete it.',
      'You may object to us processing your information, and withdraw consent or opt out of reminders at any time.',
      <>
        To make a request, email{' '}
        <a href={`mailto:${SITE.email}`} className="text-blue hover:underline break-all">{SITE.email}</a>. We may ask
        you to confirm your identity first.
      </>,
      <>
        If you are unhappy with how we handled your information, please tell us first so we can fix it. You may also
        complain to the Information Regulator (South Africa):{' '}
        <a href="https://inforegulator.org.za" className="text-blue hover:underline" target="_blank" rel="noopener noreferrer">
          inforegulator.org.za
        </a>
        .
      </>,
    ],
  },
]

export default function PrivacyPage() {
  return (
    <main className="bg-jet">
      <section className="bg-jet text-white py-10 sm:py-14 px-4 text-center">
        <p className="kicker">NextGen Solar Clean &amp; Maintenance</p>
        <h1 className="font-heading text-4xl sm:text-6xl font-bold text-paper">Privacy Policy</h1>
        <p className="text-mist text-lg max-w-xl mx-auto mt-4">
          How we handle your personal information under the Protection of Personal Information Act (POPIA).
        </p>
      </section>

      <section className="bg-graphite py-10 sm:py-14 px-4 border-y border-darkgrey">
        <div className="max-w-3xl mx-auto space-y-6">
          {SECTIONS.map((s) => (
            <div key={s.title} className="panel p-6 sm:p-8">
              <h2 className="font-heading text-xl sm:text-2xl font-bold text-paper mb-3">{s.title}</h2>
              <ul className="list-disc pl-5 space-y-2 text-mist text-base sm:text-lg leading-relaxed">
                {s.body.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            </div>
          ))}

          <p className="text-mist text-sm text-center">
            Last updated 4 October 2026. See also our{' '}
            <Link href="/terms" className="text-blue hover:underline">
              Terms &amp; Conditions
            </Link>
            .
          </p>
        </div>
      </section>
    </main>
  )
}
