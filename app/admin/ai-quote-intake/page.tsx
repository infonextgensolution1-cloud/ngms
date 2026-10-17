'use client'

import { useState } from 'react'
import StaffGate from '@/components/admin/StaffGate'
import { supabase } from '@/lib/supabaseClient'

export default function AiQuoteIntakePage() {
  return <StaffGate title="AI Quote Intake"><AiQuoteIntake /></StaffGate>
}

function AiQuoteIntake() {
  const [notes, setNotes] = useState('')
  const [suburb, setSuburb] = useState('Strand')
  const [result, setResult] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function analyse() {
    setBusy(true); setError(''); setResult('')
    try {
      const { data } = await supabase.auth.getSession()
      const token = data.session?.access_token
      if (!token) throw new Error('Sign in again.')
      const res = await fetch('/api/ai/quote-lines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify({ notes, suburb }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.error || 'AI intake failed')
      setResult(JSON.stringify(body, null, 2))
    } catch (e) { setError((e as Error).message) } finally { setBusy(false) }
  }

  return <main className="min-h-[70vh] bg-jet px-4 py-16"><div className="max-w-4xl mx-auto">
    <p className="kicker">Solar Forge · AI Ops</p>
    <h1 className="text-3xl sm:text-5xl">AI-assisted quote intake</h1>
    <p className="text-mist mt-3 max-w-2xl">Paste a WhatsApp enquiry, site note or photo description. The protected AI tool structures the job into quote-ready lines for staff review. Nothing is sent or approved automatically.</p>
    <div className="grid lg:grid-cols-2 gap-5 mt-8">
      <section className="panel p-5">
        <label className="block text-sm font-semibold text-paper">Area</label>
        <input value={suburb} onChange={e=>setSuburb(e.target.value)} className="field mt-2" />
        <label className="block text-sm font-semibold text-paper mt-5">Lead / site notes</label>
        <textarea value={notes} onChange={e=>setNotes(e.target.value)} className="field mt-2 min-h-[260px]" placeholder="Example: 38 solar panels on a double-storey home in Strand. Heavy pollen and bird droppings. Customer wants cleaning this month." />
        <button type="button" disabled={!notes.trim() || busy} onClick={analyse} className="btn-quote mt-4 w-full">{busy ? 'Analysing…' : 'Build quote intake'}</button>
        {error && <p role="alert" className="text-orange text-sm mt-3">{error}</p>}
      </section>
      <section className="panel p-5">
        <p className="tag">Staff review required</p>
        <h2 className="text-xl mt-1">Structured draft</h2>
        {result ? <pre className="mt-4 whitespace-pre-wrap text-xs text-mist bg-jet rounded-panel p-4 overflow-auto max-h-[480px]">{result}</pre> : <p className="text-mist mt-4 text-sm">The AI draft will appear here. Verify scope, quantities, pricing and site conditions before creating or sending a quote.</p>}
      </section>
    </div>
  </div></main>
}
