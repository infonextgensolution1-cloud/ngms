import PortalClient from './PortalClient'

// Keep the portal route request-rendered so a stale static homepage response
// cannot be served in place of the client sign-in screen.
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function CustomerPortalPage() {
  return <PortalClient />
}
