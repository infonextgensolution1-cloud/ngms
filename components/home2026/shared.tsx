import Image from 'next/image'
import type { CSSProperties } from 'react'

// Shared bits for the 2026 homepage (components/home2026/*).

export type Photo = { src: string; caption: string }

/** Staggered reveal delay: <li data-reveal style={d(i)}> */
export const d = (i: number): CSSProperties => ({ ['--d' as string]: `${Math.min(i, 8) * 70}ms` }) as CSSProperties

/** Remote hosts that are not in next.config images.remotePatterns are served as-is. */
export const needsUnoptimized = (src: string) => src.includes('.supabase.co') || src.includes('images.unsplash.com')

export function Arrow() {
  return (
    <span aria-hidden="true" className="ng26-arrow">
      ↗
    </span>
  )
}

/** Photo that fills its (positioned) parent, or a branded placeholder when no photo is set in Admin → Media. */
export function PhotoFill({ photo, sizes, className = '' }: { photo?: Photo; sizes: string; className?: string }) {
  if (!photo?.src) {
    return (
      <div className="ng26-ph">
        <span className="ng26-ph__k">NextGen · Helderberg Basin</span>
        <span className="ng26-ph__t">Real work. Clear results.</span>
        <span className="ng26-ph__s">Project photography is being updated.</span>
      </div>
    )
  }
  return <Image src={photo.src} alt={photo.caption} fill sizes={sizes} quality={70} unoptimized className={className} />
}
