import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Publishing & Attribution | NGMS Admin',
  robots: { index: false, follow: false },
}

export default function MediaPublishingLayout({ children }: { children: React.ReactNode }) {
  return children
}
