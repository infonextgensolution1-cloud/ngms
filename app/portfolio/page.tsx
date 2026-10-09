import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabaseClient'

export const metadata = { alternates: { canonical: '/portfolio' },
  title: 'Our Work | NextGen Solar Clean & Maintenance',
  description: 'Before and after project photos from NextGen Solar Clean & Maintenance Solutions jobs across the Helderberg Basin.',
}

export const revalidate = 300

type BeforeAfter = {
  id: string
  service_slug: string | null
  location: string
  caption: string | null
  before_image_url: string
  after_image_url: string
  before_image_urls?: string[] | null
  after_image_urls?: string[] | null
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
          Real jobs across Strand, Gordon’s Bay, Somerset West and the Overberg.
        </p>
      </section>

      <section className="bg-graphite py-14 border-y border-darkgrey">
        <div className="max-w-5xl mx-auto px-4 mb-8 grid grid-cols-2 sm:grid-cols-4 gap-3">{[['Real work','Completed jobs'],['Before / after','Visible proof'],['Helderberg','Local coverage'],['Multi-trade','One contractor']].map(([a,b])=><div key={a} className="rounded-card border border-darkgrey bg-cardgrey p-4"><p className="font-heading font-semibold text-paper">{a}</p><p className="text-xs text-mist mt-1">{b}</p></div>)}</div>
        {projects.length > 0 ? (
          <div className="max-w-5xl mx-auto px-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((p) => (
              <div key={p.id} className="bg-cardgrey border border-darkgrey rounded-card overflow-hidden">
                <div className="grid grid-cols-2 gap-1 bg-jet p-1">
                  <div className="grid grid-cols-2 gap-1">
                    {(Array.isArray(p.before_image_urls) && p.before_image_urls.length ? p.before_image_urls : [p.before_image_url]).slice(0,4).map((url, i) => (
                      <div key={url} className="relative aspect-video overflow-hidden rounded">
                        <Image src={url} alt={`Before ${i + 1}`} fill sizes="(max-width: 640px) 45vw, 180px" quality={72} unoptimized className="object-cover" />
                        <span className="absolute top-1 left-1 bg-jet/80 text-paper text-[9px] uppercase px-1.5 py-0.5 rounded">Before</span>
                        <img src="/logo.png" alt="" className="absolute bottom-1 left-1 w-8 h-8 object-contain" />
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    {(Array.isArray(p.after_image_urls) && p.after_image_urls.length ? p.after_image_urls : [p.after_image_url]).slice(0,4).map((url, i) => (
                      <div key={url} className="relative aspect-video overflow-hidden rounded">
                        <Image src={url} alt={`After ${i + 1}`} fill sizes="(max-width: 640px) 45vw, 180px" quality={72} className="object-cover" />
                        <span className="absolute top-1 left-1 bg-orange/90 text-white text-[9px] uppercase px-1.5 py-0.5 rounded">After</span>
                        <img src="/logo.png" alt="" className="absolute bottom-1 left-1 w-8 h-8 object-contain" />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-5">
                  <p className="text-xs uppercase tracking-[0.16em] text-orange font-semibold">{p.service_slug?.replaceAll('-', ' ') || 'Project'}</p>
                  <p className="font-heading font-semibold text-paper mt-1">{p.caption || 'Completed Project'}</p>
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
          <Link href="/quote" className="btn-glow font-heading font-semibold px-6 py-3 rounded-btn">
            Start a similar project
          </Link>
          <Link href="/services" className="border border-mist text-paper font-heading font-semibold px-6 py-3 rounded-btn hover:border-blue hover:text-blue">
            View Services
          </Link>
        </div>
      </section>
    </main>
  )
}
