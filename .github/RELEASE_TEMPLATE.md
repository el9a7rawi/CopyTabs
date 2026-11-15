<p align="center">
  <img src="https://raw.githubusercontent.com/el9a7rawi/CopyTabs/v{{VERSION}}/icons/icon128.png" width="96" alt="CopyTabs" />
</p>

<h1 align="center">CopyTabs v{{VERSION}}</h1>

<p align="center">Fifteen tabs open for one research session? CopyTabs collects every open URL into a single numbered <code>.txt</code> file and your clipboard in one click — no manual copy-paste, fully offline.</p>

<p align="center">
  <a href="https://github.com/el9a7rawi/CopyTabs/releases"><img src="https://img.shields.io/github/v/release/el9a7rawi/CopyTabs?color=4f46e5" alt="Latest release" /></a>
  <a href="https://github.com/el9a7rawi/CopyTabs/blob/main/LICENSE"><img src="https://img.shields.io/badge/License-Apache_2.0-E8710A" alt="Apache 2.0" /></a>
  <a href="https://github.com/el9a7rawi/CopyTabs/pulls"><img src="https://img.shields.io/badge/PRs-Welcome-22C55E" alt="PRs welcome" /></a>
  <a href="https://developer.chrome.com/docs/extensions"><img src="https://img.shields.io/badge/Manifest-V3-4285F4" alt="Manifest V3" /></a>
  <img src="https://img.shields.io/badge/Arabic_RTL_Interface-7c3aed" alt="Arabic RTL interface" />
  <img src="https://img.shields.io/badge/Works-Offline-059669" alt="Works offline" />
</p>

---

## 1. Release files

<div align="center">

| File | Browser |
|---|---|
| `copytabs-chrome-v{{VERSION}}.zip` | Chrome |
| `copytabs-edge-v{{VERSION}}.zip` | Edge |
| `copytabs-brave-v{{VERSION}}.zip` | Brave |
| `copytabs-opera-v{{VERSION}}.zip` | Opera |
| `copytabs-firefox-v{{VERSION}}.zip` | Firefox |
| `SHA256SUMS.txt` | Checksums for verifying the integrity of every file above |
| `Source code (zip / tar.gz)` | Full source code (attached automatically by GitHub) |

</div>

---

## 2. Installation — one minute

**Chrome / Edge / Brave / Opera** (file `copytabs-<browser>-v{{VERSION}}.zip` — for example `copytabs-edge-v{{VERSION}}.zip`):

1. Unzip the archive.
2. Open `chrome://extensions` (or the equivalent page) and enable **Developer mode**.
3. Choose **Load unpacked**, select the unzipped folder, then pin the toolbar icon.

**Firefox** (file `copytabs-firefox-v{{VERSION}}.zip`):

1. Unzip the archive.
2. Open `about:debugging` → This Firefox → Load Temporary Add-on → select `manifest.json`.
3. The signed build is always available on the AMO add-on page (coming soon).

---

## 3. Requirements

<div align="center">

| Browser | Minimum version |
|---|---|
| Chrome / Edge / Brave / Opera | **121+** |
| Firefox | **121+** |

</div>

---

## 4. Verify file integrity

<p align="center">Compare the checksum of the file you downloaded with the matching line in <code>SHA256SUMS.txt</code> — a match means the archive is intact and untouched.</p>

<div dir="ltr">

```powershell
# Windows (PowerShell 7)
Get-FileHash copytabs-chrome-v{{VERSION}}.zip -Algorithm SHA256
```

</div>

<div dir="ltr">

```bash
# Linux / macOS
sha256sum -c SHA256SUMS.txt
```

</div>

---

## 5. Source code and license

<p align="center">The full source code is attached below, and the project is licensed under <b>Apache-2.0</b> — free to use, modify, and share.</p>

---

<p align="center">Built with care by <b>Ahmed Yousry</b> · <a href="https://github.com/el9a7rawi/CopyTabs/blob/main/LICENSE">Apache-2.0</a></p>
