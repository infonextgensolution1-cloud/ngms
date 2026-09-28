import type { Metadata } from 'next'
import AdminApp from '@/components/admin/AdminApp'

// Admin only: makes /admin installable as "NGMS Admin" on a phone's home screen
// and viewable offline. The public website gets no manifest or service worker.
export const metadata: Metadata = {
  title: 'NGMS Admin',
  manifest: '/admin.webmanifest',
  robots: { index: false, follow: false },
  appleWebApp: { capable: true, title: 'NGMS Admin', statusBarStyle: 'black-translucent' },
  icons: { apple: '/admin-app/apple-touch-icon.png' },
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminApp>{children}</AdminApp>
}
