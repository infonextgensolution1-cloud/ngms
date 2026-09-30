'use client'

import { useState } from 'react'
import { Copy, Loader2, Mail, MessageCircle, Sparkles } from 'lucide-react'
import { callAi } from '@/lib/ai/client'
import { waLink, type Lead } from '@/lib/ngms-leads-ui'

type Channel = 'whatsapp' | 'email'

const input = 'w-full bg-jet border border-darkgrey text-paper rounded-btn px-3 py-2.5 text-sm focus:outline-none focus:border-blue'

/** "Draft follow-up" card on the lead page: Claude writes it, the owner edits and sends it themselves. */
export default function LeadReplyDraft({ lead }: { lead: Lead }) {
  const [channel, setChannel] = useState<Channel>(lead.email && !waLink(lead.phone) ? 'email' : 'whatsapp')
  const [extra, setExtra] = useState('')
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  async function draft() {
    setBusy(true)
    setMsg('')
    try {
      const res = await callAi<{ text: string }>('lead-reply', { leadId: lead.id, channel, extra })
      setText(res.text)
    } catch (e) {
      setMsg((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
      setMsg('Copied.')
    } catch {
      setMsg('Copy blocked by the browser. Select the text and copy it.')
    }
  }

  const wa = waLink(lead.phone)
  // Email drafts start with "Subject: …"; split it off for the mailto link.
  const subjectMatch = text.match(/^Subject:\s*(.+)\n+/i)
  const mailto =
    lead.email && text
      ? `mailto:${lead.email}?subject=${encodeURIComponent(subjectMatch?.[1]?.trim() ?? 'Your NGMS enquiry')}&body=${encodeURIComponent(subjectMatch ? text.slice(subjectMatch[0].length) : text)}`
      : null

  const pick = (c: Channel, label: string) => (
    <button
      onClick={() => setChannel(c)}
      className={`flex-1 text-xs py-2 rounded-btn border ${channel === c ? 'border-orange text-orange' : 'border-darkgrey text-mist'}`}
    >
      {label}
    </button>
  )

  return (
    <section className="bg-cardgrey border border-darkgrey rounded-card p-4 mb-4">
      <h2 className="font-heading font-bold text-paper mb-1">Draft follow-up</h2>
      <p className="text-xs text-mist mb-3">Claude writes it from the enquiry and notes. Check it, then send it yourself.</p>
      <div className="flex gap-2 mb-3">
        {pick('whatsapp', 'WhatsApp')}
        {pick('email', 'Email')}
      </div>
      <input
        className={input}
        placeholder="Optional: e.g. offer Thursday morning, ask for roof photos"
        value={extra}
        onChange={(e) => setExtra(e.target.value)}
      />
      <button
        onClick={draft}
        disabled={busy}
        className="mt-2 inline-flex items-center gap-2 bg-blue hover:bg-blue-dark text-white font-heading font-semibold px-4 py-2.5 rounded-btn disabled:opacity-50"
      >
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} {text ? 'Redraft' : 'Draft message'}
      </button>

      {text && (
        <>
          <textarea className={`${input} mt-3 min-h-[180px]`} value={text} onChange={(e) => setText(e.target.value)} aria-label="Draft message" />
          <div className="flex flex-wrap gap-2 mt-2">
            {channel === 'whatsapp' && wa && (
              <a
                href={`${wa}?text=${encodeURIComponent(text)}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-sm px-4 py-2 rounded-btn bg-whatsapp hover:bg-whatsapp-dark text-white font-semibold"
              >
                <MessageCircle className="w-4 h-4" /> Open in WhatsApp
              </a>
            )}
            {channel === 'email' && mailto && (
              <a href={mailto} className="inline-flex items-center gap-1.5 text-sm px-4 py-2 rounded-btn bg-blue hover:bg-blue-dark text-white font-semibold">
                <Mail className="w-4 h-4" /> Open in email
              </a>
            )}
            <button onClick={copy} className="inline-flex items-center gap-1.5 text-sm px-4 py-2 rounded-btn border border-darkgrey text-mist hover:text-paper">
              <Copy className="w-4 h-4" /> Copy
            </button>
          </div>
          {channel === 'email' && !lead.email && <p className="text-xs text-mist mt-2">No email on file. Copy the text, or add an email under Contact.</p>}
        </>
      )}
      {msg && <p className="text-xs text-mist mt-2">{msg}</p>}
    </section>
  )
}
