import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import i18next from 'i18next';
import { LANGUAGES, DEFAULT_LANGUAGE, browserLanguage, resolveLanguagePreference } from '../src/i18n/languages.js';

const root = path.dirname(fileURLToPath(import.meta.url));
const sourceRoot = path.resolve(root, '../src');
const localesRoot = path.join(sourceRoot, 'i18n/locales');
const config = fs.readFileSync(path.join(sourceRoot, 'i18n/config.js'), 'utf8');
const namespaces = [...config.match(/export const NAMESPACES = Object\.freeze\(\[([\s\S]*?)\]\)/)?.[1]?.matchAll(/'([^']+)'/g) || []]
  .map((match) => match[1]);
const failures = [];
const resources = new Map();

if (!namespaces.length) failures.push('Cannot read NAMESPACES from i18n/config.js');

function readLocale(language, namespace) {
  const file = path.join(localesRoot, language, `${namespace}.json`);
  if (!fs.existsSync(file)) { failures.push(`Missing namespace: ${language}/${namespace}`); return {}; }
  const raw = fs.readFileSync(file, 'utf8');
  const seen = new Set();
  for (const match of raw.matchAll(/^  "([^"]+)":/gm)) {
    if (seen.has(match[1])) failures.push(`Duplicate key: ${language}/${namespace}:${match[1]}`);
    seen.add(match[1]);
  }
  try { return JSON.parse(raw); }
  catch (error) { failures.push(`Invalid JSON: ${file}: ${error.message}`); return {}; }
}

function placeholders(value) {
  return [...value.matchAll(/{{\s*([A-Za-z]\w*)\s*}}/g)].map((match) => match[1]).sort().join(',');
}

for (const { code } of LANGUAGES) {
  const directory = path.join(localesRoot, code);
  if (!fs.existsSync(directory)) { failures.push(`Missing locale: ${code}`); continue; }
  const actualFiles = fs.readdirSync(directory).filter((file) => file.endsWith('.json')).map((file) => file.slice(0, -5));
  for (const name of actualFiles) if (!namespaces.includes(name)) failures.push(`Undeclared namespace: ${code}/${name}`);
  for (const namespace of namespaces) resources.set(`${code}:${namespace}`, readLocale(code, namespace));
}

for (const namespace of namespaces) {
  const source = resources.get(`${DEFAULT_LANGUAGE}:${namespace}`) || {};
  for (const { code } of LANGUAGES) {
    const target = resources.get(`${code}:${namespace}`) || {};
    for (const [key, sourceText] of Object.entries(source)) {
      if (typeof sourceText !== 'string' || !sourceText.trim()) failures.push(`Empty/invalid source: ${namespace}:${key}`);
      if (!(key in target)) { failures.push(`Missing key: ${code}/${namespace}:${key}`); continue; }
      if (typeof target[key] !== 'string' || !target[key].trim()) failures.push(`Empty translation: ${code}/${namespace}:${key}`);
      else if (placeholders(target[key]) !== placeholders(sourceText)) failures.push(`Placeholder mismatch: ${code}/${namespace}:${key}`);
    }
    for (const key of Object.keys(target)) if (!(key in source)) failures.push(`Extra key: ${code}/${namespace}:${key}`);
  }
}

function sourceFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? sourceFiles(file) : /\.(?:jsx?|mjs)$/.test(entry.name) ? [file] : [];
  });
}

for (const file of sourceFiles(sourceRoot)) {
  const source = fs.readFileSync(file, 'utf8');
  for (const match of source.matchAll(/['"]([a-z]+):([A-Za-z][A-Za-z0-9_]*)['"]/g)) {
    const [, namespace, key] = match;
    if (!namespaces.includes(namespace)) continue;
    const canonical = resources.get(`${DEFAULT_LANGUAGE}:${namespace}`);
    if (!canonical?.[key] && !canonical?.[`${key}_other`]) {
      failures.push(`Unknown key in ${path.relative(sourceRoot, file)}: ${namespace}:${key}`);
    }
  }
}

const preferenceCases = [
  ['en', 'ja', 'fr-FR', 'en'], [null, 'ja', 'fr-FR', 'ja'],
  [null, null, 'en-US', 'en'], [null, null, 'zh-TW', 'vi'],
  ['unknown', 'unknown', 'unknown', 'vi'],
];
for (const [user, local, browser, expected] of preferenceCases) {
  if (resolveLanguagePreference(user, local, browser) !== expected) failures.push(`Preference order: ${user}/${local}/${browser}`);
}
if (browserLanguage('ZH_cn') !== 'zh-CN') failures.push('Browser locale normalization: zh-CN');

const instance = i18next.createInstance();
await instance.init({
  lng: 'en', fallbackLng: 'vi', defaultNS: 'common', ns: namespaces,
  resources: Object.fromEntries(LANGUAGES.map(({ code }) => [code,
    Object.fromEntries(namespaces.map((namespace) => [namespace, resources.get(`${code}:${namespace}`) || {}]))])),
  interpolation: { escapeValue: false },
});
for (const [language, count, expected] of [
  ['en', 1, 'Uploaded 1 file'], ['en', 2, 'Uploaded 2 files'],
  ['vi', 2, 'Đã tải lên 2 tệp'],
]) {
  await instance.changeLanguage(language);
  const actual = instance.t('upload:uploadedFiles', { count, formattedCount: String(count) });
  if (actual !== expected) failures.push(`Plural: ${language}/${count}: ${actual}`);
}
await instance.changeLanguage('en');
if (instance.t('files:openTitle', { title: 'Báo cáo.pdf' }) !== 'Open Báo cáo.pdf') failures.push('Interpolation changed user content');

if (failures.length) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`i18n: ${LANGUAGES.length} locales, ${namespaces.length} namespaces, all keys and placeholders valid`);
}
