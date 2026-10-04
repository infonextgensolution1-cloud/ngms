import type { Config } from 'tailwindcss'

// Solar Forge theme — one grey ramp (dark to light), NextGen Blue as the technology accent,
// and Solar Orange reserved for the primary "Get a quote" CTA and rare attention marks.
// Spec: docs/solar-forge-theme.md
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
        // Solar Orange — the conversion colour: primary "Get a quote" CTAs and rare attention marks only
        orange: {
          DEFAULT: '#F57C1B',
          dark: '#FF5A1F',
        },
        // NextGen Blue — the technology accent: kickers, links, icons, focus rings, active states.
        //   DEFAULT  text/icons on dark (5.96:1 on Jet)
        //   fill     solid fills under white text (4.63:1)
        //   dark     hover/pressed fill (5.43:1 under white)
        //   deep     blue TEXT on light bands (4.9:1 on Fog, 5.5:1 on Chalk)
        blue: {
          DEFAULT: '#3B8BFF',
          fill: '#1F6FEB',
          dark: '#1D64D8',
          deep: '#1A5BD0',
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
        // Legacy 'power' token (was purple) now follows NextGen Blue so older
        // components stay on-palette without edits.
        power: {
          DEFAULT: '#1F6FEB',
          dark: '#1D64D8',
          light: '#3B8BFF',
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
        // Poppins — display headings, loaded with next/font in app/layout.tsx
        heading: ['var(--font-heading)', 'Poppins', 'system-ui', 'sans-serif'],
        // Inter — body and UI, loaded with next/font in app/layout.tsx
        body: ['var(--font-body)', 'Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '6px',
        btn: '4px',
        panel: '10px',
      },
      boxShadow: {
        // Subtle depth for premium cards on dark: hairline highlight + soft drop
        panel: 'inset 0 1px 0 rgba(255,255,255,0.04), 0 10px 30px -12px rgba(0,0,0,0.6)',
      },
    },
  },
  plugins: [],
}
export default config
