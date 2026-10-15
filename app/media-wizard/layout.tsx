import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'NGMS Solar Forge Media Wizard',
  manifest: '/media-wizard/manifest.webmanifest',
  robots: { index: false, follow: false },
  appleWebApp: { capable: true, title: 'Solar Forge', statusBarStyle: 'black-translucent' },
}

export default function MediaWizardLayout({ children }: { children: React.ReactNode }) {
  return children
}
