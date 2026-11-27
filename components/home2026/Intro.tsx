import Link from 'next/link'
import { Arrow, d } from './shared'

// Sections directly under the hero: ticker, "who are we helping", the orange
// local-point-of-contact panel, and the four feature circles.

const TICKER = [
  'Local team',
  'Helderberg Basin',
  'Written quotes',
  'Clear scope and price',
  'Quality workmanship',
  'One accountable contact',
  'Local knowledge',
  'Strand to Somerset West',
]

export function Marquee() {
  const row = (hidden?: boolean) => (
    <ul className="ng26-marquee__row" aria-hidden={hidden ? true : undefined}>
      {TICKER.map((t) => (
        <li key={t}>
          {t}
          <i aria-hidden="true">▲</i>
        </li>
      ))}
    </ul>
  )
  return (
    <div className="ng26-marquee" role="region" aria-label="Why customers choose NextGen">
      <div className="ng26-marquee__track">
        {row()}
        {row(true)}
      </div>
    </div>
  )
}

const CLIENTS = [
  { n: '01', t: 'HOMEOWNERS', s: 'Keep your property in shape.', href: '/quote?type=homeowner', tone: 'light' },
  { n: '02', t: 'BODY CORPORATES', s: 'Planned upkeep for shared spaces.', href: '/body-corporate-maintenance', tone: 'dark' },
  { n: '03', t: 'BUSINESSES', s: 'One contact for ongoing maintenance.', href: '/quote?type=commercial', tone: 'orange' },
]

export function Audience() {
  return (
    <section className="ng26-sec ng26-sec--grey" aria-labelledby="ng26-clients-title">
      <div className="ng26-wrap">
        <div className="ng26-head" data-reveal>
          <p className="ng26-eyebrow">START HERE</p>
          <h2 id="ng26-clients-title" className="ng26-h-lg">
            WHO ARE WE
            <br />
            <span className="is-o">HELPING TODAY?</span>
          </h2>
        </div>
        <ul className="ng26-aud">
          {CLIENTS.map((c, i) => (
            <li key={c.href} data-reveal style={d(i)}>
              <Link href={c.href} className={`ng26-aud__card ng26-aud__card--${c.tone}`}>
                <span className="ng26-aud__n">{c.n}</span>
                <strong>{c.t}</strong>
                <small>{c.s}</small>
                <b aria-hidden="true">↗</b>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export function LocalContact({ tradeCount }: { tradeCount: number }) {
  const stats = [
    { n: tradeCount, label: 'Trades, one team' },
    { n: 3, label: 'Towns, no callout fee' },
    { n: 550, prefix: 'R', label: 'Solar clean from' },
    { n: 4, label: 'Steps to a finished job' },
  ]
  return (
    <section className="ng26-sec ng26-sec--ink ng26-sec--tight" aria-labelledby="ng26-intro-title">
      <div className="ng26-wrap">
        <div className="ng26-contact ng26-on-orange" data-reveal>
          <div className="ng26-contact__copy">
            <p className="ng26-eyebrow ng26-eyebrow--ink">ONE LOCAL POINT OF CONTACT</p>
            <h2 id="ng26-intro-title" className="ng26-h-lg">
              LESS CHASING.
              <br />
              <span className="is-w">MORE GETTING DONE.</span>
            </h2>
            <p className="ng26-contact__p">
              From solar panel cleaning to repairs, painting and exterior maintenance, NGMS helps homeowners, body corporates and
              businesses manage property work with one reliable team.
            </p>
            <Link href="/services" className="ng26-btn ng26-btn--dark">
              VIEW ALL SERVICES <span aria-hidden="true">↗</span>
            </Link>
          </div>
          <ul className="ng26-contact__stats">
            {stats.map((s) => (
              <li key={s.label} className="ng26-stat">
                <strong data-count={s.n} data-prefix={s.prefix}>
                  {s.prefix}
                  {s.n}
                </strong>
                <span>{s.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}

const FEATURES = [
  {
    href: '/services',
    t: 'BEST SERVICES',
    s: 'Practical maintenance solutions delivered by one accountable team.',
    icon: <path d="M29 8a11 11 0 0 0-13.8 13.8L7 30l11 11 8.2-8.2A11 11 0 0 0 40 19l-7 7-7-7 7-7a11 11 0 0 0-4-4Zm-18 22 7 7" />,
  },
  {
    href: '/portfolio',
    t: 'COMPLETE SOLUTIONS',
    s: 'Residential, commercial and shared-property maintenance in one place.',
    icon: <path d="M7 40V12h34v28H7ZM13 12V7h22v5M15 19h6m6 0h6M15 25h6m6 0h6M15 31h6m6 0h6M21 40V33h6v7" />,
  },
  {
    href: '/about',
    t: 'QUALITY WORKMANSHIP',
    s: 'Clear scopes, considered workmanship and visible project results.',
    icon: <path d="M24 5 39 11v11c0 10-6.4 16.5-15 21-8.6-4.5-15-11-15-21V11l15-6ZM16 24l5 5 11-12" />,
  },
  {
    href: '/contact',
    t: 'QUICK SUPPORT',
    s: 'Speak to our team and send through your maintenance requirements.',
    icon: <path d="M8 27v-4a16 16 0 0 1 32 0v4M8 24H6v9h8v-9H8Zm32 0h2v9h-8v-9h6ZM34 34c-2 5-6 7-12 7h-4" />,
  },
]

export function Features() {
  return (
    <section className="ng26-sec ng26-sec--grey ng26-sec--tight" aria-label="Why customers choose NextGen Maintenance Solutions">
      <div className="ng26-wrap">
        <ul className="ng26-feat">
          {FEATURES.map((f, i) => (
            <li key={f.t} data-reveal style={d(i)}>
              <Link href={f.href} className="ng26-feat__card">
                <span className="ng26-feat__circle">
                  <svg viewBox="0 0 48 48" aria-hidden="true">
                    {f.icon}
                  </svg>
                </span>
                <h3>{f.t}</h3>
                <p>{f.s}</p>
                <span className="ng26-feat__more">
                  MORE <Arrow />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
