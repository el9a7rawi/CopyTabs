// popup.js — واجهة الإضافة (MV3, type=module). كل بيانات المستخدم تُعرض عبر textContent فقط.

import { t, loadLocale, localeCode, matchLocale, applyTranslations } from './i18n.js';
import { SYSTEM_PREFIXES, detectBrowser } from './browser.js';

const DEFAULTS = {
  scope: 'current',          // النطاق
  includeTitles: false,      // تضمين العناوين
  removeDuplicates: true,    // إزالة المكرر
  skipSystem: true,          // تخطي صفحات النظام
  sortOrder: 'original',     // الترتيب: original|az|domain
  numberFormat: 'dot',       // الترقيم: dot|paren|dash
  fileName: 'tabs-links',    // اسم الملف
  autoCopy: true,            // نسخ تلقائي
  darkMode: false,           // يعكس body[data-theme]
  saveHistory: true,         // حفظ السجل
  lang: ''                   // لغة الواجهة — فارغة تعني أن المستخدم لم يختر بعد
};

const $ = (id) => document.getElementById(id);
const els = {
  themeToggle: $('themeToggle'),
  langSelect: $('lang'),
  mainExportBtn: $('mainExportBtn'),
  copyOnlyBtn: $('copyOnlyBtn'),
  downloadOnlyBtn: $('downloadOnlyBtn'),
  statusMsg: $('statusMsg'),
  searchInput: $('searchInput'),
  searchToggle: $('searchToggle'),
  searchClear: $('searchClear'),
  previewList: $('previewList'),
  emptyState: $('emptyState'),
  historyList: $('historyList'),
  historyEmpty: $('historyEmpty'),
  clearHistoryBtn: $('clearHistoryBtn'),
  resetBtn: $('resetBtn')
};
const optIds = ['scope', 'includeTitles', 'removeDuplicates', 'skipSystem', 'sortOrder', 'numberFormat', 'fileName', 'autoCopy', 'darkMode', 'saveHistory'];

let settings = { ...DEFAULTS };
let allTabs = [];       // [{id, title, url, checked}]

init();

async function init() {
  settings = await loadSettings();
  await initLocale();
  applyTranslations();
  applyBrowserCopy();
  applySettingsToUI();
  enhanceCustomSelects();
  syncCustomSelects();
  bindEvents();
  await refreshTabs();
  await renderHistory();
  applyTheme();
}

// أول تشغيل: لغة المتصفح تُستخدم مرة واحدة فقط ثم تُحفظ كاختيار صريح
async function initLocale() {
  const wanted = settings.lang || matchLocale(navigator.language) || 'en';
  await loadLocale(wanted);
  if (settings.lang !== localeCode()) {
    settings.lang = localeCode();
    await saveSettings();
  }
}

// ---------- Settings (chrome.storage.local) ----------
async function loadSettings() {
  try {
    const stored = await chrome.storage.local.get(['ct_settings']);
    return { ...DEFAULTS, ...(stored.ct_settings || {}) };
  } catch {
    return { ...DEFAULTS };
  }
}
async function saveSettings() {
  try {
    await chrome.storage.local.set({ ct_settings: settings });
  } catch { /* تجاهل آمن */ }
}

function applySettingsToUI() {
  for (const id of optIds) {
    const el = $(id);
    if (!el) continue;
    if (el.type === 'checkbox') el.checked = Boolean(settings[id]);
    else el.value = settings[id] ?? DEFAULTS[id];
  }
  if (els.langSelect) els.langSelect.value = localeCode();
}

function readSettingsFromUI() {
  for (const id of optIds) {
    const el = $(id);
    if (!el) continue;
    settings[id] = el.type === 'checkbox' ? el.checked : el.value;
  }
  // تنظيف اسم الملف: منع رموز غير صالحة
  settings.fileName = sanitizeFileName(settings.fileName || DEFAULTS.fileName);
}

