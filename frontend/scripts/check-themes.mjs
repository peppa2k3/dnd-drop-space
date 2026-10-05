import assert from 'node:assert/strict';
import { THEMES, DEFAULT_APPEARANCE, applyAppearance, normalizeAppearance, resolvedMode,
  readAppearance, writeAppearance } from '../src/config/themes.js';

function luminance(channels) {
  const values = channels.split(' ').map(Number).map((value) => {
    const s = value / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return values[0] * 0.2126 + values[1] * 0.7152 + values[2] * 0.0722;
}

function contrast(a, b) {
  const [lighter, darker] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (lighter + 0.05) / (darker + 0.05);
}

assert.equal(THEMES.length, 5);
assert.ok(THEMES.some(({ id }) => id === DEFAULT_APPEARANCE.theme));
const expectedTokens = Object.keys(THEMES[0].dark).sort();
let checks = 0;
for (const theme of THEMES) {
  for (const mode of ['dark', 'light']) {
    const palette = theme[mode];
    assert.deepEqual(Object.keys(palette).sort(), expectedTokens, `${theme.id}/${mode}: incomplete palette`);
    for (const [foreground, background, minimum] of [
      ['text-primary', 'background', 7], ['text-primary', 'surface', 7],
      ['text-secondary', 'surface', 4.5], ['text-muted', 'surface', 4.5],
      ['primary-hover', 'background', 4.5], ['primary-hover', 'surface', 4.5],
      ['primary-contrast', 'primary', 4.5],
      ['danger', 'surface', 4.5], ['success', 'surface', 4.5],
    ]) {
      const ratio = contrast(palette[foreground], palette[background]);
      assert.ok(ratio >= minimum,
        `${theme.id}/${mode}: ${foreground} on ${background} is ${ratio.toFixed(2)}:1, need ${minimum}:1`);
      checks++;
    }
  }
}
console.log(`Theme contrast OK: ${checks} pairs across 5 themes and 2 modes`);

const cssVariables = new Map();
const storage = new Map();
globalThis.document = {
  documentElement: { dataset: {}, style: { setProperty: (key, value) => cssVariables.set(key, value) } },
  querySelector: () => null,
};
globalThis.localStorage = {
  setItem: (key, value) => storage.set(key, value),
  getItem: (key) => storage.get(key) ?? null,
};
for (const theme of THEMES) {
  for (const mode of ['dark', 'light']) {
    applyAppearance({ theme: theme.id, mode });
    assert.equal(document.documentElement.dataset.theme, theme.id);
    assert.equal(document.documentElement.dataset.mode, mode);
    assert.equal(cssVariables.get('--background'), theme[mode].background);
    assert.equal(cssVariables.get('--primary'), theme[mode].primary);
  }
}
assert.equal(resolvedMode('system', false), 'light');
assert.equal(resolvedMode('system', true), 'dark');
applyAppearance({ theme: 'ice-datacenter', mode: 'system' }, false);
assert.equal(document.documentElement.dataset.modePreference, 'system');
assert.equal(document.documentElement.dataset.mode, 'light');
assert.equal(cssVariables.get('--background'), THEMES[4].light.background);
applyAppearance({ theme: 'ice-datacenter', mode: 'system' }, true);
assert.equal(document.documentElement.dataset.mode, 'dark');
assert.equal(cssVariables.get('--background'), THEMES[4].dark.background);
assert.deepEqual(normalizeAppearance({ theme: 'ice-data', mode: 'light' }),
  { theme: 'ice-datacenter', mode: 'light' });
const selected = { theme: 'ice-datacenter', mode: 'system' };
writeAppearance('theme-test', selected);
assert.deepEqual(normalizeAppearance(readAppearance('theme-test')), selected);
assert.deepEqual(normalizeAppearance({ theme: 'invalid', mode: 'invalid' }), DEFAULT_APPEARANCE);
console.log('Theme switching, system mode and local restore OK');
