// options.js — مرآة خفيفة لإعدادات popup (نفس المفاتيح في chrome.storage.local)
const DEFAULTS = {
  scope: 'current', includeTitles: false, removeDuplicates: true, skipSystem: true,
  sortOrder: 'original', numberFormat: 'dot', fileName: 'tabs-links',
  autoCopy: true, darkMode: false, saveHistory: true
};
const ids = Object.keys(DEFAULTS);
const $ = (id) => document.getElementById(id);

init();
async function init() {
  const { ct_settings = {} } = await chrome.storage.local.get(['ct_settings']);
  const s = { ...DEFAULTS, ...ct_settings };
  for (const id of ids) {
    const el = $(id);
    if (!el) continue;
    if (el.type === 'checkbox') el.checked = Boolean(s[id]);
    else el.value = s[id];
    el.addEventListener('change', save);
  }
  document.body.dataset.theme = s.darkMode ? 'dark' : 'light';
  enhanceCustomSelects();
  syncCustomSelects();
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.cselect')) closeAllMenus();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAllMenus();
  });
}

async function save() {
  const next = {};
  for (const id of ids) {
    const el = $(id);
    next[id] = el.type === 'checkbox' ? el.checked : el.value;
  }
  next.fileName = String(next.fileName || 'tabs-links').replace(/[\\/:*?"<>|]/g, '-').slice(0, 60) || 'tabs-links';
  await chrome.storage.local.set({ ct_settings: next });
  document.body.dataset.theme = next.darkMode ? 'dark' : 'light';
  syncCustomSelects();
  const st = $('statusMsg');
  if (st) { st.textContent = 'تم الحفظ ✓'; setTimeout(() => (st.textContent = ''), 1200); }
}

function enhanceCustomSelects() {
  document.querySelectorAll('.cselect').forEach((wrap) => {
    const native = $(wrap.dataset.select);
    const btn = wrap.querySelector('.cselect-btn');
    const menu = wrap.querySelector('.cselect-menu');
    if (!native || !btn || !menu) return;
    menu.innerHTML = '';
    Array.from(native.options).forEach((opt) => {
      const li = document.createElement('li');
      li.className = 'cselect-option';
      li.setAttribute('role', 'option');
      li.dataset.value = opt.value;
      const txt = document.createElement('span');
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
      }
    });
  });
}

function syncCustomSelects() {
  document.querySelectorAll('.cselect').forEach((wrap) => {
    const native = $(wrap.dataset.select);
    const label = wrap.querySelector('.cselect-value');
    const menu = wrap.querySelector('.cselect-menu');
    if (!native || !label || !menu) return;
    const current = Array.from(native.options).find((o) => o.value === native.value);
    label.textContent = current ? current.textContent : '';
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