function sanitizeFileName(name) {
  const clean = String(name).trim().replace(/[\\/:*?"<>|]/g, '-').slice(0, 60) || 'tabs-links';
  return clean;
}

// ---------- Tabs ----------
async function refreshTabs() {
  setStatus(t('statusLoading'));
  try {
    let query = {};
    if (settings.scope === 'current') {
      const win = await chrome.windows.getCurrent();
      query = { windowId: win.id };
    }
    const tabs = await chrome.tabs.query(query);
    allTabs = tabs
      .filter((tab) => tab.url)
      .filter((tab) => (settings.skipSystem ? !isSystemUrl(tab.url) : true))
      .map((tab) => ({ id: tab.id, title: (tab.title || '').trim() || tab.url, url: tab.url, checked: true }));

    if (settings.removeDuplicates) {
      const seen = new Set();
      allTabs = allTabs.filter((tab) => {
        if (seen.has(tab.url)) return false;
        seen.add(tab.url);
        return true;
      });
    }
    applySort();
    renderPreview();
    updateBadge(allTabs.length);
    $('heroHint').textContent = allTabs.length
      ? t('heroHintCount', { n: allTabs.length })
      : t('heroHintEmpty');
    setStatus(allTabs.length ? '' : t('statusNoLinks'));
  } catch (err) {
    console.error(err);
    setStatus(t('errorTabs'), true);
  }
}

function isSystemUrl(url) {
  return SYSTEM_PREFIXES.some((p) => url.startsWith(p));
}

// اسم خيار صفحات النظام يتبع المتصفح المضيف (chrome:// أو edge:// أو about: …)
// عزل المخطط LTR يمنع انقلاب chrome:// داخل جملة عربية
function applyBrowserCopy() {
  const label = $('skipSystemLabel');
  if (!label) return;
  const { scheme } = detectBrowser();
  label.textContent = scheme
    ? t('optSkipSystem', { scheme: `\u2066${scheme}\u2069` })
    : t('optSkipSystemPlain');
}

function applySort() {
  if (settings.sortOrder === 'az') {
    allTabs.sort((a, b) => a.url.localeCompare(b.url));
  } else if (settings.sortOrder === 'domain') {
    allTabs.sort((a, b) => domainOf(a.url).localeCompare(domainOf(b.url)));
  }
}
function domainOf(url) {
  try { return new URL(url).hostname; } catch { return url; }
}

// ---------- Search ----------
function expandSearch() {
  const box = els.searchToggle.closest('.searchbox');
  box.classList.add('open');
  els.searchToggle.setAttribute('aria-expanded', 'true');
  els.searchInput.tabIndex = 0;
  els.searchInput.focus();
}

function collapseSearch() {
  const box = els.searchToggle.closest('.searchbox');
  box.classList.remove('open');
  els.searchToggle.setAttribute('aria-expanded', 'false');
  els.searchInput.value = '';
  els.searchInput.tabIndex = -1;
  els.searchClear.hidden = true;
  renderPreview();
  els.searchToggle.focus();
}

// ---------- Preview + search ----------
function renderPreview() {
  const q = (els.searchInput.value || '').trim().toLowerCase();
  els.previewList.innerHTML = '';
  const visible = allTabs.filter((tab) =>
    !q || tab.url.toLowerCase().includes(q) || tab.title.toLowerCase().includes(q)
  );
  els.emptyState.hidden = visible.length > 0;

  for (const tab of visible) {
    const li = document.createElement('li');
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = tab.checked;
    cb.setAttribute('aria-label', t('itemSelect'));
    cb.addEventListener('change', () => { tab.checked = cb.checked; });

    const meta = document.createElement('div');
    meta.className = 'meta';
    const title = document.createElement('div');
    title.className = 't';
    title.textContent = tab.title; // textContent فقط — منع XSS
    const url = document.createElement('div');
    url.className = 'u';
    url.textContent = tab.url;
    url.title = tab.url;
    meta.append(title, url);
    li.append(cb, meta);
    els.previewList.appendChild(li);
  }
}

// ---------- Formatting ----------
function selectedTabs() {
  return allTabs.filter((tab) => tab.checked);
}

function formatText(tabs) {
  return tabs.map((tab, i) => {
    const prefix = settings.numberFormat === 'paren' ? `${i + 1}) ` : settings.numberFormat === 'dash' ? `- ` : `${i + 1}. `;
    if (settings.includeTitles) return `${prefix}${tab.title} — ${tab.url}`;
    return `${prefix}${tab.url}`;
  }).join('\n');
}

// ---------- Export actions ----------
async function handleMainExport() {
  readSettingsFromUI();
  await saveSettings();
  await refreshTabsKeepChecks();
  const tabs = selectedTabs();
  if (!tabs.length) return setStatus(t('statusNeedOne'), true);
  const text = formatText(tabs);
  let copied = false;
  if (settings.autoCopy) copied = await copyToClipboard(text);
  const okDl = await downloadTxt(text, buildFileName());
  if (okDl) {
    await pushHistory(tabs.length, text);
    setStatus(copied ? t('statusDoneBoth', { n: tabs.length }) : t('statusDoneDl', { n: tabs.length }));
  }
}

async function handleCopyOnly() {
  readSettingsFromUI();
  await saveSettings();
  await refreshTabsKeepChecks();
  const tabs = selectedTabs();
  if (!tabs.length) return setStatus(t('statusNeedOne'), true);
  const text = formatText(tabs);
  const ok = await copyToClipboard(text);
  if (ok) {
    await pushHistory(tabs.length, text);
    setStatus(t('statusCopied', { n: tabs.length }));
  } else {
    setStatus(t('errorCopy'), true);
  }
}

async function handleDownloadOnly() {
  readSettingsFromUI();
  await saveSettings();
  await refreshTabsKeepChecks();
  const tabs = selectedTabs();
  if (!tabs.length) return setStatus(t('statusNeedOne'), true);
  const text = formatText(tabs);
  const ok = await downloadTxt(text, buildFileName());
  if (ok) {
    await pushHistory(tabs.length, text);
    setStatus(t('statusDownloaded', { n: tabs.length }));
  }
}

// إعادة التحميل مع الحفاظ على التحديد السابق (حسب URL)
async function refreshTabsKeepChecks() {
  const prev = new Map(allTabs.map((tab) => [tab.url, tab.checked]));
  await refreshTabs();
  for (const tab of allTabs) {
    if (prev.has(tab.url)) tab.checked = prev.get(tab.url);
  }
  renderPreview();
}

function buildFileName() {
  const d = new Date();
  const stamp = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return `${settings.fileName}-${stamp}.txt`;
}

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // fallback: textarea مخفي (يعمل في popup)
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      return ok;
    } catch { return false; }
  }
}

