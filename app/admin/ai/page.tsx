'use client'

import { useEffect, useState } from 'react'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { supabase } from '@/lib/supabaseClient'
import { ArrowLeft, Copy, Loader2, MessageSquareText, Sparkles, WandSparkles } from 'lucide-react'
import Link from 'next/link'

const MODES = [
  { id: 'message', title: 'Message Drafter', icon: MessageSquareText, desc: 'WhatsApp, email and customer follow-ups.' },
  { id: 'prompt', title: 'Prompt Builder', icon: WandSparkles, desc: 'Turn a rough idea into a Solar Forge prompt.' },
  { id: 'quote', title: 'Quote Assistant', icon: Sparkles, desc: 'Draft scope, descriptions and customer-ready wording.' },
  { id: 'marketing', title: 'Marketing Assistant', icon: Sparkles, desc: 'Create approved campaign copy without inventing claims.' },
  { id: 'job', title: 'Job Assistant', icon: Sparkles, desc: 'Job notes, checklists and completion messages.' },
]

export default function NgmsAiPage() {
  const { session, checking } = useAdminAuth()
  const [mode, setMode] = useState('message')
  const [task, setTask] = useState('')
  const [context, setContext] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const [recordLabel, setRecordLabel] = useState('')\n  const [recordContext, setRecordContext] = useState('')

  async function loadRecordContext(type: string, id: string) {
    const token = (await supabase.auth.getSession()).data.session?.access_token
    const res = await fetch('/api/admin/ai/context', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token || ''}` },
      body: JSON.stringify({ type, id }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok || !data.ok) throw new Error(data.error || 'Could not load record context.')
    setRecordLabel(data.label || `${type} ${id}`)
    setRecordContext(data.context || '')
    setContext(data.context || '')
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const type = params.get('type')
    const id = params.get('id')
    if (type && id && ['lead','client','quote','job'].includes(type)) {
      void loadRecordContext(type, id).catch((e) => setError(e instanceof Error ? e.message : 'Could not load record.'))
    }
  })

  async function run() {
    setError('')
    setCopied(false)
    setOutput('')
    if (!task.trim()) return setError('Describe what you want the AI to create.')
    setBusy(true)
    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token
      const res = await fetch('/api/admin/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token || ''}` },
        body: JSON.stringify({ mode, task, context }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.ok) throw new Error(data.error || 'AI request failed.')
      setOutput(data.output || '')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'AI request failed.')
    } finally {
      setBusy(false)
    }
  }

  async function copy() {
    if (!output) return
    await navigator.clipboard.writeText(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  if (checking) return <main className="min-h-[60vh] flex items-center justify-center bg-jet"><Loader2 className="w-6 h-6 text-mist animate-spin" /></main>
  if (!session) return <main className="min-h-[60vh] flex items-center justify-center bg-jet text-paper"><p>Staff login required.</p></main>

  return (
    <main className="min-h-[70vh] bg-jet px-4 py-10 sm:py-16">
      <div className="max-w-6xl mx-auto">
        <Link href="/admin" className="inline-flex items-center gap-1 text-sm text-mist hover:text-paper mb-5"><ArrowLeft className="w-4 h-4" /> Admin</Link>

        <div className="mb-8">
          <div className="inline-flex items-center gap-2 text-blue text-sm font-heading font-semibold mb-2"><Sparkles className="w-4 h-4" /> NGMS AI OPERATIONS</div>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-paper">AI Ops Copilot</h1>
          <p className="text-mist mt-2 max-w-2xl">Draft customer messages, prompts, quote wording, campaigns and job documents from the protected staff panel. Nothing is sent automatically.</p>
          {recordLabel && <div className="mt-4 inline-flex items-center gap-2 border border-blue/40 bg-cardgrey rounded-btn px-3 py-2 text-xs text-paper"><Sparkles className="w-4 h-4 text-blue" /> Context loaded: {recordLabel}</div>}
        </div>

        <div className="grid lg:grid-cols-[280px_1fr] gap-5">
          <aside className="space-y-2">
            {MODES.map(({ id, title, desc, icon: Icon }) => (
              <button key={id} onClick={() => setMode(id)} className={`w-full text-left p-4 rounded-card border transition ${mode === id ? 'border-blue bg-cardgrey' : 'border-darkgrey bg-cardgrey/60 hover:border-blue/60'}`}>
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${mode === id ? 'text-blue' : 'text-mist'}`} />
                  <span className="font-heading font-semibold text-paper">{title}</span>
                </div>
                <p className="text-xs text-mist mt-2 ml-8">{desc}</p>
              </button>
            ))}
          </aside>

          <section className="bg-cardgrey border border-darkgrey rounded-card p-5 sm:p-6">
            <label className="block text-sm font-heading font-semibold text-paper mb-2">What do you need?</label>
            <textarea value={task} onChange={e => setTask(e.target.value)} rows={6} placeholder="Example: Draft a WhatsApp follow-up for a customer who requested an exterior painting quote but has not replied." className="w-full bg-jet border border-darkgrey text-paper rounded-btn px-4 py-3 focus:outline-none focus:border-blue resize-y" />

            <label className="block text-sm font-heading font-semibold text-paper mt-5 mb-2">Context</label>
            <textarea value={context} onChange={e => setContext(e.target.value)} rows={5} placeholder="Paste lead details, approved pricing, scope, previous message, job notes or campaign information. Avoid passwords and payment credentials." className="w-full bg-jet border border-darkgrey text-paper rounded-btn px-4 py-3 focus:outline-none focus:border-blue resize-y" />

            {error && <p className="text-sm text-orange mt-4">{error}</p>}

            <button onClick={run} disabled={busy || !task.trim()} className="mt-5 bg-blue-fill hover:bg-blue-dark disabled:opacity-50 text-white font-heading font-semibold px-5 py-3 rounded-btn inline-flex items-center gap-2">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {busy ? 'Drafting…' : 'Run NGMS AI'}
            </button>

            <div className="mt-8 border-t border-darkgrey pt-6">
              <div className="flex items-center justify-between gap-3 mb-3">
                <h2 className="font-heading font-semibold text-paper">Draft</h2>
                {output && <button onClick={copy} className="text-sm text-mist hover:text-paper inline-flex items-center gap-1"><Copy className="w-4 h-4" /> {copied ? 'Copied' : 'Copy'}</button>}
              </div>
              <div className="min-h-48 whitespace-pre-wrap bg-jet border border-darkgrey rounded-btn p-4 text-sm text-paper">
                {output || <span className="text-mist">Your approved draft will appear here.</span>}
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
