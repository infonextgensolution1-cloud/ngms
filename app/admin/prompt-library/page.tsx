'use client'

import StaffGate from '@/components/admin/StaffGate'
import PromptLibrary from '@/components/admin/prompts/PromptLibrary'

export default function AdminPromptLibraryPage() {
  return (
    <StaffGate title="NGMS Prompt Library">
      <main className="min-h-[70vh] bg-jet">
        <PromptLibrary />
      </main>
    </StaffGate>
  )
}
