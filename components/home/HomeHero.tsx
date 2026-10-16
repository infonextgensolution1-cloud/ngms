'use client'

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { SITE, whatsappLink } from '@/lib/site'

export type LandingSlide = { image_url: string; alt_text: string; caption: string | null }

const MAX_SLIDES = 12

export default function HomeHero({ slides, days = 'Mon–Sat', open = '07:00', close = '17:00' }: { slides: LandingSlide[]; days?: string; open?: string; close?: string }) {
  const photos = slides.filter((slide) => Boolean(slide.image_url)).slice(0, MAX_SLIDES)
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)
  const next = useCallback(() => setIndex((current) => photos.length ? (current + 1) % photos.length : 0), [photos.length])

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReducedMotion(query.matches)
    update()
    query.addEventListener?.('change', update)
    return () => query.removeEventListener?.('change', update)
  }, [])

  useEffect(() => {
    if (photos.length < 2 || paused || reducedMotion) return
    const timer = window.setInterval(next, 6500)
    return () => window.clearInterval(timer)
  }, [photos.length, paused, reducedMotion, next])

  const photo = photos[index]

  return (
    <section className="ngms-new-hero" aria-labelledby="ngms-home-title">
      <div className="ngms-new-hero__photo" aria-hidden="true">
        {photo ? <Image
          key={photo.image_url}
          src={photo.image_url}
          alt=""
          fill
          priority
          sizes="100vw"
          quality={82}
          unoptimized={photo.image_url.includes('.supabase.co/storage/')}
          className="ngms-new-hero__image"
        /> : <div className="ngms-new-hero__empty" />}
        <div className="ngms-new-hero__shade" />
      </div>

      <div className="max-w-6xl mx-auto px-4 pt-14 pb-10 sm:pt-20 lg:pt-28 lg:pb-14 min-h-[640px] lg:min-h-[720px] flex flex-col">
        <div className="max-w-2xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 backdrop-blur px-3 py-1.5 text-xs font-medium text-paper/90">
            <span className="h-1.5 w-1.5 rounded-full bg-orange" aria-hidden />
            Property maintenance · Helderberg Basin
          </p>
          <h1
            id="hero-title"
            className="font-heading font-bold text-[2.6rem] leading-[0.98] sm:text-6xl lg:text-7xl tracking-[-0.03em] mt-5"
          >
            One call.
            <span className="block text-orange">All solutions.</span>
          </h1>
          <p className="mt-6 text-base sm:text-lg text-paper/85 max-w-xl leading-relaxed">
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
            <a href={`tel:${SITE.phone}`} className="text-sm text-paper/80 hover:text-orange px-2 py-3">
              or call <span className="font-semibold text-paper">{SITE.phoneDisplay}</span>
            </a>
          </div>
        </div>

        <div className="mt-auto pt-12 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <ul className="grid grid-cols-3 gap-px rounded-panel overflow-hidden border border-white/10 bg-white/10 max-w-xl">
            {PROOF.map(([a, b]) => (
              <li key={a} className="bg-jet/70 backdrop-blur px-3 py-3 sm:px-4">
                <p className="font-heading font-semibold text-sm sm:text-base text-paper">{a}</p>
                <p className="text-[11px] sm:text-xs text-mist mt-0.5">{b}</p>
              </li>
            ))}
          </ul>

          {count > 0 && (
            <div
              role="group"
              aria-roledescription="carousel"
              aria-label="Recent NextGen jobs"
              className="flex items-center gap-3 rounded-panel border border-white/10 bg-jet/70 backdrop-blur p-2 pl-4 max-w-md"
            >
              <p className="flex-1 min-w-0 text-sm" aria-live={playing ? 'off' : 'polite'}>
                <span className="block text-[11px] uppercase tracking-[0.18em] text-mist">
                  Recent work {count > 1 && `· ${index + 1}/${count}`}
                </span>
                <span className="block truncate text-paper">{slide.caption || slide.alt_text || 'Completed NextGen job'}</span>
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
      <div className="ngms-new-hero__content">
        <p className="ngms-new-eyebrow"><span /> Property maintenance · Helderberg Basin</p>
        <h1 id="ngms-home-title">ONE CALL.<br /><span>ALL SOLUTIONS.</span></h1>
        <p className="ngms-new-hero__intro">Solar panel cleaning and trusted property maintenance trades, coordinated by one local team.</p>
        <p className="ngms-new-hero__areas">STRAND · GORDON’S BAY · SOMERSET WEST · OVERBERG</p>
        <div className="ngms-new-hero__actions">
          <Link href="/quote" className="ngms-new-button ngms-new-button--orange">GET A QUOTE <span aria-hidden="true">↗</span></Link>
          <a href={whatsappLink("Hi NextGen, I'd like a quote please.")} target="_blank" rel="noopener noreferrer" className="ngms-new-button ngms-new-button--outline">WHATSAPP US</a>
          <a href={'tel:' + SITE.phone} className="ngms-new-hero__phone">{SITE.phoneDisplay}</a>
        </div>
        <ul className="ngms-new-hero__proof" aria-label="Service commitments">
          <li><strong>01</strong><span>Local team</span></li>
          <li><strong>02</strong><span>Written quotes</span></li>
          <li><strong>03</strong><span>Quality workmanship</span></li>
          <li><strong>04</strong><span>{days} · {open}–{close}</span></li>
        </ul>
      </div>
      {photos.length > 1 && <div className="ngms-new-hero__photo-controls">
        <span>{String(index + 1).padStart(2, '0')} / {String(photos.length).padStart(2, '0')}{photo?.caption ? ' · ' + photo.caption : ''}</span>
        <button type="button" onClick={() => setPaused((value) => !value)} aria-label={paused ? 'Resume photo slideshow' : 'Pause photo slideshow'}>{paused ? 'PLAY' : 'PAUSE'}</button>
        <button type="button" onClick={() => setIndex((value) => (value + photos.length - 1) % photos.length)} aria-label="Previous photo">←</button>
        <button type="button" onClick={() => setIndex((value) => (value + 1) % photos.length)} aria-label="Next photo">→</button>
      </div>}
    </section>
  )
}
