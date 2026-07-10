import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#20704A',
          light: '#60D394',
          soft: '#B9ECD7',
        },
        paper: {
          DEFAULT: '#F9FEF9',
          card: '#FFFFFF',
          line: '#E5F7E8',
        },
        ledger: {
          DEFAULT: '#86EFAC',
          dark: '#22C55E',
          light: '#D8FFE9',
        },
        brass: {
          DEFAULT: '#D9FAE8',
          light: '#F4FFFB',
        },
        rust: {
          DEFAULT: '#15803D',
          light: '#DCFCE7',
        },
      },
      fontFamily: {
        display: ['var(--font-fraunces)', 'serif'],
        body: ['var(--font-inter)', 'sans-serif'],
        mono: ['var(--font-plex-mono)', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(20,22,28,0.04), 0 8px 24px rgba(20,22,28,0.06)',
        receipt: '0 2px 0 rgba(20,22,28,0.05), 0 12px 28px rgba(20,22,28,0.10)',
      },
      backgroundImage: {
        perforation:
          'radial-gradient(circle, transparent 4px, #F5FBF7 4.5px) 0 0/16px 16px repeat-x',
      },
    },
  },
  plugins: [],
};
export default config;
