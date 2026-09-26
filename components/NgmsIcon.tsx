import { serviceIcon } from '@/lib/service-icons'

// One of the NGMS brand icons (service or site icon). Floats gently while on
// the page and lifts with an orange glow on hover/tap — see .ngms-icon in
// globals.css. `index` staggers the float so a grid doesn't bob in sync.
export default function NgmsIcon({
  name,
  variant = 'dark',
  className = 'h-10 w-10',
  index = 0,
}: {
  name: string
  variant?: 'light' | 'dark'
  className?: string
  index?: number
}) {
  const src = serviceIcon(name, variant)
  if (!src) return null
  return (
    <img
      src={src}
      alt=""
      aria-hidden="true"
      width={64}
      height={64}
      loading="lazy"
      className={`ngms-icon ${className}`}
      style={{ animationDelay: `${-(index * 0.45).toFixed(2)}s` }}
    />
  )
}
