export type Service = {
  slug: string
  name: string
  tagline: string
  description: string
}

export const services: Service[] = [
  {
    slug: 'solar-panel-cleaning',
    name: 'Solar Panel Cleaning',
    tagline: 'Keep every panel earning its keep',
    description:
      'Regular professional cleaning removes Cape dust, pollen and salt air build-up so your solar array keeps generating at full capacity. NGMS’s flagship service across the Helderberg Basin.',
  },
  {
    slug: 'painting',
    name: 'Painting',
    tagline: 'Interior and exterior, done properly',
    description:
      'Full prep, quality materials and a clean finish for homes, complexes and commercial units — scheduled around Cape winter rain for exterior work.',
  },
  {
    slug: 'waterproofing',
    name: 'Waterproofing',
    tagline: 'Stop leaks before they start',
    description:
      'Roofs, walls, balconies and parapets waterproofed to hold up against Helderberg winters, with warranty-backed workmanship.',
  },
  {
    slug: 'paving',
    name: 'Paving',
    tagline: 'Driveways, patios and walkways',
    description:
      'New paving, repairs and re-levelling for driveways, patios and pathways — built to last on Western Cape ground conditions.',
  },
  {
    slug: 'plumbing',
    name: 'Plumbing',
    tagline: 'Leaks, geysers, installations and repairs',
    description:
      'Qualified plumbing for homes, body corporates and complexes — from a dripping tap to a full geyser replacement.',
  },
  {
    slug: 'electrical',
    name: 'Electrical',
    tagline: 'Safe, compliant electrical work',
    description:
      'Electrical repairs, installations and fault-finding carried out to code, with COC certification where required.',
  },
  {
    slug: 'pool-fibre-lining',
    name: 'Pool Fibre Lining',
    tagline: 'Restore your pool, don’t replace it',
    description:
      'Fibreglass relining for cracked, faded or leaking pools — a durable finish that outlasts standard paint.',
  },
  {
    slug: 'high-pressure-cleaning',
    name: 'High-Pressure Cleaning',
    tagline: 'Driveways, walls, roofs and more',
    description:
      'High-pressure washing to lift grime, moss and algae from paving, walls, roofs and outdoor areas.',
  },
  {
    slug: 'rubble-removal',
    name: 'Rubble Removal',
    tagline: 'Site and garden clearance',
    description:
      'Fast, reliable rubble and garden refuse removal for renovation sites, gardens and general clean-ups.',
  },
  {
    slug: 'steelwork-welding',
    name: 'Steelwork & Welding',
    tagline: 'Gates, railings, structural work',
    description:
      'Custom steelwork, welding repairs, gates, burglar bars and railings, built on-site or in the workshop.',
  },
  {
    slug: 'handyman',
    name: 'Handyman Services',
    tagline: 'The small jobs, handled properly',
    description:
      'General repairs and maintenance for everything that doesn’t need its own trade — one call covers it.',
  },
  {
    slug: 'subcontractor-work',
    name: 'Subcontractor Work',
    tagline: 'Trade support for other contractors',
    description:
      'NGMS teams up with other contractors and property managers as a reliable multi-trade subcontractor across the Helderberg Basin.',
  },
]

export function getService(slug: string) {
  return services.find((s) => s.slug === slug)
}
