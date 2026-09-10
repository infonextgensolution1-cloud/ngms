'use client'

import Link from 'next/link'
import {
  Sun, Paintbrush, Umbrella, LayoutGrid, Wrench, Zap,
  Waves, Droplets, Truck, Flame, Hammer, Users,
  type LucideIcon,
} from 'lucide-react'
import { services } from '@/lib/services'

// Icon + photo + starting price per service.
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
  'high-pressure-cleaning': { Icon: Droplets, photo: '/services/pressure-cleaning.jpg', from: 'From R25/m²' },
  'gutter-cleaning': { Icon: Droplets, photo: '/services/gutters.jpg', from: 'From R650' },
  'rubble-removal': { Icon: Truck, photo: '/services/rubble.jpg', from: 'From R1 800' },
  'steelwork-welding': { Icon: Flame, photo: '/services/steelwork.jpg', from: 'From R650/hr' },
  handyman: { Icon: Hammer, photo: '/services/handyman.jpg', from: 'From R380/hr' },
  'subcontractor-work': { Icon: Users, photo: '/services/subcontractor.jpg', from: 'Get quote' },
}

const fallback = { Icon: Wrench, photo: '', from: 'Get quote' }

export default function ServiceGrid() {
  // Solar leads, everything else follows
  const ordered = [
    ...services.filter((s) => s.slug === 'solar-panel-cleaning'),
    ...services.filter((s) => s.slug !== 'solar-panel-cleaning'),
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {ordered.map((service) => {
        const { Icon, photo, from } = meta[service.slug] ?? fallback
        const isLead = service.slug === 'solar-panel-cleaning'

        return (
          <Link
            key={service.slug}
            href={`/services/${service.slug}`}
            className={`group block bg-cardgrey rounded-card overflow-hidden border transition ${
              isLead ? 'border-orange' : 'border-darkgrey hover:border-orange'
            }`}
          >
            <div className="relative h-36 bg-jet overflow-hidden">
              {photo && (
                <img
                  src={photo}
                  alt={service.name}
                  className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition"
                  onError={(e) => {
                    ;(e.currentTarget as HTMLImageElement).style.display = 'none'
                  }}
                />
              )}
              <div className="absolute inset-0 flex items-center justify-center">
                <Icon
                  className={isLead ? 'w-12 h-12 text-orange' : 'w-10 h-10 text-orange'}
                  strokeWidth={1.5}
                />
              </div>
              {isLead && (
                <span className="absolute top-3 left-3 bg-orange text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide font-heading">
                  Our speciality
                </span>
              )}
            </div>

            <div className="p-6">
              <h2 className="font-heading text-lg font-semibold mb-1 text-paper">
                {service.name}
              </h2>
              <p className="text-orange text-sm font-bold mb-3">{service.tagline}</p>
              <p className="text-mist text-sm">{service.description}</p>
              <div className="flex items-center justify-between mt-4">
                <span className="text-sm font-bold text-paper">{from}</span>
                <span className="text-sm font-bold text-blue">Learn more &rarr;</span>
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
