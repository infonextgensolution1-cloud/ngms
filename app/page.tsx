import { Space_Grotesk } from 'next/font/google'
import { services } from '@/lib/services'
import SeasonalBanner from '@/components/SeasonalBanner'
import DiscountPopup from '@/components/DiscountPopup'
import TrustStrip from '@/components/TrustStrip'
import TrustBadges from '@/components/TrustBadges'
import HowItWorks from '@/components/HowItWorks'
import SolarRoiCalculator from '@/components/SolarRoiCalculator'
import BodyCorporateSection from '@/components/BodyCorporateSection'
import DiyTips from '@/components/home/DiyTips'
import HelderbergToday from '@/components/home/HelderbergToday'
import { getBeforeAfter, getGalleryPhotos, getHeroSlides, getServiceImages } from '@/lib/queries'
import { HeroBento, JobReel, MissionBand, PostTrio, ServicePhotoGrid, type Photo } from '@/components/home/VestoxHome'

export const revalidate = 0

// Homepage display font: Space Grotesk Bold (modern / tech look).
// Sets --font-heading on <main>, so every font-heading class on the homepage uses it.
const techHeading = Space_Grotesk({ subsets: ['latin'], weight: ['500', '600', '700'], variable: '--font-heading' })

const TICKER_ITEMS = services.map((s) => s.name)

export default async function HomePage() {
  const [slides, gallery, beforeAfter, serviceImages] = await Promise.all([
    getHeroSlides(),
    getGalleryPhotos(24),
    getBeforeAfter(),
    getServiceImages(),
  ])

  // All photos come from Admin → Media, so new uploads show up here automatically.
  const jobPhotos: Photo[] = slides
    .filter((s) => s.image_url)
    .map((s) => ({ src: s.image_url, caption: s.caption || s.alt_text || 'Recent job' }))
  const solarPhotos: Photo[] = gallery
    .filter((g) => g.service_slug === 'solar-panel-cleaning' && g.image_url)
    .map((g) => ({ src: g.image_url, caption: g.caption || 'Solar panel cleaning' }))
  const afterPhotos: Photo[] = beforeAfter.map((b) => ({
    src: b.after_image_url,
    caption: b.location && !(b.caption ?? '').includes(b.location)
      ? `${b.caption || 'Completed job'} — ${b.location}`
      : b.caption || 'Completed job',
  }))
  const servicePhotos: Photo[] = Object.entries(serviceImages).map(([slug, src]) => ({
    src,
    caption: services.find((s) => s.slug === slug)?.name ?? 'Recent job',
  }))

  const pool = [...jobPhotos, ...afterPhotos, ...servicePhotos]
  const pick = (i: number) => pool.length ? pool[i % pool.length] : undefined
  const solar = (i: number) => solarPhotos[i] ?? pick(i)

  return (
    <main className={`bg-jet ${techHeading.variable}`}>
      <SeasonalBanner />
      <DiscountPopup />

      <HeroBento solar={solar(0)} avatars={[pick(1), pick(2), pick(3)].filter(Boolean) as Photo[]} feature={pick(0)} />

      <TrustBadges />

      {/* Scrolling service ticker */}
      <div className="bg-graphite overflow-hidden py-3">
        <div className="flex w-max animate-marquee">
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((name, i) => (
            <span
              key={`${name}-${i}`}
              className="flex items-center text-mist text-xs uppercase tracking-[0.15em] font-heading font-semibold px-6 whitespace-nowrap"
            >
              {name}
              <span className="text-orange ml-6" aria-hidden>
                &bull;
              </span>
            </span>
          ))}
        </div>
      </div>

      <JobReel photos={[...jobPhotos, ...solarPhotos.slice(1, 3)]} />

      {/* Solar ROI calculator — the best selling tool */}
      <section className="bg-jet py-14 px-4">
        <div className="max-w-[520px] mx-auto">
          <SolarRoiCalculator />
        </div>
      </section>

      <MissionBand photo={pick(4) ?? pick(0)} side={afterPhotos[0] ?? pick(2)} />

      {/* Before/after sliders + real reviews */}
      <TrustStrip beforeAfter={beforeAfter} />

      <HowItWorks />

      <ServicePhotoGrid services={services} images={serviceImages} />

      {/* DIY tips + live Helderberg weather and local news */}
      <DiyTips />

      <HelderbergToday />

      <BodyCorporateSection />

      <PostTrio left={solar(3)} right={afterPhotos[1] ?? pick(3)} />
    </main>
  )
}
