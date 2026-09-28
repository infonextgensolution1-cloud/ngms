import type { Metadata } from 'next'

// page.tsx is a client component and can't export metadata, so it lives here.
export const metadata: Metadata = {
  title: 'Solar Cleaning ROI Calculator | NGSMS',
  description:
    'Work out what dirty solar panels are costing you each month. Enter your panel count and electricity bill to see the payback on a professional clean in Strand, Gordon’s Bay & Somerset West.',
}

export default function RoiCalculatorLayout({ children }: { children: React.ReactNode }) {
  return children
}
