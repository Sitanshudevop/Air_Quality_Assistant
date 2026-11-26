// Tailwind configuration for Saans design tokens and typography.
import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        neutral: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#090d16',
        },
        brand: {
          light: '#2dd4bf',
          DEFAULT: '#0f766e',
          dark: '#115e59',
        },
        status: {
          good: '#16a34a',
          moderate: '#ca8a04',
          poor: '#ea580c',
          severe: '#dc2626',
        },
      },
      borderRadius: {
        card: '24px',
        pill: '9999px',
      },
      maxWidth: {
        content: '1200px',
      },
      fontFamily: {
        sans: [
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
} satisfies Config;
