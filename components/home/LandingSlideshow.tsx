'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

// Landing-page slideshow — up to 12 slides, managed in Admin → Media → Landing slides.
// Auto-advances every 5s, pauses on hover/touch, swipe on mobile, arrows + dots.
// Only the current slide and its neighbours are mounted, so the page doesn't
// download all 12 photos up front.

export type LandingSlide = { image_url: string; alt_text: string; caption: string | null }

const MAX_SLIDES = 12
const INTERVAL_MS = 5000

export default function LandingSlideshow({ slides }: { slides: LandingSlide[] }) {
  const usable = slides.filter((s) => s.image_url).slice(0, MAX_SLIDES)
  const count = usable.length
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const touchX = useRef<number | null>(null)

  const go = useCallback((n: number) => setIndex(((n % count) + count) % count), [count])

  useEffect(() => {
    if (count < 2 || paused) return
    const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduce) return
    const t = setTimeout(() => go(index + 1), INTERVAL_MS)
    return () => clearTimeout(t)
  }, [index, paused, count, go])

  if (count === 0) return null

  const near = (i: number) => {
    const d = Math.abs(i - index)
    return d <= 1 || d === count - 1
  }
  const slide = usable[index]

  return (
    <section
      className="relative bg-jet text-paper overflow-hidden"
      aria-roledescription="carousel"
      aria-label="Recent NextGen jobs"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => {
        touchX.current = e.touches[0].clientX
        setPaused(true)
      }}
      onTouchEnd={(e) => {
        const start = touchX.current
        touchX.current = null
        setPaused(false)
        if (start === null) return
        const dx = e.changedTouches[0].clientX - start
        if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1))
      }}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') go(index + 1)
        if (e.key === 'ArrowLeft') go(index - 1)
      }}
    >
      <div className="relative h-[58vh] min-h-[340px] max-h-[640px]">
        {usable.map((s, i) =>
          near(i) ? (
            <Image
              key={s.image_url}
              src={s.image_url}
              alt={s.alt_text || 'Completed NextGen job'}
              fill
              sizes="100vw"
              quality={72}
              priority={i === 0}
              className={`object-cover transition-[opacity,transform] duration-[900ms] ease-out ${
                i === index ? 'opacity-100 scale-100' : 'opacity-0 scale-[1.04]'
              }`}
              aria-hidden={i !== index}
            />
          ) : null,
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-jet/90 via-jet/20 to-jet/10" />

        <div className="absolute inset-x-0 bottom-0 px-4 pb-14 sm:pb-16">
          <div className="max-w-6xl mx-auto">
            <p className="font-heading font-bold uppercase tracking-[0.2em] text-[11px] text-power-light mb-2">
              Recent work · {String(index + 1).padStart(2, '0')} / {String(count).padStart(2, '0')}
            </p>
            <p key={index} className="font-heading font-bold uppercase text-2xl sm:text-4xl leading-[1.02] max-w-2xl animate-fade-up">
              {slide.caption || slide.alt_text || 'Another job done right'}
            </p>
            <div className="flex gap-3 flex-wrap mt-5">
              <Link href="/quote" className="btn-power">
                Get a free quote &rarr;
              </Link>
              <Link href="/gallery" className="btn-outline">
                See the gallery
              </Link>
            </div>
          </div>
        </div>

        {count > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(index - 1)}
              aria-label="Previous slide"
              className="hidden sm:grid absolute left-4 top-1/2 -translate-y-1/2 h-11 w-11 place-items-center rounded-full bg-jet/60 backdrop-blur-sm text-paper hover:bg-power transition-colors"
            >
              &larr;
            </button>
            <button
              type="button"
              onClick={() => go(index + 1)}
              aria-label="Next slide"
              className="hidden sm:grid absolute right-4 top-1/2 -translate-y-1/2 h-11 w-11 place-items-center rounded-full bg-jet/60 backdrop-blur-sm text-paper hover:bg-power transition-colors"
            >
              &rarr;
            </button>

            <div className="absolute bottom-5 inset-x-0 flex justify-center gap-1.5 px-4">
              {usable.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => go(i)}
                  aria-label={`Go to slide ${i + 1}`}
                  aria-current={i === index}
                  className="h-6 flex items-center"
                >
                  <span
                    className={`block h-1.5 rounded-full transition-all duration-300 ${
                      i === index ? 'w-7 bg-power' : 'w-1.5 bg-paper/50'
                    }`}
                  />
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  )
}
