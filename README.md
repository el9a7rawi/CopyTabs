<p align="center">
  <img src="icons/icon128.png" width="96" alt="CopyTabs" />
</p>

<h1 align="center">CopyTabs — One-Click Tab Link Copier</h1>

<p align="center">Fifteen tabs open for one research session? CopyTabs collects every open URL into a single numbered <code>.txt</code> file and your clipboard in one click — no manual copy-paste, fully offline.</p>

<p align="center">
  <a href="https://github.com/el9a7rawi/CopyTabs/releases"><img src="https://img.shields.io/github/v/release/el9a7rawi/CopyTabs?color=4f46e5" alt="Latest release" /></a>
  <a href="https://github.com/el9a7rawi/CopyTabs/blob/main/LICENSE"><img src="https://img.shields.io/badge/License-Apache_2.0-E8710A" alt="Apache 2.0" /></a>
  <a href="https://github.com/el9a7rawi/CopyTabs/pulls"><img src="https://img.shields.io/badge/PRs-Welcome-22C55E" alt="PRs welcome" /></a>
  <a href="https://developer.chrome.com/docs/extensions"><img src="https://img.shields.io/badge/Manifest-V3-4285F4" alt="Manifest V3" /></a>
  <img src="https://img.shields.io/badge/Arabic_RTL_Interface-7c3aed" alt="Arabic RTL interface" />
  <img src="https://img.shields.io/badge/Works-Offline-059669" alt="Works offline" />
</p>

<h3 align="center">Download for your browser — click the icon</h3>

<div align="center">

