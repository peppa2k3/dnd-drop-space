export const DEFAULT_APPEARANCE = Object.freeze({ theme: 'cyber-blue', mode: 'dark' });

const darkBase = {
  ink: '233 243 251', 'ink-soft': '205 222 233', 'ink-light': '172 198 214',
  slate: '171 193 207', 'slate-light': '141 168 185', line: '49 69 86',
  brick: '255 138 138', 'brick-soft': '65 30 41', success: '103 232 177',
  'sidebar-text': '237 249 255', 'sidebar-muted': '178 201 214',
  overlay: '0 4 12', 'shadow-color': '0 0 0', 'primary-contrast': '4 17 24',
};

const lightBase = {
  ink: '21 38 54', 'ink-soft': '40 62 77', 'ink-light': '68 90 106',
  slate: '74 96 111', 'slate-light': '92 113 128', line: '189 209 221',
  brick: '177 42 54', 'brick-soft': '254 232 235', success: '22 116 84',
  'sidebar-text': '238 250 255', 'sidebar-muted': '178 208 222',
  overlay: '4 15 26', 'shadow-color': '24 48 67', 'primary-contrast': '255 255 255',
};

export const THEMES = [
  {
    id: 'cyber-blue', name: 'Cyber Space Blue', description: 'Cloud storage · cyan',
    dark: { ...darkBase, paper: '7 11 20', 'paper-dim': '11 19 32', 'paper-card': '16 24 39',
      gold: '0 217 255', 'gold-deep': '85 231 255', 'gold-soft': '13 54 70',
      secondary: '99 102 241', accent: '34 211 238', sidebar: '7 16 30',
      'sidebar-hover': '18 37 53', 'sidebar-active': '19 56 74' },
    light: { ...lightBase, paper: '241 248 252', 'paper-dim': '227 241 248', 'paper-card': '255 255 255',
      gold: '0 116 151', 'gold-deep': '0 99 130', 'gold-soft': '213 241 249',
      secondary: '77 79 196', accent: '8 139 163', sidebar: '12 39 60',
      'sidebar-hover': '21 59 82', 'sidebar-active': '20 76 102' },
  },
  {
    id: 'neon-storage', name: 'Neon Storage', description: 'Neon · RGB tinh tế',
    dark: { ...darkBase, paper: '5 5 5', 'paper-dim': '10 14 16', 'paper-card': '16 20 25',
      gold: '0 255 178', 'gold-deep': '99 255 208', 'gold-soft': '11 54 44',
      secondary: '0 184 255', accent: '168 85 247', sidebar: '5 14 14',
      'sidebar-hover': '14 39 35', 'sidebar-active': '14 57 45' },
    light: { ...lightBase, paper: '241 250 247', 'paper-dim': '223 243 237', 'paper-card': '255 255 255',
      gold: '0 116 86', 'gold-deep': '0 101 76', 'gold-soft': '209 242 231',
      secondary: '0 126 181', accent: '124 58 190', sidebar: '8 39 35',
      'sidebar-hover': '12 64 53', 'sidebar-active': '13 83 64' },
  },
  {
    id: 'deep-purple', name: 'Deep Cloud Purple', description: 'SaaS · tím sâu',
    dark: { ...darkBase, paper: '9 9 15', 'paper-dim': '15 15 26', 'paper-card': '21 21 34',
      gold: '139 92 246', 'gold-deep': '190 165 255', 'gold-soft': '47 32 76',
      secondary: '6 182 212', accent: '236 72 153', sidebar: '14 11 27',
      'sidebar-hover': '35 27 59', 'sidebar-active': '56 38 85' },
    light: { ...lightBase, paper: '248 246 253', 'paper-dim': '239 233 249', 'paper-card': '255 255 255',
      gold: '104 57 183', 'gold-deep': '88 43 163', 'gold-soft': '233 222 249',
      secondary: '0 132 157', accent: '180 42 111', sidebar: '35 26 63',
      'sidebar-hover': '57 41 93', 'sidebar-active': '77 50 120' },
  },
  {
    id: 'space-terminal', name: 'Space Terminal', description: 'Server · terminal',
    dark: { ...darkBase, paper: '2 6 4', 'paper-dim': '5 13 8', 'paper-card': '9 20 14',
      gold: '57 255 136', 'gold-deep': '125 255 176', 'gold-soft': '17 53 31',
      secondary: '0 229 255', accent: '105 226 150', sidebar: '3 13 8',
      'sidebar-hover': '11 39 23', 'sidebar-active': '16 60 32' },
    light: { ...lightBase, paper: '244 250 244', 'paper-dim': '227 241 229', 'paper-card': '255 255 255',
      gold: '21 124 67', 'gold-deep': '17 104 58', 'gold-soft': '217 242 221',
      secondary: '0 136 158', accent: '34 139 73', sidebar: '12 39 24',
      'sidebar-hover': '22 64 38', 'sidebar-active': '25 87 46' },
  },
  {
    id: 'ice-data', name: 'Ice Data Center', description: 'Cloud · AI · băng xanh',
    dark: { ...darkBase, paper: '7 16 24', 'paper-dim': '11 25 34', 'paper-card': '16 33 45',
      gold: '56 189 248', 'gold-deep': '126 215 255', 'gold-soft': '21 56 72',
      secondary: '45 212 191', accent: '129 140 248', sidebar: '7 25 34',
      'sidebar-hover': '20 49 59', 'sidebar-active': '24 66 79' },
    light: { ...lightBase, paper: '242 249 251', 'paper-dim': '225 240 244', 'paper-card': '255 255 255',
      gold: '18 112 160', 'gold-deep': '12 92 136', 'gold-soft': '212 238 247',
      secondary: '0 133 120', accent: '82 92 184', sidebar: '13 44 59',
      'sidebar-hover': '23 65 82', 'sidebar-active': '27 83 104' },
  },
];

const themeIds = new Set(THEMES.map(({ id }) => id));

export function normalizeAppearance(value) {
  return {
    theme: themeIds.has(value?.theme) ? value.theme : DEFAULT_APPEARANCE.theme,
    mode: value?.mode === 'light' ? 'light' : 'dark',
  };
}

export function applyAppearance(value) {
  const appearance = normalizeAppearance(value);
  const root = document.documentElement;
  const palette = THEMES.find(({ id }) => id === appearance.theme)[appearance.mode];
  for (const [name, channels] of Object.entries(palette)) {
    root.style.setProperty(`--${name}`, channels);
  }
  root.dataset.theme = appearance.theme;
  root.dataset.mode = appearance.mode;
  root.style.colorScheme = appearance.mode;
  const themeColor = document.querySelector('meta[name="theme-color"]');
  if (themeColor) themeColor.content = `rgb(${palette.paper})`;
}

export function readAppearance(key) {
  try { return JSON.parse(localStorage.getItem(key)); }
  catch { return null; }
}

export function writeAppearance(key, value) {
  try { localStorage.setItem(key, JSON.stringify(normalizeAppearance(value))); }
  catch { /* Storage can be unavailable in private browsing. */ }
}
