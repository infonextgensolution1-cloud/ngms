import type { Config } from 'tailwindcss'

// Ember Grid theme — black/grey/white with Signal Blue as the only accent.
// Spec: docs/ember-grid-theme.md
const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Jet Black — primary page background
        jet: '#0A0A0A',
        // Graphite — section/band background, hover cards
        graphite: '#1F2023',
        // Steel Line — borders / dividers
        darkgrey: '#2E3035',
        // Carbon — card/panel background
        cardgrey: '#141517',
        // Ash — secondary text on dark
        mist: '#9A9CA1',
        // Chalk — primary text on dark
        paper: '#F4F4F2',
        // Concrete — one light block per page
        concrete: '#D6D6D3',
        // Signal Blue — the single accent (CTAs, icons, markers, split panels).
        // Token key kept as 'orange' so existing bg-orange/text-orange/border-orange
        // classes across the app don't need touching — only the hex changes.
        orange: {
          DEFAULT: '#2E6BFF',
          dark: '#1948CC',
        },
        // 'blue' token kept as an alias of the same accent so existing
        // kickers/links stay in sync with the one-accent look
        blue: {
          DEFAULT: '#2E6BFF',
          dark: '#1948CC',
        },
        // WhatsApp Green — WhatsApp buttons only (functional, kept)
        whatsapp: {
          DEFAULT: '#25D366',
          dark: '#1DA851',
        },
      },
      fontFamily: {
        // Big Shoulders Display — set in app/layout.tsx
        heading: ['var(--font-heading)', 'sans-serif'],
        // IBM Plex Sans — set in app/layout.tsx
        body: ['var(--font-body)', 'sans-serif'],
      },
      borderRadius: {
        card: '2px',
        btn: '2px',
      },
    },
  },
  plugins: [],
}
export default config