| [<img src="assets/browsers/chrome.svg" width="52" alt="Chrome" /><br><b>Chrome</b>](https://github.com/el9a7rawi/CopyTabs/releases/latest) | [<img src="assets/browsers/edge.svg" width="52" alt="Edge" /><br><b>Edge</b>](https://github.com/el9a7rawi/CopyTabs/releases/latest) | [<img src="assets/browsers/firefox.svg" width="52" alt="Firefox" /><br><b>Firefox</b>](https://github.com/el9a7rawi/CopyTabs/releases/latest) | [<img src="assets/browsers/brave.svg" width="52" alt="Brave" /><br><b>Brave</b>](https://github.com/el9a7rawi/CopyTabs/releases/latest) | [<img src="assets/browsers/opera.svg" width="52" alt="Opera" /><br><b>Opera</b>](https://github.com/el9a7rawi/CopyTabs/releases/latest) |
|---|---|---|---|---|

</div>

<p align="center">
  <img src="assets/screenshots/popup-light.webp" width="280" alt="CopyTabs popup — light theme" />
</p>

---

## 1. Why CopyTabs?

<div align="center">

| Without CopyTabs | With CopyTabs |
|---|---|
| Copy every URL by hand and paste it into a file | One click collects all links, already numbered |
| A research session is lost when the browser closes | A saved file, a clipboard copy, and an export history |
| Duplicate links and internal pages you never wanted | Duplicates removed and system pages skipped automatically |

</div>

<div dir="ltr">

```text
1. https://www.google.com/
2. https://developer.chrome.com/docs/extensions/
3. https://github.com/
```

</div>

---

## 2. How it works — three steps

1. **Open** CopyTabs from the browser toolbar: every open tab is listed with a live counter.
2. **Click** the primary action (or review the preview and pick individual links with the per-link toggle).
3. **Share** — the `.txt` file downloads instantly, the same text lands in your clipboard, and a copy is kept in your export history.

---

## 3. Interface tour

### 3.1 The three export actions

<p align="center"><img src="assets/screenshots/section-actions.webp" width="400" alt="Export actions" /></p>

- **Save all links now** (`احفظ كل روابطك الآن`) — the primary action: exports the selected links, downloads the file, and copies the text to the clipboard in one click, with a live count of ready links underneath.
- **Quick copy** (`نسخ سريع`) — clipboard only, no file download.
- **Download TXT** (`تحميل TXT`) — file only, no clipboard write.
- A status line under the buttons confirms success or explains the error — and disappears completely when there is nothing to report, so it never leaves an empty gap.

### 3.2 Live preview and search

<p align="center"><img src="assets/screenshots/section-preview.webp" width="400" alt="Preview and search" /></p>

- Every link gets its own card: title, URL, and a **dedicated toggle** — unchecking a link removes it from the export.
- The magnifying-glass icon expands into a search field with a smooth transition, filtering the preview **as you type** by title or URL.
- The centered **×** clears the text while the bar stays open; close it with the icon again or with `Escape`.
- URLs are rendered left-to-right so they never break inside the interface.

### 3.3 Customize the export

<p align="center"><img src="assets/screenshots/section-customize.webp" width="360" alt="Export options" /></p>

- **Three custom dropdowns** with their own design (not native OS menus): scope, sort order, and numbering format — all keyboard- and screen-reader-accessible.
- **Switches**: include page titles, remove duplicates, skip system pages, auto-copy to clipboard, keep export history.
- **File name field** (up to 60 characters, with automatic sanitizing of invalid characters and an automatic date stamp).
- The **reset button** (circular arrow at the top of the section) restores every option to its default.
- The full list of options is in section 4 below.

### 3.4 Your recent exports

<p align="center"><img src="assets/screenshots/section-history.webp" width="400" alt="Export history" /></p>

- The last **10 exports**: date, time, and link count for each run.
- A **download** button for every saved copy, plus a **clear history** button (trash icon) at the top of the section.
- A friendly empty state before the first export — your first run shows up here the moment it finishes.

### 3.5 True black dark theme

<p align="center"><img src="assets/screenshots/popup-dark.webp" width="280" alt="Dark theme" /></p>

A real black background (`#000000`) with tuned contrast, toggled by the sun/moon icon in the header and remembered automatically.

### 3.6 Dropdowns with their own design

<p align="center"><img src="assets/screenshots/popup-menu.webp" width="280" alt="Custom dropdown open" /></p>

No default Windows menus: scope, sort order, and numbering are clean floating panels with a check mark, full keyboard support, and screen-reader labels.

### 3.7 Support continued development

<p align="center"><img src="assets/screenshots/section-donate.webp" width="400" alt="Support section" /></p>

- An optional section for anyone who wants to back the project — CopyTabs stays free and open source.
- A highlighted InstaPay button with PayPal as an alternative — both open in a new tab, and the extension sends no data.

---

## 4. Ten controls that shape every export

1. **Scope** — current window only, or every window.
2. **Include page titles** — lines formatted as `1. Title — URL`.
3. **Remove duplicate links** — applied automatically before export.
4. **Skip system pages** — ignores `chrome://` and similar URLs.
5. **Sort order** — original browser order, alphabetical, or by domain.
6. **Numbering format** — `1.`, `1)`, or `-`.
7. **Custom file name** — with an automatic date stamp: `tabs-links-YYYY-MM-DD.txt`.
8. **Auto-copy to clipboard** — after every export.
9. **Dark theme** — the sun/moon toggle in the header, remembered automatically.
10. **Export history** — the last 10 runs, with re-download and a clear button.

On top of that: live search, an individual toggle per link, a counter badge for the number of links, a context menu, two keyboard shortcuts, and a reset button.

---

## 5. Export file examples

Without titles:

<div dir="ltr">

```text
1. https://www.google.com/
2. https://developer.chrome.com/docs/extensions/
3. https://github.com/
```

</div>

With **include page titles** enabled:

<div dir="ltr">

```text
1. Google — https://www.google.com/
2. Chrome Extensions — https://developer.chrome.com/docs/extensions/
```

</div>

---

## 6. Installation — one minute

Open the [Releases](https://github.com/el9a7rawi/CopyTabs/releases) page and download the latest build — **one archive per browser**: Chrome, Edge, Brave, Opera, and Firefox (the four Chromium archives are identical, while the Firefox archive carries the Gecko settings).

**Chrome / Edge / Brave / Opera** (file `copytabs-<browser>-vX.Y.Z.zip` — for example `copytabs-edge-v1.2.1.zip`):

1. Unzip the archive.
2. Open `chrome://extensions` (or the equivalent page) and enable **Developer mode**.
3. Choose **Load unpacked**, select the unzipped folder, then pin the toolbar icon.

**Firefox** (file `copytabs-firefox-vX.Y.Z.zip`):

1. Unzip the archive.
2. Open `about:debugging` → This Firefox → Load Temporary Add-on → select `manifest.json`.
3. The signed build is always available on the AMO add-on page (coming soon).

**For developers working from source:** `git clone` the repository, then load the folder directly as an unpacked extension for Chromium browsers; for Firefox use the build output (`python tools/build.py`) — the source manifest ships without `background.scripts` (required for Chrome).

> No build step, no dependencies — every code change needs only a **Reload** from the extensions page. Requirements: Chrome / Edge / Brave / Opera / Firefox 121 or newer.

---

## 7. Privacy comes first

<div align="center">

| Principle | How it is applied |
|---|---|
| Works fully offline | Zero network requests |
| Least privilege | Only `tabs`, `storage`, `contextMenus`, and `downloads` |
| Your data stays on your device | Settings and history live in `storage.local` — no link is ever sent to a server |

</div>

---

## 8. Frequently asked questions

**8.1 Does it work without an internet connection?**
Yes, entirely; the only remote resource is the Cairo font from Google Fonts, and the extension falls back to a local font automatically when it is unreachable.

**8.2 Is any of my data collected?**
No. The extension contains no networking code at all — and you can verify that yourself in the source.

**8.3 How do I change the numbering format?**
Open *Customize the export → Numbering format*: `1.`, `1)`, or `-`.

**8.4 Why is a tab missing from my export?**
Check that it is still selected in the preview, that it is not a system page you chose to skip, and that it was not removed as a duplicate.

---

## 9. For developers

<div dir="ltr">

```text
├── manifest.json      ← single source MV3 manifest (the build emits one variant per browser)
├── popup.html/css/js  ← the interface (Cairo + Tajawal, Arabic RTL)
├── background.js      ← one shared background: service_worker, emitted as scripts for Firefox
├── icons/             ← 16 / 32 / 48 / 128
├── assets/            ← README screenshots + browser icons
└── tools/build.py     ← store builds + SHA256 (used by CI and releases)
```

</div>

A fully Arabic RTL interface, `textContent` only when rendering data (never `innerHTML`), and settings stored in `chrome.storage.local`. Quick verification:

<div dir="ltr">

```powershell
python3 -c "import json; json.load(open('manifest.json')); print('manifest OK')"
```

</div>

---

## 10. License and contributing

The project is open source and free for everyone under the **Apache-2.0** license — use it, modify it, and share it freely; the full text is in [LICENSE](LICENSE).

Contributions are welcome: open an issue for bug reports and ideas, or send a pull request directly — CI validates the manifest and every image link before a change is merged.

---

<p align="center">Built with care by <b>Ahmed Yousry</b> · <a href="LICENSE">Apache-2.0</a></p>
