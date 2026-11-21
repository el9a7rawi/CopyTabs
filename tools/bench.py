#!/usr/bin/env python3
"""Benchmark the real popup with a mocked 100-tab Chrome session.

Runs popup.html in headless Chrome with a fake `chrome.*` API that serves N tabs
and counts extension API calls. Prints one JSON line so results can be diffed
before and after a performance change.

Usage:
    python tools/bench.py [--tabs 100]

Output: {"tabs":100,"elapsed_ms":...,"tabs_query":...,"storage_get":...,
         "storage_set":...,"badge_text_writes":...,"preview_nodes":...}
"""
import argparse
import json
import re
import shutil
import socket
import subprocess
import sys
import tempfile
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CHROME_CANDIDATES = [
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
]

MOCK_JS = r"""// benchmark harness only
(() => {
  const N = __N__;
  const metrics = {
    tabs: N, started: performance.now(),
    tabs_query: 0, storage_get: 0, storage_set: 0,
    badge_text_writes: 0, badge_color_writes: 0, dom_nodes_created: 0, errors: []
  };
  const origCreate = document.createElement.bind(document);
  document.createElement = (...args) => { metrics.dom_nodes_created++; return origCreate(...args); };
  window.addEventListener('error', (e) => metrics.errors.push(String(e.message)));
  window.addEventListener('unhandledrejection', (e) => metrics.errors.push(String(e.reason)));
  window.__BENCH = metrics;
  const tabs = [];
  for (let i = 0; i < N; i++) {
    const k = i % 7;
    const url = k === 0 ? 'chrome://settings/'
      : k === 1 ? 'https://example.com/shared'
      : 'https://example.com/page/' + i;
    tabs.push({ id: i + 1, title: 'Tab ' + (i + 1), url });
  }
  const store = {
    ct_settings: {
      scope: 'current', includeTitles: false, removeDuplicates: true,
      skipSystem: true, sortOrder: 'original', numberFormat: 'dot',
      fileName: 'tabs-links', autoCopy: true, darkMode: false,
      saveHistory: true, lang: 'en'
    },
    ct_history: []
  };
  window.chrome = {
    runtime: { getURL: (p) => new URL(p, location.href).href },
    i18n: { getUILanguage: () => 'en-US' },
    storage: { local: {
      get: async (keys) => {
        metrics.storage_get++;
        const out = {};
        (Array.isArray(keys) ? keys : Object.keys(store)).forEach((k) => {
          if (k in store) out[k] = store[k];
        });
        return out;
      },
      set: async (obj) => { metrics.storage_set++; Object.assign(store, obj); }
    } },
    tabs: { query: async () => { metrics.tabs_query++; return tabs; } },
    windows: {
      getCurrent: async () => ({ id: 1 }),
      getLastFocused: async () => ({ id: 1 })
    },
    downloads: { download: async () => 1 },
    action: {
      setBadgeText: () => { metrics.badge_text_writes++; },
      setBadgeBackgroundColor: () => { metrics.badge_color_writes++; }
    }
  };
})();
"""

BENCH_JS = r"""// benchmark harness only: measure search churn and publish metrics
setTimeout(() => {
  const input = document.getElementById('searchInput');
  const firstLi = document.querySelector('#previewList li');
  const searches = ['example.com/1', 'example.com/2', 'example.com/3', '', 'https://', 'shared', ''];
  const t0 = performance.now();
  for (let i = 0; i < 20; i++) {
    input.value = searches[i % searches.length];
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }
  const m = window.__BENCH || {};
  m.search_20_ms = Math.round(performance.now() - t0);
  m.preview_nodes = document.querySelectorAll('#previewList li').length;
  m.nodes_reused = document.querySelector('#previewList li') === firstLi;
  const hiddenRows = [...document.querySelectorAll('#previewList li')].filter((li) => li.hidden);
  m.hidden_row_display = hiddenRows.length ? getComputedStyle(hiddenRows[0]).display : null;
  m.elapsed_ms = Math.round(performance.now() - (m.started || 0));
  const pre = document.createElement('pre');
  pre.id = 'bench-metrics';
  pre.textContent = JSON.stringify(m);
  document.body.appendChild(pre);
}, 2500);
"""


def chrome_path():
    for candidate in CHROME_CANDIDATES:
        if Path(candidate).is_file():
            return candidate
    sys.exit("Chrome not found: install Chrome or edit CHROME_CANDIDATES")


def build_site(tmp, tabs):
    for name in ["popup.html", "popup.css", "popup.js", "i18n.js", "browser.js", "core.js", "preview.js"]:
        src = ROOT / name
        if src.is_file():
            shutil.copy2(src, tmp / name)
    shutil.copytree(ROOT / "locales", tmp / "locales", dirs_exist_ok=True)
    html = (tmp / "popup.html").read_text(encoding="utf-8")
    html = html.replace(
        '<script type="module" src="popup.js"></script>',
        '<script src="mock.js"></script>\n'
        '  <script src="bench.js"></script>\n'
        '  <script type="module" src="popup.js"></script>',
    )
    (tmp / "popup.html").write_text(html, encoding="utf-8")
    (tmp / "mock.js").write_text(MOCK_JS.replace("__N__", str(tabs)), encoding="utf-8")
    (tmp / "bench.js").write_text(BENCH_JS, encoding="utf-8")


def serve(tmp, port):
    return subprocess.Popen(
        [sys.executable, "-m", "http.server", str(port), "--bind", "127.0.0.1", "--directory", str(tmp)],
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
    )


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--tabs", type=int, default=100)
    args = parser.parse_args()

    # Chrome يحتفظ ببعض ملفات البروفايل لحظة الخروج على Windows — تجاهل خطأ الحذف
    with tempfile.TemporaryDirectory(prefix="copytabs-bench-", ignore_cleanup_errors=True) as tmp_dir:
        tmp = Path(tmp_dir)
        build_site(tmp, args.tabs)
        with socket.socket() as sock:
            sock.bind(("127.0.0.1", 0))
            port = sock.getsockname()[1]
        server = serve(tmp, port)
        time.sleep(1.0)
        try:
            result = subprocess.run(
                [
                    chrome_path(), "--headless", "--disable-gpu", "--no-first-run",
                    "--hide-scrollbars", "--window-size=600,1700",
                    f"--user-data-dir={tmp / 'profile'}", "--virtual-time-budget=6000",
                    "--dump-dom", f"http://127.0.0.1:{port}/popup.html",
                ],
                capture_output=True, text=True, encoding="utf-8", errors="replace",
            )
        finally:
            server.terminate()
            server.wait(timeout=10)

        match = re.search(r'<pre id="bench-metrics">(.*?)</pre>', result.stdout, re.S)
        if not match:
            sys.exit("bench: no metrics captured (popup failed to run)")
        payload = match.group(1).replace("&quot;", '"').replace("&amp;", "&")
        data = json.loads(payload)
        if data.get("errors"):
            print("BENCH FAILED: page errors: " + str(data["errors"]), file=sys.stderr)
            sys.exit(1)
        budget = args.tabs * 6  # ~5 nodes per row + chrome overhead; old code used ~32/tab
        if data.get("dom_nodes_created", 0) > budget:
            print(f"BENCH FAILED: {data['dom_nodes_created']} DOM nodes exceed {budget}", file=sys.stderr)
            sys.exit(1)
        print(json.dumps(data, ensure_ascii=False, sort_keys=True))


if __name__ == "__main__":
    main()
