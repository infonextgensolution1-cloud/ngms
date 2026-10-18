import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import SeasonalBanner from '@/components/SeasonalBanner'
import DiscountPopup from '@/components/DiscountPopup'
import HomeHero from '@/components/home/HomeHero'
import HowItWorks from '@/components/HowItWorks'
import BodyCorporateSection from '@/components/BodyCorporateSection'
import HelderbergToday from '@/components/home/HelderbergToday'
import { GoogleReviews, WhyNgms, AreasAndFaq } from '@/components/home/HomeSections'
import { services } from '@/lib/services'
import { SITE, whatsappLink } from '@/lib/site'
import { getBusinessHours } from '@/lib/business-hours'
import { getBeforeAfter, getGalleryPhotos, getHeroSlides, getServiceImages, getSlotPhotos } from '@/lib/queries'
import './homepage-mason-editorial.css'
import './homepage-editorial.css'
import './homepage-fusion.css'
import './ngms-public-fusion.css'
import './homepage-stein-reference.css'

// Admin-managed homepage media should become visible promptly after an edit.
export const revalidate = 60
export const metadata: Metadata = { alternates: { canonical: '/' } }

export default async function HomePage() {
  const [hours, slides, gallery, serviceImages, beforeAfter, slotPhotos] = await Promise.all([
    getBusinessHours(),
    getHeroSlides(),
    getGalleryPhotos(18),
    getServiceImages(),
    getBeforeAfter(),
    getSlotPhotos(['hero_solar', 'hero_feature', 'mission_left', 'mission_right']),
  ])
  const projectPhotos = gallery.filter((photo) => photo.image_url).slice(0, 6)
  const comparisonPhotos = beforeAfter.filter((photo) => photo.before_image_url && photo.after_image_url).slice(0, 3)

  return (
    <main className="ngms-home-new">
      <SeasonalBanner />
      <DiscountPopup />
      <HomeHero slides={slides} days={hours.days} open={hours.open} close={hours.close} />

      <section className="ngms-new-clients" aria-labelledby="ngms-clients-title">
        <div>
          <p className="ngms-new-eyebrow ngms-new-eyebrow--dark">START HERE</p>
          <h2 id="ngms-clients-title">WHO ARE WE<br /><span>HELPING TODAY?</span></h2>
        </div>
        <div className="ngms-new-client-grid">
          <Link href="/quote?type=homeowner"><span>01</span><strong>HOMEOWNERS</strong><small>Keep your property in shape.</small><b aria-hidden="true">↗</b></Link>
          <Link href="/body-corporate-maintenance"><span>02</span><strong>BODY CORPORATES</strong><small>Planned upkeep for shared spaces.</small><b aria-hidden="true">↗</b></Link>
          <Link href="/quote?type=commercial"><span>03</span><strong>BUSINESSES</strong><small>One contact for ongoing maintenance.</small><b aria-hidden="true">↗</b></Link>
        </div>
      </section>

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
                  {image ? <Image src={image} alt={service.name} fill sizes="(max-width: 700px) 100vw, (max-width: 1050px) 50vw, 25vw" quality={76} unoptimized={image.includes('.supabase.co')} /> : <div className="ngms-new-service-card__placeholder" />}
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

      <section className="ngms-new-solar" aria-labelledby="ngms-solar-title">
        <div className="ngms-new-solar__copy">
          <p className="ngms-new-eyebrow">FLAGSHIP SERVICE · SOLAR</p>
          <h2 id="ngms-solar-title">CLEAN PANELS.<br /><span>CLEAR RESULTS.</span></h2>
          <p>Coastal salt, dust and pollen build up on solar panels. Our careful cleaning service helps keep your panels clear, with before-and-after photos so you can see the work.</p>
          <div className="ngms-new-solar__actions">
            <Link href="/solar-panel-cleaning/helderberg" className="ngms-new-button ngms-new-button--orange">SOLAR PANEL CLEANING <span aria-hidden="true">↗</span></Link>
            <Link href="/roi-calculator" className="ngms-new-button ngms-new-button--outline">CHECK CLEANING ROI</Link>
          </div>
        </div>
        <div className="ngms-new-solar__facts">
          {slotPhotos.hero_solar?.image_url && (
            <div className="ngms-new-solar__photo">
              <Image
                src={slotPhotos.hero_solar.image_url}
                alt={slotPhotos.hero_solar.caption || 'NGMS solar panel cleaning project'}
                fill
                sizes="(max-width: 900px) 100vw, 40vw"
                quality={80}
                unoptimized={slotPhotos.hero_solar.image_url.includes('.supabase.co/storage/')}
                className="object-cover"
              />
              {slotPhotos.hero_solar.caption && <p>{slotPhotos.hero_solar.caption}</p>}
            </div>
          )}
          <div><strong>01</strong><span>Gentle cleaning method</span></div>
          <div><strong>02</strong><span>Before-and-after photos</span></div>
          <div><strong>03</strong><span>Local Helderberg service</span></div>
        </div>
      </section>

      {projectPhotos.length > 0 && <section className="ngms-new-work" aria-labelledby="ngms-work-title">
        <div className="ngms-new-section-head">
          <div>
            <p className="ngms-new-eyebrow">REAL WORK · REAL PROPERTIES</p>
            <h2 id="ngms-work-title">WORK THAT<br /><span>SPEAKS FOR ITSELF.</span></h2>
          </div>
          <Link href="/portfolio" className="ngms-new-text-link ngms-new-text-link--light">VIEW PROJECTS <span aria-hidden="true">↗</span></Link>
        </div>
        <div className="ngms-new-work-grid">
          {projectPhotos.map((photo, index) => <figure key={photo.image_url}>
            <div className="ngms-new-work-photo">
              <Image src={photo.image_url} alt={photo.caption || 'Completed NGMS maintenance project'} fill sizes="(max-width: 700px) 100vw, 33vw" quality={76} unoptimized={photo.image_url.includes('.supabase.co')} />
            </div>
            <figcaption><span>{String(index + 1).padStart(2, '0')}</span>{photo.caption || 'Completed NGMS project'}</figcaption>
          </figure>)}
        </div>
      </section>}

      {comparisonPhotos.length > 0 && <section className="bg-[#F2F2F2] text-[#0D0D0D] px-5 py-16 sm:px-8 sm:py-24" aria-labelledby="ngms-before-after-title">
        <div className="mx-auto max-w-7xl">
          <p className="mb-4 text-xs font-black uppercase tracking-[.16em] text-[#A43C00]">Visible proof</p>
          <h2 id="ngms-before-after-title" className="mb-10 text-4xl leading-none sm:text-6xl">BEFORE.<br /><span className="text-[#A43C00]">AFTER.</span></h2>
          <div className="grid gap-5 md:grid-cols-3">
            {comparisonPhotos.map((photo, index) => <article key={photo.after_image_url} className="min-w-0 border border-[#D0D0D0] bg-white">
              <div className="grid grid-cols-2">
                <div>
                  <div className="relative aspect-[4/3] bg-[#D8D8D8]">
                    <Image src={photo.before_image_url} alt={`Before: ${photo.caption || photo.location || 'NGMS project'}`} fill sizes="(max-width: 768px) 50vw, 20vw" quality={72} unoptimized={photo.before_image_url.includes('.supabase.co')} />
                  </div>
                  <p className="bg-[#0D0D0D] px-3 py-2 text-[10px] font-black uppercase tracking-wider text-white">Before</p>
                </div>
                <div>
                  <div className="relative aspect-[4/3] bg-[#D8D8D8]">
                    <Image src={photo.after_image_url} alt={`After: ${photo.caption || photo.location || 'NGMS project'}`} fill sizes="(max-width: 768px) 50vw, 20vw" quality={72} unoptimized={photo.after_image_url.includes('.supabase.co')} />
                  </div>
                  <p className="bg-[#FF5A00] px-3 py-2 text-[10px] font-black uppercase tracking-wider text-[#0D0D0D]">After</p>
                </div>
              </div>
              <div className="p-4">
                <p className="text-sm font-bold">{photo.caption || 'Completed maintenance work'}</p>
                <p className="mt-1 text-xs text-[#555]">{photo.location}</p>
              </div>
            </article>)}
          </div>
          <p className="mt-8"><Link href="/portfolio" className="inline-flex border-b-2 border-[#FF5A00] py-3 text-xs font-black uppercase tracking-wider">VIEW MORE PROJECTS ↗</Link></p>
        </div>
      </section>}

      <GoogleReviews />
      <WhyNgms photo={slotPhotos.mission_left ? { src: slotPhotos.mission_left.image_url, caption: slotPhotos.mission_left.caption || 'Recent NGMS maintenance project' } : undefined} />
      <HowItWorks />
      <BodyCorporateSection photo={slotPhotos.hero_feature ? { src: slotPhotos.hero_feature.image_url, caption: slotPhotos.hero_feature.caption || 'Complex maintenance' } : undefined} />
      <HelderbergToday />
      <AreasAndFaq />

    </main>
  )
}
