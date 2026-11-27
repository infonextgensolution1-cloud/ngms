import Link from 'next/link'
import type { ReactNode } from 'react'
import { SITE, whatsappLink } from '@/lib/site'
import { FAQS } from '@/lib/faqs'
import { getWeather, tradeConditions, type Weather, type WxKind } from '@/lib/helderberg'
import { Arrow, PhotoFill, d, type Photo } from './shared'

// Why NextGen, how it works, body corporates, weather, areas + FAQ, final CTA.

/* ---------- WHY NGMS ---------- */

const REASONS = [
  {
    title: 'One team, twelve trades',
    body: 'Solar, painting, waterproofing, plumbing, electrical and more, coordinated by one Helderberg crew.',
  },
  {
    title: 'Written, fixed quotes',
    body: 'A written quote before we start. What we quote is what you pay — no surprise line items.',
  },
  {
    title: 'Owner on site',
    body: 'The business is run hands-on by the owner, so the person who quotes is the person accountable for the work.',
  },
  {
    title: 'Planned around Cape weather',
    body: 'Painting, waterproofing and paving are scheduled around winter rain so coatings and joints cure properly.',
  },
  {
    title: 'Photos when it’s done',
    body: 'Before-and-after photos on completion, so you can see the work even if you weren’t home.',
  },
  {
    title: 'Fast WhatsApp replies',
    body: 'Send a photo and we come back with a price — most quote requests are answered the same day.',
  },
]

