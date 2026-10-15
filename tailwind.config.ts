import type { Config } from 'tailwindcss'

// NGMS Pinterest-inspired visual palette — carbon black, warm off-white, concrete grey, white and signal orange.
// WhatsApp green and Facebook blue are reserved exclusively for their respective social actions.
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
        jet: '#0B0D0F',
        // Graphite — section/band background, hover cards
        graphite: '#151719',
        // Steel Line — borders / dividers
        darkgrey: '#343434',
        // Carbon — card/panel background
        cardgrey: '#111214',
        // Slate — secondary text on light bands (4.9:1 on Concrete, 5.8:1 on Fog)
        slate: '#57534E',
        // Ash — secondary text on dark
        mist: '#B8B7B2',
        // Chalk — primary text on dark, cards on light bands
        paper: '#FFFFFF',
        // Fog — the main light band background
        fog: '#F3F0E9',
        // Concrete — light tiles, borders and dividers on light bands
        concrete: '#D5D4D0',
        // Ember Deep — orange TEXT on light bands only (Chalk 5.5:1, Fog 4.9:1).
        // Bright Solar Orange fails contrast as small text on light greys.
        'ember-deep': '#B83E00',
        // Solar Orange — the conversion colour: primary "Get a quote" CTAs and rare attention marks only
        orange: {
          DEFAULT: '#FF6A00',
          dark: '#D94F00',
        },
        // Legacy blue utility names map to the NGMS orange accent for backwards compatibility.
        //   DEFAULT  text/icons on dark (5.96:1 on Jet)
        //   fill     solid fills under white text (4.63:1)
        //   dark     hover/pressed fill (5.43:1 under white)
        //   deep     blue TEXT on light bands (4.9:1 on Fog, 5.5:1 on Chalk)
        blue: {
          DEFAULT: '#FF6A00',
          fill: '#E65A00',
          dark: '#C94D00',
          deep: '#B83E00',
        },
        // WhatsApp Green — WhatsApp buttons only (functional, kept)
        whatsapp: {
          DEFAULT: '#25D366',
          dark: '#1DA851',
        },
        // Luminous Orange — "Get a quote" / CTA buttons (black text, Eco Green border)
        glow: {
          DEFAULT: '#FF6A00',
          bright: '#FF896B',
        },
        // Legacy 'power' token (was purple) now follows NextGen Blue so older
        // components stay on-palette without edits.
        power: {
          DEFAULT: '#FF6A00',
          dark: '#C94D00',
          light: '#FF8A3D',
        },
        // Solar Orange — legacy CTA border token
        ecogreen: '#FF6A00',
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
