export const DEFAULT_LANGUAGE = 'vi';
export const LANGUAGE_STORAGE_KEY = 'dnd-drop-space:language';

export const LANGUAGES = Object.freeze([
  { code: 'vi', name: 'Tiếng Việt', englishName: 'Vietnamese', shortName: 'VI' },
  { code: 'en', name: 'English', englishName: 'English', shortName: 'EN' },
  { code: 'zh-CN', name: '简体中文', englishName: 'Simplified Chinese', shortName: '中文' },
  { code: 'ja', name: '日本語', englishName: 'Japanese', shortName: '日本' },
  { code: 'ko', name: '한국어', englishName: 'Korean', shortName: '한국' },
  { code: 'fr', name: 'Français', englishName: 'French', shortName: 'FR' },
  { code: 'de', name: 'Deutsch', englishName: 'German', shortName: 'DE' },
  { code: 'it', name: 'Italiano', englishName: 'Italian', shortName: 'IT' },
  { code: 'es', name: 'Español', englishName: 'Spanish', shortName: 'ES' },
]);

const codes = new Set(LANGUAGES.map(({ code }) => code));

export function supportedLanguage(value) {
  return codes.has(value) ? value : null;
}

export function browserLanguage(value) {
  if (!value) return null;
  const normalized = value.replace('_', '-').toLowerCase();
  const exact = LANGUAGES.find(({ code }) => code.toLowerCase() === normalized);
  if (exact) return exact.code;
  if (normalized.startsWith('zh-')) return null;
  return supportedLanguage(normalized.split('-')[0]);
}

export function resolveLanguagePreference(userLanguage, localLanguage, browserValue) {
  return supportedLanguage(userLanguage) || supportedLanguage(localLanguage)
    || browserLanguage(browserValue) || DEFAULT_LANGUAGE;
}

export function readStoredLanguage() {
  try { return supportedLanguage(localStorage.getItem(LANGUAGE_STORAGE_KEY)); }
  catch { return null; }
}

export function storeLanguage(value) {
  try { localStorage.setItem(LANGUAGE_STORAGE_KEY, value); }
  catch { /* Storage can be unavailable in private browsing. */ }
}

export function initialLanguage() {
  return resolveLanguagePreference(null, readStoredLanguage(), globalThis.navigator?.language);
}
