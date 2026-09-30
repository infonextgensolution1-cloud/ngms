'use client'

import StaffGate from '@/components/admin/StaffGate'
import TrafficDashboard from '@/components/admin/analytics/TrafficDashboard'

export default function AdminAnalyticsPage() {
  return (
    <StaffGate title="Site Traffic">
      <main className="min-h-[70vh] bg-jet">
        <TrafficDashboard />
      </main>
    </StaffGate>
  )
}
