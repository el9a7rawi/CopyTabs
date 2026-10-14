<div dir="rtl">

## CopyTabs v{{VERSION}} — ناسخ روابط التبويبات بضغطة واحدة

إصدار عام: مجاني ومفتوح المصدر (Apache-2.0). زر واحد يجمع كل روابط تبويباتك في ملف `.txt` مرقّم + نسخة فورية في الحافظة — يعمل أوفلاين بالكامل.

**يدعم: Chrome وEdge وBrave وOpera وFirefox** — حمّل الملف الذي يحمل اسم متصفحك من الجدول بالأسفل.

### الملفات

| الملف | لمتصفح |
|---|---|
| `copytabs-chrome-v{{VERSION}}.zip` | Chrome |
| `copytabs-edge-v{{VERSION}}.zip` | Edge |
| `copytabs-brave-v{{VERSION}}.zip` | Brave |
| `copytabs-opera-v{{VERSION}}.zip` | Opera |
| `copytabs-firefox-v{{VERSION}}.zip` | Firefox |
| `SHA256SUMS.txt` | بصمات التحقق من سلامة كل الملفات أعلاه |
| `Source code (zip / tar.gz)` | السورس كود الكامل (يُرفق تلقائيًا من GitHub) |

### التثبيت اليدوي — Chrome / Edge / Brave / Opera

1. حمّل ملف `copytabs-chrome-v{{VERSION}}.zip` وفك الضغط.
2. افتح `chrome://extensions` (أو ما يقابلها) وفعّل Developer mode.
3. اختر Load unpacked وحدّد المجلد المفكوك.

### التثبيت اليدوي — Firefox

1. حمّل ملف `copytabs-firefox-v{{VERSION}}.zip` وفك الضغط.
2. افتح `about:debugging` ← This Firefox ← Load Temporary Add-on ← اختر `manifest.json`.
3. النسخة الموقّعة دائمًا من صفحة الإضافة على AMO (قريبًا).

### المتطلبات

- Chrome / Edge / Brave / Opera بإصدار **121+**
- Firefox بإصدار **121+**

### التحقق من السلامة

<div dir="ltr">

```powershell
# Windows (PowerShell 7) — قارن الناتج مع SHA256SUMS.txt
Get-FileHash copytabs-chrome-v{{VERSION}}.zip -Algorithm SHA256
```

</div>

</div>
