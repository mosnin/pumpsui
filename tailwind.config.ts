import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        'omni-bg': '#060611',
        'omni-surface': '#0D0D1F',
        'omni-surface2': '#161630',
        'omni-border': '#2A2A5A',
        'omni-primary': '#6366F1',
        'omni-accent': '#06B6D4',
      },
      fontFamily: {
        'space': ['Space Grotesk', 'sans-serif'],
      },
      animation: {
        blob: 'blob 7s infinite',
      },
      keyframes: {
        blob: {
          '0%, 100%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
        },
      },
    },
  },
  plugins: [],
}
export default config
