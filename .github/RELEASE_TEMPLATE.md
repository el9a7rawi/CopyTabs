<p align="center">
  <img src="https://raw.githubusercontent.com/el9a7rawi/CopyTabs/v{{VERSION}}/icons/icon128.png" width="72" alt="CopyTabs" />
</p>

<h1 align="center">CopyTabs v{{VERSION}}</h1>

<p align="center">One-click tab link copier — <b>free and open source</b> (Apache-2.0).</p>

<p align="center">
  <img src="https://img.shields.io/badge/Manifest-V3-059669" alt="Manifest V3" />
  <img src="https://img.shields.io/badge/Chrome_Edge_Brave_Opera-Firefox-4f46e5" alt="Supported browsers" />
  <img src="https://img.shields.io/badge/Works-Offline-059669" alt="Works offline" />
</p>

<p align="center">One click collects every open tab URL into a numbered <code>.txt</code> file and your clipboard — fully offline, no data leaves your device.</p>

---

<h2 align="center">1. Release files</h2>

<p align="center"><b>Supported: Chrome, Edge, Brave, Opera, and Firefox</b> — download the archive that matches your browser from the table below.</p>

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

<h2 align="center">2. Manual installation</h2>

### 2.1 Chrome / Edge / Brave / Opera

1. Download your browser's archive (for example `copytabs-chrome-v{{VERSION}}.zip`) and unzip it.
2. Open `chrome://extensions` (or the equivalent page) and enable **Developer mode**.
3. Choose **Load unpacked**, select the unzipped folder, then pin the toolbar icon.

### 2.2 Firefox

1. Download `copytabs-firefox-v{{VERSION}}.zip` and unzip it.
2. Open `about:debugging` → This Firefox → Load Temporary Add-on → select `manifest.json`.
3. The signed build is always available on the AMO add-on page (coming soon).

---

<h2 align="center">3. Requirements</h2>

<div align="center">

| Browser | Minimum version |
|---|---|
| Chrome / Edge / Brave / Opera | **121+** |
| Firefox | **121+** |

</div>

---

<h2 align="center">4. Verify file integrity</h2>

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

<h2 align="center">5. Source code and license</h2>

<p align="center">The full source code is attached below, and the project is licensed under <b>Apache-2.0</b> — free to use, modify, and share.</p>

---

<p align="center">Built with care by <b>Ahmed Yousry</b></p>
