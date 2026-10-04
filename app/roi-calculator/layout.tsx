import type { Metadata } from 'next'

// page.tsx is a client component and can't export metadata, so it lives here.
export const metadata: Metadata = { alternates: { canonical: '/roi-calculator' },
  title: 'Solar Cleaning ROI Calculator | NextGen Solar Clean & Maintenance',
  description:
    'Work out what dirty solar panels are costing you each month. Enter your panel count and monthly solar saving to see the break-even on a professional clean in Strand, Gordon’s Bay & Somerset West.',
}

export default function RoiCalculatorLayout({ children }: { children: React.ReactNode }) {
  return children
}
