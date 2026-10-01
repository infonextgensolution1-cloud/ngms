import type { Metadata } from 'next'
import SegmentLandingPage from '@/components/SegmentLandingPage'
import { segmentConfigs } from '@/lib/segment-landings'
export const metadata: Metadata = { title: segmentConfigs.bodyCorporate.title, description: segmentConfigs.bodyCorporate.intro }
export default function Page() { return <SegmentLandingPage config={segmentConfigs.bodyCorporate} /> }
