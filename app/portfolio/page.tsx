import Link from 'next/link'

export const metadata = {
  title: 'Our Work | NGSMS',
  description: 'Recent NGSMS projects across the Helderberg Basin.',
}

const PROJECTS = [
  { service: 'Solar Panel Cleaning', location: 'Touws River (Engen)' },
  { service: 'Solar Panel Cleaning', location: 'Helderberg Retirement Village' },
  { service: 'Solar Panel Cleaning', location: 'Somerset West (Commercial)' },
]

export default function PortfolioPage() {
  return (
    <main className="bg-jet">
      <section className="bg-jet text-white py-14 px-4 text-center">
        <p className="text-blue font-bold text-sm uppercase tracking-wide mb-2 font-heading">Our Work</p>
        <h1 className="font-heading text-4xl sm:text-6xl font-bold text-paper">Recent Projects</h1>
        <p className="text-mist text-lg max-w-xl mx-auto mt-4">
          Real jobs across Strand, Gordon’s Bay and Somerset West.
        </p>
      </section>

      <section className="bg-graphite py-14 border-y border-darkgrey">
        <div className="max-w-5xl mx-auto px-4 grid sm:grid-cols-3 gap-6">
          {PROJECTS.map((project) => (
            <div key={project.location} className="bg-cardgrey border border-darkgrey rounded-card overflow-hidden">
              <div className="h-40 bg-darkgrey flex items-center justify-center">
                <p className="text-mist text-xs uppercase tracking-wide font-heading">Photo coming soon</p>
              </div>
              <div className="p-5">
                <p className="font-heading font-semibold text-paper">{project.service}</p>
                <p className="text-blue text-sm mt-1">&#128205; {project.location}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 py-14 text-center">
        <p className="text-mist text-lg">
          We’re currently uploading before-and-after photos from recent solar cleaning, paving, painting and
          waterproofing projects. Check back shortly, or get in touch for references from recent clients.
        </p>
        <div className="flex gap-4 justify-center flex-wrap mt-8">
          <Link href="/quote" className="bg-orange hover:bg-orange-dark text-white font-heading font-semibold px-6 py-3 rounded-btn">
            Get a Free Quote
          </Link>
          <Link href="/services" className="border border-mist text-paper font-heading font-semibold px-6 py-3 rounded-btn hover:border-blue hover:text-blue">
            View Services
          </Link>
        </div>
      </section>
    </main>
  )
}
