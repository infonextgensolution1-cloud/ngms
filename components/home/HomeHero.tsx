'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { SITE, whatsappLink } from '@/lib/site'

// Homepage hero. The background photos are the landing slides managed in
// Admin → Media → Landing slides (up to 12); the brand message on top is fixed,
// so the page always says who NGMS is, what it does and where, whatever photo shows.
//
// Accessibility: auto-advance stops for reduced-motion users, there is a visible
// pause button (WCAG 2.2.2), and hover/focus inside the hero pauses it too.
// Only the current slide and its neighbours are mounted.

export type LandingSlide = { image_url: string; alt_text: string; caption: string | null }

const MAX_SLIDES = 12
const INTERVAL_MS = 6000

export default function HomeHero({ slides, days = 'Mon–Sat', open = '07:00', close = '19:00' }: { slides: LandingSlide[]; days?: string; open?: string; close?: string }) {
  const PROOF = [
    ['12 trades', 'one accountable team'],
    ['Free site assessment', 'written quote before work'],
    ['Helderberg Basin', 'no callout fee'],
  ]
  const usable = slides.filter((s) => s.image_url).slice(0, MAX_SLIDES)
  const count = usable.length
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false) // user pressed pause
  const [hold, setHold] = useState(false) // hover / focus / touch
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

  const go = useCallback((n: number) => setIndex(((n % count) + count) % count), [count])
  const playing = count > 1 && !paused && !hold && !reduce

  useEffect(() => {
    if (!playing) return
    const t = setTimeout(() => go(index + 1), INTERVAL_MS)
    return () => clearTimeout(t)
  }, [index, playing, go])

  const near = (i: number) => {
    const d = Math.abs(i - index)
    return d <= 1 || d === count - 1
  }
  const slide = usable[index]

  return (
    <section
      aria-labelledby="hero-title"
      className="ngms-editorial-hero relative isolate overflow-hidden bg-fog text-graphite"
      onMouseEnter={() => setHold(true)}
      onMouseLeave={() => setHold(false)}
      onFocusCapture={() => setHold(true)}
      onBlurCapture={() => setHold(false)}
      onTouchStart={(e) => {
        touchX.current = e.touches[0].clientX
        setHold(true)
      }}
      onTouchEnd={(e) => {
        const start = touchX.current
        touchX.current = null
        setHold(false)
        if (start === null || count < 2) return
        const dx = e.changedTouches[0].clientX - start
        if (Math.abs(dx) > 50) go(index + (dx < 0 ? 1 : -1))
      }}
    >
      {/* Background media */}
      <div className="absolute inset-0 -z-10" aria-hidden>
        {count > 0 ? (
          usable.map((s, i) =>
            near(i) ? (
              <Image
                key={s.image_url}
                src={s.image_url}
                alt=""
                fill
                sizes="100vw"
                quality={70}
                priority={i === 0}
                unoptimized={s.image_url.includes(".supabase.co/storage/")}
                className={`object-cover transition-[opacity,transform] duration-[1200ms] ease-out ${
                  i === index ? 'opacity-100 scale-100' : 'opacity-0 scale-[1.03]'
                }`}
              />
            ) : null,
          )
        ) : (
          <div className="absolute inset-0 bg-graphite" />
        )}
        {/* Legibility scrims: strong on the left (text side) and bottom, light on the right */}
        <div className="absolute inset-0 bg-gradient-to-r from-fog via-fog/95 to-fog/35" />
        <div className="absolute inset-0 bg-gradient-to-t from-fog/95 via-fog/10 to-fog/25" />
        {/* Fine engineering grid, very low contrast */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(30,35,40,.28) 1px, transparent 1px), linear-gradient(90deg, rgba(30,35,40,.28) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
            maskImage: 'linear-gradient(to right, black, transparent 70%)',
            WebkitMaskImage: 'linear-gradient(to right, black, transparent 70%)',
          }}
        />
      </div>

      <div className="max-w-6xl mx-auto px-4 pt-14 pb-10 sm:pt-20 lg:pt-28 lg:pb-14 min-h-[640px] lg:min-h-[720px] flex flex-col">
        <div className="max-w-2xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-concrete bg-paper/85 backdrop-blur px-3 py-1.5 text-xs font-semibold text-graphite shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-orange" aria-hidden />
            Property maintenance · Helderberg Basin
          </p>
          <h1
            id="hero-title"
            className="font-heading font-bold text-[2.6rem] leading-[0.98] sm:text-6xl lg:text-7xl tracking-[-0.03em] mt-5 text-graphite"
          >
            One call.
            <span className="block text-ember-deep">All solutions.</span>
          </h1>
          <p className="mt-6 text-base sm:text-lg text-graphite/90 max-w-xl leading-relaxed">
            One accountable team for solar, painting, waterproofing, paving, plumbing, electrical and seven more trades —
            serving homes, body corporates and security complexes across the Helderberg Basin.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/quote" className="btn-quote !text-[0.95rem] !px-7 !py-3.5">
              Get a free quote
            </Link>
            <a
              href={whatsappLink("Hi NextGen, I'd like a quote please.")}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-wa !text-[0.95rem] !px-7 !py-3.5"
            >
              WhatsApp a photo
            </a>
            <a href={`tel:${SITE.phone}`} className="text-sm text-graphite/80 hover:text-ember-deep px-2 py-3">
              or call <span className="font-semibold text-graphite">{SITE.phoneDisplay}</span>
            </a>
          </div>
        </div>

        <div className="mt-auto pt-12 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <ul className="ngms-proof-grid grid grid-cols-3 gap-px rounded-panel overflow-hidden border border-concrete bg-concrete max-w-xl shadow-[0_12px_36px_rgba(18,22,26,.08)]">
            {PROOF.map(([a, b]) => (
              <li key={a} className="bg-paper/95 backdrop-blur px-3 py-3 sm:px-4">
                <p className="font-heading font-semibold text-sm sm:text-base text-graphite">{a}</p>
                <p className="text-[11px] sm:text-xs text-slate mt-0.5">{b}</p>
              </li>
            ))}
          </ul>

          {count > 0 && (
            <div
              role="group"
              aria-roledescription="carousel"
              aria-label="Recent NextGen jobs"
              className="ngms-hero-caption flex items-center gap-3 rounded-panel border border-concrete bg-paper/95 backdrop-blur p-2 pl-4 max-w-md shadow-[0_12px_36px_rgba(18,22,26,.08)]"
            >
              <p className="flex-1 min-w-0 text-sm" aria-live={playing ? 'off' : 'polite'}>
                <span className="block text-[11px] uppercase tracking-[0.18em] text-slate">
                  Recent work {count > 1 && `· ${index + 1}/${count}`}
                </span>
                <span className="block truncate text-graphite">{slide.caption || slide.alt_text || 'Completed NextGen job'}</span>
              </p>
              {count > 1 && (
                <div className="flex items-center gap-1 shrink-0">
                  <HeroButton label="Previous photo" onClick={() => go(index - 1)}>
                    <path d="M15 18l-6-6 6-6" />
                  </HeroButton>
                  <HeroButton label={paused ? 'Play slideshow' : 'Pause slideshow'} onClick={() => setPaused((p) => !p)}>
                    {paused || reduce ? <path d="M8 5v14l11-7z" fill="currentColor" /> : <path d="M9 5v14M15 5v14" />}
                  </HeroButton>
                  <HeroButton label="Next photo" onClick={() => go(index + 1)}>
                    <path d="M9 18l6-6-6-6" />
                  </HeroButton>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

function HeroButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="grid h-11 w-11 place-items-center rounded-btn text-paper hover:bg-white/10 transition-colors"
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        {children}
      </svg>
    </button>
  )
}
