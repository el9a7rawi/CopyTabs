// preview.js — معاينة الروابط: إعادة استخدام عقد القائمة بدل إعادة بنائها مع كل حرف بحث.
export function createPreview(listEl, emptyEl, t) {
  const rows = new Map(); // tab.id -> { li, cb, title, url, tab }

  function makeRow(tab) {
    const li = document.createElement('li');
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.setAttribute('aria-label', t('itemSelect'));

    const meta = document.createElement('div');
    meta.className = 'meta';
    const title = document.createElement('div');
    title.className = 't';
    const url = document.createElement('div');
    url.className = 'u';
    meta.append(title, url);
    li.append(cb, meta);

    const row = { li, cb, title, url, tab };
    cb.addEventListener('change', () => { row.tab.checked = cb.checked; });
    return row;
  }

  function updateRow(row, tab) {
    row.tab = tab;
    row.cb.checked = tab.checked;
    row.title.textContent = tab.title;
    row.url.textContent = tab.url;
    row.url.title = tab.url;
  }

  function render(tabs, query = '') {
    const q = query.trim().toLowerCase();
    const visible = q
      ? tabs.filter((tab) => tab.url.toLowerCase().includes(q) || tab.title.toLowerCase().includes(q))
      : tabs;
    const shown = new Set(visible.map((tab) => tab.id));

    // الصفوف المتبقية من تبويبات أُغلقت تُحذف حتى لا تنمو القائمة بلا حد
    const current = new Set(tabs.map((tab) => tab.id));
    for (const [id, row] of rows) {
      if (!current.has(id)) { row.li.remove(); rows.delete(id); }
    }

    // العقد تُبنى مرة واحدة ثم تُخفى/تُظهر — البحث لا ينشئ عقدًا جديدة
    const frag = document.createDocumentFragment();
    for (const tab of tabs) {
      let row = rows.get(tab.id);
      if (!row) { row = makeRow(tab); rows.set(tab.id, row); }
      updateRow(row, tab);
      row.li.hidden = !shown.has(tab.id);
      frag.appendChild(row.li);
    }
    listEl.appendChild(frag);
    emptyEl.hidden = visible.length > 0;
    return visible.length;
  }

  function refreshLabels() {
    for (const row of rows.values()) row.cb.setAttribute('aria-label', t('itemSelect'));
  }

  return { render, refreshLabels };
}
