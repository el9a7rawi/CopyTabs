#!/usr/bin/env python3
"""Regenerate the README screenshots from the real popup.

Runs the shipped popup.html/popup.js inside a 400px iframe in headless Chrome,
with a mocked `chrome.*` API, then captures every locale: English gets the full
tour (both themes, dropdowns, search, and each section), the other seven get the
popup, the export actions, and the options panel. Requires Chrome and Pillow.

Usage:
    python tools/screenshots.py

Output: assets/screenshots/<locale>/*.webp (400px @2x, 20px rounded corners, quality 90)
"""
import json
import shutil
import socket
import subprocess
import sys
import tempfile
import time
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "assets" / "screenshots"
CHROME_CANDIDATES = [
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
]
RADIUS = 40          # 20px at the 2x capture scale
IFRAME_HEIGHT = 2000

LANGS = ["en", "es", "fr", "de", "pt-BR", "ru", "ar", "zh-CN"]
FULL_SECTIONS = {
    "section-actions.webp": "hero",
    "section-preview.webp": "card0",
    "section-customize.webp": "card1",
    "section-history.webp": "card2",
    "section-donate.webp": "card3",
}
LOCAL_SECTIONS = {
    "section-actions.webp": "hero",
    "section-customize.webp": "card1",
}

MOCK_JS = r"""// harness only: fake chrome.* so the popup runs outside the extension
(() => {
  const params = new URLSearchParams(location.search);
  const store = {
    ct_settings: {
      scope: 'current', includeTitles: false, removeDuplicates: true, skipSystem: true,
      sortOrder: 'original', numberFormat: 'dot', fileName: 'tabs-links', autoCopy: true,
      darkMode: params.get('theme') === 'dark', saveHistory: true, lang: params.get('lang') || 'en'
    },
    ct_history: [
      { at: new Date(Date.now() - 5400e3).toISOString(), count: 12, preview: 'x', full: 'x' },
      { at: new Date(Date.now() - 90000e3).toISOString(), count: 5, preview: 'x', full: 'x' }
    ]
  };
  const tabs = [
    { id: 1, title: 'GitHub — el9a7rawi/CopyTabs', url: 'https://github.com/el9a7rawi/CopyTabs' },
    { id: 2, title: 'GitHub Docs — Actions', url: 'https://docs.github.com/actions' },
    { id: 3, title: 'Google', url: 'https://www.google.com/' },
    { id: 4, title: 'MDN Web Docs', url: 'https://developer.mozilla.org/' },
    { id: 5, title: 'Stack Overflow', url: 'https://stackoverflow.com/' },
    { id: 6, title: 'YouTube', url: 'https://www.youtube.com/' },
    { id: 7, title: 'Figma', url: 'https://www.figma.com/' },
    { id: 8, title: 'Notion', url: 'https://www.notion.so/' }
  ];
  const errors = [];
  window.__errors = errors;
  window.addEventListener('error', (e) => errors.push(String(e.message)));
  window.addEventListener('unhandledrejection', (e) => errors.push(String(e.reason)));
  window.chrome = {
    runtime: { getURL: (p) => new URL(p, location.href).href },
    storage: { local: {
      get: async (keys) => {
        const out = {};
        (Array.isArray(keys) ? keys : Object.keys(store)).forEach((k) => { if (k in store) out[k] = store[k]; });
        return out;
      },
      set: async (obj) => Object.assign(store, obj)
    } },
    tabs: { query: async () => tabs },
    windows: { getCurrent: async () => ({ id: 1 }) },
    downloads: { download: async () => 1 },
    action: { setBadgeText: () => {}, setBadgeBackgroundColor: () => {} }
  };
  const rect = (el) => {
    const r = el.getBoundingClientRect();
    return { top: Math.round(r.top + window.scrollY), bottom: Math.round(r.bottom + window.scrollY) };
  };
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      if (params.get('open') === 'scope') document.querySelector('[data-select="scope"] .cselect-btn')?.click();
      if (params.get('open') === 'lang') document.querySelector('[data-select="lang"] .cselect-btn')?.click();
      const query = params.get('search');
      if (query) {
        document.getElementById('searchToggle')?.click();
        const input = document.getElementById('searchInput');
        input.value = query;
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
      const blocks = [
        { name: 'header', ...rect(document.querySelector('.header')) },
        { name: 'hero', ...rect(document.querySelector('.hero')) },
        ...Array.from(document.querySelectorAll('.card')).map((card, i) => ({ name: `card${i}`, ...rect(card) })),
        { name: 'footer', ...rect(document.querySelector('.footer')) }
      ];
      const pre = document.createElement('pre');
      pre.id = 'harness-rects';
      pre.style.display = 'none';
      pre.textContent = JSON.stringify({
        blocks,
        bodyHeight: Math.round(document.body.getBoundingClientRect().height),
        errors
      });
      document.body.appendChild(pre);
      parent.postMessage(pre.textContent, '*');
    }, 1400);
  });
})();
"""


