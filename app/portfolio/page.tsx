import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'

export const metadata = {
  title: 'Our Work | NGSMS',
  description: 'Before and after project photos from NextGen Solar & Maintenance Solutions jobs across the Helderberg Basin.',
}

export const revalidate = 0

type BeforeAfter = {
  id: string
  service_slug: string | null
  location: string
  caption: string | null
  before_image_url: string
  after_image_url: string
}

async function getProjects(): Promise<BeforeAfter[]> {
  const { data } = await supabase
    .from('before_after_photos')
    .select('*')
    .eq('is_active', true)
    .order('sort_order')
  return (data as BeforeAfter[]) ?? []
}

export default async function PortfolioPage() {
  const projects = await getProjects()

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
        {projects.length > 0 ? (
          <div className="max-w-5xl mx-auto px-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((p) => (
              <div key={p.id} className="bg-cardgrey border border-darkgrey rounded-card overflow-hidden">
                <div className="grid grid-cols-2">
                  <div className="relative">
                    <img src={p.before_image_url} alt="Before" className="h-36 w-full object-cover" />
                    <span className="absolute top-2 left-2 bg-jet/80 text-paper text-[10px] uppercase tracking-wide px-2 py-1 rounded-btn">Before</span>
                  </div>
                  <div className="relative">
                    <img src={p.after_image_url} alt="After" className="h-36 w-full object-cover" />
                    <span className="absolute top-2 left-2 bg-orange/90 text-white text-[10px] uppercase tracking-wide px-2 py-1 rounded-btn">After</span>
                  </div>
                </div>
                <div className="p-5">
                  <p className="font-heading font-semibold text-paper">{p.caption || 'Completed Project'}</p>
                  <p className="text-blue text-sm mt-1">&#128205; {p.location}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="aspect-square bg-cardgrey border border-darkgrey rounded-card flex items-center justify-center">
                <p className="text-mist text-xs uppercase tracking-wide font-heading text-center px-2">Photo coming soon</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="max-w-3xl mx-auto px-4 py-14 text-center">
        <p className="text-mist text-lg">
          {projects.length > 0
            ? 'More before-and-after photos are added regularly as jobs are completed.'
            : 'We’re currently uploading before-and-after photos from recent jobs. Check back shortly, or get in touch for references from recent clients.'}
        </p>
        <div className="flex gap-4 justify-center flex-wrap mt-8">
          <Link href="/quote" className="bg-whatsapp hover:bg-whatsapp-dark text-white font-heading font-semibold px-6 py-3 rounded-btn">
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
