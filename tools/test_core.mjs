import test from 'node:test';
import assert from 'node:assert/strict';

const core = await import('../core.js');

const settings = {
  scope: 'current', includeTitles: false, removeDuplicates: true, skipSystem: true,
  sortOrder: 'original', numberFormat: 'dot', fileName: 'tabs-links', autoCopy: true,
  darkMode: false, saveHistory: true, lang: 'en'
};

test('prepareTabs drops empty URLs, system pages and duplicates, preserving order', () => {
  const tabs = [
    { id: 1, title: 'A', url: 'https://a.test/' },
    { id: 2, title: 'B', url: 'chrome://settings/' },
    { id: 3, title: '', url: 'https://a.test/' },
    { id: 4, title: 'D', url: '' },
    { id: 5, title: 'E', url: 'https://e.test/' }
  ];
  const out = core.prepareTabs(tabs, settings);
  assert.deepEqual(out.map((t) => t.id), [1, 5]);
  assert.equal(out[0].title, 'A');
});

test('prepareTabs keeps system pages when skipSystem is false', () => {
  const tabs = [{ id: 1, title: 'S', url: 'chrome://settings/' }];
  assert.equal(core.prepareTabs(tabs, settings).length, 0);
  assert.equal(core.prepareTabs(tabs, { ...settings, skipSystem: false }).length, 1);
});

test('prepareTabs sorts by URL and by domain without mutating input', () => {
  const tabs = [
    { id: 1, title: 'z', url: 'https://z.test/' },
    { id: 2, title: 'a', url: 'https://a.test/' },
    { id: 3, title: 'b', url: 'https://b.test/' }
  ];
  const byUrl = core.prepareTabs(tabs, { ...settings, sortOrder: 'az' });
  assert.deepEqual(byUrl.map((t) => t.id), [2, 3, 1]);
  const byDomain = core.prepareTabs(tabs, { ...settings, sortOrder: 'domain' });
  assert.deepEqual(byDomain.map((t) => t.id), [2, 3, 1]);
  assert.deepEqual(tabs.map((t) => t.id), [1, 2, 3]);
});

test('formatLinks supports dot, paren, dash and page titles', () => {
  const tabs = [{ title: 'Google', url: 'https://google.test/' }, { title: 'MDN', url: 'https://mdn.test/' }];
  assert.equal(core.formatLinks(tabs, settings), '1. https://google.test/\n2. https://mdn.test/');
  assert.equal(core.formatLinks(tabs, { ...settings, numberFormat: 'paren' }), '1) https://google.test/\n2) https://mdn.test/');
  assert.equal(core.formatLinks(tabs, { ...settings, numberFormat: 'dash' }), '- https://google.test/\n- https://mdn.test/');
  assert.equal(core.formatLinks(tabs, { ...settings, includeTitles: true }), '1. Google — https://google.test/\n2. MDN — https://mdn.test/');
});

test('sanitizeFileName removes unsafe characters and caps length', () => {
  assert.equal(core.sanitizeFileName('  my/name:*?"<>|  '), 'my-name-------');
  assert.equal(core.sanitizeFileName('a'.repeat(80)).length, 60);
  assert.equal(core.sanitizeFileName('   '), 'tabs-links');
});

test('makeFileName appends the local date stamp', () => {
  const d = new Date(2026, 10, 21);
  assert.equal(core.makeFileName('tabs-links', d), 'tabs-links-2026-11-21.txt');
  assert.equal(core.makeFileName('bad/name', d), 'bad-name-2026-11-21.txt');
});

test('isBadgeRelevantChange ignores loading-only tab updates', () => {
  assert.equal(core.isBadgeRelevantChange({}), false);
  assert.equal(core.isBadgeRelevantChange({ status: 'loading' }), false);
  assert.equal(core.isBadgeRelevantChange({ status: 'complete' }), true);
  assert.equal(core.isBadgeRelevantChange({ url: 'https://x.test/' }), true);
  assert.equal(core.isBadgeRelevantChange({ title: 'x' }), true);
  assert.equal(core.isBadgeRelevantChange({ favIconUrl: 'https://x.test/f.ico' }), true);
});
