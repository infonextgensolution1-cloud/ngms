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
        purple: {
          DEFAULT: '#7c3aed',
          dark: '#5b21b6',
        },
        orange: {
          DEFAULT: '#f97316',
          dark: '#ea580c',
        },
        eco: '#16a34a',
      },
      backgroundImage: {
        'hero-gradient': 'radial-gradient(ellipse at top, #3b0764 0%, #0a0a0a 60%)',
        'headline-gradient': 'linear-gradient(90deg, #f97316, #a855f7, #7c3aed)',
      },
    },
  },
  plugins: [],
}
export default config
