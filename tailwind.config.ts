import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Deep Black — primary page background
        jet: '#050608',
        // Graphite — section/band background
        graphite: '#101318',
        // Dark Grey — borders / dividers
        darkgrey: '#1B2027',
        // Card Grey — card/panel background
        cardgrey: '#151A20',
        // Light Grey — secondary text on dark
        mist: '#AEB6C0',
        // near-white for primary text on dark
        paper: '#F7F9FB',
        // NGMS Orange — sparing accent (stat numbers, prices, secondary highlights)
        orange: {
          DEFAULT: '#FF7A18',
          dark: '#E0680E',
        },
        // NGMS Blue — trust, links, location
        blue: {
          DEFAULT: '#1688FF',
          dark: '#0F6FDB',
        },
        // WhatsApp Green — WhatsApp icon/CTA/floating button, primary quote CTA
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
        card: '12px',
        btn: '8px',
      },
    },
  },
  plugins: [],
}
export default config
