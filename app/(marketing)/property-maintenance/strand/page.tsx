import type { Metadata } from 'next'
import SegmentLandingPage from '@/components/SegmentLandingPage'
import { segmentConfigs } from '@/lib/segment-landings'
export const metadata: Metadata = { alternates: { canonical: '/property-maintenance/strand' }, title: segmentConfigs.propertyStrand.title, description: segmentConfigs.propertyStrand.intro }
export default function Page() { return <SegmentLandingPage config={segmentConfigs.propertyStrand} /> }
