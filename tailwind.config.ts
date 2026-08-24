import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        jet: '#0a0a0a',
        graphite: '#1a1a1a',
        silver: '#a3a3a3',
        orange: {
          DEFAULT: '#F57C1B',
          dark: '#D9660A',
        },
        purple: {
          DEFAULT: '#8B1BF5',
          dark: '#6D14C4',
        },
        eco: '#39D353',
        sun: '#FACC15',
      },
      backgroundImage: {
        'hero-gradient': 'radial-gradient(ellipse at top, #262626 0%, #0a0a0a 60%)',
        'headline-gradient': 'linear-gradient(90deg, #F57C1B, #FACC15, #8B1BF5)',
        'brand-bar': 'linear-gradient(90deg, #F57C1B, #FACC15, #8B1BF5, #39D353)',
      },
    },
  },
  plugins: [],
}
export default config
