// Ember Grid signature element #1 — an orange "+" cluster (2x3 grid) used
// as a small section marker ahead of a kicker/heading. Pure CSS, no
// images, ~6 characters of markup weight.
export default function PlusCluster({
  className = '',
  animate = true,
}: {
  className?: string
  animate?: boolean
}) {
  return (
    <div className={`inline-grid grid-cols-3 gap-1 sm:gap-1.5 ${className}`} aria-hidden="true">
      {Array.from({ length: 6 }).map((_, i) => (
        <span
          key={i}
          className={`text-orange text-xs sm:text-sm leading-none font-bold select-none ${
            animate ? 'animate-pulse-soft' : ''
          }`}
          style={animate ? { animationDelay: `${i * 140}ms` } : undefined}
        >
          +
        </span>
      ))}
    </div>
  )
}
