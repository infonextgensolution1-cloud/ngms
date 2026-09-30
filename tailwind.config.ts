import type { Config } from 'tailwindcss'

// Solar Forge theme — one grey ramp (dark to light) with Solar Orange as the only accent.
// Builds on Ember Grid: every existing token keeps its name and value, and three are new
// (slate, fog, ember-deep). Spec: docs/solar-forge-theme.md
//
//   Dark greys:   jet  cardgrey  graphite  darkgrey
//   Mid greys:    slate (text on light)   mist (text on dark)
//   Light greys:  concrete  fog  paper
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
        // Slate — secondary text on light bands (4.9:1 on Concrete, 5.8:1 on Fog)
        slate: '#55585E',
        // Ash — secondary text on dark
        mist: '#9A9CA1',
        // Chalk — primary text on dark, cards on light bands
        paper: '#F4F4F2',
        // Fog — the main light band background
        fog: '#E7E7E4',
        // Concrete — light tiles, borders and dividers on light bands
        concrete: '#D6D6D3',
        // Ember Deep — orange TEXT on light bands only (Chalk 5.5:1, Fog 4.9:1).
        // Bright Solar Orange fails contrast as small text on light greys.
        'ember-deep': '#A84300',
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
        // Luminous Orange — "Get a quote" / CTA buttons (black text, Eco Green border)
        glow: {
          DEFAULT: '#FF8A1F',
          bright: '#FFA033',
        },
        // Power Purple — brand purple for highlight CTAs, the seasonal banner and price badges
        // (white text on it is 5.6:1)
        power: {
          DEFAULT: '#8B1BF5',
          dark: '#7210D6',
          light: '#B77BFA',
        },
        // Eco Green — CTA button border
        ecogreen: '#39D353',
        // Facebook Blue — Facebook icon and the "Book a site walk-through" button
        facebook: {
          DEFAULT: '#1877F2',
          dark: '#1465CF',
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
