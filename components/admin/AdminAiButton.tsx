'use client'

import Link from 'next/link'
import { Sparkles } from 'lucide-react'

export default function AdminAiButton({ contextType, contextId, label = 'AI Assist' }: { contextType: 'lead'|'client'|'quote'|'job'; contextId: string; label?: string }) {
  const params = new URLSearchParams({ type: contextType, id: contextId })
  return (
    <Link href={`/admin/ai?${params.toString()}`} className="inline-flex items-center gap-1.5 bg-blue-fill hover:bg-blue-dark text-white font-heading font-semibold px-3 py-2 rounded-btn text-sm">
      <Sparkles className="w-4 h-4" /> {label}
    </Link>
  )
}
