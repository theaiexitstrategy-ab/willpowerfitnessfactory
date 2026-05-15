import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        black: { DEFAULT: '#0a0a0a', deep: '#000000' },
        char: '#111111',
        card: '#1a1a1a',
        border: '#262626',
        silver: '#808080',
        light: '#b8b8b8',
        gold: { DEFAULT: '#C9A84C', hi: '#E0BE5A', dim: '#9E822F' },
      },
      fontFamily: {
        display: ['"Bebas Neue"', 'sans-serif'],
        condensed: ['"Barlow Condensed"', 'sans-serif'],
        body: ['Barlow', 'sans-serif'],
      },
      letterSpacing: {
        wider: '0.1em',
        widest: '0.22em',
        ultra: '0.32em',
      },
    },
  },
  plugins: [],
};
export default config;
