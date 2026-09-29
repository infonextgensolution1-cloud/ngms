'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Check, Copy, Search } from 'lucide-react'
import {
  AFRIKAANS_LINE,
  NGMS_CONTEXT,
  PACK_CATEGORIES,
  PACK_PROMPTS,
  type PackPrompt,
} from '@/lib/ngms-prompt-pack'

export default function PromptLibrary() {
  const [category, setCategory] = useState<(typeof PACK_CATEGORIES)[number]>('All')
  const [query, setQuery] = useState('')
  const [withContext, setWithContext] = useState(true)
  const [withAfrikaans, setWithAfrikaans] = useState(true)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  const items = useMemo(() => {
    const q = query.trim().toLowerCase()
    return PACK_PROMPTS.filter(
      (i) =>
        (category === 'All' || i.c === category) &&
        (!q || `${i.t} ${i.p} ${i.c}`.toLowerCase().includes(q)),
    )
  }, [category, query])

  function buildText(item: PackPrompt) {
    let text = item.p
    if (item.af && withAfrikaans) text += `\n\n${AFRIKAANS_LINE}`
    if (withContext) text = `${NGMS_CONTEXT}\n\n${text}`
    return text
  }

  function shownText(item: PackPrompt) {
    return item.af && withAfrikaans ? `${item.p}\n\n${AFRIKAANS_LINE}` : item.p
  }

  async function copy(item: PackPrompt, key: string) {
    const text = buildText(item)
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      try {
        document.execCommand('copy')
      } catch {
        /* ignore */
      }
      document.body.removeChild(ta)
    }
    setCopiedKey(key)
    setTimeout(() => setCopiedKey((k) => (k === key ? null : k)), 1400)
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <Link href="/admin" className="inline-flex items-center gap-1 text-sm text-mist hover:text-orange mb-4">
        <ArrowLeft className="w-4 h-4" /> Admin
      </Link>
      <h1 className="font-heading text-2xl font-bold text-paper">NGMS Prompt Library</h1>
      <p className="text-sm text-mist mb-6">
        Tap Copy and paste into Claude. Numbers match the original 50-prompt list (1-6 not included).
      </p>

      <div className="relative mb-3">
        <Search className="w-4 h-4 text-mist absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search prompts (solar, DM, winter, body corporate...)"
          className="w-full bg-cardgrey border border-darkgrey text-paper rounded-btn pl-9 pr-4 py-3 focus:outline-none focus:border-orange"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-2">
        {PACK_CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategory(c)}
            className={`shrink-0 px-4 py-2 rounded-full text-sm border transition ${
              category === c
                ? 'bg-orange text-jet border-orange font-semibold'
                : 'bg-cardgrey text-paper border-darkgrey hover:border-orange'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-4 text-sm text-mist mb-6">
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" checked={withContext} onChange={(e) => setWithContext(e.target.checked)} />
          Add NGMS context
        </label>
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" checked={withAfrikaans} onChange={(e) => setWithAfrikaans(e.target.checked)} />
          English + Afrikaans
        </label>
      </div>

      {items.length === 0 && <p className="text-mist text-center py-10">Nothing found.</p>}

      <div className="grid gap-3">
        {items.map((item) => {
          const key = `${item.n}-${item.t}`
          const copied = copiedKey === key
          return (
            <div key={key} className="bg-cardgrey border border-darkgrey rounded-card p-5">
              <p className="text-xs font-bold tracking-wide text-orange">
                PROMPT {item.n} · {item.c.toUpperCase()}
              </p>
              <h2 className="font-heading font-bold text-paper mt-1 mb-2">{item.t}</h2>
              <p className="text-sm text-mist whitespace-pre-wrap">{shownText(item)}</p>
              <button
                type="button"
                onClick={() => copy(item, key)}
                className={`mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-btn font-heading font-semibold text-sm ${
                  copied ? 'bg-ecogreen text-jet' : 'bg-orange text-jet hover:opacity-90'
                }`}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
