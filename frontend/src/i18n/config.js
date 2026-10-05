import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import resourcesToBackend from 'i18next-resources-to-backend';
import { DEFAULT_LANGUAGE, LANGUAGES, initialLanguage } from './languages';

export const NAMESPACES = Object.freeze([
  'common', 'navigation', 'auth', 'dashboard', 'files', 'folders', 'shared',
  'search', 'upload', 'storage', 'profile', 'settings', 'admin', 'errors', 'notifications',
]);

const localeModules = import.meta.glob('./locales/*/*.json');

i18n.use(resourcesToBackend((language, namespace) =>
  localeModules[`./locales/${language}/${namespace}.json`]?.()
    || Promise.reject(new Error(`Missing locale resource: ${language}/${namespace}`)))).use(initReactI18next);

export const i18nReady = i18n.init({
  lng: initialLanguage(),
  fallbackLng: DEFAULT_LANGUAGE,
  supportedLngs: LANGUAGES.map(({ code }) => code),
  load: 'currentOnly',
  ns: NAMESPACES,
  defaultNS: 'common',
  resources: {},
  interpolation: { escapeValue: false },
  returnNull: false,
  react: { useSuspense: false },
});

export default i18n;
