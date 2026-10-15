import type { Metadata } from 'next'
import SegmentLandingPage from '@/components/SegmentLandingPage'
import { segmentConfigs } from '@/lib/segment-landings'
export const metadata: Metadata = { alternates: { canonical: '/property-maintenance/somerset-west' }, title: segmentConfigs.propertySomerset.title, description: segmentConfigs.propertySomerset.intro }
export default function Page() { return <SegmentLandingPage config={segmentConfigs.propertySomerset} /> }
