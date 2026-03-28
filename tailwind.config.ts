import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1B4F8A',
          50: '#E8F0FA',
          100: '#C5D9F0',
          200: '#8BB3E0',
          300: '#518DD1',
          400: '#2E6FB5',
          500: '#1B4F8A',
          600: '#16406F',
          700: '#103054',
          800: '#0B2039',
          900: '#05101D',
        },
        accent: {
          DEFAULT: '#2E75B6',
          light: '#5A9AD4',
          dark: '#1D5A94',
        },
        demand: {
          high: '#22c55e',
          medium: '#eab308',
          low: '#ef4444',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
      },
      animation: {
        'cursor-blink': 'cursor-blink 1s step-end infinite',
        'slide-in': 'slide-in 0.3s ease-out',
        'fade-up': 'fade-up 0.4s ease-out',
      },
      keyframes: {
        'cursor-blink': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        'slide-in': {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
export default config;
