import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabaseClient'

export const metadata = {
  alternates: { canonical: '/portfolio' },
  title: 'Our Projects | NextGen Solar Clean & Maintenance',
  description: 'Explore completed maintenance, cleaning and property improvement projects across Strand, Gordon’s Bay, Somerset West and the Overberg.',
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

function projectImages(project: BeforeAfter, side: 'before' | 'after') {
  const urls = side === 'before' ? project.before_image_urls : project.after_image_urls
  const fallback = side === 'before' ? project.before_image_url : project.after_image_url
  return Array.isArray(urls) && urls.length ? urls : [fallback]
}

export default async function PortfolioPage() {
  const projects = await getProjects()
  const featured = projects[0]
  const featuredImage = featured ? projectImages(featured, 'after')[0] : null

  return (
    <main className="ngms-projects-page bg-[#f1f0ec] text-[#111111]">
      <div className="mx-auto max-w-[1500px] px-3 py-3 sm:px-6 sm:py-6 lg:px-8">
        <div className="overflow-hidden border border-[#222222] bg-[#f8f7f3]">
          <header className="grid grid-cols-2 border-b border-[#222222] sm:grid-cols-[1fr_auto_auto_auto]">
            <Link href="/" aria-label="NextGen home" className="flex items-center px-4 py-4 text-lg font-black tracking-[0.16em] sm:px-6">
              NGMS<span className="ml-2 text-[#ed4b26]">↗</span>
            </Link>
            <Link href="/services" className="flex items-center justify-center border-l border-[#222222] px-3 py-4 text-[10px] font-bold uppercase tracking-[0.14em] hover:bg-[#ed4b26] hover:text-white sm:px-5">Services</Link>
            <Link href="/portfolio" aria-current="page" className="flex items-center justify-center border-l border-[#222222] px-3 py-4 text-[10px] font-bold uppercase tracking-[0.14em] sm:px-5">Projects</Link>
            <Link href="/quote" className="col-span-2 flex items-center justify-between border-t border-[#222222] bg-[#ed4b26] px-4 py-3 text-xs font-bold uppercase tracking-[0.12em] text-white hover:bg-[#c93618] sm:col-span-1 sm:border-l sm:border-t-0 sm:px-5">
              Start a project <span aria-hidden="true">↗</span>
            </Link>
          </header>

          <section className="grid min-h-[540px] grid-cols-1 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="relative flex flex-col justify-between p-5 sm:p-9 lg:p-12">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#ed4b26]">NextGen / Field notes · 01</p>
                <h1 className="mt-8 text-[clamp(4.5rem,12vw,9rem)] font-black leading-[0.78] tracking-[-0.09em]">WORK<span className="text-[#ed4b26]">.</span></h1>
                <h2 className="mt-4 max-w-[10ch] text-[clamp(2.5rem,6vw,5rem)] font-black uppercase leading-[0.86] tracking-[-0.065em] text-[#777773]">Built to last.</h2>
                <p className="mt-7 max-w-md text-sm leading-relaxed text-[#454545] sm:text-base">
                  Real maintenance. Visible results. Explore completed work across Strand, Gordon’s Bay, Somerset West and the Overberg.
                </p>
                <div className="mt-6 flex flex-wrap gap-2 text-[9px] font-bold uppercase tracking-[0.12em] text-[#333333]">
                  <span className="border border-[#bdbbb5] px-3 py-2">01 / Real projects</span>
                  <span className="border border-[#bdbbb5] px-3 py-2">02 / Before & after</span>
                  <span className="border border-[#bdbbb5] px-3 py-2">03 / Local expertise</span>
                </div>
              </div>
              <div className="mt-10 flex items-end justify-between border-t border-[#bdbbb5] pt-4">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#777773]">One point of contact</p>
                  <p className="mt-1 text-sm font-semibold">One Call. All Solutions.</p>
                </div>
                <a href="#project-grid" className="flex h-12 w-12 items-center justify-center bg-[#ed4b26] text-2xl text-white transition hover:bg-[#111111]" aria-label="Scroll to projects">↓</a>
              </div>
            </div>

            <div className="relative min-h-[360px] overflow-hidden border-t border-[#222222] bg-[#d7d5cf] lg:min-h-[620px] lg:border-l lg:border-t-0">
              {featuredImage ? (
                <Image src={featuredImage} alt={featured?.caption || 'Featured completed NextGen maintenance project'} fill priority sizes="(max-width: 1024px) 100vw, 55vw" quality={82} className="object-cover grayscale-[22%]" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-[linear-gradient(135deg,#deddd8_0%,#b8b7b1_48%,#292929_48%,#111111_100%)]">
                  <div className="absolute inset-y-0 left-[58%] w-[22%] bg-[#ed4b26]" />
                  <div className="relative z-10 border-[10px] border-[#ed4b26] px-8 py-4 text-8xl font-black tracking-[-0.08em] text-[#111111] sm:text-9xl">N<span className="text-white">G</span></div>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/5 to-black/10" />
              <div className="absolute left-5 top-5 border border-white/60 px-3 py-2 text-[9px] font-bold uppercase tracking-[0.2em] text-white sm:left-8 sm:top-8">Portfolio / Helderberg Basin</div>
              <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between gap-4 p-5 text-white sm:p-8">
                <div className="max-w-lg">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#ff714e]">{featured?.service_slug?.replaceAll('-', ' ') || 'Maintenance projects'}</p>
                  <h2 className="mt-2 text-3xl font-black uppercase leading-[0.9] tracking-[-0.05em] sm:text-5xl">{featured?.caption || 'Property care. Proven.'}</h2>
                  <p className="mt-3 text-xs text-white/80">{featured?.location || 'Strand · Somerset West · Gordon’s Bay'}</p>
                </div>
                {featured && <span className="hidden h-12 w-12 shrink-0 items-center justify-center border border-white/70 text-xl sm:flex" aria-hidden="true">↗</span>}
              </div>
            </div>
          </section>

          <section className="border-t border-[#222222] px-5 py-8 sm:px-9 sm:py-12 lg:px-12">
            <div className="grid gap-6 md:grid-cols-[1fr_1fr] md:items-end">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#ed4b26]">02 / Selected work</p>
                <h2 className="mt-3 text-4xl font-black uppercase leading-[0.9] tracking-[-0.07em] sm:text-6xl">Proof in the<br /><span className="text-[#ed4b26]">details.</span></h2>
              </div>
              <p className="max-w-lg text-sm leading-relaxed text-[#555555] md:justify-self-end">
                From routine upkeep to multi-trade improvements, every project is about practical results, clear communication and work done with care.
              </p>
            </div>

            <div className="mt-8 grid grid-cols-2 border-l border-t border-[#aaa9a3] sm:grid-cols-4">
              {[
                ['01', 'Completed work', 'Real jobs, not stock claims'],
                ['02', 'Before / after', 'Visible progress'],
                ['03', 'Helderberg local', 'Western Cape service area'],
                ['04', 'Multi-trade', 'One point of contact'],
              ].map(([number, title, description]) => (
                <div key={number} className="min-h-28 border-b border-r border-[#aaa9a3] p-3 sm:p-5">
                  <p className="text-xs font-black tracking-[0.16em] text-[#ed4b26]">{number}</p>
                  <p className="mt-3 text-sm font-bold uppercase leading-tight">{title}</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-[#666666]">{description}</p>
                </div>
              ))}
            </div>
          </section>

          <section id="project-grid" className="border-t border-[#222222] bg-[#e7e5df] px-4 py-8 sm:px-8 sm:py-12 lg:px-12">
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#ed4b26]">03 / Project archive</p>
                <h2 className="mt-2 text-3xl font-black uppercase tracking-[-0.06em] sm:text-5xl">Made. Maintained. Improved.</h2>
              </div>
              <span className="hidden text-xs font-bold uppercase tracking-[0.14em] text-[#555555] sm:block">{projects.length.toString().padStart(2, '0')} projects ↘</span>
            </div>

            {projects.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {projects.map((project, index) => (
                  <article key={project.id} className="group min-w-0 border border-[#b4b2ab] bg-[#f8f7f3]">
                    <div className="grid grid-cols-2 gap-px bg-[#b4b2ab]">
                      {(['before', 'after'] as const).map((side) => (
                        <div key={side} className="relative aspect-[4/3] overflow-hidden bg-[#d4d2cc]">
                          {projectImages(project, side).slice(0, 1).map((url) => (
                            <Image key={url} src={url} alt={`${side === 'before' ? 'Before' : 'After'} — ${project.caption || 'maintenance project'}`} fill sizes="(max-width: 768px) 50vw, (max-width: 1280px) 45vw, 30vw" quality={76} className="object-cover transition duration-500 group-hover:scale-[1.03]" />
                          ))}
                          <span className={`absolute left-2 top-2 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.14em] ${side === 'after' ? 'bg-[#ed4b26] text-white' : 'bg-[#111111]/85 text-white'}`}>{side}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex min-h-36 flex-col p-4 sm:p-5">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#ed4b26]">{project.service_slug?.replaceAll('-', ' ') || 'Project'}</p>
                        <span className="text-xs text-[#777773]">{String(index + 1).padStart(2, '0')}</span>
                      </div>
                      <h3 className="mt-2 text-lg font-black uppercase leading-tight tracking-[-0.035em]">{project.caption || 'Completed project'}</h3>
                      <p className="mt-auto pt-3 text-xs text-[#555555]">⌖ {project.location}</p>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
                <div className="flex min-h-64 flex-col justify-between bg-[#111111] p-6 text-white sm:p-9">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#ff714e]">Project archive / Updating</p>
                  <div>
                    <h3 className="text-3xl font-black uppercase leading-[0.9] tracking-[-0.05em] sm:text-5xl">Every job<br />has a story.</h3>
                    <p className="mt-4 max-w-md text-sm text-white/70">We’re adding verified before-and-after project photos. Contact us for details about relevant recent work.</p>
                  </div>
                </div>
                <div className="flex min-h-64 flex-col justify-between border border-[#b4b2ab] bg-[#f8f7f3] p-6 sm:p-8">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#ed4b26]">Want similar results?</p>
                  <div>
                    <h3 className="text-2xl font-black uppercase leading-tight tracking-[-0.05em]">Let’s plan your project.</h3>
                    <p className="mt-3 text-sm text-[#555555]">Tell us what needs attention and we’ll arrange the next step.</p>
                    <Link href="/quote" className="mt-5 inline-flex items-center gap-4 bg-[#ed4b26] px-4 py-3 text-xs font-bold uppercase tracking-[0.12em] text-white hover:bg-[#111111]">Request a quote <span aria-hidden="true">↗</span></Link>
                  </div>
                </div>
              </div>
            )}
          </section>

          <footer className="grid border-t border-[#222222] sm:grid-cols-[1fr_auto]">
            <div className="p-5 sm:p-8">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#ed4b26]">NextGen Maintenance Solutions</p>
              <p className="mt-2 text-xl font-black uppercase tracking-[-0.04em] sm:text-2xl">Good work speaks for itself.</p>
              <p className="mt-2 text-sm text-[#555555]">Strand · Gordon’s Bay · Somerset West · Overberg</p>
            </div>
            <Link href="/quote" className="flex items-center justify-between gap-6 border-t border-[#222222] bg-[#ed4b26] px-5 py-5 text-xs font-bold uppercase tracking-[0.14em] text-white hover:bg-[#111111] sm:border-l sm:border-t-0 sm:px-8">Start your project <span className="text-xl" aria-hidden="true">↗</span></Link>
          </footer>
        </div>
      </div>
    </main>
  )
}
