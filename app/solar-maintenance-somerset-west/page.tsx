import SolarLandingPage from '@/components/SolarLandingPage'

export const metadata = {
  title: 'Solar Panel Cleaning & Maintenance Somerset West | NGSMS',
  description:
    'Solar panel cleaning and maintenance in Somerset West. Eco-friendly purified-water cleaning, tiered pricing from R550, no callout fee in the Helderberg zone.',
}

export default function Page() {
  return (
    <SolarLandingPage
      town="Somerset West"
      areaLine="Serving Somerset West · Helderberg Village · Heldervue · Strand"
      heading="Solar Panel Cleaning & Maintenance in Somerset West"
      intro="Keep your system producing what it should. Regular cleaning and a proper visual check of panels and mounting — for homes, estates and business premises around Somerset West."
      nearby={[
        'Somerset West',
        'Helderberg Village',
        'Heldervue',
        'Parel Vallei',
        'Somerset Ridge',
        'Strand',
        'Firgrove',
      ]}
    />
  )
}
