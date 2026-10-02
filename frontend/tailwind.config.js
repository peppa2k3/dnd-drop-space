/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#14213D',
          soft: '#233252',
          light: '#3C4A63',
        },
        paper: {
          DEFAULT: '#FAF9F6',
          dim: '#F1EEE7',
          card: '#FFFFFF',
        },
        line: '#E4E0D8',
        slate: {
          DEFAULT: '#5B6472',
          light: '#8891A0',
        },
        gold: {
          DEFAULT: '#C89B3C',
          soft: '#EFE2C0',
          deep: '#9C7726',
        },
        brick: {
          DEFAULT: '#B3492B',
          soft: '#F3DED6',
        },
      },
      fontFamily: {
        display: ['"Fraunces"', 'ui-serif', 'Georgia', 'serif'],
        sans: ['"Inter"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      borderRadius: {
        card: '6px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(20, 33, 61, 0.06), 0 1px 1px rgba(20, 33, 61, 0.04)',
        popover: '0 8px 24px rgba(20, 33, 61, 0.16)',
      },
      keyframes: {
        'fade-in': { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
        'slide-up': { '0%': { opacity: 0, transform: 'translateY(6px)' }, '100%': { opacity: 1, transform: 'translateY(0)' } },
      },
      animation: {
        'fade-in': 'fade-in 0.15s ease-out',
        'slide-up': 'slide-up 0.18s ease-out',
      },
    },
  },
  plugins: [],
};
