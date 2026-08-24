import Link from 'next/link'
import { services } from '@/lib/services'

export default function HomePage() {
  return (
    <main>
      <div className="bg-brand-bar p-[3px]">
        <section className="bg-jet min-h-[85vh] flex flex-col items-center justify-center text-center px-4">
          <p className="text-xs tracking-[0.2em] text-gray-300 uppercase mb-4 font-semibold">
            Next Gen Maintenance Solutions
          </p>
          <h1 className="text-5xl sm:text-7xl font-black leading-tight">
            <span className="text-white">ONE CALL.</span>
            <br />
            <span className="bg-headline-gradient bg-clip-text text-transparent">ALL SOLUTIONS.</span>
          </h1>
          <p className="max-w-xl text-gray-200 text-lg mt-6 mb-8">
            From maintenance and repairs to specialist services and property improvement
            projects — NGMS provides one coordinated solution for your property.
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
              WHATSAPP NGMS
            </a>
          </div>
          <p className="text-xs tracking-widest text-gray-300 uppercase mt-8 font-semibold">
            Serving Strand · Somerset West · Gordon's Bay · Helderberg Basin
          </p>
        </section>
      </div>

      <div className="bg-gradient-to-r from-orange to-sun text-black text-center text-sm font-bold py-2">
        10% OFF your first booking · Solar panel cleaning from R50/panel
      </div>

      <section className="bg-white text-black py-10">
        <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          <div>
            <p className="text-3xl font-black text-orange">12</p>
            <p className="text-xs text-gray-600 uppercase tracking-wide font-semibold">Trade Services</p>
          </div>
          <div>
            <p className="text-3xl font-black text-eco">100%</p>
            <p className="text-xs text-gray-600 uppercase tracking-wide font-semibold">Helderberg-Based</p>
          </div>
          <div>
            <p className="text-3xl font-black text-purple">1</p>
            <p className="text-xs text-gray-600 uppercase tracking-wide font-semibold">Point of Contact</p>
          </div>
          <div>
            <p className="text-3xl font-black text-orange">7</p>
            <p className="text-xs text-gray-600 uppercase tracking-wide font-semibold">Step Process</p>
          </div>
        </div>
      </section>

      <section className="bg-gray-50 text-black py-14 text-center">
        <p className="text-orange font-bold text-sm mb-2">WHAT WE DO</p>
        <h2 className="text-3xl sm:text-4xl font-black mb-10">EVERYTHING YOUR PROPERTY NEEDS</h2>
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 sm:grid-cols-3 gap-4 text-left">
          {services.slice(0, 6).map((service) => (
            <Link
              key={service.slug}
              href={`/services/${service.slug}`}
              className="bg-white border border-gray-200 rounded-xl p-4 hover:border-orange hover:shadow-md transition"
            >
              <p className="font-bold text-sm">{service.name}</p>
              <p className="text-orange text-xs font-bold mt-1">{service.tagline}</p>
            </Link>
          ))}
        </div>
        <Link href="/services" className="inline-block mt-8 text-orange font-bold text-sm">
          View all 12 services &rarr;
        </Link>
      </section>

      <section className="bg-white text-black py-14 text-center">
        <p className="text-purple font-bold text-sm mb-2 uppercase tracking-wide">See The Difference</p>
        <h2 className="text-3xl sm:text-4xl font-black mb-4">Before &amp; After</h2>
        <p className="text-gray-700 text-lg max-w-xl mx-auto mb-8">
          Real before-and-after results from recent NGMS jobs — photos loading soon.
        </p>
        <Link href="/portfolio" className="inline-block bg-jet hover:bg-graphite text-white font-bold px-6 py-3 rounded-full">
          View All Projects
        </Link>
      </section>
    </main>
  )
}
