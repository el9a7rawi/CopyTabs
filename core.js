// core.js — منطق التبويبات والروابط الخالص، مشترك بين الواجهة والخلفية (بلا DOM ولا chrome API).
import { SYSTEM_PREFIXES } from './browser.js';

export const SETTINGS_DEFAULTS = Object.freeze({
  scope: 'current', includeTitles: false, removeDuplicates: true, skipSystem: true,
  sortOrder: 'original', numberFormat: 'dot', fileName: 'tabs-links', autoCopy: true,
  darkMode: false, saveHistory: true, lang: ''
});

export function isSystemUrl(url) {
  return SYSTEM_PREFIXES.some((p) => url.startsWith(p));
}

export function hostOf(url) {
  try { return new URL(url).hostname; } catch { return url; }
}

export function prepareTabs(tabs, settings) {
  let out = tabs
    .filter((tab) => tab.url && (!settings.skipSystem || !isSystemUrl(tab.url)))
    .map((tab) => ({ id: tab.id, title: (tab.title || '').trim() || tab.url, url: tab.url, checked: true }));

  if (settings.removeDuplicates) {
    const seen = new Set();
    out = out.filter((tab) => (seen.has(tab.url) ? false : (seen.add(tab.url), true)));
  }
  return sortTabs(out, settings);
}

export function sortTabs(tabs, settings) {
  const out = [...tabs];
  if (settings.sortOrder === 'az') {
    out.sort((a, b) => a.url.localeCompare(b.url));
  } else if (settings.sortOrder === 'domain') {
    // حساب النطاق مرة واحدة خارج المقارنة حتى لا نعيد تحليل كل رابط عشرات المرات
    const hosts = new Map(out.map((tab) => [tab, hostOf(tab.url)]));
    out.sort((a, b) => hosts.get(a).localeCompare(hosts.get(b)));
  }
  return out;
}

export function formatLinks(tabs, settings) {
  return tabs.map((tab, i) => {
    const prefix = settings.numberFormat === 'paren' ? `${i + 1}) `
      : settings.numberFormat === 'dash' ? '- ' : `${i + 1}. `;
    return settings.includeTitles ? `${prefix}${tab.title} — ${tab.url}` : `${prefix}${tab.url}`;
  }).join('\n');
}

export function sanitizeFileName(name) {
  return String(name || '').trim().replace(/[\\/:*?"<>|]/g, '-').slice(0, 60) || 'tabs-links';
}

export function makeFileName(base, now = new Date()) {
  const stamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  return `${sanitizeFileName(base)}-${stamp}.txt`;
}

export function isBadgeRelevantChange(changeInfo = {}) {
  // only URL changes can alter the exportable count; favicon/title changes cannot
  return changeInfo.status === 'complete' || 'url' in changeInfo;
}

export function scopeQuery(settings, windowId) {
  // غياب النافذة المركّزة حالة انتقالية — نعدّ الكل بدل استعلام بـ windowId غير معرّف
  return settings.scope === 'all' || !windowId ? {} : { windowId };
}