def chrome_path():
    for candidate in CHROME_CANDIDATES:
        if Path(candidate).is_file():
            return candidate
    sys.exit("Chrome not found: install Chrome or edit CHROME_CANDIDATES")


def build_site(tmp):
    for name in ["popup.html", "popup.css", "popup.js", "i18n.js", "browser.js"]:
        shutil.copy2(ROOT / name, tmp / name)
    shutil.copytree(ROOT / "locales", tmp / "locales", dirs_exist_ok=True)

    html = (tmp / "popup.html").read_text(encoding="utf-8")
    html = html.replace(
        '<link rel="stylesheet" href="popup.css" />',
        '<link rel="stylesheet" href="popup.css" />\n  <link rel="stylesheet" href="harness.css" />',
    )
    html = html.replace(
        '<script type="module" src="popup.js"></script>',
        '<script src="mock.js"></script>\n  <script type="module" src="popup.js"></script>',
    )
    (tmp / "popup.html").write_text(html, encoding="utf-8")

    (tmp / "harness.css").write_text(
        "/* harness only: full-page capture instead of the 600px popup viewport */\n"
        "html { width: 400px !important; }\n"
        "body { max-height: none !important; }\n",
        encoding="utf-8",
    )
    (tmp / "mock.js").write_text(MOCK_JS, encoding="utf-8")
    (tmp / "index.html").write_text(
        "<!DOCTYPE html><html><head><meta charset=\"utf-8\" />"
        "<style>html, body { margin: 0; padding: 0; background: #fff; }"
        f"iframe {{ display: block; width: 400px; height: {IFRAME_HEIGHT}px; border: 0; }}</style>"
        "</head><body><iframe id=\"frame\"></iframe>"
        "<script>"
        "const frame = document.getElementById('frame');"
        "frame.src = 'popup.html' + location.search;"
        "window.addEventListener('message', (event) => {"
        "  if (typeof event.data !== 'string') return;"
        "  const pre = document.createElement('pre');"
        "  pre.id = 'harness-rects';"
        "  pre.style.display = 'none';"
        "  pre.textContent = event.data;"
        "  document.body.appendChild(pre);"
        "});"
        "</script></body></html>",
        encoding="utf-8",
    )


def serve(tmp, port):
    return subprocess.Popen(
        [sys.executable, "-m", "http.server", str(port), "--bind", "127.0.0.1", "--directory", str(tmp)],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )


def run_chrome(url, profile, screenshot=None, dump=False):
    args = [
        chrome_path(), "--headless", "--disable-gpu", "--no-first-run", "--hide-scrollbars",
        "--force-device-scale-factor=2", "--window-size=600,2100",
        f"--user-data-dir={profile}", "--virtual-time-budget=7000",
    ]
    if screenshot:
        args.append(f"--screenshot={screenshot}")
    if dump:
        args.append("--dump-dom")
    args.append(url)
    result = subprocess.run(args, capture_output=True, text=True, encoding="utf-8", errors="replace")
    if dump:
        return result.stdout
    return ""


def read_rects(url, profile):
    dom = run_chrome(url, profile, dump=True)
    marker = '<pre id="harness-rects"'
    if marker not in dom:
        debug = ROOT / "dist" / "harness-dom.html"
        debug.parent.mkdir(exist_ok=True)
        debug.write_text(dom, encoding="utf-8")
        sys.exit(f"harness did not report layout rects (dom {len(dom)} chars -> {debug})")
    payload = dom.split(marker, 1)[1].split(">", 1)[1].split("</pre>", 1)[0]
    data = json.loads(payload.replace("&quot;", '"'))
    if data["errors"]:
        sys.exit(f"popup console errors: {data['errors']}")
    return data


