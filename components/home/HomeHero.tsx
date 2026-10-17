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
      className="ngms-editorial-hero ngms-new-hero relative isolate overflow-hidden bg-[#171717] text-[#F4F2ED]"
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
      <div className="absolute inset-0 -z-10 bg-[#171717]" aria-hidden="true">
        {photos.map((slide, slideIndex) => (
          <Image
            key={slide.image_url}
            src={slide.image_url}
            alt=""
            fill
            sizes="100vw"
            quality={78}
            priority={slideIndex === 0}
            unoptimized={slide.image_url.includes('.supabase.co/storage/')}
            className={`object-cover object-center transition-opacity duration-700 ${slideIndex === index ? 'opacity-50' : 'opacity-0'}`}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-r from-[#171717] via-[#171717]/90 to-[#171717]/50" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#171717] via-transparent to-[#171717]/25" />
        <div
          className="absolute inset-0 opacity-[0.13]"
          style={{
            backgroundImage: 'linear-gradient(rgba(244,242,237,.22) 1px, transparent 1px), linear-gradient(90deg, rgba(244,242,237,.22) 1px, transparent 1px)',
            backgroundSize: '72px 72px',
            maskImage: 'linear-gradient(to right, black, transparent 90%)',
            WebkitMaskImage: 'linear-gradient(to right, black, transparent 90%)',
          }}
        />
      </div>

      <div className="mx-auto flex min-h-[650px] max-w-[1600px] flex-col px-5 pb-7 pt-16 sm:px-8 sm:pt-20 lg:min-h-[760px] lg:px-16 lg:pb-9 lg:pt-24">
        <div className="grid flex-1 gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,.8fr)] lg:items-center lg:gap-12">
          <div className="max-w-5xl">
            <p className="inline-flex items-center gap-3 border border-white/30 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[#F4F2ED]">
              <span className="h-2 w-2 bg-[#FF4B18]" aria-hidden="true" />
              Helderberg Basin / Western Cape
            </p>
            <h1 id="hero-title" className="mt-8 font-heading text-[clamp(3.3rem,9.3vw,9.4rem)] font-extrabold uppercase leading-[0.79] tracking-[-0.065em] text-[#F4F2ED]">
              One call.
              <span className="mt-3 block text-[#A6A6A6]">All</span>
              <span className="block text-[#FF4B18]">solutions.</span>
            </h1>
            <p className="mt-8 max-w-2xl border-l-2 border-[#FF4B18] pl-5 text-base font-medium leading-relaxed text-[#F4F2ED] sm:text-lg lg:text-xl">
              One accountable team for solar panel cleaning, painting, waterproofing, paving, plumbing, electrical and more — serving homes, body corporates and businesses across the Helderberg Basin.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/quote" className="btn-quote !min-h-[52px] !px-7 !py-4 !text-[0.95rem]">
                Get a free quote <span aria-hidden="true">↗</span>
              </Link>
              <a href={whatsappLink("Hi NextGen, I'd like a quote please.")} target="_blank" rel="noopener noreferrer" className="btn-wa !min-h-[52px] !px-7 !py-4 !text-[0.95rem]">
                WhatsApp a photo
              </a>
              <a href={`tel:${SITE.phone}`} className="px-2 py-3 text-sm font-semibold text-white underline decoration-[#FF4B18] underline-offset-4 hover:text-[#FF4B18]">
                Or call {SITE.phoneDisplay}
              </a>
            </div>
          </div>

          <div className="relative hidden min-h-[360px] border border-white/25 bg-black/25 p-5 lg:flex lg:flex-col lg:justify-between xl:min-h-[460px]" aria-label="Featured NGMS project">
            <div className="flex items-start justify-between gap-4">
              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#FF4B18]">Field notes / NGMS</span>
              <span className="font-heading text-3xl font-bold text-white/60">{String(index + 1).padStart(2, '0')}</span>
            </div>
            <div>
              <div className="mb-4 h-px w-full bg-white/25" />
              <p className="font-heading text-3xl font-bold uppercase leading-tight text-white xl:text-4xl">{photo?.caption || photo?.alt_text || 'Maintenance. Managed.'}</p>
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-[#E0DEDA]">Local service. Clear communication. One point of contact from quote to completion.</p>
            </div>
            <div className="flex items-center justify-between border-t border-white/25 pt-4 text-xs font-semibold uppercase tracking-[0.12em] text-[#E0DEDA]">
              <span>Project / {String(count).padStart(2, '0')} slides</span>
              <span>Strand · Gordon’s Bay · Somerset West</span>
            </div>
          </div>
        </div>

        <div className="mt-12 grid grid-cols-2 border border-white/25 sm:grid-cols-4">
          {PROOF.map(([title, detail], proofIndex) => (
            <div key={title} className="border-b border-r border-white/20 px-4 py-4 last:border-r-0 sm:border-b-0 sm:px-5">
              <span className="block font-heading text-xl font-bold text-[#FF4B18]">{String(proofIndex + 1).padStart(2, '0')}</span>
              <p className="mt-2 font-heading text-sm font-bold uppercase text-white sm:text-base">{title}</p>
              <p className="mt-1 text-xs leading-relaxed text-[#D4D1CC] sm:text-sm">{detail}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 flex flex-col gap-4 border-t border-white/25 pt-4 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#FF4B18]">NGMS / Project carousel</p>
            <p className="mt-1 truncate text-sm font-semibold text-white">{photo?.caption || photo?.alt_text || 'Completed NextGen project'} <span className="ml-2 font-normal text-[#C9C6C1]">{days} · {open}–{close}</span></p>
          </div>
          {count > 0 && (
            <div className="flex flex-wrap items-center gap-2" aria-label="Hero carousel controls">
              <span className="mr-2 font-heading text-xl font-bold tabular-nums text-white">{String(index + 1).padStart(2, '0')}<span className="text-white/45"> / {String(count).padStart(2, '0')}</span></span>
              <button type="button" onClick={() => go(index - 1)} className="h-11 w-11 border border-white/40 text-xl text-white hover:border-[#FF4B18] hover:text-[#FF4B18]" aria-label="Previous hero slide">←</button>
              <button type="button" onClick={() => go(index + 1)} className="h-11 w-11 border border-white/40 text-xl text-white hover:border-[#FF4B18] hover:text-[#FF4B18]" aria-label="Next hero slide">→</button>
              <button type="button" onClick={() => setPaused((value) => !value)} className="h-11 border border-[#FF4B18] px-4 text-xs font-bold tracking-wide text-white hover:bg-[#FF4B18] hover:text-black" aria-label={paused ? 'Play hero carousel' : 'Pause hero carousel'}>{paused ? 'PLAY' : 'PAUSE'}</button>
            </div>
          )}
        </div>
        {count > 1 && (
          <div className="mt-3 grid grid-cols-6 gap-1.5 sm:grid-cols-12" aria-label="Choose a hero slide">
            {photos.map((slide, slideIndex) => (
              <button
                key={slide.image_url}
                type="button"
                onClick={() => go(slideIndex)}
                aria-label={`Show slide ${slideIndex + 1}: ${slide.caption || slide.alt_text || 'NGMS project'}`}
                aria-current={slideIndex === index ? 'true' : undefined}
                className={`h-2.5 border transition-colors ${slideIndex === index ? 'border-[#FF4B18] bg-[#FF4B18]' : 'border-white/40 bg-white/15 hover:bg-white/55'}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
