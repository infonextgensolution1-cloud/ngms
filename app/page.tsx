import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import SeasonalBanner from '@/components/SeasonalBanner'
import DiscountPopup from '@/components/DiscountPopup'
import HomeHero from '@/components/home/HomeHero'
import HowItWorks from '@/components/HowItWorks'
import BodyCorporateSection from '@/components/BodyCorporateSection'
import HelderbergToday from '@/components/home/HelderbergToday'
import HomeHero from '@/components/home/HomeHero'
import LocalPointOfContact from '@/components/home/LocalPointOfContact'
import { getBusinessHours } from '@/lib/business-hours'
import { getBeforeAfter, getGalleryPhotos, getHeroSlides, getServiceImages, getSlotPhotos } from '@/lib/queries'
import './homepage-mason-editorial.css'

export const revalidate = 300
export const metadata: Metadata = { alternates: { canonical: '/' } }

// Homepage flow: hero → local point-of-contact statement → services → solar offer →
// proof, reviews, why NGMS, process, body corporates, local planning and final CTA.
// Homepage imagery remains managed through Admin → Media.
export default async function HomePage() {
  const [hours, slides, gallery, serviceImages, beforeAfter, slotPhotos] = await Promise.all([
    getBusinessHours(),
    getHeroSlides(),
    getGalleryPhotos(18),
    getServiceImages(),
    getBeforeAfter(),
    getSlotPhotos(['hero_feature', 'mission_left']),
  ])
  const projectPhotos = gallery.filter((photo) => photo.image_url).slice(0, 6)
  const comparisonPhotos = beforeAfter.filter((photo) => photo.before_image_url && photo.after_image_url).slice(0, 3)

  return (
    <main className="ngms-home-new">
      <SeasonalBanner />
      <DiscountPopup />
      <HomeHero slides={slides} days={hours.days} open={hours.open} close={hours.close} />

      <section className="ngms-new-intro" aria-labelledby="ngms-intro-title">
        <div>
          <p className="ngms-new-eyebrow ngms-new-eyebrow--dark">ONE LOCAL POINT OF CONTACT</p>
          <h2 id="ngms-intro-title">LESS CHASING.<br /><span>MORE GETTING DONE.</span></h2>
        </div>
        <p>From solar panel cleaning to repairs, painting and exterior maintenance, NGMS helps homeowners, body corporates and businesses manage property work with one reliable team.</p>
      </section>

      <section className="ngms-new-services" aria-labelledby="ngms-services-title">
        <div className="ngms-new-section-head">
          <div>
            <p className="ngms-new-eyebrow ngms-new-eyebrow--dark">WHAT WE DO</p>
            <h2 id="ngms-services-title">ONE TEAM.<br /><span>MANY SOLUTIONS.</span></h2>
          </div>
          <Link href="/services" className="ngms-new-text-link">VIEW ALL SERVICES <span aria-hidden="true">↗</span></Link>
        </div>
        <ul className="ngms-new-service-grid">
          {services.map((service, index) => {
            const image = serviceImages[service.slug]
            return <li key={service.slug}>
              <Link href={`/services/${service.slug}`} className="ngms-new-service-card">
                <div className="ngms-new-service-card__media">
                  {image ? <Image src={image} alt={service.name} fill sizes="(max-width: 700px) 100vw, (max-width: 1050px) 50vw, 25vw" quality={76} unoptimized={image.includes('.supabase.co/storage/')} /> : <div className="ngms-new-service-card__fallback" />}
                  <span className="ngms-new-service-card__number">{String(index + 1).padStart(2, '0')}</span>
                </div>
                <div className="ngms-new-service-card__body">
                  <h3>{service.name}</h3>
                  <p>{service.tagline}</p>
                  <span className="ngms-new-service-card__link">EXPLORE SERVICE <span aria-hidden="true">↗</span></span>
                </div>
              </Link>
            </li>
          })}
        </ul>
      </section>

  const slot = (key: string): Photo | undefined =>
    slotPhotos[key] ? { src: slotPhotos[key].image_url, caption: slotPhotos[key].caption || 'Recent job' } : undefined

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
      <LocalPointOfContact />
      <ServicesOverview services={services} images={serviceImages} />
      <SolarFeature photo={slot('hero_solar') ?? solarPhotos[0] ?? pick(0)} />
      <RecentWork photos={recent} />
      <GoogleReviews />
      <WhyNgms photo={slotPhotos.mission_left ? { src: slotPhotos.mission_left.image_url, caption: slotPhotos.mission_left.caption || 'Recent NGMS maintenance project' } : undefined} />
      <HowItWorks />
      <BodyCorporateSection photo={slotPhotos.hero_feature ? { src: slotPhotos.hero_feature.image_url, caption: slotPhotos.hero_feature.caption || 'Complex maintenance' } : undefined} />
      <HelderbergToday />
      <AreasAndFaq />

      <section className="ngms-new-clients" aria-labelledby="ngms-clients-title">
        <div>
          <p className="ngms-new-eyebrow ngms-new-eyebrow--dark">WHO WE HELP</p>
          <h2 id="ngms-clients-title">PROPERTY CARE<br /><span>WITHOUT THE RUNAROUND.</span></h2>
        </div>
        <div className="ngms-new-client-grid">
          <Link href="/quote?type=homeowner"><span>01</span><strong>HOMEOWNERS</strong><small>Keep your property in shape.</small><b aria-hidden="true">↗</b></Link>
          <Link href="/body-corporate-maintenance"><span>02</span><strong>BODY CORPORATES</strong><small>Planned upkeep for shared spaces.</small><b aria-hidden="true">↗</b></Link>
          <Link href="/quote?type=commercial"><span>03</span><strong>BUSINESSES</strong><small>One contact for ongoing maintenance.</small><b aria-hidden="true">↗</b></Link>
        </div>
      </section>

      <section className="ngms-new-final" aria-labelledby="ngms-final-title">
        <p className="ngms-new-eyebrow">YOUR PROPERTY. ONE POINT OF CONTACT.</p>
        <h2 id="ngms-final-title">ONE CALL.<br /><span>ALL SOLUTIONS.</span></h2>
        <p>Tell us what needs doing. We’ll help you plan the next step.</p>
        <div className="ngms-new-final__actions">
          <Link href="/quote" className="ngms-new-button ngms-new-button--black">REQUEST A QUOTE <span aria-hidden="true">↗</span></Link>
          <a href={whatsappLink("Hi NextGen, I'd like to discuss a property maintenance quote.")} target="_blank" rel="noopener noreferrer" className="ngms-new-button ngms-new-button--black-outline">WHATSAPP {SITE.phoneDisplay}</a>
        </div>
      </section>
      <footer className="ngms-new-footer">
        <Link href="/" className="ngms-new-footer__brand">NEXTGEN <span>MAINTENANCE SOLUTIONS</span></Link>
        <p>ONE CALL. ALL SOLUTIONS.</p>
        <nav aria-label="Footer navigation"><Link href="/services">Services</Link><Link href="/portfolio">Projects</Link><Link href="/contact">Contact</Link><Link href="/privacy">Privacy</Link></nav>
      </footer>
    </main>
  )
}