def capture(url, profile, path):
    if path.exists():
        path.unlink()
    run_chrome(url, profile, screenshot=path)
    if not path.exists():
        sys.exit(f"Chrome produced no screenshot for {url}")
    image = Image.open(path).convert("RGB").crop((0, 0, 800, IFRAME_HEIGHT * 2))
    return image


def trim_bottom(image, background):
    px = image.load()
    bottom = image.height
    while bottom > 0:
        row = [px[x, bottom - 1] for x in range(0, image.width, 8)]
        if any(max(abs(p[i] - background[i]) for i in range(3)) > 4 for p in row):
            break
        bottom -= 1
    return image.crop((0, 0, image.width, bottom))


def rounded(image):
    mask = Image.new("L", image.size, 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle((0, 0, image.width - 1, image.height - 1), radius=RADIUS, fill=255)
    out = image.convert("RGBA")
    out.putalpha(mask)
    return out


def save(image, name, out_dir=OUT_DIR):
    rounded(image).save(out_dir / name, "WEBP", quality=90, method=6)
    print(f"  {out_dir.name}/{name} {image.width}x{image.height}")


def section_bounds(blocks, index):
    current = blocks[index]
    prev_bottom = blocks[index - 1]["bottom"] if index > 0 else 0
    next_top = blocks[index + 1]["top"] if index + 1 < len(blocks) else current["bottom"]
    top = (prev_bottom + current["top"]) // 2 if index > 0 else max(0, current["top"] - 24)
    bottom = (current["bottom"] + next_top) // 2
    return top, bottom


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="copytabs-shots-") as tmp_dir:
        tmp = Path(tmp_dir)
        build_site(tmp)
        with socket.socket() as sock:
            sock.bind(("127.0.0.1", 0))
            port = sock.getsockname()[1]
        server = serve(tmp, port)
        time.sleep(1.2)
        base = f"http://127.0.0.1:{port}/index.html"
        try:
            for lang in LANGS:
                out = OUT_DIR / lang
                out.mkdir(parents=True, exist_ok=True)
                profile = tmp / f"profile-{lang}"
                query = f"theme=light&lang={lang}"
                light = capture(f"{base}?{query}", profile, tmp / f"light-{lang}.png")
                data = read_rects(f"{base}?{query}", profile)
                background = light.getpixel((2, 2))
                light = trim_bottom(light, background)
                save(light, "popup-light.webp", out)

                if lang == "en":
                    dark = capture(f"{base}?theme=dark&lang=en", profile, tmp / "dark.png")
                    dark = trim_bottom(dark, dark.getpixel((2, 2)))
                    save(dark, "popup-dark.webp", out)

                    menu = capture(f"{base}?theme=light&lang=en&open=scope", profile, tmp / "menu.png")
                    menu = trim_bottom(menu, menu.getpixel((2, 2)))
                    save(menu, "popup-menu.webp", out)

                    language = capture(f"{base}?theme=light&lang=en&open=lang", profile, tmp / "language.png")
                    language = trim_bottom(language, language.getpixel((2, 2)))
                    save(language, "popup-language.webp", out)

                    search = capture(f"{base}?theme=light&lang=en&search=git", profile, tmp / "search.png")
                    search = trim_bottom(search, search.getpixel((2, 2)))
                    save(search, "popup-search.webp", out)
                    sections = FULL_SECTIONS
                else:
                    sections = LOCAL_SECTIONS

                blocks = data["blocks"]
                for name, block_name in sections.items():
                    index = next(i for i, block in enumerate(blocks) if block["name"] == block_name)
                    top, bottom = section_bounds(blocks, index)
                    bottom = min(bottom, light.height // 2)
                    save(light.crop((0, top * 2, 800, bottom * 2)), name, out)
        finally:
            server.terminate()
            server.wait(timeout=10)


if __name__ == "__main__":
    main()
