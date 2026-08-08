import type { Config } from 'tailwindcss';

const brandBlue = {
  50: '#EFF8FF',
  100: '#DCEEFF',
  200: '#B9DEFF',
  300: '#86C7FF',
  400: '#4AA9F4',
  500: '#1689DC',
  600: '#006BC4',
  700: '#0057A2',
  800: '#064A83',
  900: '#0B3E6C',
  950: '#072747',
};

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        blue: brandBlue,
        ink: {
          DEFAULT: '#163A59',
          light: '#4AA9F4',
          soft: '#B9DEFF',
        },
        paper: {
          DEFAULT: '#F7FBFF',
          card: '#FFFFFF',
          line: '#DCEEFF',
        },
        ledger: {
          DEFAULT: '#86C7FF',
          dark: '#006BC4',
          light: '#DCEEFF',
        },
        brass: {
          DEFAULT: '#DCEEFF',
          light: '#F7FBFF',
        },
        rust: {
          DEFAULT: '#006BC4',
          light: '#DCEEFF',
        },
      },
      fontFamily: {
        display: ['Georgia', 'Cambria', 'Times New Roman', 'serif'],
        body: ['Inter', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        mono: ['IBM Plex Mono', 'Cascadia Mono', 'Consolas', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(20,22,28,0.04), 0 8px 24px rgba(20,22,28,0.06)',
        receipt: '0 2px 0 rgba(20,22,28,0.05), 0 12px 28px rgba(20,22,28,0.10)',
      },
      backgroundImage: {
        perforation:
          'radial-gradient(circle, transparent 4px, #F7FBFF 4.5px) 0 0/16px 16px repeat-x',
      },
    },
  },
  plugins: [],
};
export default config;
