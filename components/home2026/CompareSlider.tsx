'use client'

import Image from 'next/image'
import { useState } from 'react'

// Drag (or use the arrow keys on) the handle to compare a before / after pair.
// Built on a native range input so it works with touch, mouse and keyboard.

export default function CompareSlider({ before, after, label }: { before: string; after: string; label: string }) {
  const [pos, setPos] = useState(50)
  return (
    <div className="ng26-cmp" style={{ ['--pos' as string]: `${pos}%` } as React.CSSProperties}>
      <Image src={after} alt={`After: ${label}`} fill sizes="(max-width: 768px) 100vw, 33vw" quality={72} unoptimized />
      <div className="ng26-cmp__before">
        <Image src={before} alt={`Before: ${label}`} fill sizes="(max-width: 768px) 100vw, 33vw" quality={72} unoptimized />
      </div>
      <span className="ng26-cmp__tag ng26-cmp__tag--b">Before</span>
      <span className="ng26-cmp__tag ng26-cmp__tag--a">After</span>
      <span className="ng26-cmp__handle" aria-hidden="true">
        <i>⇆</i>
      </span>
      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={pos}
        onChange={(e) => setPos(Number(e.target.value))}
        aria-label={`Compare before and after: ${label}`}
        className="ng26-cmp__range"
      />
    </div>
  )
}
