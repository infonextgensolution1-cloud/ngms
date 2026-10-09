import Image from 'next/image'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'

export const metadata = {
  alternates: { canonical: '/gallery' },
  title: 'Gallery | NextGen Maintenance Solutions',
  description:
    'A closer look at maintenance work by NextGen across Strand, Gordon’s Bay, Somerset West and the Helderberg Basin.',
}

export const revalidate = 300

type GalleryPhoto = {
  id: string
  image_url: string
  caption: string | null
  service_slug: string | null
}

async function getGalleryPhotos(): Promise<GalleryPhoto[]> {
  const { data, error } = await supabase
    .from('gallery_photos')
    .select('id, image_url, caption, service_slug')
    .eq('is_active', true)
    .order('sort_order')

  if (error) {
    console.error('Unable to load gallery photos:', error.message)
    return []
  }

  return (data as GalleryPhoto[]) ?? []
}

function serviceLabel(slug: string | null) {
  if (!slug) return 'Field work'
  return slug
    .split(/[-_]/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export default async function GalleryPage() {
  const photos = await getGalleryPhotos()
  const [leadPhoto, ...remainingPhotos] = photos

  return (
    <main className="bg-[#F7F4EF] text-[#171717]">
      {/* Editorial cover inspired by the supplied gallery reference. */}
      <section className="relative isolate mx-auto flex min-h-[520px] max-w-[1440px] flex-col overflow-hidden bg-[#171717] px-5 pb-7 pt-6 text-white sm:min-h-[600px] sm:px-10 sm:pt-8 lg:min-h-[660px] lg:px-16">
        <header className="flex items-center justify-between border-b border-white/20 pb-4 text-[10px] font-bold uppercase tracking-[0.16em] sm:text-xs">
          <Link href="/" aria-label="NextGen Maintenance Solutions home" className="text-base font-black tracking-[-0.08em] sm:text-lg">
            NGMS<span className="text-[#FF6A00]">.</span>
          </Link>
          <span className="hidden sm:inline text-white/55">One call. All solutions.</span>
          <Link href="/contact" className="transition-colors hover:text-[#FF6A00]">Contact ↗</Link>
        </header>

        <div className="relative flex flex-1 flex-col justify-center py-14 sm:py-16">
          <p className="mb-6 flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.22em] text-[#C4C1BB]">
            <span className="h-[2px] w-8 bg-[#FF6A00]" />
            NGMS / Field archive
          </p>
          <h1 className="max-w-[1000px] text-[clamp(4rem,11vw,10rem)] font-semibold leading-[0.78] tracking-[-0.085em] text-white">
            Selected
            <span className="block">Field Work</span>
            <span className="block text-[#777570]">2026—27</span>
          </h1>
          <div className="mt-10 grid gap-7 border-t border-white/20 pt-5 sm:grid-cols-[1fr_auto] sm:items-end">
            <p className="max-w-xl text-sm leading-relaxed text-[#C4C1BB] sm:text-base">
              A working record of the details, finishes and maintenance jobs we handle across the Helderberg. Real work, captured on site.
            </p>
            <div className="font-mono text-[10px] uppercase leading-relaxed tracking-[0.12em] text-[#96938D] sm:text-right">
              <p>01 / On-site photography</p>
              <p>02 / Maintenance &amp; repairs</p>
              <p>03 / Helderberg Basin</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-white/20 pt-4 font-mono text-[10px] uppercase tracking-[0.12em] text-[#96938D]">
          <span>NextGen Maintenance Solutions</span>
          <a href="#gallery-grid" className="transition-colors hover:text-[#FF6A00]">Explore archive ↓</a>
        </div>
        <span aria-hidden="true" className="pointer-events-none absolute right-[-0.06em] top-[20%] select-none text-[clamp(10rem,26vw,25rem)] font-semibold leading-none tracking-[-0.12em] text-white/[0.025]">NG</span>
      </section>

      {/* Neutral archive index: photographs remain controlled by the admin gallery. */}
      <section id="gallery-grid" className="scroll-mt-16 bg-[#E5E2DD] px-5 py-12 sm:px-10 sm:py-16 lg:px-16">
        <div className="mx-auto max-w-[1280px]">
          <div className="mb-8 flex flex-col justify-between gap-5 border-b border-[#C6C1B9] pb-5 sm:flex-row sm:items-end">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#B83E00]">The archive / 01</p>
              <h2 className="mt-3 text-4xl font-semibold leading-[0.9] tracking-[-0.065em] text-[#171717] sm:text-6xl">Work in focus.</h2>
            </div>
            <p className="max-w-xs font-mono text-[10px] uppercase leading-relaxed tracking-[0.1em] text-[#77736D]">
              {String(photos.length).padStart(2, '0')} {photos.length === 1 ? 'photograph' : 'photographs'} / Admin-managed collection
            </p>
          </div>

          {leadPhoto ? (
            <>
              <article className="grid gap-0 border-b border-[#C6C1B9] pb-8 lg:grid-cols-[1.35fr_0.65fr] lg:gap-8">
                <div className="relative aspect-[4/3] overflow-hidden bg-[#C6C3BE] sm:aspect-[16/9] lg:aspect-[1.28/1]">
                  <Image
                    src={leadPhoto.image_url}
                    alt={leadPhoto.caption || serviceLabel(leadPhoto.service_slug) + ' by NextGen Maintenance Solutions'}
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 65vw"
                    quality={80}
                    unoptimized
                    className="object-cover transition-transform duration-700 hover:scale-[1.025]"
                  />
                  <span className="absolute left-4 top-4 bg-[#FF6A00] px-3 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-[#171717]">Featured / 01</span>
                </div>
                <div className="flex flex-col justify-between gap-8 py-5 lg:py-2">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#B83E00]">{serviceLabel(leadPhoto.service_slug)}</p>
                    <h3 className="mt-4 max-w-md text-3xl font-semibold leading-[0.95] tracking-[-0.06em] sm:text-5xl">
                      {leadPhoto.caption || 'Details from the field.'}
                    </h3>
                    <p className="mt-5 max-w-md text-sm leading-relaxed text-[#55534F]">
                      A closer look at the work delivered by our team. Each image is published through the NGMS admin gallery.
                    </p>
                  </div>
                  <div className="flex items-end justify-between border-t border-[#C6C1B9] pt-4 font-mono text-[10px] uppercase tracking-[0.12em] text-[#77736D]">
                    <span>Helderberg / South Africa</span>
                    <span>01 — {String(photos.length).padStart(2, '0')}</span>
                  </div>
                </div>
              </article>

              {remainingPhotos.length > 0 && (
                <div className="pt-10">
                  <div className="mb-5 flex items-center justify-between">
                    <h3 className="text-2xl font-semibold tracking-[-0.05em] sm:text-3xl">More from the field</h3>
                    <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#77736D]">02 / {String(photos.length).padStart(2, '0')}</span>
                  </div>
                  <div className="grid grid-cols-1 gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
                    {remainingPhotos.map((photo, index) => (
                      <article key={photo.id} className="group min-w-0">
                        <div className="relative aspect-[4/5] overflow-hidden bg-[#C6C3BE]">
                          <Image
                            src={photo.image_url}
                            alt={photo.caption || serviceLabel(photo.service_slug) + ' by NextGen Maintenance Solutions'}
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                            quality={75}
                            unoptimized
                            className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                          />
                          <span className="absolute left-3 top-3 bg-[#F7F4EF] px-2 py-1 font-mono text-[10px] text-[#171717]">{String(index + 2).padStart(2, '0')}</span>
                        </div>
                        <div className="flex items-start justify-between gap-3 border-b border-[#C6C1B9] py-3">
                          <div className="min-w-0">
                            <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#B83E00]">{serviceLabel(photo.service_slug)}</p>
                            <p className="mt-1 text-sm font-semibold leading-snug text-[#171717]">{photo.caption || 'Field work'}</p>
                          </div>
                          <span aria-hidden="true" className="pt-1 text-lg text-[#FF6A00] transition-transform group-hover:translate-x-1">↗</span>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="grid min-h-[300px] items-center gap-8 border-b border-[#C6C1B9] py-12 sm:grid-cols-[1fr_auto] sm:py-16">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#B83E00]">Archive in progress / 00</p>
                <h3 className="mt-4 max-w-xl text-4xl font-semibold leading-[0.9] tracking-[-0.065em] sm:text-6xl">Good work deserves to be seen.</h3>
                <p className="mt-5 max-w-lg text-sm leading-relaxed text-[#55534F]">
                  New site photographs will appear here when they are published in the admin dashboard. No sample projects or stock photos are shown as completed NGMS work.
                </p>
              </div>
              <div className="flex h-28 w-28 items-center justify-center border border-[#BDB8B0] text-5xl font-light text-[#FF6A00]" aria-hidden="true">+</div>
            </div>
          )}
        </div>
      </section>

      <section className="bg-[#F7F4EF] px-5 py-14 sm:px-10 sm:py-20 lg:px-16">
        <div className="mx-auto flex max-w-[1280px] flex-col justify-between gap-8 sm:flex-row sm:items-end">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#B83E00]">Have a project in mind?</p>
            <h2 className="mt-3 max-w-2xl text-4xl font-semibold leading-[0.92] tracking-[-0.065em] sm:text-6xl">Let’s get the details right.</h2>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-[#55534F] sm:text-base">
              From one repair to a full property maintenance list, tell us what needs doing.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a href="https://wa.me/27631387945" target="_blank" rel="noreferrer" aria-label="Contact NextGen on WhatsApp" className="inline-flex min-h-12 items-center gap-3 border border-[#FF6A00] bg-[#171717] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[#303030]">
              <span aria-hidden="true" className="text-lg text-[#B7FF00]">◉</span> WhatsApp ↗
            </a>
            <Link href="/contact" className="inline-flex min-h-12 items-center gap-4 bg-[#FF6A00] px-5 py-3 text-sm font-bold text-[#171717] transition-colors hover:bg-[#E85E00]">
              Request a quote <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
