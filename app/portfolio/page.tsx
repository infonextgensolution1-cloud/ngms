import Link from 'next/link'

export const metadata = {
  title: 'Our Work | NGMS',
  description: 'Recent NGMS projects across the Helderberg Basin.',
}

export default function PortfolioPage() {
  return (
    <main className="bg-white text-black">
      <section className="bg-jet text-white py-14 px-4 text-center">
        <p className="text-orange font-bold text-sm uppercase tracking-wide mb-2">Our Work</p>
        <h1 className="text-4xl sm:text-6xl font-black">Recent Projects</h1>
        <p className="text-gray-300 text-lg max-w-xl mx-auto mt-4">
          Real jobs across Strand, Gordon’s Bay and Somerset West — photos loading soon.
        </p>
      </section>

      <section className="max-w-3xl mx-auto px-4 py-20 text-center">
        <p className="text-gray-700 text-lg">
          We’re currently uploading before-and-after photos from recent solar cleaning, paving, painting and
          waterproofing projects. Check back shortly, or get in touch for references from recent clients.
        </p>
        <div className="flex gap-4 justify-center flex-wrap mt-8">
          <Link href="/quote" className="bg-orange hover:bg-orange-dark text-white font-bold px-6 py-3 rounded-full">
            Get a Free Quote
          </Link>
          <Link href="/services" className="border-2 border-black text-black font-bold px-6 py-3 rounded-full">
            View Services
          </Link>
        </div>
      </section>
    </main>
  )
}
