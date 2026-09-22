import type { Config } from 'tailwindcss'

// Ember Grid theme — black/grey/white with Solar Orange as the only accent.
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
        // Solar Orange — the single accent (CTAs, icons, markers, split panels)
        orange: {
          DEFAULT: '#F57C1B',
          dark: '#FF5A1F',
        },
        // Legacy 'blue' token now maps to the orange accent so existing
        // kickers/links switch to the one-accent look without component edits
        blue: {
          DEFAULT: '#F57C1B',
          dark: '#FF5A1F',
        },
        // WhatsApp Green — WhatsApp buttons only (functional, kept)
        whatsapp: {
          DEFAULT: '#25D366',
          dark: '#1DA851',
        },
      },
      fontFamily: {
        heading: ['var(--font-oswald)', 'sans-serif'],
        body: ['var(--font-inter)', 'sans-serif'],
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
