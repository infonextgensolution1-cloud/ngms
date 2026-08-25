export type Service = {
  slug: string
  name: string
  tagline: string
  description: string
  metaTitle: string
  metaDescription: string
}

export const services: Service[] = [
  {
    slug: 'solar-panel-cleaning',
    name: 'Solar Panel Cleaning',
    tagline: 'Keep every panel earning its keep',
    description:
      'Regular professional cleaning removes Cape dust, pollen and salt air build-up so your solar array keeps generating at full capacity. NGSMS’s flagship service across the Helderberg Basin.',
    metaTitle: 'Solar Panel Cleaning Helderberg | Strand, Gordon’s Bay & Somerset West',
    metaDescription:
      'Professional solar panel cleaning in the Helderberg Basin. Restore maximum power output and protect your investment. Safe, effective cleaning for homes in Strand, Gordon’s Bay & Somerset West.',
  },
  {
    slug: 'painting',
    name: 'Painting',
    tagline: 'Interior and exterior, done properly',
    description:
      'Full prep, quality materials and a clean finish for homes, complexes and commercial units — scheduled around Cape winter rain for exterior work.',
    metaTitle: 'Painters Helderberg | Interior & Exterior Painting Somerset West, Strand',
    metaDescription:
      'Quality interior and exterior painting in the Helderberg. Clean finishes that stand up to Western Cape weather. Serving Strand, Gordon’s Bay and Somerset West.',
  },
  {
    slug: 'waterproofing',
    name: 'Waterproofing',
    tagline: 'Stop leaks before they start',
    description:
      'Roofs, walls, balconies and parapets waterproofed to hold up against Helderberg winters, with warranty-backed workmanship.',
    metaTitle: 'Waterproofing Helderberg | Roof & Wall Waterproofing Somerset West',
    metaDescription:
      'Professional roof, balcony and wall waterproofing in Strand, Gordon’s Bay and Somerset West. Stop leaks before the Cape winter rains arrive.',
  },
  {
    slug: 'paving',
    name: 'Paving',
    tagline: 'Driveways, patios and walkways',
    description:
      'New paving, repairs and re-levelling for driveways, patios and pathways — built to last on Western Cape ground conditions.',
    metaTitle: 'Paving Helderberg | Driveway Paving & Repairs Somerset West, Strand',
    metaDescription:
      'New paving, repairs and re-levelling for driveways and outdoor areas in the Helderberg Basin. Neat, durable work built for local conditions.',
  },
  {
    slug: 'plumbing',
    name: 'Plumbing',
    tagline: 'Leaks, geysers, installations and repairs',
    description:
      'Qualified plumbing for homes, body corporates and complexes — from a dripping tap to a full geyser replacement.',
    metaTitle: 'Plumber Helderberg | Somerset West, Strand & Gordon’s Bay',
    metaDescription:
      'Reliable plumbing repairs, geyser work and installations in Strand, Gordon’s Bay and Somerset West. Fast response from a local Helderberg team.',
  },
  {
    slug: 'electrical',
    name: 'Electrical',
    tagline: 'Safe, compliant electrical work',
    description:
      'Electrical repairs, installations and fault-finding carried out to code, with COC certification where required.',
    metaTitle: 'Electrician Helderberg | Electrical Services Somerset West & Strand',
    metaDescription:
      'Safe electrical repairs, installations and DB board work in the Helderberg. Qualified electricians serving Strand, Gordon’s Bay and Somerset West.',
  },
  {
    slug: 'pool-fibre-lining',
    name: 'Pool Fibre Lining',
    tagline: 'Restore your pool, don’t replace it',
    description:
      'Fibreglass relining for cracked, faded or leaking pools — a durable finish that outlasts standard paint.',
    metaTitle: 'Pool Fibre Lining Helderberg | Fibreglass Pool Renovation',
    metaDescription:
      'Professional fibreglass pool lining and renovations in Strand, Gordon’s Bay and Somerset West. Smooth, durable finish that lasts season after season.',
  },
  {
    slug: 'high-pressure-cleaning',
    name: 'High-Pressure Cleaning',
    tagline: 'Driveways, walls, roofs and more',
    description:
      'High-pressure washing to lift grime, moss and algae from paving, walls, roofs and outdoor areas.',
    metaTitle: 'Pressure Cleaning Helderberg | Driveways, Paving & Outdoor Areas',
    metaDescription:
      'High-pressure cleaning for driveways, paving, walls and outdoor surfaces in Strand, Gordon’s Bay and Somerset West. Fast, effective results that make surfaces look new again.',
  },
  {
    slug: 'rubble-removal',
    name: 'Rubble Removal',
    tagline: 'Site and garden clearance',
    description:
      'Fast, reliable rubble and garden refuse removal for renovation sites, gardens and general clean-ups.',
    metaTitle: 'Rubble Removal Helderberg | Building & Garden Waste Somerset West',
    metaDescription:
      'Fast, clean rubble and garden waste removal in Strand, Gordon’s Bay and Somerset West. We clear the site so you can move on.',
  },
  {
    slug: 'steelwork-welding',
    name: 'Steelwork & Welding',
    tagline: 'Gates, railings, structural work',
    description:
      'Custom steelwork, welding repairs, gates, burglar bars and railings, built on-site or in the workshop.',
    metaTitle: 'Steelwork & Welding Helderberg | Custom Fabrication Somerset West',
    metaDescription:
      'Custom steelwork, gates, railings and on-site welding in Strand, Gordon’s Bay and Somerset West. Strong, neat fabrications built to last.',
  },
  {
    slug: 'handyman',
    name: 'Handyman Services',
    tagline: 'The small jobs, handled properly',
    description:
      'General repairs and maintenance for everything that doesn’t need its own trade — one call covers it.',
    metaTitle: 'Handyman Helderberg | Reliable Home Maintenance Somerset West, Strand',
    metaDescription:
      'Trusted handyman services for repairs, installations and general maintenance in the Helderberg Basin. One reliable team for the jobs that need doing.',
  },
  {
    slug: 'subcontractor-work',
    name: 'Subcontractor Work',
    tagline: 'Trade support for other contractors',
    description:
      'NGSMS teams up with other contractors and property managers as a reliable multi-trade subcontractor across the Helderberg Basin.',
    metaTitle: 'Subcontractor Services Helderberg | Trade Support Somerset West, Strand',
    metaDescription:
      'Reliable subcontractor and trade support for contractors and property managers across Strand, Gordon’s Bay and Somerset West.',
  },
]

export function getService(slug: string) {
  return services.find((s) => s.slug === slug)
}
