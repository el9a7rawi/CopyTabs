// i18n.js — محرك الترجمة: تحميل كسول للملفات، قواعد الجمع، وضبط الاتجاه.

export const LOCALES = [
  { code: 'en', label: 'English', dir: 'ltr' },
  { code: 'es', label: 'Español', dir: 'ltr' },
  { code: 'fr', label: 'Français', dir: 'ltr' },
  { code: 'de', label: 'Deutsch', dir: 'ltr' },
  { code: 'pt-BR', label: 'Português (Brasil)', dir: 'ltr' },
  { code: 'ru', label: 'Русский', dir: 'ltr' },
  { code: 'ar', label: 'العربية', dir: 'rtl' },
  { code: 'zh-CN', label: '中文（简体）', dir: 'ltr' }
];

const RTL_CODES = new Set(['ar', 'he', 'fa', 'ur']);

let dictionary = {};
let fallbackDictionary = {};
let activeCode = 'en';
let pluralRules = new Intl.PluralRules('en');
let fallbackRules = new Intl.PluralRules('en');

export function localeCode() {
  return activeCode;
}

export function localeDir(code = activeCode) {
  return RTL_CODES.has(code) ? 'rtl' : 'ltr';
}

// يطابق وسم لغة المتصفح مع أقرب لغة متاحة (ar-EG ← ar، pt-PT ← pt-BR)
export function matchLocale(tag) {
  const raw = String(tag || '').trim().toLowerCase();
  if (!raw) return null;
  const exact = LOCALES.find((l) => l.code.toLowerCase() === raw);
  if (exact) return exact.code;
  const base = raw.split('-')[0];
  const byBase = LOCALES.find((l) => l.code.toLowerCase().split('-')[0] === base);
  return byBase ? byBase.code : null;
}

export function setDirection(dir) {
  if (typeof document === 'undefined') return; // service worker has no DOM
  document.documentElement.dir = dir;
  document.documentElement.lang = activeCode;
}

async function fetchLocale(code) {
  const res = await fetch(chrome.runtime.getURL(`locales/${code}.json`));
  if (!res.ok) throw new Error(`locale ${code} failed: ${res.status}`);
  return res.json();
}

// الملفات تُكتب متداخلة (key.one/key.other) والمحرك يبحث بمفاتيح مسطّحة
function flatten(source, prefix = '', out = {}) {
  for (const [key, value] of Object.entries(source)) {
    const name = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object') flatten(value, name, out);
    else out[name] = value;
  }
  return out;
}

export async function loadLocale(code) {
  const target = LOCALES.some((l) => l.code === code) ? code : 'en';
  const [targetDict, fallbackDict] = await Promise.all([
    fetchLocale(target),
    target === 'en' ? Promise.resolve({}) : fetchLocale('en')
  ]);
  dictionary = flatten(targetDict);
  fallbackDictionary = flatten(fallbackDict);
  activeCode = target;
  pluralRules = new Intl.PluralRules(target);
  fallbackRules = new Intl.PluralRules('en');
  setDirection(localeDir(target));
  return target;
}

function lookup(dict, rules, key, vars) {
  if (dict[key] !== undefined) return dict[key];
  if (vars && typeof vars.n === 'number') {
    const category = rules.select(vars.n);
    if (dict[`${key}.${category}`] !== undefined) return dict[`${key}.${category}`];
    if (dict[`${key}.other`] !== undefined) return dict[`${key}.other`];
  }
  return undefined;
}

function interpolate(text, vars) {
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (match, name) =>
    Object.prototype.hasOwnProperty.call(vars, name) ? String(vars[name]) : match
  );
}

export function t(key, vars) {
  const value = lookup(dictionary, pluralRules, key, vars)
    ?? lookup(fallbackDictionary, fallbackRules, key, vars);
  if (value === undefined) {
    console.warn(`i18n: missing key "${key}"`);
    return key;
  }
  return interpolate(value, vars);
}

export function applyTranslations(root = document) {
  root.querySelectorAll('[data-i18n]').forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });
  root.querySelectorAll('[data-i18n-attr]').forEach((el) => {
    el.dataset.i18nAttr.split(';').forEach((pair) => {
      const [attr, key] = pair.split(':');
      if (attr && key) el.setAttribute(attr.trim(), t(key.trim()));
    });
  });
  root.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  });
}
