import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        /* Accessibility-first palette (WCAG AA) */
        page: '#F8FAFC',
        card: '#FFFFFF',
        'card-border': '#E2E8F0',
        heading: '#0F172A',
        body: '#334155',
        muted: '#64748B',
        'btn-primary': '#2563EB',
        'btn-primary-hover': '#1D4ED8',
        primary: {
          DEFAULT: '#2563EB',
          dark: '#1D4ED8',
          light: '#E0F2FE',
        },
        accent: {
          DEFAULT: '#3B82F6',
        },
        background: {
          DEFAULT: '#F8FAFC',
          white: '#FFFFFF',
        },
        'grey-dark': '#334155',
        'grey-medium': '#64748B',
        'grey-light': '#94A3B8',
        'grey-background': '#F8FAFC',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
      },
      boxShadow: {
        'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
      },
    },
  },
  plugins: [],
}
export default config

