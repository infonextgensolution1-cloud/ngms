import SolarLandingPage from '@/components/SolarLandingPage'

export const metadata = {
  title: 'Solar Panel Cleaning Gordon’s Bay & Overberg | NGSMS',
  description:
    'Solar panel cleaning in Gordon’s Bay and the Overberg. Coastal salt build-up removed with purified water. From R550, flat R350 callout outside the Helderberg zone.',
}

export default function Page() {
  return (
    <SolarLandingPage
      town="Gordon’s Bay"
      areaLine="Serving Gordon’s Bay · Strand · Rooi Els · Pringle Bay · Kleinmond"
      heading="Solar Panel Cleaning in Gordon’s Bay & the Overberg"
      intro="Right on the coast, salt film builds up fast and it costs you kilowatts. We clean panels with purified water and soft brushes — homes, guest houses, farms and commercial roofs from Gordon’s Bay through the Overberg."
      nearby={[
        'Gordon’s Bay',
        'Strand',
        'Rooi Els',
        'Pringle Bay',
        'Betty’s Bay',
        'Kleinmond',
        'Grabouw',
        'Elgin',
        'Bot River',
      ]}
    />
  )
}
