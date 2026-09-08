import SolarLandingPage from '@/components/SolarLandingPage'

export const metadata = {
  title: 'Solar Panel Cleaning Helderberg | NGSMS',
  description:
    'Eco-friendly solar panel cleaning across the Helderberg Basin. Tiered pricing from R550, no callout fee in Strand, Gordon’s Bay or Somerset West.',
}

export default function Page() {
  return (
    <SolarLandingPage
      town="the Helderberg"
      areaLine="Serving Strand · Somerset West · Gordon’s Bay · Helderberg Basin"
      heading="Solar Panel Cleaning in the Helderberg Basin"
      intro="Salt air, summer wind and spring pollen quietly cost you output. We clean panels properly — purified water, soft brush, no chemicals — for homes, estates and businesses across the Helderberg."
      nearby={[
        'Strand',
        'Somerset West',
        'Gordon’s Bay',
        'Helderberg Village',
        'Heldervue',
        'Firgrove',
        'Sir Lowry’s Pass',
      ]}
    />
  )
}
