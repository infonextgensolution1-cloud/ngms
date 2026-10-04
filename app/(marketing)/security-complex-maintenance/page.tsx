import type { Metadata } from 'next'
import SegmentLandingPage from '@/components/SegmentLandingPage'
import { segmentConfigs } from '@/lib/segment-landings'
export const metadata: Metadata = { alternates: { canonical: '/security-complex-maintenance' }, title: segmentConfigs.securityComplex.title, description: segmentConfigs.securityComplex.intro }
export default function Page() { return <SegmentLandingPage config={segmentConfigs.securityComplex} /> }
