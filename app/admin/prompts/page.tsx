'use client'

import StaffGate from '@/components/admin/StaffGate'
import PromptDashboard from '@/components/admin/prompts/PromptDashboard'

export default function AdminPromptsPage() {
  return (
    <StaffGate title="Prompt Dashboard">
      <main className="min-h-[70vh] bg-jet">
        <PromptDashboard />
      </main>
    </StaffGate>
  )
}
