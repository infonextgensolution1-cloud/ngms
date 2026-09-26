'use client'

import { ExternalLink, MousePointerClick } from 'lucide-react'

// Send a finished prompt to Claude. Every button copies the prompt first (inside the click, so the
// browser allows it), then:
//   New chat        opens claude.ai/new with the prompt pre-filled (?q=), you press Enter.
//   Existing chat   opens claude.ai so you can pick the chat to continue and paste.
//   Claude in Chrome only copies: paste it into the Claude side panel on whatever tab you're on.
//   Claude Code     opens claude.ai/code to start a session on the ngms repo, then paste.
// Very long prompts are too big for a link, so New chat then opens empty and you paste.

const MAX_URL_PROMPT = 6000

function newChatUrl(text: string) {
  const q = encodeURIComponent(text)
  return q.length <= MAX_URL_PROMPT ? `https://claude.ai/new?q=${q}` : 'https://claude.ai/new'
}

export default function ClaudeStrip({
  text,
  onCopy,
}: {
  text: string
  onCopy: (text: string, msg: string) => void
}) {
  const prefilled = encodeURIComponent(text).length <= MAX_URL_PROMPT

  const links = [
    {
      id: 'new',
      label: 'New Claude chat',
      href: newChatUrl(text),
      msg: prefilled
        ? 'Prompt copied and opened in a new Claude chat. Check it and press Enter.'
        : 'Prompt copied. It is too long to pre-fill, so paste it into the new chat (Ctrl+V).',
    },
    {
      id: 'existing',
      label: 'Existing chat',
      href: 'https://claude.ai/recents',
      msg: 'Prompt copied. Open the chat you want to continue and paste it (Ctrl+V).',
    },
    {
      id: 'code',
      label: 'Claude Code',
      href: 'https://claude.ai/code',
      msg: 'Prompt copied. Start a session on the ngms repo and paste it.',
    },
  ]

  return (
    <div className="pd-strip" role="group" aria-label="Run this prompt in Claude">
      <p className="pd-strip-label">Run in Claude</p>
      <div className="pd-strip-links">
        {links.map((l) => (
          <a
            key={l.id}
            className="pd-chip"
            href={l.href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => onCopy(text, l.msg)}
          >
            {l.label}
            <ExternalLink size={13} aria-hidden="true" />
            <span className="pd-sr">(copies the prompt, opens in a new tab)</span>
          </a>
        ))}
        <button
          type="button"
          className="pd-chip"
          onClick={() =>
            onCopy(text, 'Prompt copied. Open the Claude side panel in Chrome on the tab you need and paste it.')
          }
        >
          Claude in Chrome
          <MousePointerClick size={13} aria-hidden="true" />
          <span className="pd-sr">(copies the prompt for the Chrome extension side panel)</span>
        </button>
      </div>
    </div>
  )
}
