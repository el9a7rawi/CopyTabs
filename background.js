// ===== background.js — Service Worker (MV3, module) =====
// مسؤوليات: إعدادات افتراضية + قائمة سياق + Badge بعدد التبويبات + أمر التصدير السريع.
// best-practice: مستمعون في المستوى الأعلى (top-level)، لا DOM، لا XHR، الحفظ في chrome.storage.

const DEFAULTS = {
  scope: 'current',
  includeTitles: false,
  removeDuplicates: true,
  skipSystem: true,
  sortOrder: 'original',
  numberFormat: 'dot',
  fileName: 'tabs-links',
  autoCopy: true,
  darkMode: false,
  saveHistory: true
};
const SYSTEM_PREFIXES = ['chrome://', 'edge://', 'about:', 'chrome-extension://', 'view-source:'];

chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    await chrome.storage.local.set({ ct_settings: DEFAULTS, ct_history: [] });
  } else {
    const { ct_settings } = await chrome.storage.local.get(['ct_settings']);
    if (!ct_settings) await chrome.storage.local.set({ ct_settings: DEFAULTS });
  }
  setupContextMenu();
  await refreshBadge();
});

chrome.runtime.onStartup.addListener(async () => {
  setupContextMenu();
  await refreshBadge();
});

function setupContextMenu() {
  try {
    chrome.contextMenus.removeAll(() => {
      chrome.contextMenus.create({
        id: 'ct-export',
        title: 'نسخ روابط التبويبات (TXT مرقّم)',
        contexts: ['action']
      });
    });
  } catch { /* بيئة غير داعمة */ }
}

chrome.contextMenus.onClicked.addListener(async (info) => {
  if (info.menuItemId === 'ct-export') await quickExport(false);
});

chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'quick-export') await quickExport(true);
});

// تحديث Badge عند تغيّر التبويبات
chrome.tabs.onCreated.addListener(refreshBadge);
chrome.tabs.onRemoved.addListener(refreshBadge);
chrome.tabs.onUpdated.addListener(refreshBadge);
chrome.windows.onFocusChanged.addListener(refreshBadge);

async function refreshBadge() {
  try {
    const { ct_settings = DEFAULTS } = await chrome.storage.local.get(['ct_settings']);
    let tabs;
    if (ct_settings.scope === 'all') tabs = await chrome.tabs.query({});
    else {
      const win = await chrome.windows.getCurrent();
      tabs = await chrome.tabs.query({ windowId: win?.id });
    }
    const n = tabs.filter((t) => t.url && !isSystem(t.url, ct_settings.skipSystem)).length;
    await chrome.action.setBadgeText({ text: n > 0 ? String(n) : '' });
    await chrome.action.setBadgeBackgroundColor({ color: '#4f46e5' });
  } catch { /* تجاهل */ }
}

function isSystem(url, skip) {
  if (!skip) return false;
  return SYSTEM_PREFIXES.some((p) => url.startsWith(p));
}

async function quickExport(fromCommand) {
  try {
    const { ct_settings = DEFAULTS } = await chrome.storage.local.get(['ct_settings']);
    const s = { ...DEFAULTS, ...ct_settings };
    const query = s.scope === 'all' ? {} : { windowId: (await chrome.windows.getCurrent())?.id };
    let tabs = await chrome.tabs.query(query);
    tabs = tabs.filter((t) => t.url).filter((t) => !isSystem(t.url, s.skipSystem));
    if (s.removeDuplicates) {
      const seen = new Set();
      tabs = tabs.filter((t) => (seen.has(t.url) ? false : (seen.add(t.url), true)));
    }
    if (s.sortOrder === 'az') tabs.sort((a, b) => a.url.localeCompare(b.url));
    if (s.sortOrder === 'domain') tabs.sort((a, b) => host(a.url).localeCompare(host(b.url)));

    const text = tabs.map((t, i) => {
      const p = s.numberFormat === 'paren' ? `${i + 1}) ` : s.numberFormat === 'dash' ? '- ' : `${i + 1}. `;
      return s.includeTitles ? `${p}${t.title || t.url} — ${t.url}` : `${p}${t.url}`;
    }).join('\n');

    if (!text) return;
    const d = new Date();
    const stamp = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const safe = String(s.fileName || 'tabs-links').replace(/[\\/:*?"<>|]/g, '-');
    await chrome.downloads.download({
      url: 'data:text/plain;charset=utf-8,' + encodeURIComponent(text),
      filename: `${safe}-${stamp}.txt`,
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

function host(url) {
  try { return new URL(url).hostname; } catch { return url; }
}
