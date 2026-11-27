'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import { SITE, whatsappLink } from '@/lib/site'
import type { LandingSlide } from '@/components/home/HomeHero'
import { needsUnoptimized } from './shared'

// Homepage hero (2026 look): huge condensed headline, orange phone button, and a
// framed photo slider driven by Admin → Media hero slides. Same props and slide
// data as the previous hero, so nothing changes on the admin side.

const MAX_SLIDES = 12
const INTERVAL = 6500

const PROOF: [string, string][] = [
  ['Local team', 'Helderberg Basin'],
  ['Written quotes', 'Clear scope and price'],
  ['Quality workmanship', 'One accountable contact'],
  ['Local knowledge', 'Strand to Somerset West'],
]

export default function Hero({
  slides,
  tradeCount,
  days = 'Mon–Sat',
  open = '07:00',
  close = '19:00',
}: {
  slides: LandingSlide[]
  tradeCount: number
  days?: string
  open?: string
  close?: string
}) {
  const list = slides.slice(0, MAX_SLIDES)
  const count = list.length
  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(true)
  const [paused, setPaused] = useState(false)
  const [reduced, setReduced] = useState(false)
  const touchX = useRef<number | null>(null)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const on = () => setReduced(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])

  const go = useCallback((n: number) => setIndex(((n % count) + count) % count), [count])

  useEffect(() => {
    if (count < 2 || !playing || paused || reduced) return
    const id = window.setTimeout(() => go(index + 1), INTERVAL)
    return () => window.clearTimeout(id)
  }, [index, count, playing, paused, reduced, go])

  const active = list[index]
  const running = playing && !paused && !reduced && count > 1
  const pad = (n: number) => String(n).padStart(2, '0')

  return (
    <section className="ng26-hero" aria-labelledby="ng26-hero-title">
      <div className="ng26-wrap ng26-hero__grid">
        <div className="ng26-hero__copy">
          <p className="ng26-eyebrow ng26-eyebrow--light">Helderberg Basin · Strand · Gordon’s Bay · Somerset West</p>
          <h1 id="ng26-hero-title" className="ng26-hero__title">
            <span>ONE CALL.</span>
            <span className="is-o">ALL SOLUTIONS.</span>
          </h1>
          <p className="ng26-hero__lead">
            One accountable team for solar panel cleaning, painting, waterproofing, paving, plumbing, electrical and more — serving
            homes, body corporates and businesses across the Helderberg Basin.
          </p>
          <div className="ng26-hero__cta">
            <Link href="/quote" className="ng26-btn ng26-btn--light">
              GET A FREE QUOTE <span aria-hidden="true">↗</span>
            </Link>
            <a href={`tel:${SITE.phone}`} className="ng26-btn ng26-btn--phone">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" />
              </svg>
              CALL {SITE.phoneDisplay}
            </a>
            <a
              href={whatsappLink("Hi NextGen, I'd like a quote please.")}
              target="_blank"
              rel="noopener noreferrer"
              className="ng26-btn ng26-btn--ghost"
            >
              WHATSAPP A PHOTO
            </a>
          </div>
          <ul className="ng26-hero__proof">
            {PROOF.map(([a, b]) => (
              <li key={a}>
                <strong>{a}</strong>
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="ng26-hero__stage">
          <div
            className="ng26-hero__frame"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocus={() => setPaused(true)}
            onBlur={() => setPaused(false)}
            onTouchStart={(e) => {
              setPaused(true)
              touchX.current = e.touches[0].clientX
            }}
            onTouchEnd={(e) => {
              const start = touchX.current
              touchX.current = null
              setPaused(false)
              if (start == null || count < 2) return
              const dx = e.changedTouches[0].clientX - start
              if (Math.abs(dx) > 48) go(index + (dx < 0 ? 1 : -1))
            }}
          >
            <div className="ng26-hero__media" role="group" aria-roledescription="carousel" aria-label="NGMS project photos">
              {count === 0 ? (
                <div className="ng26-ph">
                  <span className="ng26-ph__k">NextGen · Helderberg Basin</span>
                  <span className="ng26-ph__t">Real work. Clear results.</span>
                  <span className="ng26-ph__s">Project photography is being updated.</span>
                </div>
              ) : (
                list.map((s, i) => (
                  <div
                    key={`${s.image_url}-${i}`}
                    className={`ng26-slide${i === index ? ' is-active' : ''}`}
                    aria-hidden={i === index ? undefined : true}
                  >
                    <Image
                      src={s.image_url}
                      alt={s.alt_text}
                      fill
                      priority={i === 0}
                      sizes="(max-width: 900px) 100vw, 42vw"
                      quality={78}
                      unoptimized={needsUnoptimized(s.image_url)}
                    />
                  </div>
                ))
              )}
              <div className="ng26-hero__shade" aria-hidden="true" />
              {count > 0 && (
                <p className="ng26-hero__count" aria-live="polite">
                  <b>{pad(index + 1)}</b> / {pad(count)}
                </p>
              )}
              {active?.caption && <p className="ng26-hero__caption">{active.caption}</p>}
              {count > 1 && (
                <div className="ng26-hero__ctrl">
                  <button type="button" onClick={() => go(index - 1)} aria-label="Previous photo">
                    ←
                  </button>
                  <button type="button" onClick={() => go(index + 1)} aria-label="Next photo">
                    →
                  </button>
                  <button
                    type="button"
                    onClick={() => setPlaying((p) => !p)}
                    aria-label={playing ? 'Pause slideshow' : 'Play slideshow'}
                    aria-pressed={!playing}
                    className="ng26-hero__pp"
                  >
                    {playing ? 'PAUSE' : 'PLAY'}
                  </button>
                </div>
              )}
            </div>
            {count > 1 && (
              <div className="ng26-hero__bars" data-running={running} role="group" aria-label="Choose photo">
                {list.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => go(i)}
                    aria-label={`Show photo ${i + 1} of ${count}`}
                    aria-current={i === index ? 'true' : undefined}
                    className={i === index ? 'is-on' : ''}
                  >
                    <span style={{ animationDuration: `${INTERVAL}ms` }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="ng26-hero__badge" aria-hidden="true">
            <strong data-count={tradeCount}>{tradeCount}</strong>
            <span>Trades</span>
          </div>
          <p className="ng26-hero__hours">
            <i aria-hidden="true" /> {days} · {open}–{close}
          </p>
        </div>
      </div>
    </section>
  )
}