async function downloadTxt(text, filename) {
  try {
    // chrome.downloads أولًا، ثم Blob fallback دون صلاحيات
    const url = 'data:text/plain;charset=utf-8,' + encodeURIComponent(text);
    await chrome.downloads.download({ url, filename, saveAs: false });
    return true;
  } catch {
    // Blob fallback
    try {
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 800);
      return true;
    } catch { setStatus(t('errorDownload'), true); return false; }
  }
}

// ---------- History ----------
async function pushHistory(count, text) {
  if (!settings.saveHistory) return;
  try {
    const { ct_history = [] } = await chrome.storage.local.get(['ct_history']);
    const entry = {
      at: new Date().toISOString(),
      count,
      preview: text.slice(0, 220),
      full: text.slice(0, 20000) // حد أمان ضد الامتلاء
    };
    const next = [entry, ...ct_history].slice(0, 10);
    await chrome.storage.local.set({ ct_history: next });
    await renderHistory();
  } catch { /* تجاهل */ }
}

async function renderHistory() {
  try {
    const { ct_history = [] } = await chrome.storage.local.get(['ct_history']);
    els.historyList.innerHTML = '';
    els.historyEmpty.hidden = ct_history.length > 0;
    const locale = localeCode();
    ct_history.forEach((h) => {
      const li = document.createElement('li');
      const d = new Date(h.at);
      const label = document.createElement('span');
      const day = d.toLocaleDateString(locale);
      const time = d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
      label.textContent = `${day} ${time} • ${t('historyItem', { n: h.count })}`;
      const btn = document.createElement('button');
      btn.className = 'mini-btn';
      btn.setAttribute('aria-label', t('historyRedownloadAria'));
      btn.title = t('historyRedownloadTitle');
      btn.innerHTML = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>';
      btn.addEventListener('click', () => downloadTxt(h.full || h.preview, buildFileName()));
      li.append(label, btn);
      els.historyList.appendChild(li);
    });
  } catch { /* تجاهل */ }
}

