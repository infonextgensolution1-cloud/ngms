'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'

type Direction = 'up' | 'left' | 'right' | 'none'

// Dependency-free scroll-reveal wrapper (IntersectionObserver + CSS
// transitions, same pattern already used in StatsStrip) so the homepage
// gets scroll-triggered motion without pulling in an animation library.
// Falls back to fully visible, no animation, when the visitor has
// prefers-reduced-motion set.
export default function Reveal({
  children,
  className = '',
  delayMs = 0,
  direction = 'up',
  once = true,
}: {
  children: ReactNode
  className?: string
  delayMs?: number
  direction?: Direction
  once?: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  const [reduceMotion, setReduceMotion] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    const reduced = mq?.matches ?? false
    setReduceMotion(reduced)
    if (reduced) {
      setVisible(true)
      return
    }

    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true)
            if (once) observer.unobserve(entry.target)
          } else if (!once) {
            setVisible(false)
          }
        })
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [once])

  const offsetClass =
    direction === 'up'
      ? 'translate-y-8'
      : direction === 'left'
        ? '-translate-x-8'
        : direction === 'right'
          ? 'translate-x-8'
          : ''

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out will-change-transform ${
        visible ? 'opacity-100 translate-x-0 translate-y-0' : `opacity-0 ${offsetClass}`
      } ${className}`}
      style={{ transitionDelay: reduceMotion ? '0ms' : `${delayMs}ms` }}
    >
      {children}
    </div>
  )
}
