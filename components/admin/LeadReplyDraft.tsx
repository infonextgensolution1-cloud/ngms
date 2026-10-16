'use client'

import { useState } from 'react'
import { Copy, Mail, MessageCircle, Sparkles, ExternalLink } from 'lucide-react'
import { waLink, type Lead } from '@/lib/ngms-leads-ui'

type Channel = 'whatsapp' | 'email'

const input = 'w-full bg-jet border border-darkgrey text-paper rounded-btn px-3 py-2.5 text-sm focus:outline-none focus:border-blue'

/** Builds a user-reviewed prompt for ChatGPT; this component does not call an AI API. */
export default function LeadReplyDraft({ lead }: { lead: Lead }) {
  const [channel, setChannel] = useState<Channel>(lead.email && !waLink(lead.phone) ? 'email' : 'whatsapp')
  const [extra, setExtra] = useState('')
  const [text, setText] = useState('')
  const [msg, setMsg] = useState('')

  function draft() {
    const prompt = [
      'Draft a professional, friendly follow-up message for NextGen Maintenance Solutions (NGMS), a maintenance company serving Strand, Gordon’s Bay and Somerset West, South Africa.',
      'Use South African English and ZAR where relevant. Do not invent prices, availability, promises or technical facts.',
      `Channel: ${channel === 'whatsapp' ? 'WhatsApp' : 'Email'}`,
      `Customer name: ${lead.name || 'Customer'}`,
      `Service enquiry: ${lead.service || 'Not specified'}`,
      `Area: ${lead.suburb || 'Not specified'}`,
      `Customer message: ${lead.message || 'No message supplied'}`,
      `Internal notes: ${lead.notes || 'None'}`,
      `Additional instruction: ${extra.trim() || 'None'}`,
      channel === 'email' ? 'For email, include a concise subject line on the first line as “Subject: …”.' : 'Keep it concise and natural for WhatsApp.',
      'Return only the draft message. The NGMS team will review and send it manually.',
    ].join('\n\n')
    setText(prompt)
    setMsg('Prompt prepared locally. Review it, then open ChatGPT and paste it. No AI API was called.')
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
      setMsg('Copied. Paste this into ChatGPT.')
    } catch {
      setMsg('Copy blocked by the browser. Select the text and copy it.')
    }
  }

  const wa = waLink(lead.phone)
  const subjectMatch = text.match(/^Subject:\s*(.+)\n+/i)
  const mailto =
    lead.email && text && !text.startsWith('Draft a professional')
      ? `mailto:${lead.email}?subject=${encodeURIComponent(subjectMatch?.[1]?.trim() ?? 'Your NGMS enquiry')}&body=${encodeURIComponent(subjectMatch ? text.slice(subjectMatch[0].length) : text)}`
      : null

  const pick = (c: Channel, label: string) => (
    <button
      type="button"
      onClick={() => setChannel(c)}
      className={`flex-1 text-xs py-2 rounded-btn border ${channel === c ? 'border-orange text-orange' : 'border-darkgrey text-mist'}`}
    >
      {label}
    </button>
  )

  return (
    <section className="bg-cardgrey border border-darkgrey rounded-card p-4 mb-4">
      <h2 className="font-heading font-bold text-paper mb-1">Draft follow-up</h2>
      <p className="text-xs text-mist mb-3">Prepare a prompt for your existing ChatGPT plan. Review the prompt before opening ChatGPT; nothing is generated or sent automatically.</p>
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
        type="button"
        onClick={draft}
        className="mt-2 inline-flex items-center gap-2 bg-blue-fill hover:bg-blue-dark text-white font-heading font-semibold px-4 py-2.5 rounded-btn"
      >
        <Sparkles className="w-4 h-4" /> {text ? 'Refresh prompt' : 'Prepare ChatGPT prompt'}
      </button>

      {text && (
        <>
          <textarea className={`${input} mt-3 min-h-[180px]`} value={text} onChange={(e) => setText(e.target.value)} aria-label="ChatGPT prompt or edited draft" />
          <div className="flex flex-wrap gap-2 mt-2">
            <a
              href="https://chatgpt.com/"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => { void navigator.clipboard.writeText(text).then(() => setMsg('Prompt copied. Paste it into the new ChatGPT tab.')).catch(() => setMsg('ChatGPT opened. Copy the prompt manually from the text box.')) }}
              className="inline-flex items-center gap-1.5 text-sm px-4 py-2 rounded-btn bg-blue-fill hover:bg-blue-dark text-white font-semibold"
            >
              <ExternalLink className="w-4 h-4" /> Copy prompt and open ChatGPT
            </a>
            {channel === 'whatsapp' && wa && !text.startsWith('Draft a professional') && (
              <a href={`${wa}?text=${encodeURIComponent(text)}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm px-4 py-2 rounded-btn bg-whatsapp hover:bg-whatsapp-dark text-white font-semibold">
                <MessageCircle className="w-4 h-4" /> Open in WhatsApp
              </a>
            )}
            {channel === 'email' && mailto && (
              <a href={mailto} className="inline-flex items-center gap-1.5 text-sm px-4 py-2 rounded-btn bg-blue-fill hover:bg-blue-dark text-white font-semibold">
                <Mail className="w-4 h-4" /> Open in email
              </a>
            )}
            <button type="button" onClick={copy} className="inline-flex items-center gap-1.5 text-sm px-4 py-2 rounded-btn border border-darkgrey text-mist hover:text-paper">
              <Copy className="w-4 h-4" /> Copy prompt
            </button>
          </div>
          {channel === 'email' && !lead.email && <p className="text-xs text-mist mt-2">No email on file. Copy the message after drafting it in ChatGPT, or add an email under Contact.</p>}
        </>
      )}
      {msg && <p className="text-xs text-mist mt-2" role="status">{msg}</p>}
    </section>
  )
}
