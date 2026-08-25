'use client'

import { useEffect, useState } from 'react'

type Slide = { id: string; image_url: string; alt_text: string; caption: string | null }

export function HeroSlideshow({ slides }: { slides: Slide[] }) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (slides.length <= 1) return
    const t = setInterval(() => setIndex((i) => (i + 1) % slides.length), 5000)
    return () => clearInterval(t)
  }, [slides.length])

  if (slides.length === 0) {
    return (
      <div className="relative bg-graphite overflow-hidden min-h-[320px] md:min-h-[85vh] border-t md:border-t-0 md:border-l border-darkgrey">
        <div className="absolute -right-16 -top-16 w-72 h-72 bg-orange/10 rotate-45" />
        <div className="absolute right-10 bottom-0 w-56 h-56 bg-blue/10 rotate-12" />
        <div className="absolute left-0 top-1/3 w-40 h-40 bg-cardgrey rotate-45 border border-darkgrey" />
        <div className="absolute inset-0 flex items-center justify-center px-8 text-center">
          <p className="text-mist text-xs uppercase tracking-widest font-heading font-semibold">
            Real project photography coming soon
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative bg-graphite overflow-hidden min-h-[320px] md:min-h-[85vh] border-t md:border-t-0 md:border-l border-darkgrey">
      {slides.map((slide, i) => (
        <img
          key={slide.id}
          src={slide.image_url}
          alt={slide.alt_text}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
            i === index ? 'opacity-100' : 'opacity-0'
          }`}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-t from-jet/80 via-jet/10 to-transparent" />
      {slides[index]?.caption && (
        <p className="absolute bottom-6 left-6 right-6 text-paper font-heading font-semibold text-sm">
          {slides[index].caption}
        </p>
      )}
      {slides.length > 1 && (
        <div className="absolute bottom-4 right-6 flex gap-1.5">
          {slides.map((_, i) => (
            <span key={i} className={`h-1.5 w-1.5 rounded-full ${i === index ? 'bg-orange' : 'bg-mist/50'}`} />
          ))}
        </div>
      )}
    </div>
  )
}
