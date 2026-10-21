'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { SITE, whatsappLink } from '@/lib/site'

export type LandingSlide = { image_url: string; alt_text: string; caption: string | null }

const MAX_SLIDES = 12
const PROOF: [string, string][] = [
  ['Local team', 'Helderberg Basin'],
  ['Written quotes', 'Clear scope and price'],
  ['Quality workmanship', 'One accountable contact'],
  ['Local knowledge', 'Strand to Somerset West'],
]

export default function HomeHero({ slides, days = 'Mon–Sat', open = '07:00', close = '19:00' }: { slides: LandingSlide[]; days?: string; open?: string; close?: string }) {
  const photos = slides.filter((slide) => Boolean(slide.image_url)).slice(0, MAX_SLIDES)
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)
  const touchX = useRef<number | null>(null)
  const count = photos.length
  const photo = photos[index]

  const go = useCallback((target: number) => {
    if (!count) return
    setIndex((target + count) % count)
  }, [count])

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReducedMotion(query.matches)
    update()
    query.addEventListener?.('change', update)
    return () => query.removeEventListener?.('change', update)
  }, [])

  useEffect(() => {
    if (count < 2 || paused || reducedMotion) return
    const timer = window.setInterval(() => setIndex((current) => (current + 1) % count), 6500)
    return () => window.clearInterval(timer)
  }, [count, paused, reducedMotion])

  return (
    <section
      aria-labelledby="hero-title"
      aria-roledescription="carousel"
      aria-label="NextGen services and project highlights"
      className="ngms-stein-hero"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onTouchStart={(event) => { touchX.current = event.touches[0].clientX; setPaused(true) }}
      onTouchEnd={(event) => {
        const start = touchX.current
        touchX.current = null
        setPaused(false)
        if (start === null || count < 2) return
        const delta = event.changedTouches[0].clientX - start
        if (Math.abs(delta) > 50) go(index + (delta < 0 ? 1 : -1))
      }}
    >
      <div className="ngms-stein-hero__grid-mark" aria-hidden="true">N</div>
      <div className="ngms-stein-hero__inner">
        <div className="ngms-stein-hero__copy">
          <p className="ngms-stein-hero__eyebrow"><span /> NGMS / HELDERBERG BASIN / WESTERN CAPE</p>
          <h1 id="hero-title"><span className="ngms-stein-hero__white">ONE CALL.</span><span className="ngms-stein-hero__orange">ALL SOLUTIONS.</span></h1>
          <p className="ngms-stein-hero__intro">
            One accountable team for solar panel cleaning, painting, waterproofing, paving, plumbing, electrical and more — serving homes, body corporates and businesses across the Helderberg Basin.
          </p>
          <div className="ngms-stein-hero__actions">
            <Link href="/quote" className="ngms-stein-hero__button ngms-stein-hero__button--orange">GET A FREE QUOTE <span aria-hidden="true">↗</span></Link>
            <a href={whatsappLink("Hi NextGen, I'd like a quote please.")} target="_blank" rel="noopener noreferrer" className="ngms-stein-hero__button ngms-stein-hero__button--outline"><span aria-hidden="true">◉</span> WHATSAPP A PHOTO</a>
          </div>
          <a href={`tel:${SITE.phone}`} className="ngms-stein-hero__phone">OR CALL {SITE.phoneDisplay}</a>
        </div>

        <div className="ngms-stein-hero__media" aria-label="Selected homepage hero slide image">
          {photo?.image_url ? (
            <Image
              key={photo.image_url}
              src={photo.image_url}
              alt={photo.alt_text || photo.caption || 'NGMS project photo'}
              fill
              sizes="(min-width: 1024px) 52vw, 100vw"
              quality={85}
              unoptimized={photo.image_url.includes('.supabase.co/storage/') || photo.image_url.includes('images.unsplash.com')}
              priority={index === 0}
              className="ngms-stein-hero__image"
            />
          ) : (
            <div className="ngms-stein-hero__empty">SELECT A PHOTO IN ADMIN → MEDIA → HERO SLIDES</div>
          )}
          <div className="ngms-stein-hero__media-top">
            <span>{String(index + 1).padStart(2, '0')} / {String(Math.max(count, 12)).padStart(2, '0')}</span>
            <span className="ngms-stein-hero__rule" />
            <span>NGMS / FIELD NOTES</span>
          </div>
          <div className="ngms-stein-hero__media-bottom">
            <span>{photo?.caption || photo?.alt_text || 'NEXTGEN MAINTENANCE SOLUTIONS'}</span>
            <span>HELD﻿ERBERG BASIN<br />WESTERN CAPE</span>
          </div>
          {count > 1 && <div className="ngms-stein-hero__arrows" aria-label="Hero carousel controls">
            <button type="button" onClick={() => go(index + 1)} aria-label="Next hero slide">→</button>
            <button type="button" onClick={() => go(index - 1)} aria-label="Previous hero slide">←</button>
          </div>}
        </div>

        <div className="ngms-stein-hero__proof">
          {PROOF.map(([title, detail], proofIndex) => (
            <div key={title} className="ngms-stein-hero__proof-item">
              <strong>{String(proofIndex + 1).padStart(2, '0')}</strong>
              <span>{title}</span>
              <small>{detail}</small>
            </div>
          ))}
        </div>
        {count > 1 && <div className="ngms-stein-hero__slide-picker" aria-label="Choose a hero slide">
          <span>HERO SLIDES</span>
          {photos.map((slide, slideIndex) => (
            <button key={slide.image_url} type="button" onClick={() => go(slideIndex)} aria-label={`Show slide ${slideIndex + 1}: ${slide.caption || slide.alt_text || 'NGMS project'}`} aria-current={slideIndex === index ? 'true' : undefined}>{String(slideIndex + 1).padStart(2, '0')}</button>
          ))}
          <button type="button" className="ngms-stein-hero__pause" onClick={() => setPaused((value) => !value)} aria-label={paused ? 'Play hero carousel' : 'Pause hero carousel'}>{paused ? 'PLAY' : 'PAUSE'}</button>
        </div>}
        <div className="ngms-stein-hero__hours">{days} / {open}–{close} <span>ONE CALL. ALL SOLUTIONS.</span></div>
      </div>
    </section>
  )
}
