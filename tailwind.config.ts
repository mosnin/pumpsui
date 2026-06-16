import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        'omni-bg':       '#060611',
        'omni-surface':  '#0D0D1F',
        'omni-surface2': '#161630',
        'omni-border':   '#2A2A5A',
        'omni-primary':  '#6366F1',
        'omni-accent':   '#06B6D4',
      },
      fontFamily: {
        'space-grotesk': ['var(--font-space-grotesk)', 'sans-serif'],
        inter:           ['var(--font-inter)', 'sans-serif'],
      },
      animation: {
        blob:             'blob 7s infinite',
        'spin-slow':      'spin 3s linear infinite',
        shimmer:          'shimmer 2s infinite',
        'toast-in':       'toast-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'toast-out':      'toast-out 0.2s ease-in forwards',
        'toast-swipe-out':'toast-swipe-out 0.2s ease-out forwards',
      },
      keyframes: {
        blob: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%':      { transform: 'translate(30px, -50px) scale(1.1)' },
          '66%':      { transform: 'translate(-20px, 20px) scale(0.9)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        'toast-in': {
          from: { opacity: '0', transform: 'translateX(calc(100% + 24px))' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
        'toast-out': {
          from: { opacity: '1', transform: 'translateX(0)' },
          to:   { opacity: '0', transform: 'translateX(calc(100% + 24px))' },
        },
        'toast-swipe-out': {
          from: { transform: 'translateX(var(--radix-toast-swipe-end-x))' },
          to:   { opacity: '0', transform: 'translateX(calc(100% + 24px))' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-omni':   'linear-gradient(135deg, #6366F1, #06B6D4)',
      },
    },
  },
  plugins: [],
}
export default config
