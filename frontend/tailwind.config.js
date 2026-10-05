/** @type {import('tailwindcss').Config} */
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        background: { DEFAULT: token('background'), secondary: token('background-secondary') },
        surface: { DEFAULT: token('surface'), hover: token('surface-hover') },
        primary: { DEFAULT: token('primary'), hover: token('primary-hover'), contrast: token('primary-contrast') },
        secondary: token('secondary'),
        accent: token('accent'),
        text: { primary: token('text-primary'), secondary: token('text-secondary'), muted: token('text-muted') },
        border: { DEFAULT: token('border'), hover: token('border-hover') },
        success: token('success'),
        warning: token('warning'),
        danger: token('danger'),
        overlay: { DEFAULT: token('overlay'), contrast: token('overlay-contrast') },
      },
      fontFamily: {
        display: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      borderRadius: { card: '12px' },
      boxShadow: {
        card: '0 8px 28px rgb(var(--shadow-color) / 0.12)',
        popover: '0 20px 48px rgb(var(--shadow-color) / 0.26)',
        glow: '0 0 0 1px rgb(var(--primary) / 0.32), 0 0 15px -3px rgb(var(--glow) / var(--glow-opacity, 0.25))',
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
