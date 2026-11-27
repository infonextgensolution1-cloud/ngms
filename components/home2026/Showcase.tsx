import Image from 'next/image'
import Link from 'next/link'
import { Arrow, PhotoFill, d, needsUnoptimized, type Photo } from './shared'
import CompareSlider from './CompareSlider'

// Services bento, solar flagship, before/after proof and Google reviews.

export function Services({
  services,
  images,
}: {
  services: { slug: string; name: string; tagline: string }[]
  images: Record<string, string | undefined>
}) {
  const n = services.length
  return (
    <section className="ng26-sec ng26-sec--dark" aria-labelledby="ng26-services-title">
      <div className="ng26-wrap">
        <div className="ng26-head ng26-head--row" data-reveal>
          <div>
            <p className="ng26-eyebrow ng26-eyebrow--light">WHAT WE DO</p>
            <h2 id="ng26-services-title" className="ng26-h-lg">
              ONE TEAM.
              <br />
              <span className="is-o">MANY SOLUTIONS.</span>
            </h2>
          </div>
          <Link href="/services" className="ng26-btn ng26-btn--ghost">
            VIEW ALL SERVICES <span aria-hidden="true">↗</span>
          </Link>
        </div>
        <ul className="ng26-svc">
          {services.map((s, i) => {
            const image = images[s.slug]
            const feature = i === 0
            const wide = !feature && i === n - 1 && n % 2 === 0
            return (
              <li key={s.slug} className={feature ? 'is-feature' : wide ? 'is-wide' : undefined} data-reveal style={d(i % 4)}>
                <Link href={`/services/${s.slug}`} className="ng26-svc__card">
                  {image ? (
                    <Image
                      src={image}
                      alt={`${s.name} service imagery`}
                      fill
                      sizes="(max-width: 560px) 100vw, (max-width: 980px) 50vw, 25vw"
                      quality={76}
                      unoptimized={needsUnoptimized(image)}
                    />
                  ) : (
                    <span className="ng26-svc__ph" aria-hidden="true" />
                  )}
                  <span className="ng26-svc__num">{String(i + 1).padStart(2, '0')}</span>
                  <span className="ng26-svc__body">
                    <h3>{s.name}</h3>
                    <p>{s.tagline}</p>
                    <span className="ng26-svc__link">
                      EXPLORE SERVICE <Arrow />
                    </span>
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}

export function SolarFlagship({ photo }: { photo?: Photo }) {
  const facts = ['Gentle cleaning method', 'Before-and-after photos', 'Local Helderberg service']
  return (
    <section className="ng26-sec ng26-sec--grey" aria-labelledby="ng26-solar-title">
      <div className="ng26-wrap ng26-solar">
        <div className="ng26-solar__copy" data-reveal>
          <p className="ng26-eyebrow">FLAGSHIP SERVICE · SOLAR</p>
          <h2 id="ng26-solar-title" className="ng26-h-lg">
            CLEAN PANELS.
            <br />
            <span className="is-o">CLEAR RESULTS.</span>
          </h2>
          <p className="ng26-solar__p">
            Coastal salt, dust and pollen build up on solar panels. Our careful cleaning service helps keep your panels clear, with
            before-and-after photos so you can see the work.
          </p>
          <div className="ng26-solar__cta">
            <Link href="/solar-panel-cleaning/helderberg" className="ng26-btn ng26-btn--orange">
              SOLAR PANEL CLEANING <span aria-hidden="true">↗</span>
            </Link>
            <Link href="/roi-calculator" className="ng26-btn ng26-btn--outline">
              CHECK CLEANING ROI
            </Link>
          </div>
          <ol className="ng26-solar__facts">
            {facts.map((f, i) => (
              <li key={f}>
                <strong>{String(i + 1).padStart(2, '0')}</strong>
                <span>{f}</span>
              </li>
            ))}
          </ol>
        </div>
        {photo?.src && (
          <figure className="ng26-solar__photo ng26-frame" data-reveal style={d(1)}>
            <div className="ng26-frame__in">
              <PhotoFill photo={photo} sizes="(max-width: 900px) 100vw, 46vw" />
              {photo.caption && photo.caption !== 'NGMS solar panel cleaning project' && <figcaption>{photo.caption}</figcaption>}
            </div>
          </figure>
        )}
      </div>
    </section>
  )
}

export type ProofPair = { before: string; after: string; caption: string; location: string }

export function BeforeAfter({ pairs }: { pairs: ProofPair[] }) {
  if (pairs.length === 0) return null
  return (
    <section className="ng26-sec ng26-sec--dark" aria-labelledby="ng26-ba-title">
      <div className="ng26-wrap">
        <div className="ng26-head" data-reveal>
          <p className="ng26-eyebrow ng26-eyebrow--light">Visible proof</p>
          <h2 id="ng26-ba-title" className="ng26-h-lg">
            BEFORE.
            <br />
            <span className="is-o">AFTER.</span>
          </h2>
          <p className="ng26-head__sub">Drag the handle to compare each job.</p>
        </div>
        <ul className="ng26-ba">
          {pairs.map((p, i) => (
            <li key={p.after} data-reveal style={d(i)}>
              <article className="ng26-ba__card">
                <CompareSlider before={p.before} after={p.after} label={p.caption || p.location || 'NGMS project'} />
                <div className="ng26-ba__meta">
                  <p>{p.caption || 'Completed maintenance work'}</p>
                  {p.location && <small>{p.location}</small>}
                </div>
              </article>
            </li>
          ))}
        </ul>
        <p className="ng26-ba__more">
          <Link href="/portfolio" className="ng26-btn ng26-btn--orange">
            VIEW MORE PROJECTS <span aria-hidden="true">↗</span>
          </Link>
        </p>
      </div>
    </section>
  )
}

export async function GoogleReviews() {
  const { getGoogleReviews } = await import('@/lib/google-reviews')
  const data = await getGoogleReviews()
  const stars = (n?: number) => '★★★★★'.slice(0, Math.max(1, Math.min(5, Math.round(n ?? 5))))

  return (
    <section id="reviews" className="ng26-sec ng26-sec--grey" aria-labelledby="ng26-reviews-title">
      <div className="ng26-wrap">
        <div className="ng26-head ng26-head--row" data-reveal>
          <div>
            <p className="ng26-eyebrow">Google reviews</p>
            <h2 id="ng26-reviews-title" className="ng26-h-lg">
              REAL FEEDBACK
              <br />
              <span className="is-o">FROM NEXTGEN CUSTOMERS.</span>
            </h2>
            <p className="ng26-head__sub">
              Live reviews from our Google Business Profile, with a direct option for customers to leave their own review.
            </p>
          </div>
          <div className="ng26-head__btns">
            <a href={data.writeAReviewUri} target="_blank" rel="noopener noreferrer" className="ng26-btn ng26-btn--orange">
              ★ LEAVE A GOOGLE REVIEW
            </a>
            <a href={data.reviewsUri} target="_blank" rel="noopener noreferrer" className="ng26-btn ng26-btn--outline">
              READ ALL GOOGLE REVIEWS
            </a>
          </div>
        </div>

        <div className="ng26-rev">
          <div className="ng26-rev__score" data-reveal>
            <p className="ng26-rev__k">Google rating</p>
            {data.rating ? (
              <>
                <p className="ng26-rev__big">{data.rating.toFixed(1)}</p>
                <p className="ng26-rev__stars" aria-hidden="true">
                  ★★★★★
                </p>
                <p className="ng26-rev__n">{data.userRatingCount ? `${data.userRatingCount} reviews` : 'Latest rating'}</p>
              </>
            ) : (
              <>
                <p className="ng26-rev__t">See what customers say on Google</p>
                <a href={data.reviewsUri} target="_blank" rel="noopener noreferrer" className="ng26-rev__a">
                  Open our Google reviews →
                </a>
              </>
            )}
            <p className="ng26-rev__fine">Powered by Google. Reviews remain on Google.</p>
          </div>

          <div className="ng26-rev__list">
            {data.reviews.length > 0 ? (
              data.reviews.slice(0, 4).map((r, i) => (
                <article key={r.googleMapsUri ?? `google-review-${i}`} className="ng26-rev__card" data-reveal style={d(i)}>
                  <div className="ng26-rev__row">
                    <p className="ng26-rev__who">{r.authorName ?? 'Google customer'}</p>
                    <span className="ng26-rev__stars" aria-label={`${r.rating ?? 5} out of 5 stars`}>
                      {stars(r.rating)}
                    </span>
                  </div>
                  {r.relativePublishTimeDescription && <p className="ng26-rev__when">{r.relativePublishTimeDescription}</p>}
                  {r.text && <p className="ng26-rev__text">{r.text}</p>}
                  {r.googleMapsUri && (
                    <a href={r.googleMapsUri} target="_blank" rel="noopener noreferrer" className="ng26-rev__a">
                      View review →
                    </a>
                  )}
                </article>
              ))
            ) : (
              <div className="ng26-rev__card ng26-rev__card--wide" data-reveal>
                <p className="ng26-rev__who">See our latest Google reviews</p>
                <p className="ng26-rev__text">Open our Google profile to see the newest customer feedback.</p>
                <a href={data.reviewsUri} target="_blank" rel="noopener noreferrer" className="ng26-rev__a">
                  Open Google reviews →
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
