import type { Metadata } from 'next'
import { services } from '@/lib/services'
import SeasonalBanner from '@/components/SeasonalBanner'
import DiscountPopup from '@/components/DiscountPopup'
import TrustStrip from '@/components/TrustStrip'
import HowItWorks from '@/components/HowItWorks'
import BodyCorporateSection from '@/components/BodyCorporateSection'
import HelderbergToday from '@/components/home/HelderbergToday'
import HomeHero from '@/components/home/HomeHero'
import { getBusinessHours } from '@/lib/business-hours'
import { AreasAndFaq, FinalCta, GoogleReviews, RecentWork, ServicesOverview, SolarFeature, WhyNgms, type Photo } from '@/components/home/HomeSections'
import { getBeforeAfter, getGalleryPhotos, getHeroSlides, getServiceImages, getSlotPhotos } from '@/lib/queries'

export const revalidate = 300

// Title/description/OG come from the root layout; only the canonical is page-specific.
export const metadata: Metadata = { alternates: { canonical: '/' } }

// Homepage flow: who/what/where (hero) → services → flagship solar offer → proof
// (recent work, before/after, reviews) → why NGMS → process → complexes →
// weather-aware planning → service area + FAQ → final quote/WhatsApp CTA.
// Every photo comes from Admin → Media, so new uploads show up here automatically.
export default async function HomePage() {
  const hours = await getBusinessHours()
  const [slides, gallery, beforeAfter, serviceImages, slotPhotos] = await Promise.all([
    getHeroSlides(),
    getGalleryPhotos(24),
    getBeforeAfter(),
    getServiceImages(),
    getSlotPhotos(['hero_solar', 'hero_feature', 'mission_left', 'mission_right']),
  ])

  const jobPhotos: Photo[] = slides
    .filter((s) => s.image_url)
    .map((s) => ({ src: s.image_url, caption: s.caption || s.alt_text || 'Recent job' }))
  const solarPhotos: Photo[] = gallery
    .filter((g) => g.service_slug === 'solar-panel-cleaning' && g.image_url)
    .map((g) => ({ src: g.image_url, caption: g.caption || 'Solar panel cleaning' }))
  const afterPhotos: Photo[] = beforeAfter.map((b) => ({
    src: b.after_image_url,
    caption:
      b.location && !(b.caption ?? '').includes(b.location)
        ? `${b.caption || 'Completed job'} — ${b.location}`
        : b.caption || 'Completed job',
  }))
  const galleryPhotos: Photo[] = gallery
    .filter((g) => g.image_url)
    .map((g) => ({ src: g.image_url, caption: g.caption || 'Recent job' }))

  const pool = [...afterPhotos, ...galleryPhotos, ...jobPhotos]
  const pick = (i: number) => (pool.length ? pool[i % pool.length] : undefined)

  // Pinned from Admin → Media → Homepage slot; falls back to an automatic pick.
  const slot = (key: string): Photo | undefined =>
    slotPhotos[key] ? { src: slotPhotos[key].image_url, caption: slotPhotos[key].caption || 'Recent job' } : undefined

  // Recent work strip: completed jobs first, de-duplicated by image.
  const seen = new Set<string>()
  const recent = [...afterPhotos, ...galleryPhotos, ...jobPhotos].filter((p) => {
    if (!p.src || seen.has(p.src)) return false
    seen.add(p.src)
    return true
  }).slice(0, 10)

  return (
    <main className="bg-jet ngms-home-refresh" data-ngms-home-refresh>
      <SeasonalBanner />
      <DiscountPopup />

      <HomeHero slides={slides} days={hours.days} open={hours.open} close={hours.close} />
      <ServicesOverview services={services} images={serviceImages} />
      <SolarFeature photo={slot('hero_solar') ?? solarPhotos[0] ?? pick(0)} />
      <RecentWork photos={recent} />
      <GoogleReviews />
      <TrustStrip beforeAfter={beforeAfter} />
      <WhyNgms photo={slot('mission_left') ?? pick(1)} />
      <HowItWorks />
      <BodyCorporateSection photo={slot('hero_feature') ?? pick(2)} />
      <HelderbergToday />
      <AreasAndFaq />
      <FinalCta photo={slot('mission_right') ?? pick(3)} />
    </main>
  )
}
