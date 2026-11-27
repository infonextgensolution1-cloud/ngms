'use client'

import { useEffect, useLayoutEffect } from 'react'

// Page-level motion for the 2026 homepage: scroll reveal ([data-reveal]) and
// count-up numbers ([data-count]). Everything is fully visible without JS, and
// nothing animates when the visitor prefers reduced motion.

const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect

export default function Effects() {
  useIsoLayoutEffect(() => {
    const root = document.querySelector<HTMLElement>('.ng26')
    if (!root) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce || !('IntersectionObserver' in window)) return

    const raf = new Set<number>()
    const vh = window.innerHeight

    // Reveal: anything already on screen is marked before the hidden state is applied (no flash).
    const items = Array.from(root.querySelectorAll<HTMLElement>('[data-reveal]'))
    items.forEach((el) => {
      const top = el.getBoundingClientRect().top
      if (top < vh * 0.92) el.classList.add('is-in')
    })
    root.classList.add('ng26-js')

    const reveal = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-in')
            reveal.unobserve(e.target)
          }
        })
      },
      { threshold: 0.12, rootMargin: '0px 0px -6% 0px' },
    )
    items.forEach((el) => {
      if (!el.classList.contains('is-in')) reveal.observe(el)
    })

    // Count-up
    const counters = Array.from(root.querySelectorAll<HTMLElement>('[data-count]'))
    const fmt = (el: HTMLElement, v: number) => {
      el.textContent = `${el.dataset.prefix ?? ''}${Math.round(v)}${el.dataset.suffix ?? ''}`
    }
    counters.forEach((el) => fmt(el, 0))
    const count = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return
          const el = e.target as HTMLElement
          count.unobserve(el)
          const target = Number(el.dataset.count) || 0
          const dur = 1400
          const t0 = performance.now()
          const tick = (now: number) => {
            const p = Math.min(1, (now - t0) / dur)
            fmt(el, target * (1 - Math.pow(1 - p, 3)))
            if (p < 1) raf.add(requestAnimationFrame(tick))
          }
          raf.add(requestAnimationFrame(tick))
        })
      },
      { threshold: 0.6 },
    )
    counters.forEach((el) => count.observe(el))

    return () => {
      reveal.disconnect()
      count.disconnect()
      raf.forEach((id) => cancelAnimationFrame(id))
      // Leave the page readable if React re-mounts this component.
      counters.forEach((el) => fmt(el, Number(el.dataset.count) || 0))
    }
  }, [])

  return null
}
