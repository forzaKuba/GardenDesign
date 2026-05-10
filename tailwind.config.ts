import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'canvas-light': '#f0ede8',
        'canvas-dark': '#1a1a2e',
        neutral: {
          750: '#2d2d3d',
          850: '#1a1a28',
          950: '#0d0d18',
        },
      },
      width: {
        '13': '3.25rem',
      },
    },
  },
  plugins: [],
} satisfies Config
