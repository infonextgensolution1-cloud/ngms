'use client'

import { Fragment, useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { MessageCircle, Send, X } from 'lucide-react'
import { SITE, waLink } from '@/lib/site'

// Floating website chat assistant (FAQ, bookings, general queries). Talks to /api/chat.
// The conversation lives in sessionStorage so it survives page navigation, not browser restarts.

type Turn = { role: 'user' | 'assistant'; text: string }

const STORE_KEY = 'ngms-chat-v1'
const GREETING: Turn = {
  role: 'assistant',
  text: "Hi! I'm the NextGen assistant. I can answer questions about our services and prices, or book a job for you. What can I help with?",
}
const QUICK_REPLIES = ['Book a service', 'Solar cleaning prices', 'Which areas do you cover?', 'How does payment work?']

// Turns bare URLs into links; everything else stays plain text.
function Linkified({ text }: { text: string }) {
  const parts = text.split(/(https?:\/\/[^\s)]+[^\s).,!?])/g)
  return (
    <>
      {parts.map((p, i) =>
        /^https?:\/\//.test(p) ? (
          <a key={i} href={p} className="underline text-orange break-all" target={p.startsWith(SITE.url) ? undefined : '_blank'} rel="noreferrer">
            {p.replace(/^https?:\/\/(www\.)?/, '')}
          </a>
        ) : (
          <Fragment key={i}>{p}</Fragment>
        ),
      )}
    </>
  )
}

export default function ChatWidget() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [turns, setTurns] = useState<Turn[]>([GREETING])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const endRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(STORE_KEY) || 'null') as Turn[] | null
      if (Array.isArray(saved) && saved.length) setTurns(saved)
    } catch {}
  }, [])

  useEffect(() => {
    try {
      sessionStorage.setItem(STORE_KEY, JSON.stringify(turns))
    } catch {}
    endRef.current?.scrollIntoView({ block: 'end' })
  }, [turns, busy, open])

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  // Staff pages have their own tools; keep the public assistant off them.
  if (pathname?.startsWith('/admin') || pathname?.startsWith('/ops')) return null

  async function send(text: string, base: Turn[] = turns) {
    const msg = text.trim()
    if (!msg || busy) return
    const next: Turn[] = [...base, { role: 'user', text: msg }]
    setTurns(next)
    setInput('')
    setError('')
    setBusy(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // The greeting is UI only; the API expects the conversation to start with the customer.
        body: JSON.stringify({ messages: next.slice(1) }),
      })
      const json = (await res.json().catch(() => ({}))) as { reply?: string; error?: string }
      if (!res.ok || !json.reply) throw new Error(json.error || `Couldn't reach the assistant. WhatsApp us on ${SITE.phoneDisplay}.`)
      setTurns([...next, { role: 'assistant', text: json.reply }])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  function reset() {
    setTurns([GREETING])
    setError('')
  }

  const lastUser = [...turns].reverse().find((t) => t.role === 'user')?.text

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Chat with NGMS"
          className="fixed z-50 flex items-center gap-2 h-12 sm:h-14 pl-4 pr-5 rounded-full bg-orange text-jet font-heading font-bold uppercase tracking-wide text-sm shadow-lg hover:bg-orange-dark transition-colors"
          style={{ bottom: 'calc(5rem + env(safe-area-inset-bottom))', right: 'calc(1rem + env(safe-area-inset-right))' }}
        >
          <MessageCircle className="h-5 w-5" aria-hidden />
          <span className="hidden sm:inline">Ask us</span>
        </button>
      )}

      {open && (
        <section
          role="dialog"
          aria-label="NGMS chat assistant"
          className="fixed z-[60] inset-0 sm:inset-auto sm:bottom-6 sm:right-6 sm:w-[380px] sm:h-[600px] sm:max-h-[calc(100vh-3rem)] flex flex-col bg-cardgrey sm:border sm:border-darkgrey sm:rounded-card shadow-2xl overflow-hidden"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <header className="flex items-center justify-between gap-3 px-4 py-3 bg-graphite border-b border-darkgrey">
            <div className="min-w-0">
              <p className="font-heading font-bold text-paper uppercase tracking-wide leading-tight">NextGen assistant</p>
              <p className="text-mist text-xs">Answers instantly · Jacques confirms bookings</p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {turns.length > 1 && (
                <button type="button" onClick={reset} className="text-mist hover:text-orange text-xs uppercase font-semibold px-2 py-2">
                  New chat
                </button>
              )}
              <button type="button" onClick={() => setOpen(false)} aria-label="Close chat" className="text-mist hover:text-orange p-2">
                <X className="h-5 w-5" />
              </button>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3" aria-live="polite">
            {turns.map((t, i) => (
              <div key={i} className={t.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                <p
                  className={`max-w-[85%] whitespace-pre-wrap text-sm leading-relaxed rounded-2xl px-3.5 py-2.5 ${
                    t.role === 'user' ? 'bg-orange text-jet rounded-br-sm' : 'bg-graphite text-paper rounded-bl-sm'
                  }`}
                >
                  {t.role === 'assistant' ? <Linkified text={t.text} /> : t.text}
                </p>
              </div>
            ))}

            {turns.length === 1 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {QUICK_REPLIES.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => send(q)}
                    className="text-xs font-semibold text-orange border border-orange/60 rounded-full px-3 py-1.5 hover:bg-orange hover:text-jet transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {busy && (
              <div className="flex justify-start">
                <p className="bg-graphite text-mist text-sm rounded-2xl rounded-bl-sm px-3.5 py-2.5" aria-label="Assistant is typing">
                  <span className="animate-pulse">Typing…</span>
                </p>
              </div>
            )}

            {error && (
              <div className="text-sm text-orange bg-jet border border-darkgrey rounded-card p-3 space-y-2">
                <p>{error}</p>
                <div className="flex gap-3">
                  {lastUser && (
                    <button
                      type="button"
                      className="underline"
                      onClick={() => send(lastUser, turns.slice(0, -1))}
                    >
                      Try again
                    </button>
                  )}
                  <a className="underline" href={waLink(lastUser ? `Hi NextGen, ${lastUser}` : undefined)} target="_blank" rel="noreferrer">
                    WhatsApp instead
                  </a>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          <form
            className="flex items-end gap-2 border-t border-darkgrey p-3 bg-graphite"
            onSubmit={(e) => {
              e.preventDefault()
              send(input)
            }}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  send(input)
                }
              }}
              rows={1}
              maxLength={1500}
              placeholder="Type your question…"
              aria-label="Your message"
              className="flex-1 resize-none bg-jet text-paper placeholder:text-mist border border-darkgrey rounded-btn px-3 py-2.5 text-base sm:text-sm focus:outline-none focus:border-orange max-h-32"
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              aria-label="Send"
              className="shrink-0 h-11 w-11 flex items-center justify-center rounded-btn bg-orange text-jet disabled:opacity-40"
            >
              <Send className="h-5 w-5" />
            </button>
          </form>
          <p className="text-[11px] text-mist text-center px-3 pb-2 bg-graphite">
            Automated assistant. Prices are estimates until quoted. Prefer a person?{' '}
            <a href={waLink()} className="underline" target="_blank" rel="noreferrer">
              WhatsApp {SITE.phoneDisplay}
            </a>
          </p>
        </section>
      )}
    </>
  )
}
