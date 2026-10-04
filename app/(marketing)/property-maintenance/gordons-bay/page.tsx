import type { Metadata } from 'next'
import SegmentLandingPage from '@/components/SegmentLandingPage'
import { segmentConfigs } from '@/lib/segment-landings'
export const metadata: Metadata = { alternates: { canonical: '/property-maintenance/gordons-bay' }, title: segmentConfigs.propertyGordons.title, description: segmentConfigs.propertyGordons.intro }
export default function Page() { return <SegmentLandingPage config={segmentConfigs.propertyGordons} /> }
