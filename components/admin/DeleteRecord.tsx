'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Trash2 } from 'lucide-react'

/**
 * Two-tap delete: the first tap opens a confirm box, the second deletes and
 * goes back to the list. Errors (e.g. "linked to invoice INV-0003") show inline.
 */
export default function DeleteRecord({
  label,
  confirmText,
  onDelete,
  redirectTo,
}: {
  label: string
  confirmText: string
  onDelete: () => Promise<void>
  redirectTo: string
}) {
  const router = useRouter()
  const [asking, setAsking] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function run() {
    setBusy(true)
    setError('')
    try {
      await onDelete()
      router.push(redirectTo)
    } catch (e) {
      setError((e as Error).message)
      setBusy(false)
    }
  }

  if (!asking) {
    return (
      <button
        onClick={() => setAsking(true)}
        className="inline-flex items-center gap-1.5 border border-darkgrey hover:border-orange text-mist hover:text-orange text-sm font-heading font-semibold px-3.5 py-2 rounded-btn"
      >
        <Trash2 className="w-4 h-4" /> {label}
      </button>
    )
  }

  return (
    <div className="w-full bg-cardgrey border border-orange rounded-card p-3.5">
      <p className="text-sm text-paper">{confirmText}</p>
      <p className="text-xs text-mist mt-1">This can&apos;t be undone.</p>
      {error && <p className="text-xs text-orange mt-2">{error}</p>}
      <div className="flex gap-2 mt-3">
        <button
          onClick={run}
          disabled={busy}
          className="inline-flex items-center gap-1.5 bg-orange hover:opacity-90 text-white text-sm font-heading font-semibold px-3.5 py-2 rounded-btn disabled:opacity-50"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />} Yes, delete
        </button>
        <button
          onClick={() => {
            setAsking(false)
            setError('')
          }}
          disabled={busy}
          className="text-sm text-mist hover:text-paper px-3 py-2"
        >
          Keep it
        </button>
      </div>
    </div>
  )
}
