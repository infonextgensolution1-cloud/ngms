'use client'

import {
  Sun,
  Paintbrush,
  Umbrella,
  LayoutGrid,
  Wrench,
  Zap,
  Waves,
  Droplets,
  Truck,
  Flame,
  Hammer,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { services } from '@/lib/services'

// Icon + photo per service slug.
// Photos live in /public/services/ — drop real job photos there using these
// filenames and they appear automatically. Until then the icon shows alone.
const meta: Record<string, { Icon: LucideIcon; photo: string; from: string }> = {
  'solar-panel-cleaning': { Icon: Sun, photo: '/services/solar.jpg', from: 'From R550' },
  painting: { Icon: Paintbrush, photo: '/services/painting.jpg', from: 'From R75/m²' },
  waterproofing: { Icon: Umbrella, photo: '/services/waterproofing.jpg', from: 'From R180/m²' },
  paving: { Icon: LayoutGrid, photo: '/services/paving.jpg', from: 'From R280/m²' },
  plumbing: { Icon: Wrench, photo: '/services/plumbing.jpg', from: 'From R850' },
  electrical: { Icon: Zap, photo: '/services/electrical.jpg', from: 'From R950' },
  'pool-fibre-lining': { Icon: Waves, photo: '/services/pool.jpg', from: 'From R450/m²' },
  'high-pressure-cleaning': {
    Icon: Droplets,
    photo: '/services/pressure-cleaning.jpg',
    from: 'From R25/m²',
  },
  'rubble-removal': { Icon: Truck, photo: '/services/rubble.jpg', from: 'From R1 800' },
  'steelwork-welding': { Icon: Flame, photo: '/services/steelwork.jpg', from: 'From R650/hr' },
  handyman: { Icon: Hammer, photo: '/services/handyman.jpg', from: 'From R380/hr' },
  'subcontractor-work': { Icon: Users, photo: '/services/subcontractor.jpg', from: 'Get quote' },
}

export default function ServiceGrid() {
  // Solar first, everything else after
  const ordered = [
    ...services.filter((s) => s.slug === 'solar-panel-cleaning'),
    ...services.filter((s) => s.slug !== 'solar-panel-cleaning'),
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {ordered.map((service) => {
        const m = meta[service.slug]
        if (!m) return null
        const { Icon, photo, from } = m
        const isLead = service.slug === 'solar-panel-cleaning'

        return (
          <a
            key={service.slug}
            href={`/services/${service.slug}`}
            className={`group rounded-xl overflow-hidden border transition
              ${
                isLead
                  ? 'border-orange bg-graphite sm:col-span-2 lg:col-span-1'
                  : 'border-gray-800 bg-graphite hover:border-gray-600'
              }`}
          >
            <div className="relative h-40 bg-jet overflow-hidden">
              {/* Photo shows when the file exists; icon sits on top as fallback */}
              <img
                src={photo}
                alt={service.name}
                className="w-full h-full object-cover opacity-70 group-hover:opacity-90 transition"
                onError={(e) => {
                  ;(e.currentTarget as HTMLImageElement).style.display = 'none'
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Icon
                  className={isLead ? 'w-12 h-12 text-orange' : 'w-10 h-10 text-orange/80'}
                  strokeWidth={1.5}
                />
              </div>
              {isLead && (
                <span className="absolute top-3 left-3 bg-orange text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide">
                  Our speciality
                </span>
              )}
            </div>

            <div className="p-4">
              <h3 className="font-bold text-white mb-1">{service.name}</h3>
              <p className="text-sm text-gray-400 mb-3">{service.tagline}</p>
              <div className="flex items-center justify-between">
                <span className="text-orange font-semibold text-sm">{from}</span>
                <span className="text-xs text-gray-500 group-hover:text-white transition">
                  View details →
                </span>
              </div>
            </div>
          </a>
        )
      })}
    </div>
  )
}
