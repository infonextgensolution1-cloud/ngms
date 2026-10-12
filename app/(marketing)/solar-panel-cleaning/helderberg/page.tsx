import type { Metadata } from 'next'
import FormulaSolarLandingPage from '@/components/FormulaSolarLandingPage'
import { segmentConfigs } from '@/lib/segment-landings'

export const metadata: Metadata = {
  alternates: { canonical: '/solar-panel-cleaning/helderberg' },
  title: segmentConfigs.solar.title,
  description: segmentConfigs.solar.intro,
}

export default function Page() {
  return <FormulaSolarLandingPage />
}
