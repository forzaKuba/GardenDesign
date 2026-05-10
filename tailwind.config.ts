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
      keyframes: {
        'tooltip-fade': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        'tooltip-fade': 'tooltip-fade 0.12s ease-out forwards',
      },
    },
  },
  plugins: [],
} satisfies Config
