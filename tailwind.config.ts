import type { Config } from 'tailwindcss'

// Solar Forge theme — Black / Graphite / Steel / White / Silver blocks,
// NextGen Blue technology accents, and a layered Solar Orange CTA system.
// Functional channel colours (WhatsApp, Facebook/socials and service icons) stay intact.
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
        jet: '#08090B',
        // Graphite — section/band background, hover cards
        graphite: '#1B2026',
        // Steel Line — borders / dividers
        darkgrey: '#343B44',
        // Carbon — card/panel background
        cardgrey: '#111418',
        // Slate — secondary text on light bands (4.9:1 on Concrete, 5.8:1 on Fog)
        slate: '#5F6873',
        // Ash — secondary text on dark
        mist: '#AEB6C0',
        // Chalk — primary text on dark, cards on light bands
        paper: '#FFFFFF',
        // Fog — the main light band background
        fog: '#F1F3F5',
        // Concrete — light tiles, borders and dividers on light bands
        concrete: '#C7CDD4',
        // Ember Deep — orange TEXT on light bands only (Chalk 5.5:1, Fog 4.9:1).
        // Bright Solar Orange fails contrast as small text on light greys.
        'ember-deep': '#B83E00',
        // Solar Orange — the conversion colour: primary "Get a quote" CTAs and rare attention marks only
        orange: {
          DEFAULT: '#FF6A00',
          dark: '#D94F00',
        },
        // NextGen Blue — the technology accent: kickers, links, icons, focus rings, active states.
        //   DEFAULT  text/icons on dark (5.96:1 on Jet)
        //   fill     solid fills under white text (4.63:1)
        //   dark     hover/pressed fill (5.43:1 under white)
        //   deep     blue TEXT on light bands (4.9:1 on Fog, 5.5:1 on Chalk)
        blue: {
          DEFAULT: '#147BFF',
          fill: '#1F6FEB',
          dark: '#0D5FD7',
          deep: '#0A56C7',
        },
        // WhatsApp Green — WhatsApp buttons only (functional, kept)
        whatsapp: {
          DEFAULT: '#25D366',
          dark: '#1DA851',
        },
        // Luminous Orange — "Get a quote" / CTA buttons (black text, Eco Green border)
        glow: {
          DEFAULT: '#FF9D2E',
          bright: '#FFB45C',
        },
        // Legacy 'power' token (was purple) now follows NextGen Blue so older
        // components stay on-palette without edits.
        power: {
          DEFAULT: '#1F6FEB',
          dark: '#0D5FD7',
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
