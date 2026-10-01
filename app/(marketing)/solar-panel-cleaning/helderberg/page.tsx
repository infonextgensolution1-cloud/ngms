import type { Metadata } from 'next'
import SegmentLandingPage from '@/components/SegmentLandingPage'
import { segmentConfigs } from '@/lib/segment-landings'
export const metadata: Metadata = { title: segmentConfigs.solar.title, description: segmentConfigs.solar.intro }
export default function Page() { return <SegmentLandingPage config={segmentConfigs.solar} /> }