// ---------- Theme / badge / misc ----------
function applyTheme() {
  const dark = Boolean(settings.darkMode);
  document.body.dataset.theme = dark ? 'dark' : 'light';
  const moon = document.querySelector('.theme-moon');
  const sun = document.querySelector('.theme-sun');
  // ملاحظة: عناصر SVG لا تعكس خاصية hidden تلقائيًا — نستخدم toggleAttribute
  if (moon) moon.toggleAttribute('hidden', dark);
  if (sun) sun.toggleAttribute('hidden', !dark);
  els.themeToggle.title = dark ? t('themeToLight') : t('themeToDark');
  const dm = $('darkMode');
  if (dm) dm.checked = dark;
}

function setStatus(msg, isError = false) {
  els.statusMsg.textContent = msg;
  els.statusMsg.classList.toggle('error', isError);
}

function updateBadge(n) {
  try {
    chrome.action.setBadgeText({ text: n > 0 ? String(n) : '' });
    chrome.action.setBadgeBackgroundColor({ color: '#4f46e5' });
  } catch { /* popup قد يعمل دون action */ }
}

function bindEvents() {
  els.mainExportBtn.addEventListener('click', handleMainExport);
  els.copyOnlyBtn.addEventListener('click', handleCopyOnly);
  els.downloadOnlyBtn.addEventListener('click', handleDownloadOnly);
  els.searchInput.addEventListener('input', () => {
    els.searchClear.hidden = !els.searchInput.value;
    renderPreview();
  });
  els.searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') collapseSearch();
  });
  els.searchToggle.addEventListener('click', () => {
    const box = els.searchToggle.closest('.searchbox');
    box.classList.contains('open') ? collapseSearch() : expandSearch();
  });
  els.searchClear.addEventListener('click', () => {
    els.searchInput.value = '';
    els.searchClear.hidden = true;
    renderPreview();
    els.searchInput.focus();
  });

  els.themeToggle.addEventListener('click', async () => {
    settings.darkMode = document.body.dataset.theme !== 'dark';
    await saveSettings();
    applyTheme();
  });

  els.langSelect.addEventListener('change', () => changeLanguage(els.langSelect.value));

  // أي تغيير في الخيارات يُحفظ ويُطبق فورًا
  for (const id of optIds) {
    const el = $(id);
    if (!el) continue;
    el.addEventListener('change', async () => {
      const keepChecks = id !== 'scope' && id !== 'skipSystem' && id !== 'removeDuplicates';
      readSettingsFromUI();
      await saveSettings();
      applyTheme();
      if (keepChecks) { applySort(); renderPreview(); }
      else await refreshTabsKeepChecks();
    });
  }

  els.resetBtn.addEventListener('click', async () => {
    settings = { ...DEFAULTS, lang: settings.lang }; // اللغة ليست خيار تصدير
    await saveSettings();
    applySettingsToUI();
    syncCustomSelects();
    applyTheme();
    await refreshTabs();
    setStatus(t('statusReset'));
  });

  els.clearHistoryBtn.addEventListener('click', async () => {
    await chrome.storage.local.set({ ct_history: [] });
    await renderHistory();
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.cselect')) closeAllMenus();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAllMenus();
  });
}

async function changeLanguage(code) {
  if (!code || code === localeCode()) return;
  try {
    await loadLocale(code);
  } catch (err) {
    console.error('i18n: could not switch locale', code, err);
    return;
  }
  settings.lang = localeCode();
  await saveSettings();
  applyTranslations();
  applyBrowserCopy();
  refreshCustomSelectLabels();
  syncCustomSelects();
  applyTheme();
  await refreshTabsKeepChecks();
  await renderHistory();
}

