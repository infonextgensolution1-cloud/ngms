import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabaseClient'

export const metadata = {
  alternates: { canonical: '/portfolio' },
  title: 'Projects | NextGen Solar Clean & Maintenance',
  description: 'Explore completed property maintenance projects across Strand, Gordon’s Bay, Somerset West and the Helderberg Basin.',
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
  const featured = projects[0]
  const projectCount = projects.length

  return (
    <main id="main-content" className="bg-[#f5f3ef] text-[#171717]">
      <section className="px-4 pt-5 sm:px-6 lg:px-10 lg:pt-8">
        <div className="relative isolate min-h-[470px] overflow-hidden rounded-tl-[2px] rounded-tr-[2px] rounded-br-[3px] rounded-bl-[3px] bg-[#101010] text-white sm:min-h-[560px]">
          <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(ellipse_at_76%_42%,rgba(255,83,20,0.22),transparent_25%),linear-gradient(110deg,#101010_0%,#101010_44%,#282421_100%)]" />
          {featured && (
            <div className="absolute inset-y-0 right-0 w-full sm:w-[66%]">
              <Image
                src={(Array.isArray(featured.after_image_urls) && featured.after_image_urls[0]) || featured.after_image_url}
                alt={featured.caption || 'Completed NextGen maintenance project'}
                fill
                priority
                unoptimized
                sizes="(max-width: 640px) 100vw, 66vw"
                className="object-cover opacity-55"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#101010] via-[#101010]/70 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#101010]/80 via-transparent to-[#101010]/10" />
            </div>
          )}
          <div className="relative z-10 flex min-h-[470px] flex-col justify-between p-6 sm:min-h-[560px] sm:p-10 lg:p-14">
            <div className="flex items-center justify-between border-b border-white/15 pb-4 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/65">
              <span><span className="mr-2 inline-block h-2 w-2 bg-[#ff5314]" /> NextGen / Selected work</span>
              <span className="hidden sm:block">Helderberg Basin · Western Cape</span>
            </div>
            <div className="max-w-2xl py-12">
              <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.28em] text-[#ff6a32]">Proof is in the work</p>
              <h1 className="font-heading text-5xl font-extrabold uppercase leading-[0.88] tracking-[-0.045em] sm:text-7xl lg:text-8xl">
                Work that<br />stands out<span className="block text-transparent" style={{ WebkitTextStroke: '1px rgba(255,255,255,.62)' }}>and lasts.</span>
              </h1>
              <p className="mt-6 max-w-md text-sm leading-6 text-white/70 sm:text-base">
                Real maintenance projects. Visible results. One reliable team serving Strand, Gordon’s Bay, Somerset West and the wider Helderberg.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/quote" className="inline-flex min-h-12 items-center gap-3 bg-[#ff5314] px-5 py-3 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-[#e74408]">
                  Start a project <span aria-hidden="true">↗</span>
                </Link>
                <Link href="#project-work" className="inline-flex min-h-12 items-center gap-3 border border-white/35 px-5 py-3 text-xs font-bold uppercase tracking-wide text-white transition hover:border-[#ff5314]">
                  Explore our work <span aria-hidden="true">↓</span>
                </Link>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-white/15 pt-5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/60">
              <span><strong className="mr-2 text-lg text-white">{projectCount}</strong> projects shown</span>
              <span><strong className="mr-2 text-lg text-white">12</strong> trade services</span>
              <span><strong className="mr-2 text-lg text-white">1</strong> point of contact</span>
            </div>
          </div>
          <div className="absolute bottom-5 right-5 z-10 hidden max-w-[210px] border border-white/25 bg-black/45 p-4 backdrop-blur-sm sm:block">
            <p className="text-[9px] uppercase tracking-[0.2em] text-[#ff6a32]">Featured project</p>
            <p className="mt-2 text-xs font-bold uppercase">{featured?.service_slug?.replaceAll('-', ' ') || 'Property maintenance'}</p>
            <p className="mt-1 text-[10px] text-white/65">{featured?.location || 'Helderberg Basin'}</p>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 sm:py-24 lg:px-10">
        <div className="mx-auto max-w-[1400px]">
          <div className="grid gap-8 sm:grid-cols-[1fr_0.8fr] sm:items-end">
            <div>
              <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.24em] text-[#d94a13]">01 / Selected projects</p>
              <h2 className="font-heading text-4xl font-extrabold uppercase leading-[0.92] tracking-[-0.04em] sm:text-6xl">Good work.<br /><span className="text-transparent" style={{ WebkitTextStroke: '1px #77736d' }}>Clear results.</span></h2>
            </div>
            <div className="max-w-md sm:justify-self-end">
              <p className="text-sm leading-6 text-[#595650]">Every project is a chance to improve a property with care, clear communication and workmanship you can see.</p>
              <Link href="/services" className="mt-5 inline-flex items-center gap-2 border-b border-[#d94a13] pb-1 text-[10px] font-bold uppercase tracking-[0.15em]">Explore all services <span aria-hidden="true">↗</span></Link>
            </div>
          </div>

          <div id="project-work" className="mt-10 grid gap-4 sm:mt-14 sm:grid-cols-2 lg:grid-cols-12">
            <article className="group relative min-h-[340px] overflow-hidden bg-[#171717] text-white sm:min-h-[430px] lg:col-span-7">
              {featured ? (
                <Image
                  src={(Array.isArray(featured.after_image_urls) && featured.after_image_urls[0]) || featured.after_image_url}
                  alt={featured.caption || 'Featured completed project'}
                  fill
                  unoptimized
                  sizes="(max-width: 640px) 100vw, 60vw"
                  className="object-cover transition duration-700 group-hover:scale-[1.03]"
                />
              ) : (
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_30%,rgba(255,83,20,.28),transparent_35%),linear-gradient(140deg,#292725,#101010)]" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-black/5" />
              <div className="relative flex min-h-[340px] flex-col justify-between p-6 sm:min-h-[430px] sm:p-9">
                <span className="self-start bg-[#ff5314] px-3 py-2 text-[9px] font-bold uppercase tracking-[0.18em]">Featured work</span>
                <div>
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#ff8b60]">{featured?.service_slug?.replaceAll('-', ' ') || 'Property maintenance'}</p>
                  <h3 className="max-w-lg font-heading text-3xl font-extrabold uppercase leading-[0.95] sm:text-5xl">{featured?.caption || 'Results made to last'}</h3>
                  <p className="mt-3 text-xs text-white/70">{featured?.location || 'Helderberg Basin'}</p>
                </div>
              </div>
            </article>

            <div className="grid gap-3 lg:col-span-5">
              {[
                { number: '01', title: 'Before & after', text: 'Compare the details and see the difference.' },
                { number: '02', title: 'Local expertise', text: 'Work completed for homes and properties in our region.' },
                { number: '03', title: 'One point of contact', text: 'Multiple maintenance trades coordinated by one team.' },
              ].map((item) => (
                <div key={item.number} className="flex min-h-[105px] items-center gap-5 border border-[#dedad2] bg-[#e9e4db] p-5 sm:min-h-0">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center bg-[#ff5314] text-xs font-bold text-white">{item.number}</span>
                  <div className="flex-1">
                    <h3 className="font-heading text-lg font-bold uppercase leading-tight">{item.title}</h3>
                    <p className="mt-1 text-xs leading-5 text-[#66615b]">{item.text}</p>
                  </div>
                  <span aria-hidden="true" className="text-lg">↗</span>
                </div>
              ))}
              <div className="flex items-center justify-between gap-4 border-t border-[#d7d2ca] pt-4 text-[9px] font-bold uppercase tracking-[0.15em] text-[#5b5650]">
                <span>Workmanship first</span><span>Local service</span><span>Clear quotes</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#101010] px-4 py-16 text-white sm:px-6 sm:py-24 lg:px-10">
        <div className="mx-auto max-w-[1400px]">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.24em] text-[#ff6a32]">02 / The project archive</p>
              <h2 className="font-heading text-4xl font-extrabold uppercase leading-[0.92] tracking-[-0.04em] sm:text-6xl">Built through<br /><span className="text-transparent" style={{ WebkitTextStroke: '1px rgba(255,255,255,.55)' }}>real projects.</span></h2>
            </div>
            <p className="max-w-sm text-sm leading-6 text-white/60">Browse completed work and before-and-after photographs uploaded by the NextGen team.</p>
          </div>

          {projects.length > 0 ? (
            <div className="mt-10 grid gap-5 sm:mt-14 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((p, index) => (
                <article key={p.id} className="group overflow-hidden border border-white/10 bg-[#191919]">
                  <div className="grid grid-cols-2 gap-px bg-white/10">
                    <div className="relative aspect-[4/3] bg-[#292929]">
                      <Image src={(Array.isArray(p.before_image_urls) && p.before_image_urls[0]) || p.before_image_url} alt={`Before: ${p.caption || p.service_slug || 'project'}`} fill sizes="(max-width: 640px) 50vw, 25vw" unoptimized className="object-cover transition duration-500 group-hover:scale-[1.02]" />
                      <span className="absolute left-2 top-2 bg-black/75 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-white">Before</span>
                    </div>
                    <div className="relative aspect-[4/3] bg-[#292929]">
                      <Image src={(Array.isArray(p.after_image_urls) && p.after_image_urls[0]) || p.after_image_url} alt={`After: ${p.caption || p.service_slug || 'project'}`} fill sizes="(max-width: 640px) 50vw, 25vw" unoptimized className="object-cover transition duration-500 group-hover:scale-[1.02]" />
                      <span className="absolute left-2 top-2 bg-[#ff5314] px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-white">After</span>
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#ff7847]">{p.service_slug?.replaceAll('-', ' ') || 'Property maintenance'}</p>
                      <span className="text-[10px] text-white/35">{String(index + 1).padStart(2, '0')}</span>
                    </div>
                    <h3 className="mt-3 font-heading text-xl font-bold uppercase leading-tight">{p.caption || 'Completed project'}</h3>
                    <p className="mt-2 text-xs text-white/55">{p.location}</p>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-10 border border-white/15 bg-white/[0.03] p-8 sm:mt-14 sm:p-12">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#ff7847]">Project gallery in progress</p>
              <h3 className="mt-4 max-w-2xl font-heading text-3xl font-bold uppercase sm:text-4xl">Our next case study starts here.</h3>
              <p className="mt-4 max-w-xl text-sm leading-6 text-white/60">We’re adding project photos as jobs are completed. Contact us for help with your property or to discuss a similar project.</p>
            </div>
          )}

          <div className="mt-10 flex flex-wrap gap-3 border-t border-white/15 pt-6">
            <Link href="/quote" className="inline-flex min-h-12 items-center gap-3 bg-[#ff5314] px-5 py-3 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-[#e74408]">Plan your project <span aria-hidden="true">↗</span></Link>
            <Link href="/contact" className="inline-flex min-h-12 items-center gap-3 border border-white/30 px-5 py-3 text-xs font-bold uppercase tracking-wide text-white transition hover:border-[#ff5314]">Talk to our team <span aria-hidden="true">↗</span></Link>
          </div>
        </div>
      </section>
    </main>
  )
}
