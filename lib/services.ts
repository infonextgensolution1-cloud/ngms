export type ServiceFaq = { question: string; answer: string }

export type Service = {
  slug: string
  name: string
  tagline: string
  description: string
  whatsIncluded: string[]
  faqs: ServiceFaq[]
  metaTitle: string
  metaDescription: string
}

export const services: Service[] = [
  {
    slug: 'solar-panel-cleaning',
    name: 'Solar Panel Cleaning',
    tagline: 'Keep every panel earning its keep',
    description:
      'Dust, pollen, salt air and bird droppings build up on solar panels faster than most homeowners realise, and that layer of grime sits directly between your panels and the sun. NGSMS provides regular, professional solar panel cleaning across the Helderberg Basin using soft-wash methods and purified water, so panels are cleaned without scratching the glass or voiding manufacturer warranties. This is our flagship service and the one most Strand, Gordon\u2019s Bay and Somerset West homeowners know us for \u2014 coastal properties in particular see faster soiling from salt spray, which makes a regular cleaning schedule worth setting up rather than waiting until output visibly drops.',
    whatsIncluded: [
      'Soft-wash cleaning safe for all panel types and warranties',
      'Purified/deionised water to avoid mineral spotting',
      'Visual inspection for cracked cells, loose mounting or damaged wiring',
      'Before-and-after photos so you can see the difference',
      'Recommended cleaning frequency based on your roof and surroundings',
    ],
    faqs: [
      {
        question: 'How often should solar panels be cleaned in the Helderberg?',
        answer:
          'Most homes do well with a clean every 4\u20136 months. Properties near the coast, under trees, or close to dusty roads often benefit from more frequent cleaning.',
      },
      {
        question: 'Will cleaning affect my solar warranty?',
        answer:
          'No \u2014 we use soft-wash methods and non-abrasive materials designed not to damage the glass or coating, so your manufacturer warranty stays intact.',
      },
      {
        question: 'Can you clean panels on a steep or high roof?',
        answer:
          'Yes, our team is equipped for safe work at height. We assess roof access and pitch before quoting so there are no surprises on the day.',
      },
    ],
    metaTitle: 'Solar Panel Cleaning Helderberg | Strand, Gordon\u2019s Bay & Somerset West',
    metaDescription:
      'Professional solar panel cleaning in the Helderberg Basin. Restore maximum power output and protect your investment. Safe, effective cleaning for homes in Strand, Gordon\u2019s Bay & Somerset West.',
  },
  {
    slug: 'painting',
    name: 'Painting',
    tagline: 'Interior and exterior, done properly',
    description:
      'A paint job is only as good as the prep behind it. NGSMS handles interior and exterior painting for homes, complexes and commercial units across the Helderberg Basin, with proper surface preparation, quality materials and a clean, even finish. Exterior work is scheduled with Cape winter rainfall in mind \u2014 we plan around the forecast so paint has time to cure properly rather than being rushed onto damp surfaces, and we\u2019ll always talk you through the right paint system for a coastal environment where salt air and UV exposure are harder on exterior coatings than inland.',
    whatsIncluded: [
      'Surface prep: cleaning, scraping, sanding and crack filling before any paint goes on',
      'Quality interior and exterior paint systems suited to Western Cape conditions',
      'Ceilings, walls, trim, doors and exterior facades',
      'Colour consultation if you\u2019re unsure what will work',
      'Weather-aware scheduling for exterior jobs',
    ],
    faqs: [
      {
        question: 'Do you paint during the Cape winter?',
        answer:
          'Interior work continues year-round. Exterior painting is scheduled around forecast rain so surfaces are dry and the paint can cure properly \u2014 we\u2019ll plan the timing with you upfront.',
      },
      {
        question: 'Do you supply the paint or do I?',
        answer:
          'We can supply quality paint as part of the quote, or work with paint you\u2019ve already purchased \u2014 either way, we\u2019ll advise on the right type for the surface and exposure.',
      },
    ],
    metaTitle: 'Painters Helderberg | Interior & Exterior Painting Somerset West, Strand',
    metaDescription:
      'Quality interior and exterior painting in the Helderberg. Clean finishes that stand up to Western Cape weather. Serving Strand, Gordon\u2019s Bay and Somerset West.',
  },
  {
    slug: 'waterproofing',
    name: 'Waterproofing',
    tagline: 'Stop leaks before they start',
    description:
      'A leak that starts small in autumn is a ceiling stain by the time winter rains set in properly. NGSMS waterproofs roofs, flat roofs, walls, balconies and parapets across the Helderberg Basin, with workmanship backed by warranty. We look at the whole system \u2014 flashing, drainage falls, and membrane condition \u2014 rather than just patching the visible symptom, because a proper waterproofing job addresses where water is actually getting in, not just where it\u2019s showing up inside.',
    whatsIncluded: [
      'Roof, flat roof, balcony and parapet waterproofing',
      'Leak diagnosis \u2014 finding the actual entry point, not just the stain',
      'Torch-on, liquid-applied and cementitious systems depending on the surface',
      'Warranty-backed workmanship',
      'Pre-winter inspections available for existing waterproofing',
    ],
    faqs: [
      {
        question: 'How do I know if I need waterproofing or just a patch repair?',
        answer:
          'If it\u2019s a single small leak we can often assess and repair on one visit. Widespread staining, bubbling membrane, or leaks that keep returning usually point to a system that needs proper attention \u2014 we\u2019ll tell you honestly which situation you\u2019re in.',
      },
      {
        question: 'What\u2019s the best time of year to waterproof in the Helderberg?',
        answer:
          'Before winter \u2014 ideally autumn, while surfaces are still dry enough for proper application and before the rainy season tests any weak points.',
      },
    ],
    metaTitle: 'Waterproofing Helderberg | Roof & Wall Waterproofing Somerset West',
    metaDescription:
      'Professional roof, balcony and wall waterproofing in Strand, Gordon\u2019s Bay and Somerset West. Stop leaks before the Cape winter rains arrive.',
  },
  {
    slug: 'paving',
    name: 'Paving',
    tagline: 'Driveways, patios and walkways',
    description:
      'Paving that\u2019s laid without proper base preparation shifts, sinks and cracks within a season or two \u2014 especially on the sandy and clay soils common across parts of the Helderberg Basin. NGSMS installs new paving and repairs and re-levels existing driveways, patios and walkways, with attention to correct base compaction and drainage falls so the finished surface actually stays flat and stable over time rather than needing redoing.',
    whatsIncluded: [
      'New driveway, patio and walkway paving',
      'Re-levelling and repair of sunken or shifted existing paving',
      'Proper base preparation and compaction \u2014 not just relaying bricks on soft ground',
      'Correct drainage falls so water runs off rather than pooling',
      'Range of paving brick and finish options',
    ],
    faqs: [
      {
        question: 'Why has my existing paving sunk in patches?',
        answer:
          'Almost always poor base compaction from the original install, or water undermining the base over time. We can usually lift, re-level and properly re-compact the affected area rather than repaving the whole surface.',
      },
      {
        question: 'How long does a driveway repaving job take?',
        answer:
          'Depends on size and ground condition, but most residential driveways are completed within a few days once the base work is done.',
      },
    ],
    metaTitle: 'Paving Helderberg | Driveway Paving & Repairs Somerset West, Strand',
    metaDescription:
      'New paving, repairs and re-levelling for driveways and outdoor areas in the Helderberg Basin. Neat, durable work built for local conditions.',
  },
  {
    slug: 'plumbing',
    name: 'Plumbing',
    tagline: 'Leaks, geysers, installations and repairs',
    description:
      'From a dripping tap that\u2019s quietly running up your water bill to a burst geyser that needs sorting the same day, NGSMS provides qualified plumbing for homes, body corporates and complexes across the Helderberg Basin. We handle the everyday repairs as well as full geyser replacements and new installations, and we\u2019re used to working with body corporate maintenance schedules and communal systems in security complexes, not just single residential properties.',
    whatsIncluded: [
      'Leak detection and repair \u2014 taps, pipes, toilets, connections',
      'Geyser repairs, replacements and installations',
      'New installations for renovations and extensions',
      'Body corporate and complex plumbing maintenance',
      'Blocked drain clearing',
    ],
    faqs: [
      {
        question: 'Do you handle emergency plumbing call-outs?',
        answer:
          'Yes, we prioritise urgent issues like burst geysers or major leaks \u2014 message us on WhatsApp and we\u2019ll confirm the fastest available slot.',
      },
      {
        question: 'Can you work with body corporates directly?',
        answer:
          'Yes, we regularly handle plumbing maintenance for complexes and body corporates and can work with your managing agent on scheduling and invoicing.',
      },
    ],
    metaTitle: 'Plumber Helderberg | Somerset West, Strand & Gordon\u2019s Bay',
    metaDescription:
      'Reliable plumbing repairs, geyser work and installations in Strand, Gordon\u2019s Bay and Somerset West. Fast response from a local Helderberg team.',
  },
  {
    slug: 'electrical',
    name: 'Electrical',
    tagline: 'Safe, compliant electrical work',
    description:
      'Electrical work isn\u2019t somewhere to cut corners \u2014 NGSMS carries out repairs, installations and fault-finding to code across the Helderberg Basin, with Certificate of Compliance (COC) issued where required, which matters both for your safety and for property sales or insurance purposes. Whether it\u2019s a DB board that keeps tripping, a new circuit for a renovation, or general fault-finding on an intermittent problem, the work is done properly the first time.',
    whatsIncluded: [
      'Electrical fault-finding and repairs',
      'DB board upgrades and repairs',
      'New circuit installations for renovations and additions',
      'Certificate of Compliance (COC) issued where required',
      'General electrical maintenance for homes and complexes',
    ],
    faqs: [
      {
        question: 'Do I need a COC and when?',
        answer:
          'A Certificate of Compliance is legally required when selling a property, and is good practice after any significant electrical work. We can issue one once work is inspected and compliant.',
      },
      {
        question: 'My DB board keeps tripping \u2014 can you find out why?',
        answer:
          'Yes, fault-finding on tripping boards or intermittent electrical issues is one of the most common calls we get. We diagnose the actual cause rather than just resetting the breaker.',
      },
    ],
    metaTitle: 'Electrician Helderberg | Electrical Services Somerset West & Strand',
    metaDescription:
      'Safe electrical repairs, installations and DB board work in the Helderberg. Qualified electricians serving Strand, Gordon\u2019s Bay and Somerset West.',
  },
  {
    slug: 'pool-fibre-lining',
    name: 'Pool Fibre Lining',
    tagline: 'Restore your pool, don\u2019t replace it',
    description:
      'A cracked, faded or leaking pool doesn\u2019t always need replacing \u2014 fibreglass relining restores the surface with a smooth, durable finish that outlasts standard pool paint by years, not seasons. NGSMS handles fibreglass pool lining and renovation across the Helderberg Basin, addressing the underlying issue (usually a crack or old, porous surface) before applying the new lining, so the fix actually holds rather than needing redoing after one summer.',
    whatsIncluded: [
      'Fibreglass relining for cracked, faded or leaking pools',
      'Surface preparation and crack repair before relining',
      'Colour options for the finished lining',
      'Assessment of whether relining or a different repair approach suits your pool',
      'Finish that outlasts standard pool paint',
    ],
    faqs: [
      {
        question: 'How long does fibreglass pool lining last compared to paint?',
        answer:
          'Fibreglass lining typically lasts significantly longer than paint, which needs reapplying every year or two. It\u2019s a more durable, longer-term fix.',
      },
      {
        question: 'Can you reline a pool that\u2019s actively leaking?',
        answer:
          'Yes \u2014 we identify and address the crack or damage causing the leak as part of the relining process, not just cosmetically cover it.',
      },
    ],
    metaTitle: 'Pool Fibre Lining Helderberg | Fibreglass Pool Renovation',
    metaDescription:
      'Professional fibreglass pool lining and renovations in Strand, Gordon\u2019s Bay and Somerset West. Smooth, durable finish that lasts season after season.',
  },
  {
    slug: 'high-pressure-cleaning',
    name: 'High-Pressure Cleaning',
    tagline: 'Driveways, walls, roofs and more',
    description:
      'Moss, algae and grime build up fast in the Helderberg\u2019s damp winters and salty coastal air, leaving driveways, walls and roofs looking tired even when nothing is actually wrong with them. NGSMS provides high-pressure cleaning that lifts years of build-up from paving, walls, roof tiles and outdoor areas, with pressure levels adjusted to the surface so delicate finishes aren\u2019t damaged in the process.',
    whatsIncluded: [
      'Driveway and paving pressure cleaning',
      'Exterior wall and facade cleaning',
      'Roof tile cleaning (moss and algae removal)',
      'Pressure adjusted per surface to avoid damage',
      'Outdoor entertainment areas and patios',
    ],
    faqs: [
      {
        question: 'Will high-pressure cleaning damage my paving or roof tiles?',
        answer:
          'Not when done correctly \u2014 we adjust pressure and technique to the surface. Delicate or older surfaces are treated more gently than robust concrete paving, for example.',
      },
      {
        question: 'How often should driveways be pressure cleaned?',
        answer:
          'Most Helderberg properties benefit from an annual clean, or more often in shaded, damp areas prone to moss.',
      },
    ],
    metaTitle: 'Pressure Cleaning Helderberg | Driveways, Paving & Outdoor Areas',
    metaDescription:
      'High-pressure cleaning for driveways, paving, walls and outdoor surfaces in Strand, Gordon\u2019s Bay and Somerset West. Fast, effective results that make surfaces look new again.',
  },
  {
    slug: 'rubble-removal',
    name: 'Rubble Removal',
    tagline: 'Site and garden clearance',
    description:
      'Renovation rubble, garden refuse and general site waste pile up fast and become their own logistical problem if left too long. NGSMS provides fast, reliable rubble and garden waste removal across the Helderberg Basin for renovation sites, garden clean-ups and general clearance jobs, so you\u2019re not stuck coordinating skip hire and disposal yourself on top of everything else.',
    whatsIncluded: [
      'Renovation and building rubble removal',
      'Garden refuse and green waste clearance',
      'General site clean-up after other trade work',
      'Load-and-go service \u2014 no skip hire coordination needed on your end',
      'Same or next-day availability for most jobs',
    ],
    faqs: [
      {
        question: 'Do I need to sort the rubble before you collect it?',
        answer:
          'Not necessarily \u2014 tell us what\u2019s there when you book and we\u2019ll come prepared. Separating hazardous materials (like old asbestos sheeting) is worth flagging upfront.',
      },
      {
        question: 'Can you clear a site after a renovation or demolition?',
        answer:
          'Yes, this is one of the more common jobs we do \u2014 clearing a site properly so it\u2019s ready for the next stage of work.',
      },
    ],
    metaTitle: 'Rubble Removal Helderberg | Building & Garden Waste Somerset West',
    metaDescription:
      'Fast, clean rubble and garden waste removal in Strand, Gordon\u2019s Bay and Somerset West. We clear the site so you can move on.',
  },
  {
    slug: 'steelwork-welding',
    name: 'Steelwork & Welding',
    tagline: 'Gates, railings, structural work',
    description:
      'From a gate that\u2019s come off its hinges to custom burglar bars or a full set of railings, NGSMS handles steelwork and welding across the Helderberg Basin \u2014 built either on-site or fabricated in the workshop depending on the job. Coastal air is hard on unprotected steel, so where relevant we\u2019ll talk you through finishing options that hold up better against rust in a salt-air environment.',
    whatsIncluded: [
      'Custom gates, burglar bars and security railings',
      'Structural steelwork and repairs',
      'On-site and workshop welding',
      'Rust-resistant finishing options for coastal properties',
      'Repairs to existing steelwork \u2014 gates, railings, fencing',
    ],
    faqs: [
      {
        question: 'Can you match new steelwork to existing gates or railings?',
        answer:
          'Yes, we can fabricate to match existing style and dimensions, or advise on a fresh design if you\u2019re replacing something entirely.',
      },
      {
        question: 'Do you offer rust protection for steelwork near the coast?',
        answer:
          'Yes \u2014 given the salt air across Strand and Gordon\u2019s Bay, we can advise on and apply finishes that hold up better than standard paint.',
      },
    ],
    metaTitle: 'Steelwork & Welding Helderberg | Custom Fabrication Somerset West',
    metaDescription:
      'Custom steelwork, gates, railings and on-site welding in Strand, Gordon\u2019s Bay and Somerset West. Strong, neat fabrications built to last.',
  },
  {
    slug: 'handyman',
    name: 'Handyman Services',
    tagline: 'The small jobs, handled properly',
    description:
      'Not every job needs its own dedicated tradesperson \u2014 a wobbly cupboard door, a shelf that needs mounting, general small repairs around the house. NGSMS\u2019s handyman service covers the everyday maintenance that would otherwise mean tracking down and coordinating a separate contractor for something that takes an hour, across homes and complexes throughout the Helderberg Basin.',
    whatsIncluded: [
      'General repairs \u2014 doors, cupboards, fixtures, fittings',
      'Shelf, TV and fixture mounting',
      'Small maintenance jobs that don\u2019t need a specialist trade',
      'Flat-pack assembly and general installations',
      'One call for a list of small jobs, rather than several contractors',
    ],
    faqs: [
      {
        question: 'What counts as a handyman job versus needing a specialist?',
        answer:
          'General repairs, mounting, and small fixes are handyman work. If something turns out to need a licensed electrician or plumber, we\u2019ll tell you honestly and can coordinate that through NGSMS anyway.',
      },
      {
        question: 'Can I bundle several small jobs into one visit?',
        answer:
          'Yes \u2014 that\u2019s exactly what this service is for. List everything that needs doing and we\u2019ll handle it in one visit where possible.',
      },
    ],
    metaTitle: 'Handyman Helderberg | Reliable Home Maintenance Somerset West, Strand',
    metaDescription:
      'Trusted handyman services for repairs, installations and general maintenance in the Helderberg Basin. One reliable team for the jobs that need doing.',
  },
  {
    slug: 'subcontractor-work',
    name: 'Subcontractor Work',
    tagline: 'Trade support for other contractors',
    description:
      'NGSMS works alongside other contractors, builders and property managers as a reliable multi-trade subcontractor across the Helderberg Basin \u2014 useful when a main contractor needs extra hands on a specific trade, or a property manager needs one dependable team across several skill sets instead of juggling multiple subcontractors.',
    whatsIncluded: [
      'Multi-trade subcontracting for builders and main contractors',
      'Support across all 11 NGSMS trade services as needed',
      'Property management maintenance support',
      'Reliable scheduling and communication for larger projects',
      'Single point of contact across multiple trades',
    ],
    faqs: [
      {
        question: 'Do you work under other contractors on larger projects?',
        answer:
          'Yes, we regularly subcontract specific trades \u2014 painting, waterproofing, electrical and more \u2014 to main contractors and builders across the Helderberg.',
      },
      {
        question: 'Can property managers use NGSMS for ongoing maintenance across multiple trades?',
        answer:
          'Yes, this is a common arrangement \u2014 one point of contact covering multiple trade needs rather than managing several separate contractors.',
      },
    ],
    metaTitle: 'Subcontractor Services Helderberg | Trade Support Somerset West, Strand',
    metaDescription:
      'Reliable subcontractor and trade support for contractors and property managers across Strand, Gordon\u2019s Bay and Somerset West.',
  },
]

export function getService(slug: string) {
  return services.find((s) => s.slug === slug)
}
