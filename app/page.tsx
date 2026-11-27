import type { Metadata } from 'next'
import { Barlow_Condensed } from 'next/font/google'
import SeasonalBanner from '@/components/SeasonalBanner'
import DiscountPopup from '@/components/DiscountPopup'
import Hero from '@/components/home2026/Hero'
import Effects from '@/components/home2026/Effects'
import { Marquee, Audience, LocalContact, Features } from '@/components/home2026/Intro'
import { Services, SolarFlagship, BeforeAfter, GoogleReviews } from '@/components/home2026/Showcase'
import { WhyNgms, HowItWorks, BodyCorporate, WeatherToday, AreasAndFaq, FinalCta } from '@/components/home2026/Trust'
import { services } from '@/lib/services'
import { getBusinessHours } from '@/lib/business-hours'
import { getBeforeAfter, getHeroSlides, getServiceImages, getSlotPhotos } from '@/lib/queries'
import './homepage-mason-editorial.css'
import './homepage-editorial.css'
import './homepage-fusion.css'
import './ngms-public-fusion.css'
import './homepage-stein-reference.css'
import './homepage-graphite-brutalist.css'
// 2026 homepage look. Loaded last; every rule is scoped to .ng26.
import './homepage-2026.css'

// Display face for the big condensed headlines (the rest of the site keeps Inter + Poppins).
const display = Barlow_Condensed({
  subsets: ['latin'],
  weight: ['600', '700', '800', '900'],
  style: ['normal', 'italic'],
  variable: '--ng26-display',
  display: 'swap',
})

// Admin-managed homepage media should become visible promptly after an edit.
export const revalidate = 60
export const metadata: Metadata = { alternates: { canonical: '/' } }

export default async function HomePage() {
  const [hours, slides, serviceImages, beforeAfter, slotPhotos] = await Promise.all([
    getBusinessHours(),
    getHeroSlides(),
    getServiceImages(),
    getBeforeAfter(),
    getSlotPhotos(['hero_solar', 'hero_feature', 'mission_left', 'mission_right']),
  ])
  const proofPairs = beforeAfter
    .filter((photo) => photo.before_image_url && photo.after_image_url)
    .slice(0, 3)
    .map((photo) => ({
      before: photo.before_image_url,
      after: photo.after_image_url,
      caption: photo.caption || '',
      location: photo.location || '',
    }))
  const tradeCount = services.length

  return (
    <>
      {/* Banner + popup keep the class their existing styles are scoped to. */}
      <div className="ngms-home-new" style={{ display: 'contents' }}>
        <SeasonalBanner />
        <DiscountPopup />
      </div>

      <main className={`ng26 ${display.variable}`}>
        <Effects />
        <Hero slides={slides} tradeCount={tradeCount} days={hours.days} open={hours.open} close={hours.close} />
        <Marquee />
        <Audience />
        <LocalContact tradeCount={tradeCount} />
        <Features />
        <Services services={services} images={serviceImages} />
        <SolarFlagship
          photo={
            slotPhotos.hero_solar?.image_url
              ? {
                  src: slotPhotos.hero_solar.image_url,
                  caption: slotPhotos.hero_solar.caption || 'NGMS solar panel cleaning project',
                }
              : undefined
          }
        />
        <BeforeAfter pairs={proofPairs} />
        <GoogleReviews />
        <WhyNgms
          photo={
            slotPhotos.mission_left
              ? { src: slotPhotos.mission_left.image_url, caption: slotPhotos.mission_left.caption || 'Recent NGMS maintenance project' }
              : undefined
          }
        />
        <HowItWorks />
        <BodyCorporate
          photo={
            slotPhotos.hero_feature
              ? { src: slotPhotos.hero_feature.image_url, caption: slotPhotos.hero_feature.caption || 'Complex maintenance' }
              : undefined
          }
        />
        <WeatherToday />
        <AreasAndFaq />
        <FinalCta
          photo={
            slotPhotos.mission_right
              ? { src: slotPhotos.mission_right.image_url, caption: slotPhotos.mission_right.caption || 'NextGen maintenance project' }
              : undefined
          }
        />
      </main>
    </>
  )
}
