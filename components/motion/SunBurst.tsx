// Bold hero centerpiece: an original, abstract animated sunburst — slow
// counter-rotating ray rings plus a soft pulsing core. Purely decorative
// (aria-hidden), built with inline SVG so there's no image weight, and
// every animation class here is disabled under prefers-reduced-motion
// (see app/globals.css). On-brand for a solar-cleaning business without
// depicting anything literal.
export default function SunBurst({ className = '' }: { className?: string }) {
  return (
    <div className={`pointer-events-none select-none ${className}`} aria-hidden="true">
      <svg viewBox="0 0 400 400" className="h-full w-full">
        <g className="animate-spin-slow origin-center">
          {Array.from({ length: 16 }).map((_, i) => (
            <rect
              key={i}
              x="198.5"
              y="20"
              width="3"
              height="46"
              rx="1.5"
              fill="#F57C1B"
              opacity={i % 2 === 0 ? 0.55 : 0.25}
              transform={`rotate(${i * 22.5} 200 200)`}
            />
          ))}
        </g>
        <g className="animate-spin-slow-reverse origin-center">
          {Array.from({ length: 24 }).map((_, i) => (
            <circle
              key={i}
              cx={200 + 150 * Math.cos((i * Math.PI * 2) / 24)}
              cy={200 + 150 * Math.sin((i * Math.PI * 2) / 24)}
              r="2.2"
              fill="#F57C1B"
              opacity={0.35}
            />
          ))}
        </g>
        <circle cx="200" cy="200" r="86" fill="none" stroke="#2E3035" strokeWidth="1.5" />
        <circle cx="200" cy="200" r="120" fill="none" stroke="#2E3035" strokeWidth="1" />
        <circle cx="200" cy="200" r="64" fill="#F57C1B" opacity="0.08" className="animate-glow-pulse origin-center" />
        <circle cx="200" cy="200" r="40" fill="#F57C1B" opacity="0.14" className="animate-glow-pulse origin-center" />
      </svg>
    </div>
  )
}
