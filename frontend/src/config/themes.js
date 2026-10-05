export const DEFAULT_APPEARANCE = Object.freeze({ theme: 'cyber-blue', mode: 'dark' });

// RGB triplets allow Tailwind's opacity modifiers to work with every palette.
const rgb = (hex) => hex.match(/[\da-f]{2}/gi).map((part) => parseInt(part, 16)).join(' ');
const lightNeutral = {
  background: '#F8FAFC', 'background-secondary': '#F1F5F9', surface: '#FFFFFF',
  'surface-hover': '#F8FAFC', 'text-primary': '#0F172A', 'text-secondary': '#475569',
  'text-muted': '#64748B', border: '#E2E8F0', 'border-hover': '#CBD5E1',
};

const definitions = [
  {
    id: 'cyber-blue', name: 'Cyber Space Blue', description: 'Cloud storage · cyan',
    dark: { background: '#070814', 'background-secondary': '#0B1320', surface: '#101827',
      'surface-hover': '#18283B', primary: '#00D9FF', 'primary-hover': '#55E7FF',
      secondary: '#6366F1', accent: '#22D3EE', success: '#22C55E', warning: '#F59E0B', danger: '#EF4444' },
    light: { primary: '#007497', 'primary-hover': '#006382', secondary: '#4D4FC4', accent: '#087C9B',
      success: '#167454', warning: '#925700', danger: '#B12A36' },
  },
  {
    id: 'neon-storage', name: 'Neon Storage', description: 'Neon · lưu trữ',
    dark: { background: '#050505', 'background-secondary': '#0A0E10', surface: '#101419',
      'surface-hover': '#1A292A', primary: '#00FFB2', 'primary-hover': '#63FFD0',
      secondary: '#00B8FF', accent: '#A855F7', success: '#00E676', warning: '#FFD600', danger: '#FF3D71' },
    light: { primary: '#007456', 'primary-hover': '#00654C', secondary: '#007EB5', accent: '#7C3ABE',
      success: '#167454', warning: '#925700', danger: '#B12A36' },
  },
  {
    id: 'deep-purple', name: 'Deep Cloud Purple', description: 'Cloud · tím sâu',
    dark: { background: '#09090F', 'background-secondary': '#0F0F1A', surface: '#151522',
      'surface-hover': '#23223A', primary: '#885CF6', 'primary-hover': '#BEA5FF',
      secondary: '#06B6D4', accent: '#EC4899', success: '#10B981', warning: '#F59E0B', danger: '#F43F5E' },
    light: { primary: '#6839B7', 'primary-hover': '#582BA3', secondary: '#00849D', accent: '#B42A6F',
      success: '#167454', warning: '#925700', danger: '#B12A36' },
  },
  {
    id: 'space-terminal', name: 'Space Terminal', description: 'Server · terminal',
    dark: { background: '#020604', 'background-secondary': '#050D08', surface: '#09140E',
      'surface-hover': '#133522', primary: '#39FF88', 'primary-hover': '#7DFFB0',
      secondary: '#00E5FF', accent: '#69E296', success: '#39FF88', warning: '#FFD166', danger: '#FF4D6D',
      'text-secondary': '#A7C4AF', 'text-muted': '#83A58F' },
    light: { primary: '#157C43', 'primary-hover': '#11683A', secondary: '#00889E', accent: '#228B49',
      success: '#167454', warning: '#925700', danger: '#B12A36' },
  },
  {
    id: 'ice-datacenter', name: 'Ice Data Center', description: 'Cloud · data center',
    dark: { background: '#071018', 'background-secondary': '#0B1922', surface: '#10212D',
      'surface-hover': '#1B3644', primary: '#38BDF8', 'primary-hover': '#7ED7FF',
      secondary: '#2DD4BF', accent: '#818CF8', success: '#2DD4BF', warning: '#FBBF24', danger: '#FB7185' },
    light: { primary: '#1270A0', 'primary-hover': '#0C5C88', secondary: '#008578', accent: '#525CB8',
      success: '#167454', warning: '#925700', danger: '#B12A36' },
  },
];

function makePalette(values, isLight) {
  const neutral = isLight ? lightNeutral : {
    'text-primary': '#E9F3FB', 'text-secondary': '#C5DEE9', 'text-muted': '#ABC6D6',
    border: '#314556', 'border-hover': '#55748A',
  };
  const palette = { ...neutral, ...values,
    glow: values.primary, 'primary-contrast': isLight ? '#FFFFFF' : '#000000',
    overlay: '#00040C', 'overlay-contrast': '#FFFFFF',
    'shadow-color': isLight ? '#183043' : '#000000',
  };
  return Object.fromEntries(Object.entries(palette).map(([key, value]) => [key, rgb(value)]));
}

export const THEMES = definitions.map(({ dark, light, ...theme }) => ({
  ...theme, dark: makePalette(dark, false), light: makePalette(light, true),
}));
const themeIds = new Set(THEMES.map(({ id }) => id));

export function normalizeAppearance(value) {
  const requestedTheme = value?.theme === 'ice-data' ? 'ice-datacenter' : value?.theme;
  return {
    theme: themeIds.has(requestedTheme) ? requestedTheme : DEFAULT_APPEARANCE.theme,
    mode: ['light', 'dark', 'system'].includes(value?.mode) ? value.mode : DEFAULT_APPEARANCE.mode,
  };
}

export function resolvedMode(mode, prefersDark = true) {
  return mode === 'system' ? (prefersDark ? 'dark' : 'light') : mode;
}

export function applyAppearance(value, prefersDark = globalThis.matchMedia?.('(prefers-color-scheme: dark)').matches ?? true) {
  const appearance = normalizeAppearance(value);
  const root = document.documentElement;
  const mode = resolvedMode(appearance.mode, prefersDark);
  const palette = THEMES.find(({ id }) => id === appearance.theme)[mode];
  for (const [name, channels] of Object.entries(palette)) root.style.setProperty(`--${name}`, channels);
  root.dataset.theme = appearance.theme;
  root.dataset.mode = mode;
  root.dataset.modePreference = appearance.mode;
  root.style.colorScheme = mode;
  const themeColor = document.querySelector('meta[name="theme-color"]');
  if (themeColor) themeColor.content = `rgb(${palette.background})`;
}

export function readAppearance(key) {
  try { return JSON.parse(localStorage.getItem(key)); }
  catch { return null; }
}

export function writeAppearance(key, value) {
  try { localStorage.setItem(key, JSON.stringify(normalizeAppearance(value))); }
  catch { /* Storage can be unavailable in private browsing. */ }
}
