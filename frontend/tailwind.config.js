/** @type {import('tailwindcss').Config} */
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: token('ink'),
          soft: token('ink-soft'),
          light: token('ink-light'),
        },
        paper: {
          DEFAULT: token('paper'),
          dim: token('paper-dim'),
          card: token('paper-card'),
        },
        line: token('line'),
        slate: {
          DEFAULT: token('slate'),
          light: token('slate-light'),
        },
        gold: {
          DEFAULT: token('gold'),
          soft: token('gold-soft'),
          deep: token('gold-deep'),
        },
        brick: {
          DEFAULT: token('brick'),
          soft: token('brick-soft'),
        },
        sidebar: {
          DEFAULT: token('sidebar'),
          text: token('sidebar-text'),
          muted: token('sidebar-muted'),
          hover: token('sidebar-hover'),
          active: token('sidebar-active'),
        },
        secondary: token('secondary'),
        accent: token('accent'),
        success: token('success'),
        overlay: token('overlay'),
        'primary-contrast': token('primary-contrast'),
      },
      fontFamily: {
        display: ['"Inter"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['"Inter"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      borderRadius: {
        card: '12px',
      },
      boxShadow: {
        card: '0 8px 28px rgb(var(--shadow-color) / 0.12)',
        popover: '0 20px 48px rgb(var(--shadow-color) / 0.26)',
        glow: '0 0 0 1px rgb(var(--gold) / 0.35), 0 12px 32px rgb(var(--gold) / 0.13)',
      },
      keyframes: {
        'fade-in': { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
        'slide-up': { '0%': { opacity: 0, transform: 'translateY(6px)' }, '100%': { opacity: 1, transform: 'translateY(0)' } },
      },
      animation: {
        'fade-in': 'fade-in 0.18s ease-out',
        'slide-up': 'slide-up 0.2s ease-out',
      },
    },
  },
  plugins: [],
};
