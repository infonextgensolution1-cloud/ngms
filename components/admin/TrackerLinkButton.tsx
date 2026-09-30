'use client'

import { useState } from 'react'
import { Link2, Check } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { site } from '@/lib/site'

const newToken = () => (crypto.randomUUID() + crypto.randomUUID()).replace(/-/g, '')

/** Creates (once) and copies the client-facing job tracker link. */
export default function TrackerLinkButton({ jobId }: { jobId: string }) {
  const [state, setState] = useState<'idle' | 'busy' | 'copied' | 'error'>('idle')
  const [url, setUrl] = useState('')

  async function run() {
    setState('busy')
    const { data, error } = await supabase.from('jobs').select('tracker_token').eq('id', jobId).single()
    if (error) return setState('error')
    let token = (data as { tracker_token: string | null } | null)?.tracker_token
    if (!token) {
      token = newToken()
      const { error: upErr } = await supabase.from('jobs').update({ tracker_token: token }).eq('id', jobId)
      if (upErr) return setState('error')
    }
    const link = `${site.url}/track/${token}`
    setUrl(link)
    try {
      await navigator.clipboard.writeText(link)
    } catch {
      /* link is still shown below */
    }
    setState('copied')
  }

  return (
    <div className="no-print">
      <button
        onClick={run}
        disabled={state === 'busy'}
        className="inline-flex items-center gap-2 border border-darkgrey hover:border-blue text-mist hover:text-paper text-sm font-heading font-semibold px-3.5 py-2 rounded-btn"
      >
        {state === 'copied' ? <Check className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
        {state === 'copied' ? 'Client link copied' : 'Copy client tracker link'}
      </button>
      {state === 'error' && (
        <p className="text-orange text-xs mt-1">Couldn&rsquo;t create the link. Has the tracker_token migration been run?</p>
      )}
      {url && (
        <a
          href={`https://wa.me/?text=${encodeURIComponent('Track your job here: ' + url)}`}
          target="_blank"
          rel="noreferrer"
          className="block text-xs text-blue mt-1"
        >
          Send via WhatsApp
        </a>
      )}
    </div>
  )
}
