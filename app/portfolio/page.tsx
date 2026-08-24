import Link from 'next/link'

export const metadata = {
  title: 'Our Work | NGMS',
  description: 'Recent NGMS projects across the Helderberg Basin.',
}

export default function PortfolioPage() {
  return (
    <main className="bg-white text-black">
      <section className="bg-jet text-white py-14 px-4 text-center">
        <p className="text-orange font-semibold text-sm uppercase tracking-wide mb-2">Our Work</p>
        <h1 className="text-3xl sm:text-5xl font-black">Recent Projects</h1>
        <p className="text-gray-400 max-w-xl mx-auto mt-4">
          Real jobs across Strand, Gordon’s Bay and Somerset West — photos loading soon.
        </p>
      </section>

      <section className="max-w-3xl mx-auto px-4 py-20 text-center">
        <p className="text-gray-600">
          We’re currently uploading before-and-after photos from recent solar cleaning, paving, painting and
          waterproofing projects. Check back shortly, or get in touch for references from recent clients.
        </p>
        <div className="flex gap-4 justify-center flex-wrap mt-8">
          <Link href="/quote" className="bg-orange hover:bg-orange-dark text-white font-semibold px-6 py-3 rounded-full">
            Get a Free Quote
          </Link>
          <Link href="/services" className="border border-black text-black font-semibold px-6 py-3 rounded-full">
            View Services
          </Link>
        </div>
      </section>
    </main>
  )
}
