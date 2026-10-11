import type { Metadata } from 'next'
import SegmentLandingPage from '@/components/SegmentLandingPage'
import { segmentConfigs } from '@/lib/segment-landings'
export const metadata: Metadata = { alternates: { canonical: '/body-corporate-maintenance' }, title: segmentConfigs.bodyCorporate.title, description: segmentConfigs.bodyCorporate.intro }
export default function Page() { return <main className="ngms-northpoint-page ngms-northpoint-bodycorp"><SegmentLandingPage config={segmentConfigs.bodyCorporate} /></main> }
