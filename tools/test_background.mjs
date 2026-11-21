import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const listeners = {};
const calls = { query: 0, badgeText: [], badgeColor: 0, storageGet: 0 };

const mockTabs = [
  { id: 1, title: 'A', url: 'https://a.test/' },
  { id: 2, title: 'B', url: 'https://b.test/' },
  { id: 3, title: 'C', url: 'https://c.test/' },
  { id: 4, title: 'D', url: 'https://d.test/' },
  { id: 5, title: 'E', url: 'https://e.test/' },
  { id: 6, title: 'F', url: 'https://f.test/' },
  { id: 7, title: 'G', url: 'https://g.test/' },
  { id: 8, title: 'H', url: 'https://h.test/' },
  { id: 9, title: 'System', url: 'chrome://settings/' },
  { id: 10, title: 'Duplicate', url: 'https://a.test/' }
];

const settings = {
  scope: 'current', includeTitles: false, removeDuplicates: true, skipSystem: true,
  sortOrder: 'original', numberFormat: 'dot', fileName: 'tabs-links', autoCopy: true,
  darkMode: false, saveHistory: true, lang: 'en'
};

const on = (group, name, fn) => { (listeners[group] ??= {})[name] = fn; };

global.fetch = async (url) => ({
  ok: true,
  json: async () => JSON.parse(fs.readFileSync(path.join(repo, 'locales', path.basename(String(url))), 'utf8'))
});

global.chrome = {
  runtime: {
    getURL: (p) => 'https://extension.test/' + p,
    onInstalled: { addListener: (fn) => on('runtime', 'installed', fn) },
    onStartup: { addListener: (fn) => on('runtime', 'startup', fn) }
  },
  i18n: { getUILanguage: () => 'en-US' },
  storage: {
    local: {
      get: async () => { calls.storageGet++; return { ct_settings: settings, ct_history: [] }; },
      set: async () => {}
    },
    onChanged: { addListener: (fn) => on('storage', 'changed', fn) }
  },
  contextMenus: {
    removeAll: (cb) => cb(),
    create: () => {},
    onClicked: { addListener: (fn) => on('contextMenus', 'clicked', fn) }
  },
  commands: { onCommand: { addListener: (fn) => on('commands', 'command', fn) } },
  tabs: {
    query: async () => { calls.query++; return mockTabs; },
    onCreated: { addListener: (fn) => on('tabs', 'created', fn) },
    onRemoved: { addListener: (fn) => on('tabs', 'removed', fn) },
    onUpdated: { addListener: (fn) => on('tabs', 'updated', fn) }
  },
  windows: {
    getLastFocused: async () => ({ id: 1 }),
    getCurrent: async () => ({ id: 1 }),
    onFocusChanged: { addListener: (fn) => on('windows', 'focus', fn) }
  },
  action: {
    setBadgeText: (o) => { calls.badgeText.push(o.text); },
    setBadgeBackgroundColor: () => { calls.badgeColor++; }
  },
  downloads: { download: async () => 1 }
};

await import('../background.js?test=' + Date.now());

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

test('badge ignores loading-only updates, debounces real ones and writes once', async () => {
  assert.ok(listeners.tabs?.updated, 'onUpdated listener must be registered');

  for (let i = 0; i < 100; i++) listeners.tabs.updated(i + 1, { status: 'loading' }, mockTabs[i]);
  await wait(250);
  assert.equal(calls.query, 0, 'loading updates must not trigger a full tabs.query');

  listeners.tabs.updated(1, { status: 'complete' }, mockTabs[0]);
  listeners.tabs.updated(2, { status: 'complete' }, mockTabs[1]);
  await wait(250);
  assert.equal(calls.query, 1, 'multiple real updates must collapse into one query');

  assert.equal(calls.badgeColor, 1, 'badge color must be written once, not per event');
  assert.deepEqual(calls.badgeText, ['8'], 'badge must count exportable, deduplicated tabs only');
  assert.ok(calls.storageGet <= 2, 'settings must be cached, not read per event');
});
