import test from 'node:test';
import assert from 'node:assert/strict';

// DOM مصغّر يكفي لاختبار إعادة استخدام العقد دون متصفح
let createdElements = 0;
const makeEl = (tag) => {
  createdElements++;
  return {
    tag, children: [], parent: null, attrs: {}, textContent: '', title: '', className: '', type: '', hidden: false,
    appendChild(child) {
      const nodes = child.isFragment ? child.children : [child];
      for (const node of nodes) {
        if (node.parent) node.parent.children = node.parent.children.filter((c) => c !== node);
        node.parent = this;
        this.children.push(node);
      }
    },
    append(...children) { for (const child of children) this.appendChild(child); },
    remove() {
      if (!this.parent) return;
      this.parent.children = this.parent.children.filter((c) => c !== this);
      this.parent = null;
    },
    addEventListener(type, fn) { (this.listeners ??= {})[type] = fn; },
    setAttribute(k, v) { this.attrs[k] = v; }
  };
};
global.document = {
  createElement: makeEl,
  createDocumentFragment: () => { const f = makeEl('#fragment'); createdElements--; return Object.assign(f, { isFragment: true }); }
};

const { createPreview } = await import('../preview.js');

const tabs = Array.from({ length: 100 }, (_, i) => ({
  id: i + 1, title: 'Tab ' + (i + 1), url: 'https://example.com/' + i, checked: true
}));
const shown = (list) => list.children.filter((li) => !li.hidden).length;

test('render reuses the same li nodes across searches and preserves checked state', () => {
  const list = makeEl('ul');
  const empty = makeEl('p');
  const preview = createPreview(list, empty, () => 'select');

  assert.equal(preview.render(tabs), 100);
  assert.equal(shown(list), 100);
  assert.equal(list.children[0].children[1].children[0].textContent, 'Tab 1');
  assert.equal(list.children[0].children[1].children[1].textContent, 'https://example.com/0');
  assert.equal(list.children[0].children[0].checked, true);
  const createdAfterFirst = createdElements;
  const firstLi = list.children[0];
  let listAppends = 0;
  const origAppend = list.appendChild.bind(list);
  list.appendChild = (child) => { listAppends++; return origAppend(child); };

  tabs[0].checked = false;
  assert.equal(preview.render(tabs, 'https://example.com/0'), 1);
  assert.equal(shown(list), 1);
  assert.equal(list.children[0], firstLi, 'the li node must be reused, not recreated');
  assert.equal(list.children[0].children[0].checked, false, 'checked state must follow the tab object');

  assert.equal(preview.render(tabs), 100);
  assert.equal(shown(list), 100);
  assert.equal(createdElements, createdAfterFirst, 'no DOM nodes may be created after the first render');
  const appendsAfterRestore = listAppends;
  preview.render(tabs);
  assert.equal(listAppends, appendsAfterRestore, 'an unchanged tab order must not re-append rows');
  assert.equal(empty.hidden, true);
});

test('closed tabs are removed from the DOM instead of leaving stale visible rows', () => {
  const list = makeEl('ul');
  const empty = makeEl('p');
  const preview = createPreview(list, empty, () => 'select');

  preview.render(tabs.slice(0, 3));
  assert.equal(shown(list), 3);
  preview.render(tabs.slice(0, 2));
  assert.equal(shown(list), 2);
  assert.equal(list.children.length, 2);

  preview.render([]);
  assert.equal(shown(list), 0);
  assert.equal(list.children.length, 0);
  assert.equal(empty.hidden, false);
});
