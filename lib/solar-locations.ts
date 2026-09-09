export type SolarLocation = {
  slug: string
  town: string
  heading: string
  intro: string
  localAngle: string
  nearby: string[]
  callout?: string
  metaTitle: string
  metaDescription: string
}

export const solarLocations: SolarLocation[] = [
  {
    slug: 'somerset-west',
    town: 'Somerset West',
    heading: 'Solar Panel Cleaning in Somerset West',
    intro:
      'Somerset West homes and estates run some of the larger residential solar systems in the Helderberg, and larger arrays lose more real output when panels are left dirty. NGSMS cleans residential and estate solar installations across Somerset West using soft-wash methods and purified water — safe for the panel glass, safe for your manufacturer warranty.',
    localAngle:
      'Properties further inland from the coast tend to pick up more dust and pollen than salt, particularly through the dry summer months and around the surrounding farmland. That build-up is less visible than salt filming but sits on the glass just the same, so a clean every 4–6 months keeps output where it should be.',
    nearby: ['Helderberg Village', 'Heldervue', 'Parel Vallei', 'Firgrove'],
    metaTitle: 'Solar Panel Cleaning Somerset West | NGSMS Helderberg',
    metaDescription:
      'Professional solar panel cleaning in Somerset West. Soft-wash, purified water, warranty-safe. No callout fee in the Helderberg Basin. From R550.',
  },
  {
    slug: 'strand',
    town: 'Strand',
    heading: 'Solar Panel Cleaning in Strand',
    intro:
      'Strand sits right on the coast, and that shows up on solar panels faster than most homeowners expect. NGSMS cleans residential and complex solar installations throughout Strand with soft-wash methods and purified water, restoring output without scratching the glass or affecting your warranty.',
    localAngle:
      'Salt spray is the main culprit this close to the water. It leaves a fine film that dulls panels well before anything looks obviously dirty from the ground, and it builds back up quickly — which is why coastal Strand properties usually benefit from a shorter cleaning interval than homes further inland.',
    nearby: ['Rusthof', 'Broadlands', 'Van Ryneveld', 'Greenways'],
    metaTitle: 'Solar Panel Cleaning Strand | NGSMS Helderberg',
    metaDescription:
      'Solar panel cleaning in Strand. Coastal salt build-up removed with soft-wash and purified water. No callout fee. From R550.',
  },
  {
    slug: 'gordons-bay',
    town: "Gordon's Bay",
    heading: "Solar Panel Cleaning in Gordon's Bay",
    intro:
      "Gordon's Bay properties deal with two things at once: salt air off the water and wind coming down off the mountain. Both leave deposits on solar panels. NGSMS cleans solar installations across Gordon's Bay with soft-wash methods and purified water, including steeper and higher roofs where safe access matters.",
    localAngle:
      'Wind-driven grit combined with salt spray makes for a more stubborn film than dust alone, and many Gordon’s Bay roofs sit at a pitch that makes DIY cleaning genuinely unsafe. We assess roof access and pitch before quoting, so the price you get accounts for the actual job.',
    nearby: ['Temperance Town', 'Sunny Seas', 'Mountainside', 'Harbour Island'],
    metaTitle: "Solar Panel Cleaning Gordon's Bay | NGSMS Helderberg",
    metaDescription:
      "Solar panel cleaning in Gordon's Bay. Salt and wind build-up removed safely, including steep roofs. No callout fee. From R550.",
  },
  {
    slug: 'kleinmond',
    town: 'Kleinmond',
    heading: 'Solar Panel Cleaning in Kleinmond',
    intro:
      'NGSMS travels through to Kleinmond for solar panel cleaning on homes, guesthouses and smallholdings. Coastal Overberg properties take a hard time from salt and wind, and panels here often go longer between cleans simply because fewer contractors come out this far.',
    localAngle:
      'Salt off the bay combined with fynbos dust and summer wind puts a stubborn film on panels. Because we are travelling from the Helderberg, we usually schedule Overberg work in blocks \u2014 so if neighbours book together, everyone gets a better run and the callout is shared.',
    nearby: ['Betty\u2019s Bay', 'Pringle Bay', 'Hangklip'],
    callout: 'R350 callout applies in the Overberg.',
    metaTitle: 'Solar Panel Cleaning Kleinmond | NGSMS Overberg',
    metaDescription:
      'Solar panel cleaning in Kleinmond and the Overberg. Soft-wash, purified water, warranty-safe. R350 callout. Cleaning from R550.',
  },
  {
    slug: 'grabouw-elgin',
    town: 'Grabouw & Elgin',
    heading: 'Solar Panel Cleaning in Grabouw & Elgin',
    intro:
      'Grabouw and the Elgin valley run some of the larger solar installations in our service area \u2014 farms, packhouses, cold stores and guest farms. NGSMS cleans agricultural and commercial arrays as well as residential systems, with volume pricing that makes larger installations worthwhile.',
    localAngle:
      'Orchard dust, spray drift and harvest-season traffic put a heavier load on panels here than on a typical suburban roof. Farm and packhouse arrays are usually large enough to fall into our 41+ panel volume rate, which brings the per-panel cost down considerably.',
    nearby: ['Elgin Valley', 'Bot River', 'Villiersdorp side'],
    callout: 'R350 callout applies in the Overberg.',
    metaTitle: 'Solar Panel Cleaning Grabouw & Elgin | NGSMS Overberg',
    metaDescription:
      'Solar panel cleaning for farms, packhouses and homes in Grabouw and Elgin. Volume rates on large arrays. R350 callout.',
  },
  {
    slug: 'bot-river',
    town: 'Bot River',
    heading: 'Solar Panel Cleaning in Bot River',
    intro:
      'NGSMS covers Bot River for solar panel cleaning on farms, wine estates, guesthouses and homes. Rural Overberg systems are often bigger and dirtier than suburban ones, and they are frequently the properties getting the least regular attention.',
    localAngle:
      'Wind-driven farm dust and gravel-road grit build up fast out here, and many rural systems have never had a proper clean since installation. First cleans on neglected arrays often show the biggest output recovery we see anywhere.',
    nearby: ['Caledon side', 'Hermanus road', 'Van der Stel Pass'],
    callout: 'R350 callout applies in the Overberg.',
    metaTitle: 'Solar Panel Cleaning Bot River | NGSMS Overberg',
    metaDescription:
      'Solar panel cleaning for farms, estates and homes in Bot River and the Overberg. Volume rates available. R350 callout.',
  },
]

export function getSolarLocation(slug: string) {
  return solarLocations.find((l) => l.slug === slug)
}
