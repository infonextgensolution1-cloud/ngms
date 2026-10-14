import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import SeasonalBanner from '@/components/SeasonalBanner'
import DiscountPopup from '@/components/DiscountPopup'
import HomeHero from '@/components/home/HomeHero'
import { services } from '@/lib/services'
import { SITE, whatsappLink } from '@/lib/site'
import { getBusinessHours } from '@/lib/business-hours'
import { getGalleryPhotos, getHeroSlides, getServiceImages } from '@/lib/queries'

export const revalidate = 300
export const metadata: Metadata = { alternates: { canonical: '/' } }

export default async function HomePage() {
  const [hours, slides, gallery, serviceImages] = await Promise.all([
    getBusinessHours(),
    getHeroSlides(),
    getGalleryPhotos(18),
    getServiceImages(),
  ])
  const projectPhotos = gallery.filter((photo) => photo.image_url).slice(0, 6)

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
              <Image src={photo.image_url} alt={photo.caption || 'Completed NGMS maintenance project'} fill sizes="(max-width: 700px) 100vw, 33vw" quality={76} unoptimized={photo.image_url.includes('.supabase.co/storage/')} />
            </div>
            <figcaption><span>{String(index + 1).padStart(2, '0')}</span>{photo.caption || 'Completed NGMS project'}</figcaption>
          </figure>)}
        </div>
      </section>}

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

      <section className="ngms-new-coverage" aria-labelledby="ngms-coverage-title">
        <div>
          <p className="ngms-new-eyebrow">LOCAL KNOW-HOW</p>
          <h2 id="ngms-coverage-title">PROUDLY SERVING<br /><span>THE HELDERBERG.</span></h2>
          <p>Serving Strand, Gordon’s Bay and Somerset West, with additional work across the Overberg by arrangement.</p>
        </div>
        <div className="ngms-new-coverage__places"><span>STRAND</span><span>GORDON’S BAY</span><span>SOMERSET WEST</span><span>OVERBERG</span></div>
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
