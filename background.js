// background.js — خلفية الإضافة (مستمعون top-level فقط): إعدادات افتراضية، قائمة سياق، شارة العدد، تصدير سريع.

import { loadLocale, matchLocale, t } from './i18n.js';
import { SETTINGS_DEFAULTS, prepareTabs, formatLinks, makeFileName, isBadgeRelevantChange } from './core.js';

const BADGE_DEBOUNCE_MS = 150;

let cachedSettings = null;
let settingsPromise = null;
let badgeTimer = null;
let badgeGeneration = 0;
let lastBadgeCount = null;
let badgeColorSet = false;

chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    await chrome.storage.local.set({ ct_settings: SETTINGS_DEFAULTS, ct_history: [] });
  } else if (!(await chrome.storage.local.get(['ct_settings'])).ct_settings) {
    await chrome.storage.local.set({ ct_settings: SETTINGS_DEFAULTS });
  }
  setupContextMenu();
  await refreshBadge();
});

chrome.runtime.onStartup.addListener(async () => {
  setupContextMenu();
  await refreshBadge();
});

// الإعدادات تُقرأ مرة وتُحدَّث من storage.onChanged — لا من كل حدث تبويب
async function getSettings() {
  if (cachedSettings) return cachedSettings;
  if (!settingsPromise) {
    settingsPromise = chrome.storage.local.get(['ct_settings']).then(({ ct_settings }) => {
      // storage.onChanged قد يسبق الرد — لا نكتب فوق قيمة أحدث
      if (!cachedSettings) cachedSettings = { ...SETTINGS_DEFAULTS, ...(ct_settings || {}) };
      settingsPromise = null;
      return cachedSettings;
    });
  }
  return settingsPromise;
}

function setupContextMenu() {
  try {
    chrome.contextMenus.removeAll(async () => {
      const s = await getSettings();
      const lang = s.lang || matchLocale(chrome.i18n.getUILanguage()) || 'en';
      await loadLocale(lang);
      chrome.contextMenus.create({
        id: 'ct-export',
        title: t('contextMenuTitle'),
        contexts: ['action']
      });
    });
  } catch { /* بيئة غير داعمة */ }
}

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local' || !changes.ct_settings) return;
  const before = changes.ct_settings.oldValue?.lang;
  const after = changes.ct_settings.newValue?.lang;
  cachedSettings = { ...SETTINGS_DEFAULTS, ...(changes.ct_settings.newValue || {}) };
  if (before !== after) setupContextMenu();
});

chrome.contextMenus.onClicked.addListener(async (info) => {
  if (info.menuItemId === 'ct-export') await quickExport();
});

chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'quick-export') await quickExport();
});

function scheduleBadge() {
  clearTimeout(badgeTimer);
  badgeTimer = setTimeout(refreshBadge, BADGE_DEBOUNCE_MS);
}

chrome.tabs.onCreated.addListener(scheduleBadge);
chrome.tabs.onRemoved.addListener(scheduleBadge);
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (isBadgeRelevantChange(changeInfo)) scheduleBadge();
});
chrome.windows.onFocusChanged.addListener(scheduleBadge);

async function refreshBadge() {
  const generation = ++badgeGeneration;
  try {
    const s = await getSettings();
    const query = s.scope === 'all' ? {} : { windowId: (await chrome.windows.getLastFocused())?.id };
    const tabs = await chrome.tabs.query(query);
    if (generation !== badgeGeneration) return; // نتيجة قديمة لا تكتب فوق الأحدث
    const n = prepareTabs(tabs, s).length;
    if (n !== lastBadgeCount) {
      await chrome.action.setBadgeText({ text: n > 0 ? String(n) : '' });
      lastBadgeCount = n;
    }
    if (!badgeColorSet) {
      await chrome.action.setBadgeBackgroundColor({ color: '#4f46e5' });
      badgeColorSet = true;
    }
  } catch { /* تجاهل */ }
}

async function quickExport() {
  try {
    const s = await getSettings();
    const query = s.scope === 'all' ? {} : { windowId: (await chrome.windows.getLastFocused())?.id };
    const tabs = prepareTabs(await chrome.tabs.query(query), s);
    const text = formatLinks(tabs, s);
    if (!text) return;
    await chrome.downloads.download({
      url: 'data:text/plain;charset=utf-8,' + encodeURIComponent(text),
      filename: makeFileName(s.fileName),
      saveAs: false
    });
    if (s.saveHistory) {
      const { ct_history = [] } = await chrome.storage.local.get(['ct_history']);
      await chrome.storage.local.set({
        ct_history: [{ at: new Date().toISOString(), count: tabs.length, preview: text.slice(0, 220), full: text.slice(0, 20000) }, ...ct_history].slice(0, 10)
      });
    }
    await refreshBadge();
  } catch (e) {
    console.error('[CopyTabs] quickExport failed:', e);
  }
}