export function WhyNgms({ photo }: { photo?: Photo }) {
  return (
    <section className="ng26-sec ng26-sec--ink" aria-labelledby="ng26-why-title">
      <div className="ng26-wrap ng26-why">
        <figure className="ng26-why__photo ng26-frame" data-reveal>
          <div className="ng26-frame__in">
            <PhotoFill photo={photo} sizes="(max-width: 980px) 100vw, 38vw" />
            <figcaption>{photo?.caption ?? 'Helderberg Basin'}</figcaption>
          </div>
        </figure>
        <div className="ng26-why__copy">
          <div data-reveal>
            <p className="ng26-eyebrow ng26-eyebrow--light">Why NextGen</p>
            <h2 id="ng26-why-title" className="ng26-h-lg">
              MAINTENANCE YOU
              <br />
              <span className="is-o">DON’T HAVE TO CHASE.</span>
            </h2>
          </div>
          <ul className="ng26-why__list">
            {REASONS.map((r, i) => (
              <li key={r.title} data-reveal style={d(i % 2)}>
                <p className="ng26-why__n">{String(i + 1).padStart(2, '0')}</p>
                <h3>{r.title}</h3>
                <p>{r.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}

/* ---------- HOW IT WORKS ---------- */

const STEPS: { n: string; title: string; body: string; icon: ReactNode }[] = [
  {
    n: '01',
    title: 'Send the job',
    body: 'WhatsApp a photo or call us — tell us what needs doing and where.',
    icon: (
      <>
        <path d="M4 8h3l2-3h6l2 3h3v11H4V8Z" />
        <circle cx="12" cy="13" r="3.5" />
      </>
    ),
  },
  {
    n: '02',
    title: 'Get a straight quote',
    body: 'Fixed, itemised price — often the same day. No site visit needed for most jobs.',
    icon: (
      <>
        <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z" />
        <path d="M9 8h6M9 12h6" />
      </>
    ),
  },
  {
    n: '03',
    title: 'We get it done',
    body: 'One scheduled crew, right tools for the trade, worked around Cape weather when it matters.',
    icon: <path d="M14.5 6.5a4 4 0 0 0-5 5L4 17l3 3 5.5-5.5a4 4 0 0 0 5-5L15 12l-3-3 2.5-2.5Z" />,
  },
  {
    n: '04',
    title: 'Walkthrough & follow-up',
    body: 'We check the work with you. Ask about a maintenance plan for priority booking and a discount.',
    icon: (
      <>
        <path d="M5 4h14v17H5V4Z" />
        <path d="m8.5 12 2.5 2.5 4.5-5" />
      </>
    ),
  },
]

export function HowItWorks() {
  // 70% deposit / 30% on completion (see FAQ: "How do I pay?")
  const C = 2 * Math.PI * 54
  return (
    <section className="ng26-sec ng26-sec--grey" aria-labelledby="ng26-process-title">
      <div className="ng26-wrap">
        <div className="ng26-process__top">
          <div className="ng26-head" data-reveal>
            <p className="ng26-eyebrow">How it works</p>
            <h2 id="ng26-process-title" className="ng26-h-lg">
              FROM PHOTO TO
              <br />
              <span className="is-o">FINISHED JOB IN FOUR STEPS</span>
            </h2>
          </div>
          <div className="ng26-gauge" data-reveal style={d(1)}>
            <svg viewBox="0 0 128 128" className="ng26-gauge__svg" role="img" aria-label="70 percent deposit, 30 percent on completion">
              <circle cx="64" cy="64" r="54" className="ng26-gauge__track" />
              <circle
                cx="64"
                cy="64"
                r="54"
                className="ng26-gauge__arc"
                style={{ strokeDasharray: C, ['--to' as string]: C * 0.3 } as React.CSSProperties}
                transform="rotate(-90 64 64)"
              />
            </svg>
            <p className="ng26-gauge__num">
              <strong data-count={70} data-suffix="%">
                70%
              </strong>
              <span>deposit</span>
            </p>
            <p className="ng26-gauge__txt">
              Confirms your booking and covers materials. The remaining 30% is due on completion. EFT or cash.
            </p>
          </div>
        </div>
        <ol className="ng26-steps">
          {STEPS.map((s, i) => (
            <li key={s.n} data-reveal style={d(i)}>
              <div className="ng26-steps__card">
                <span className="ng26-steps__n">{s.n}</span>
                <span className="ng26-steps__ic">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    {s.icon}
                  </svg>
                </span>
                <h3>{s.title}</h3>
                <p>{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

/* ---------- BODY CORPORATES ---------- */

const BC_POINTS: { title: string; body: string; icon: ReactNode }[] = [
  {
    title: 'Rooftop & communal solar',
    body: 'Scheduled soft-wash cleans for shared arrays, planned around residents and access rules.',
    icon: (
      <>
        <path d="M3 8h18l-2 9H5L3 8Z" />
        <path d="M9 8l-1 9M15 8l1 9M4 12.5h16" />
      </>
    ),
  },
  {
    title: 'One contractor, one invoice',
    body: 'Solar, high-pressure cleaning, painting, waterproofing and paving handled by one team, so there’s one point of contact for the trustees.',
    icon: (
      <>
        <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z" />
        <path d="M9 8h6M9 12h6" />
      </>
    ),
  },
  {
    title: 'Written scope before we start',
    body: 'Free site walk-through, then a written quote the trustees can table at the next meeting.',
    icon: (
      <>
        <path d="M5 4h14v17H5V4Z" />
        <path d="M9 9h6M9 13h6M9 17h3" />
      </>
    ),
  },
]

export function BodyCorporate({ photo }: { photo?: Photo }) {
  return (
    <section className="ng26-sec ng26-sec--dark" aria-labelledby="ng26-bc-title">
      <div className="ng26-wrap ng26-bc">
        <div className="ng26-bc__copy">
          <div data-reveal>
            <p className="ng26-eyebrow ng26-eyebrow--light">Body corporates &amp; security complexes</p>
            <h2 id="ng26-bc-title" className="ng26-h-lg">
              ONE CONTRACTOR
              <br />
              <span className="is-o">FOR THE WHOLE COMPLEX.</span>
            </h2>
            <ol className="ng26-bc__steps" aria-label="How a complex assessment works">
              {['Assess', 'Quote', 'Maintain'].map((s, i) => (
                <li key={s}>
                  <b>{String(i + 1).padStart(2, '0')}</b>
                  {s}
                </li>
              ))}
            </ol>
            <p className="ng26-bc__p">
              Quarterly and annual maintenance plans for complexes across Strand, Somerset West and Gordon&apos;s Bay. Recent complex
              work includes painting, paving and waterproofing at Cosmos Mews in Strand.
            </p>
          </div>
          <ul className="ng26-bc__points">
            {BC_POINTS.map((p, i) => (
              <li key={p.title} data-reveal style={d(i)}>
                <span className="ng26-bc__ic">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    {p.icon}
                  </svg>
                </span>
                <div>
                  <h3>{p.title}</h3>
                  <p>{p.body}</p>
                </div>
              </li>
            ))}
          </ul>
          <div className="ng26-bc__cta" data-reveal>
            <Link href="/quote" className="ng26-btn ng26-btn--orange">
              REQUEST A COMPLEX ASSESSMENT <span aria-hidden="true">↗</span>
            </Link>
            <Link href="/maintenance-packages" className="ng26-btn ng26-btn--ghost">
              VIEW BODY CORPORATE PLANS
            </Link>
          </div>
        </div>
        <figure className="ng26-bc__photo ng26-frame" data-reveal style={d(1)}>
          <div className="ng26-frame__in">
            <PhotoFill photo={photo} sizes="(max-width: 980px) 100vw, 46vw" />
            <figcaption>
              <b>Complex maintenance</b>
              {photo?.caption && photo.caption !== 'Complex maintenance' ? ` · ${photo.caption}` : ''}
            </figcaption>
          </div>
        </figure>
      </div>
    </section>
  )
}

/* ---------- HELDERBERG TODAY (weather) ---------- */

const ICONS: Record<WxKind, ReactNode> = {
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>
  ),
  moon: <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />,
  partly: (
    <>
      <circle cx="8" cy="8" r="3" />
      <path d="M8 2v1M2 8h1M3.8 3.8l.7.7M12.2 3.8l-.7.7" />
      <path d="M17.5 20H10a3.5 3.5 0 0 1-.4-6.98 5 5 0 0 1 9.6 1.1A3 3 0 0 1 17.5 20z" />
    </>
  ),
  cloud: <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />,
  fog: <path d="M3 8h18M5 12h14M3 16h18M7 20h10" />,
  rain: (
    <>
      <path d="M16 13v8M8 13v8M12 15v8" />
      <path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25" />
    </>
  ),
  storm: (
    <>
      <path d="M19 16.9A5 5 0 0 0 18 7h-1.26a8 8 0 1 0-11.62 9" />
      <path d="M13 11l-4 6h6l-4 6" />
    </>
  ),
}

function WxIcon({ kind, className }: { kind: WxKind; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {ICONS[kind]}
    </svg>
  )
}

function dayName(date: string): string {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString('en-ZA', { weekday: 'short', timeZone: 'UTC' })
}

function WeatherCard({ weather }: { weather: Weather }) {
  const { now, workDay, workDayIsToday, next } = weather
  const calls = tradeConditions(workDay, { raining: workDayIsToday && (now.kind === 'rain' || now.kind === 'storm') })

  return (
    <div className="ng26-wx__card">
      <p className="ng26-eyebrow ng26-eyebrow--light">Right now in the Helderberg</p>
      <div className="ng26-wx__now">
        <div>
          <p className="ng26-wx__temp">{now.temp}&deg;</p>
          <p className="ng26-wx__meta">
            {now.label} &middot; Wind {now.wind} km/h &middot; Humidity {now.humidity}%
          </p>
        </div>
        <WxIcon kind={now.kind} className="ng26-wx__icon" />
      </div>

      <ul className="ng26-wx__days">
        {next.map((day) => (
          <li key={day.date}>
            <p className="ng26-wx__dn">{dayName(day.date)}</p>
            <WxIcon kind={day.kind} className="ng26-wx__di" />
            <p className="ng26-wx__dt">
              {day.max}&deg; <span>/ {day.min}&deg;</span>
            </p>
            <p className="ng26-wx__dr">{day.rainMm >= 1 ? `Rain ${Math.round(day.rainMm)} mm` : 'Dry'}</p>
          </li>
        ))}
      </ul>

      <div className="ng26-wx__calls">
        <p className="ng26-wx__h">Outdoor work {workDayIsToday ? 'today' : 'tomorrow'}</p>
        <ul>
          {calls.map((c) => (
            <li key={c.trade}>
              <span className="ng26-wx__trade">{c.trade}</span>
              <span className="ng26-wx__note">{c.note}</span>
              <span className={`ng26-pill ${c.go ? 'is-go' : 'is-hold'}`}>{c.go ? 'Go' : 'Hold'}</span>
            </li>
          ))}
        </ul>
        <p className="ng26-wx__fine">A guide only. We confirm your booking with you and reschedule around rain and wind.</p>
      </div>

      <p className="ng26-wx__src">
        Forecast data:{' '}
        <a href="https://www.met.no/en" target="_blank" rel="noopener noreferrer">
          MET Norway
        </a>
      </p>
    </div>
  )
}

export function WeatherView({ weather }: { weather: Weather | null }) {
  if (!weather) return null
  return (
    <section className="ng26-sec ng26-sec--grey" aria-labelledby="ng26-weather-title">
      <div className="ng26-wrap">
        <div className="ng26-head ng26-head--center" data-reveal>
          <p className="ng26-eyebrow">Helderberg today</p>
          <h2 id="ng26-weather-title" className="ng26-h-lg">
            WEATHER &amp;
            <br />
            <span className="is-o">OUTDOOR WORK</span>
          </h2>
        </div>
        <div className="ng26-wx" data-reveal style={d(1)}>
          <WeatherCard weather={weather} />
        </div>
      </div>
    </section>
  )
}

export async function WeatherToday() {
  return <WeatherView weather={await getWeather()} />
}

/* ---------- SERVICE AREAS + FAQ ---------- */

const CORE_AREAS = ['Strand', "Gordon's Bay", 'Somerset West']
const EXTENDED_AREAS = ['Kleinmond', 'Grabouw & Elgin', 'Bot River', 'Stellenbosch', 'Paarl', 'Worcester', 'Cape Town']

export function AreasAndFaq() {
  const faqs = FAQS.slice(0, 6)
  return (
    <section className="ng26-sec ng26-sec--dark" aria-label="Service area and frequently asked questions">
      <div className="ng26-wrap ng26-af">
        <div className="ng26-af__areas" aria-labelledby="ng26-areas-title">
          <div data-reveal>
            <p className="ng26-eyebrow ng26-eyebrow--light">Service area</p>
            <h2 id="ng26-areas-title" className="ng26-h-md-lg">
              BASED IN THE
              <br />
              <span className="is-o">HELDERBERG BASIN.</span>
            </h2>
          </div>
          <div className="ng26-af__panel" data-reveal style={d(1)}>
            <p className="ng26-af__k">No callout fee</p>
            <ul className="ng26-chips ng26-chips--o">
              {CORE_AREAS.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
            <p className="ng26-af__k">R350 callout</p>
            <ul className="ng26-chips">
              {EXTENDED_AREAS.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          </div>
          <ul className="ng26-af__links" data-reveal style={d(2)}>
            {[
              ['/property-maintenance/strand', 'Property maintenance in Strand'],
              ['/property-maintenance/somerset-west', 'Property maintenance in Somerset West'],
              ['/property-maintenance/gordons-bay', "Property maintenance in Gordon's Bay"],
            ].map(([href, label]) => (
              <li key={href}>
                <Link href={href}>
                  {label} <Arrow />
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="ng26-af__faq" aria-labelledby="ng26-faq-title">
          <div data-reveal>
            <p className="ng26-eyebrow ng26-eyebrow--light">FAQ</p>
            <h2 id="ng26-faq-title" className="ng26-h-md-lg">
              GOOD
              <br />
              <span className="is-o">TO KNOW.</span>
            </h2>
          </div>
          <div className="ng26-acc">
            {faqs.map((f, i) => (
              <details key={f.q} data-reveal style={d(i)}>
                <summary>
                  <span>{f.q}</span>
                  <i aria-hidden="true">+</i>
                </summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
          <Link href="/faq" className="ng26-af__all">
            ALL QUESTIONS <Arrow />
          </Link>
        </div>
      </div>
    </section>
  )
}

/* ---------- FINAL CTA ---------- */

export function FinalCta({ photo }: { photo?: Photo }) {
  return (
    <section className="ng26-sec ng26-sec--ink ng26-sec--cta" aria-labelledby="ng26-cta-title">
      <div className="ng26-wrap">
        <div className="ng26-cta" data-reveal>
          <div className="ng26-cta__in">
            {photo?.src && (
              <div className="ng26-cta__bg" aria-hidden="true">
                <PhotoFill photo={{ src: photo.src, caption: '' }} sizes="100vw" />
              </div>
            )}
            <div className="ng26-cta__copy">
              <p className="ng26-eyebrow ng26-eyebrow--light">Get started</p>
              <h2 id="ng26-cta-title" className="ng26-h-xl">
                TELL US WHAT
                <br />
                NEEDS DOING.
                <br />
                <span className="is-o">WE’LL TAKE IT FROM THERE.</span>
              </h2>
              <p className="ng26-cta__p">Send a photo on WhatsApp or fill in the quote form. Most requests get a price the same day.</p>
              <div className="ng26-cta__btns">
                <Link href="/quote" className="ng26-btn ng26-btn--light">
                  REQUEST A QUOTE <span aria-hidden="true">↗</span>
                </Link>
                <a
                  href={whatsappLink("Hi NextGen, I'd like a quote please.")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ng26-btn ng26-btn--phone"
                >
                  WHATSAPP {SITE.phoneDisplay}
                </a>
              </div>
              <Link href="/body-corporate-maintenance" className="ng26-cta__bc">
                Body corporate? Book a site walk-through <Arrow />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
