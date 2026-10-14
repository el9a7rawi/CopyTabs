<div dir="rtl">

<p align="center">
  <img src="https://raw.githubusercontent.com/el9a7rawi/CopyTabs/v{{VERSION}}/icons/icon128.png" width="72" alt="CopyTabs" />
</p>

<h1 align="center">CopyTabs v{{VERSION}}</h1>

<p align="center">ناسخ روابط التبويبات بضغطة واحدة — <b>مجاني ومفتوح المصدر</b> (Apache-2.0).</p>

<p align="center">
  <img src="https://img.shields.io/badge/Manifest-V3-059669" alt="Manifest V3" />
  <img src="https://img.shields.io/badge/Chrome_Edge_Brave_Opera-Firefox-4f46e5" alt="Supported browsers" />
  <img src="https://img.shields.io/badge/Works-Offline-059669" alt="Works offline" />
</p>

<p align="center">زر واحد يجمع كل روابط تبويباتك في ملف <code>.txt</code> مرقّم + نسخة فورية في الحافظة — يعمل أوفلاين بالكامل.</p>

---

<h2 align="center">1. ملفات الإصدار</h2>

<p align="center"><b>يدعم: Chrome وEdge وBrave وOpera وFirefox</b> — حمّل الملف الذي يحمل اسم متصفحك من الجدول.</p>

<div align="center">

| الملف | لمتصفح |
|---|---|
| `copytabs-chrome-v{{VERSION}}.zip` | Chrome |
| `copytabs-edge-v{{VERSION}}.zip` | Edge |
| `copytabs-brave-v{{VERSION}}.zip` | Brave |
| `copytabs-opera-v{{VERSION}}.zip` | Opera |
| `copytabs-firefox-v{{VERSION}}.zip` | Firefox |
| `SHA256SUMS.txt` | بصمات التحقق من سلامة كل الملفات أعلاه |
| `Source code (zip / tar.gz)` | السورس كود الكامل (يُرفق تلقائيًا من GitHub) |

</div>

---

<h2 align="center">2. التثبيت اليدوي</h2>

### 2.1 Chrome / Edge / Brave / Opera

1. حمّل ملف متصفحك (مثال: `copytabs-chrome-v{{VERSION}}.zip`) وفك الضغط.
2. افتح `chrome://extensions` (أو ما يقابلها) وفعّل **Developer mode**.
3. اختر **Load unpacked** وحدّد المجلد المفكوك، ثم ثبّت الأيقونة 📌.

### 2.2 Firefox

1. حمّل ملف `copytabs-firefox-v{{VERSION}}.zip` وفك الضغط.
2. افتح `about:debugging` ← ‏This Firefox ← ‏Load Temporary Add-on ← اختر `manifest.json`.
3. النسخة الموقّعة دائمًا من صفحة الإضافة على AMO (قريبًا).

---

<h2 align="center">3. المتطلبات</h2>

<div align="center">

| المتصفح | الحد الأدنى |
|---|---|
| Chrome / Edge / Brave / Opera | **121+** |
| Firefox | **121+** |

</div>

---

<h2 align="center">4. التحقق من سلامة الملفات</h2>

<p align="center">قارن بصمة الملف الذي حمّلته مع السطر المقابل في <code>SHA256SUMS.txt</code> — التطابق يعني أن الملف سليم ولم يُتلاعب به.</p>

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

<h2 align="center">5. السورس والرخصة</h2>

<p align="center">السورس كود الكامل مرفق بالأسفل، والمشروع مرخّص <b>Apache-2.0</b> — حرية الاستخدام والتعديل والمشاركة.</p>

---

<p align="center">صُنع بكل لُطف ❤️ <b>Ahmed Yousry</b></p>

</div>
