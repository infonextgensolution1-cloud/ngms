import { notFound } from 'next/navigation'
import SolarLandingPage from '@/components/SolarLandingPage'
import { solarLocations, getSolarLocation } from '@/lib/solar-locations'

export function generateStaticParams() {
  return solarLocations.map((l) => ({ location: l.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ location: string }> }) {
  const { location } = await params
  const loc = getSolarLocation(location)
  if (!loc) return {}
  return {
    title: loc.metaTitle,
    description: loc.metaDescription,
  }
}

export default async function SolarLocationPage({ params }: { params: Promise<{ location: string }> }) {
  const { location } = await params
  const loc = getSolarLocation(location)
  if (!loc) notFound()

  return (
    <SolarLandingPage
      town={loc.town}
      areaLine={`Serving ${loc.town} · ${loc.nearby.join(' · ')}`}
      heading={loc.heading}
      intro={loc.intro}
      nearby={loc.nearby}
      localAngle={loc.localAngle}
      callout={loc.callout}
      otherAreas={solarLocations
        .filter((l) => l.slug !== loc.slug)
        .map((l) => ({ slug: l.slug, town: l.town }))}
    />
  )
}
