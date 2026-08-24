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
          DEFAULT: '#f97316',
          dark: '#ea580c',
        },
        eco: '#16a34a',
      },
      backgroundImage: {
        'hero-gradient': 'radial-gradient(ellipse at top, #262626 0%, #0a0a0a 60%)',
        'headline-gradient': 'linear-gradient(90deg, #f97316, #fb923c, #ffffff)',
      },
    },
  },
  plugins: [],
}
export default config
