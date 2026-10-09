import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import { LANGUAGES } from '../src/i18n/languages.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const server = await createServer({
  root,
  configFile: false,
  server: { middlewareMode: true },
  appType: 'custom',
});

try {
  const { default: i18n, i18nReady, NAMESPACES } = await server.ssrLoadModule('/src/i18n/config.js');
  await i18nReady;

  const key = 'files:tryRemovingFiltersOrAddingNewDataUsingTheNewButtonInTheUpperCorner';
  const samples = {
    vi: 'Hãy thử bỏ bớt bộ lọc, hoặc thêm dữ liệu mới bằng nút “Mới” ở góc trên.',
    en: 'Try removing filters, or adding new data using the “New” button in the upper corner.',
  };

  if (!i18n.hasResourceBundle(i18n.language, 'files')) {
    throw new Error(`Initial locale was not loaded: ${i18n.language}/files`);
  }

  for (const { code } of LANGUAGES) {
    await i18n.changeLanguage(code);
    for (const namespace of NAMESPACES) {
      if (!i18n.hasResourceBundle(code, namespace)) {
        throw new Error(`Runtime resource was not loaded: ${code}/${namespace}`);
      }
    }
    const actual = i18n.t(key);
    if (actual === key.slice('files:'.length) || !actual.trim()) {
      throw new Error(`Raw or empty translation in ${code}: ${actual}`);
    }
    if (samples[code] && actual !== samples[code]) {
      throw new Error(`Wrong translation in ${code}: ${actual}`);
    }
  }

  console.log(`i18n runtime: ${LANGUAGES.length} languages load ${NAMESPACES.length} namespaces`);
} finally {
  await server.close();
}
