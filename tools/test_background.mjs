import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const listeners = {};
const calls = { query: 0, badgeText: [], badgeColor: 0, storageGet: 0 };
const menuOps = [];
let lastErrorReads = 0;
let lastErrorValue = undefined;
let simulateMenuError = false;
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let queryDelay = 0;
let queryTabs = null;
let failNextStorageGet = false;

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
      get: async () => {
        calls.storageGet++;
        if (failNextStorageGet) { failNextStorageGet = false; throw new Error('transient storage failure'); }
        return { ct_settings: settings, ct_history: [] };
      },
      set: async () => {}
    },
    onChanged: { addListener: (fn) => on('storage', 'changed', fn) }
  },
  contextMenus: {
    // callback async ليفتح نافذة التداخل التي تسبب duplicate id في كروم
    removeAll: (cb) => { menuOps.push('remove'); setTimeout(cb, 10); },
    create: (item, cb) => {
      menuOps.push('create:' + item.id);
      if (simulateMenuError) lastErrorValue = { message: 'simulated duplicate' };
      if (cb) cb();
      lastErrorValue = undefined;
    },
    onClicked: { addListener: (fn) => on('contextMenus', 'clicked', fn) }
  },
  commands: { onCommand: { addListener: (fn) => on('commands', 'command', fn) } },
  tabs: {
    query: async () => {
      calls.query++;
      if (queryDelay) await wait(queryDelay);
      return queryTabs || mockTabs;
    },
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

Object.defineProperty(chrome.runtime, 'lastError', {
  get() { lastErrorReads++; return lastErrorValue; }, configurable: true
});

await import('../background.js?test=' + Date.now());

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
  assert.equal(calls.storageGet, 1, 'settings must be read once and cached');
});

test('repeated tab events never re-read settings from storage', async () => {
  const before = calls.storageGet;
  for (let i = 0; i < 20; i++) {
    listeners.tabs.created(i + 1, {}, mockTabs[0]);
    await wait(170);
  }
  assert.equal(calls.storageGet, before, 'cached settings must survive many badge refreshes');
});

test('a slower older badge refresh cannot overwrite a newer count', async () => {
  queryDelay = 60;
  queryTabs = mockTabs; // 8 exportable
  listeners.tabs.created(1);
  await wait(15);
  queryTabs = mockTabs.slice(0, 7); // 7 exportable, newer event
  listeners.tabs.created(2);
  await wait(300);
  queryDelay = 0;
  queryTabs = null;
  assert.equal(calls.badgeText.at(-1), '7', 'the newest query must win the final badge write');
});

test('overlapping language changes never create the context menu twice', async () => {
  const before = menuOps.length;
  listeners.storage.changed({ ct_settings: { oldValue: { lang: 'en' }, newValue: { lang: 'ar' } } }, 'local');
  listeners.storage.changed({ ct_settings: { oldValue: { lang: 'ar' }, newValue: { lang: 'fr' } } }, 'local');
  await wait(150);
  const ops = menuOps.slice(before);
  assert.deepEqual(ops, ['remove', 'create:ct-export', 'remove', 'create:ct-export'],
    'every create must be preceded by a completed removeAll — no duplicate id');
});

test('install and startup rebuilds use the same serialized queue', async () => {
  const before = menuOps.length;
  listeners.runtime.installed({ reason: 'install' });
  listeners.runtime.startup();
  await wait(150);
  assert.deepEqual(menuOps.slice(before), ['remove', 'create:ct-export', 'remove', 'create:ct-export']);
});

test('first install does not rebuild the menu twice via storage.onChanged', async () => {
  const before = menuOps.length;
  listeners.storage.changed({ ct_settings: { oldValue: undefined, newValue: { lang: '' } } }, 'local');
  await wait(100);
  assert.equal(menuOps.length, before);
});

test('menu callbacks consume chrome.runtime.lastError', async () => {
  const before = lastErrorReads;
  simulateMenuError = true;
  listeners.storage.changed({ ct_settings: { oldValue: { lang: 'en' }, newValue: { lang: 'de' } } }, 'local');
  await wait(150);
  simulateMenuError = false;
  assert.ok(lastErrorReads >= before + 2, 'removeAll and create callbacks must both consume lastError');
});

test('a transient storage failure does not poison future settings reads', async () => {
  failNextStorageGet = true;
  await import('../background.js?recovery=' + Date.now());
  listeners.tabs.created(1);
  await wait(250);
  const before = calls.badgeText.length;
  listeners.tabs.created(2);
  await wait(250);
  assert.ok(calls.badgeText.length > before, 'badge must recover after one transient storage error');
});
