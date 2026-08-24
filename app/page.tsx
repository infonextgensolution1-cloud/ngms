import Link from 'next/link'
import { services } from '@/lib/services'

const REVIEWS = [
  {
    name: 'Alewyn Bronn',
    source: 'Google Review — 5 stars',
    quote: 'Reasonable price. Professional cleaning on 3 of my commercial buildings.',
  },
  {
    name: 'Marlene Bronn',
    source: 'Facebook',
    quote: 'Impressive guys, a job well done!',
  },
  {
    name: 'Cornellskop Animal Encounters',
    source: 'Facebook',
    quote: 'Fantastic service, great communication! No hidden costs — did really great work at heights I avoid.',
  },
]

export default function HomePage() {
  return (
    <main className="bg-jet">
      <section className="bg-jet min-h-[85vh] flex flex-col items-center justify-center text-center px-4">
        <p className="text-xs tracking-[0.2em] text-gray-300 uppercase mb-4 font-semibold">
          NextGen Solar &amp; Maintenance Solutions
        </p>
        <h1 className="text-5xl sm:text-7xl font-black leading-tight">
          <span className="text-white">ONE CALL.</span>
          <br />
          <span className="text-orange">ALL SOLUTIONS.</span>
        </h1>
        <p className="max-w-xl text-gray-300 text-lg mt-6 mb-8">
          From maintenance and repairs to specialist services and property improvement
          projects — NGSMS provides one coordinated solution for your property.
        </p>
        <div className="flex gap-4 flex-wrap justify-center">
          <a
            href="/quote"
            className="bg-orange hover:bg-orange-dark text-white font-bold px-6 py-3 rounded-full"
          >
            GET A FREE QUOTE
          </a>
          <a
            href="https://wa.me/27631387945"
            className="border-2 border-white text-white font-bold px-6 py-3 rounded-full"
          >
            WHATSAPP NGSMS
          </a>
        </div>
        <p className="text-xs tracking-widest text-gray-400 uppercase mt-8 font-semibold">
          Serving Strand · Somerset West · Gordon's Bay · Helderberg Basin
        </p>
      </section>

      <div className="bg-orange text-white text-center text-sm font-bold py-2">
        10% OFF your first booking · Solar panel cleaning from R50/panel
      </div>

      <section className="bg-graphite text-white py-10 border-y border-gray-800">
        <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          <div>
            <p className="text-3xl font-black text-orange">12</p>
            <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">Trade Services</p>
          </div>
          <div>
            <p className="text-3xl font-black text-orange">100%</p>
            <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">Helderberg-Based</p>
          </div>
          <div>
            <p className="text-3xl font-black text-orange">1</p>
            <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">Point of Contact</p>
          </div>
          <div>
            <p className="text-3xl font-black text-orange">7</p>
            <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">Step Process</p>
          </div>
        </div>
      </section>

      <section className="bg-jet text-white py-14 text-center">
        <p className="text-orange font-bold text-sm mb-2">WHAT WE DO</p>
        <h2 className="text-3xl sm:text-4xl font-black mb-10">EVERYTHING YOUR PROPERTY NEEDS</h2>
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 sm:grid-cols-3 gap-4 text-left">
          {services.slice(0, 6).map((service) => (
            <Link
              key={service.slug}
              href={`/services/${service.slug}`}
              className="bg-graphite border border-gray-800 rounded-xl p-4 hover:border-orange transition"
            >
              <p className="font-bold text-sm text-white">{service.name}</p>
              <p className="text-orange text-xs font-bold mt-1">{service.tagline}</p>
            </Link>
          ))}
        </div>
        <Link href="/services" className="inline-block mt-8 text-orange font-bold text-sm">
          View all 12 services &rarr;
        </Link>
      </section>

      <section className="bg-graphite text-white py-14 text-center border-y border-gray-800">
        <p className="text-orange font-bold text-sm mb-2 uppercase tracking-wide">Reviews</p>
        <h2 className="text-3xl sm:text-4xl font-black mb-10">What Our Clients Say</h2>
        <div className="max-w-5xl mx-auto px-4 grid sm:grid-cols-3 gap-6 text-left">
          {REVIEWS.map((review) => (
            <div key={review.name} className="bg-jet border border-gray-800 rounded-xl p-6">
              <p className="text-orange text-lg mb-3">&#9733;&#9733;&#9733;&#9733;&#9733;</p>
              <p className="text-gray-200 text-sm mb-4">&ldquo;{review.quote}&rdquo;</p>
              <p className="font-bold text-sm text-white">{review.name}</p>
              <p className="text-gray-500 text-xs mt-1">{review.source}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-jet text-white py-14 text-center">
        <p className="text-orange font-bold text-sm mb-2 uppercase tracking-wide">See The Difference</p>
        <h2 className="text-3xl sm:text-4xl font-black mb-4">Before &amp; After</h2>
        <p className="text-gray-300 text-lg max-w-xl mx-auto mb-8">
          Real before-and-after results from recent NGSMS jobs — photos loading soon.
        </p>
        <Link href="/portfolio" className="inline-block bg-orange hover:bg-orange-dark text-white font-bold px-6 py-3 rounded-full">
          View All Projects
        </Link>
      </section>
    </main>
  )
}
