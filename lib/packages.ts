// Maintenance packages shown on /maintenance-packages and used by the website chat assistant.
// Edit here to change both.

export type Package = {
  name: string
  icon: string
  frequency: string
  price: string
  unit: string
  features: string[]
  featured?: boolean
  badge?: string
}

export const RECURRING_PACKAGES: Package[] = [
  {
    name: 'Basic Care',
    icon: 'calendar',
    frequency: 'Every 6 months',
    price: 'from R850',
    unit: 'per visit',
    features: [
      'Solar panel clean (up to 20 panels)',
      'Gutter check & flush',
      'General exterior visual inspection',
      '15% off solar cleaning rate',
      'Priority booking',
    ],
  },
  {
    name: 'Standard Care',
    icon: 'recurring',
    frequency: 'Every 4 months',
    price: 'from R1 450',
    unit: 'per visit',
    featured: true,
    badge: 'Most Popular',
    features: [
      'Solar panel clean (up to 20 panels)',
      'Gutter clean & flush',
      'High-pressure wash — driveway or entrance area',
      'Minor handyman fixes (up to 30 min)',
      '15% off solar cleaning rate',
      'Priority booking',
    ],
  },
  {
    name: 'Complete Care',
    icon: 'walkthrough',
    frequency: 'Every 3 months',
    price: 'from R2 200',
    unit: 'per visit',
    features: [
      'Solar panel clean (up to 20 panels)',
      'Gutter clean & flush',
      'Full exterior high-pressure wash',
      'Handyman hour included',
      'Annual waterproofing inspection',
      '15% off solar cleaning rate',
      'Priority booking & fastest response',
    ],
  },
]

export const SEASONAL_COMBOS: Package[] = [
  {
    name: 'Pre-Winter Storm-Ready',
    icon: 'winter-rain',
    frequency: 'March – May (before the rains)',
    price: 'from R2 150',
    unit: 'once-off project',
    features: [
      'Full roof & gutter inspection and clean',
      'Waterproofing leak-point check + minor patch (up to 5m²)',
      'Interior touch-up painting (up to 15m²)',
      'Free follow-up call-out if a leak shows up within 30 days',
    ],
  },
  {
    name: 'Summer Refresh',
    icon: 'summer-sun',
    frequency: 'September – April',
    price: 'from R2 950',
    unit: 'once-off project',
    featured: true,
    badge: 'Peak Season Pick',
    features: [
      'Full exterior high-pressure wash (driveway, walls, entrance)',
      'Solar panel clean (up to 20 panels)',
      'Exterior touch-up painting (up to 15m²)',
      'Paving joint & crack check',
    ],
  },
  {
    name: 'Pool & Entertaining Combo',
    icon: 'pool-fibre-lining',
    frequency: 'September – April',
    price: 'from R2 250',
    unit: 'once-off project',
    features: [
      'Pool fibre lining check + minor patch (up to 3m²)',
      'High-pressure wash — pool deck & entrance area',
      'Solar panel clean (up to 10 panels)',
      '2-hour handyman slot for pre-season touch-ups',
    ],
  },
]

export const COMMERCIAL_COMBOS: Package[] = [
  {
    name: 'Body Corporate Essentials',
    icon: 'complex',
    frequency: 'Quarterly',
    price: 'from R3 200',
    unit: 'per visit',
    features: [
      'Solar panel clean — communal/rooftop arrays (up to 40 panels)',
      'Common area high-pressure wash (entrances & walkways)',
      'Gutter clean — up to 4 downpipe runs',
      'Site safety walk-through + minor electrical check',
    ],
  },
  {
    name: 'Security Complex Care',
    icon: 'crew',
    frequency: 'Twice a year',
    price: 'from R4 800',
    unit: 'per visit',
    featured: true,
    badge: 'Most Requested',
    features: [
      'Solar panel clean — all unit arrays (volume-priced on-site)',
      'Perimeter wall & boundary high-pressure wash',
      'Common area exterior paint touch-up',
      'Electrical safety check on shared lighting',
      'Priority-response SLA for the season',
    ],
  },
  {
    name: 'Light Commercial Facade',
    icon: 'high-pressure-cleaning',
    frequency: 'Quarterly',
    price: 'from R2 800',
    unit: 'per visit',
    features: [
      'Storefront/exterior high-pressure wash',
      'Exterior paint touch-up (signage area, entrance)',
      'Gutter & roof check',
      'Rubble/waste clear-out if repairs leave debris',
    ],
  },
]
