import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Solar Forge Creative Studio | NGMS Admin',
  robots: { index: false, follow: false },
}

export default function MediaStudioLayout({ children }: { children: React.ReactNode }) {
  return children
}
