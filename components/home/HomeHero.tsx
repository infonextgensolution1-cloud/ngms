'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { SITE, whatsappLink } from '@/lib/site'

export type LandingSlide = { image_url: string; alt_text: string; caption: string | null }

const MAX_SLIDES = 12
const INTERVAL_MS = 6000

export default function HomeHero({ slides, days = 'Mon–Sat', open = '07:00', close = '17:00' }: { slides: LandingSlide[]; days?: string; open?: string; close?: string }) {
  const usable = slides.filter((s) => s.image_url).slice(0, MAX_SLIDES)
  const count = usable.length
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const [hold, setHold] = useState(false)
  const [reduce, setReduce] = useState(false)
  const touchX = useRef<number | null>(null)

  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    if (!mq) return
    setReduce(mq.matches)
    const on = (e: MediaQueryListEvent) => setReduce(e.matches)
    mq.addEventListener?.('change', on)
    return () => mq.removeEventListener?.('change', on)
  }, [])

  const go = useCallback((n: number) => {
    if (count) setIndex(((n % count) + count) % count)
  }, [count])
  const playing = count > 1 && !paused && !hold && !reduce

  useEffect(() => {
    if (!playing) return
    const timer = setTimeout(() => go(index + 1), INTERVAL_MS)
    return () => clearTimeout(timer)
  }, [index, playing, go])

  const near = (i: number) => {
    const d = Math.abs(i - index)
    return d <= 1 || d === count - 1
  }
  const slide = usable[index]

  return (
    <section
      aria-labelledby="hero-title"
      className="ngms-industrial-hero relative isolate overflow-hidden"
      onMouseEnter={() => setHold(true)}
      onMouseLeave={() => setHold(false)}
      onFocusCapture={() => setHold(true)}
      onBlurCapture={() => setHold(false)}
      onTouchStart={(e) => { touchX.current = e.touches[0].clientX; setHold(true) }}
      onTouchEnd={(e) => {
        const start = touchX.current
        touchX.current = null
        setHold(false)
        if (start === null || count < 2) return
        const dx = e.changedTouches[0].clientX - start
        if (Math.abs(dx) > 50) go(index + (dx < 0 ? 1 : -1))
      }}
    >
      <div className="ngms-industrial-hero__media" aria-hidden="true">
        {count > 0 ? usable.map((s, i) => near(i) ? (
          <Image
            key={s.image_url}
            src={s.image_url}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 64vw"
            quality={78}
            priority={i === 0}
            unoptimized={s.image_url.includes('.supabase.co/storage/')}
            className={'ngms-industrial-hero__image ' + (i === index ? 'is-active' : '')}
          />
        ) : null) : <div className="ngms-industrial-hero__fallback" />}
        <div className="ngms-industrial-hero__wash" />
        <div className="ngms-industrial-hero__grid" />
        <div className="ngms-industrial-hero__crosshair ngms-industrial-hero__crosshair--one" />
        <div className="ngms-industrial-hero__crosshair ngms-industrial-hero__crosshair--two" />
      </div>

      <div className="ngms-industrial-hero__architecture" aria-hidden="true">
        <div className="ngms-architecture__floor ngms-architecture__floor--top">
          <span className="ngms-architecture__window" />
          <span className="ngms-architecture__desk" />
          <span className="ngms-architecture__screen" />
          <span className="ngms-architecture__label">SHARED SYSTEMS / 01</span>
        </div>
        <div className="ngms-architecture__floor ngms-architecture__floor--middle">
          <span className="ngms-architecture__window" />
          <span className="ngms-architecture__sofa" />
          <span className="ngms-architecture__plant" />
        </div>
        <div className="ngms-architecture__floor ngms-architecture__floor--feature">
          <span className="ngms-architecture__feature-glow" />
          <span className="ngms-architecture__feature-label">ONE CALL.<br />ALL SOLUTIONS.</span>
          <span className="ngms-architecture__feature-index">NGMS / 2026</span>
        </div>
        <div className="ngms-architecture__base"><span>BUILT FOR EVERYDAY PERFORMANCE</span><b>↗</b></div>
        <div className="ngms-architecture__editorial-card">
          <span className="ngms-editorial-card__index">NGMS / FIELD NOTES 001</span>
          <strong>PROPERTY<br />CARE.<br /><em>REDEFINED.</em></strong>
          <span className="ngms-editorial-card__foot">STRAND · SOMERSET WEST · GORDON’S BAY</span>
        </div>
      </div>

      <div className="ngms-industrial-hero__inner">
        <div className="ngms-industrial-hero__eyebrow">
          <span className="ngms-industrial-hero__eyebrow-rule" />
          <span>Property maintenance / Helderberg Basin</span>
          <span className="ngms-industrial-hero__index">/ 01</span>
        </div>

        <div className="ngms-industrial-hero__copy">
          <p className="ngms-industrial-hero__overline">HELDERVBERG PROPERTY CARE / 2026</p>
          <h1 id="hero-title">ABOVE THE<br />EVERYDAY.<span>BUILT TO LAST.</span></h1>
          <p className="ngms-industrial-hero__intro">
            Specialist solar panel cleaning and practical property maintenance, coordinated by one local team. Clear quotes. Careful work. One point of contact.
          </p>
          <p className="ngms-industrial-hero__location">STRAND · GORDON’S BAY · SOMERSET WEST</p>

          <div className="ngms-industrial-hero__actions">
            <Link href="/quote" className="ngms-industrial-button ngms-industrial-button--orange">START YOUR PROJECT <span aria-hidden="true">↗</span></Link>
            <a href={whatsappLink("Hi NextGen, I'd like a quote please.")} target="_blank" rel="noopener noreferrer" className="ngms-industrial-button ngms-industrial-button--outline">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 11.5a8.4 8.4 0 0 1-12.4 7.4L3 20l1.2-4.8A8.5 8.5 0 1 1 20.5 11.5Z"/><path d="M8.5 8.1c.3-.6.6-.6 1-.6h.4c.2 0 .4.1.5.4l.7 1.6c.1.2.1.4-.1.6l-.5.6c-.2.2-.2.4 0 .6.4.7 1.1 1.4 1.9 1.8.2.1.4.1.6-.1l.7-.8c.2-.2.4-.2.6-.1l1.6.8c.3.1.4.3.4.5 0 .4-.2 1.1-.7 1.5-.5.5-1.2.7-2 .5-1.1-.2-2.4-.9-3.6-2-1.1-1-2-2.3-2.2-3.4-.2-.8 0-1.5.7-2.1Z"/></svg>
              WhatsApp us
            </a>
            <a href={'tel:' + SITE.phone} className="ngms-industrial-hero__phone">{SITE.phoneDisplay}</a>
          </div>
        </div>

        <div className="ngms-industrial-hero__bottom">
          <ul className="ngms-industrial-hero__proof">
            <li><span className="ngms-industrial-hero__proof-icon">⌖</span><span>Local<br />expertise</span></li>
            <li><span className="ngms-industrial-hero__proof-icon">◇</span><span>Professional<br />workmanship</span></li>
            <li><span className="ngms-industrial-hero__proof-icon">✓</span><span>Written<br />quotes</span></li>
            <li><span className="ngms-industrial-hero__proof-icon">◷</span><span>{days}<br />{open}–{close}</span></li>
          </ul>

          {count > 0 && (
            <div className="ngms-industrial-hero__carousel" role="group" aria-roledescription="carousel" aria-label="Recent NextGen jobs">
              <div className="ngms-industrial-hero__caption">
                <span>Recent work {count > 1 ? '· ' + (index + 1) + '/' + count : ''}</span>
                <strong>{slide.caption || slide.alt_text || 'Completed NextGen job'}</strong>
              </div>
              {count > 1 && <div className="ngms-industrial-hero__controls">
                <HeroButton label="Previous photo" onClick={() => go(index - 1)}><path d="m15 18-6-6 6-6" /></HeroButton>
                <HeroButton label={paused ? 'Play slideshow' : 'Pause slideshow'} onClick={() => setPaused((p) => !p)}>
                  {paused || reduce ? <path d="M8 5v14l11-7z" fill="currentColor" /> : <path d="M9 5v14M15 5v14" />}
                </HeroButton>
                <HeroButton label="Next photo" onClick={() => go(index + 1)}><path d="m9 18 6-6-6-6" /></HeroButton>
              </div>}
            </div>
          )}
        </div>
      </div>

      <div className="ngms-industrial-hero__side-note" aria-hidden="true"><span>Property care</span><span>Built around you</span><i /></div>
    </section>
  )
}

function HeroButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" onClick={onClick} aria-label={label} className="ngms-industrial-hero__control">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
  </button>
}