// ---------- Custom Select ----------
function enhanceCustomSelects() {
  document.querySelectorAll('.cselect').forEach((wrap) => {
    const selectId = wrap.dataset.select;
    const native = $(selectId);
    const btn = wrap.querySelector('.cselect-btn');
    const menu = wrap.querySelector('.cselect-menu');
    if (!native || !btn || !menu) return;

    // بناء الخيارات (textContent فقط)
    menu.innerHTML = '';
    Array.from(native.options).forEach((opt, idx) => {
      const li = document.createElement('li');
      li.className = 'cselect-option';
      li.setAttribute('role', 'option');
      li.dataset.value = opt.value;
      li.dataset.index = String(idx);
      li.tabIndex = -1;
      const txt = document.createElement('span');
      txt.className = 'cselect-opt-label';
      txt.textContent = opt.textContent;
      const check = document.createElement('span');
      check.className = 'cselect-check';
      check.textContent = '✓';
      check.setAttribute('aria-hidden', 'true');
      li.append(txt, check);
      li.addEventListener('click', () => {
        native.value = opt.value;
        native.dispatchEvent(new Event('change', { bubbles: true }));
        syncCustomSelects();
        closeAllMenus();
        btn.focus();
      });
      menu.appendChild(li);
    });

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = !menu.hidden;
      closeAllMenus();
      if (!isOpen) {
        menu.hidden = false;
        wrap.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
        highlightCurrent(wrap);
      }
    });

    btn.addEventListener('keydown', (e) => {
      const items = Array.from(menu.querySelectorAll('.cselect-option'));
      let hi = items.findIndex((li) => li.classList.contains('highlight'));
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (menu.hidden) { btn.click(); return; }
        hi = e.key === 'ArrowDown' ? Math.min(items.length - 1, hi + 1) : Math.max(0, hi - 1);
        items.forEach((li) => li.classList.remove('highlight'));
        items[hi]?.classList.add('highlight');
        items[hi]?.scrollIntoView({ block: 'nearest' });
      } else if (e.key === 'Enter' || e.key === ' ') {
        if (!menu.hidden && hi >= 0) { e.preventDefault(); items[hi].click(); }
      }
    });
  });
}

function highlightCurrent(wrap) {
  const native = $(wrap.dataset.select);
  wrap.querySelectorAll('.cselect-option').forEach((li) => {
    li.classList.remove('highlight');
    if (li.dataset.value === native.value) li.classList.add('highlight');
  });
}

// بعد تغيير اللغة: نصوص القوائم المخصصة تُنسخ من الخيارات الأصلية المترجمة
function refreshCustomSelectLabels() {
  document.querySelectorAll('.cselect').forEach((wrap) => {
    const native = $(wrap.dataset.select);
    if (!native) return;
    wrap.querySelectorAll('.cselect-option').forEach((li) => {
      const opt = native.options[Number(li.dataset.index)];
      const label = li.querySelector('.cselect-opt-label');
      if (opt && label) label.textContent = opt.textContent;
    });
  });
}

function syncCustomSelects() {
  document.querySelectorAll('.cselect').forEach((wrap) => {
    const native = $(wrap.dataset.select);
    const label = wrap.querySelector('.cselect-value');
    const menu = wrap.querySelector('.cselect-menu');
    if (!native || !menu) return;
    const current = Array.from(native.options).find((o) => o.value === native.value);
    if (label && current) label.textContent = current.textContent;
    menu.querySelectorAll('.cselect-option').forEach((li) => {
      li.setAttribute('aria-selected', li.dataset.value === native.value ? 'true' : 'false');
    });
  });
}

function closeAllMenus() {
  document.querySelectorAll('.cselect').forEach((w) => {
    w.classList.remove('open');
    w.querySelector('.cselect-btn')?.setAttribute('aria-expanded', 'false');
    const m = w.querySelector('.cselect-menu');
    if (m) m.hidden = true;
  });
}
