# AGENTS.md — ناسخ روابط التبويبات (CopyTabs) | المرجع الملزم الكامل

> **⚠️ تعليمات ملزمة رقم (0) — تُقرأ أولًا وتُنفَّذ قبل أي شيء:**
>
> 1. **يجب استخدام جميع الـ Skills المتاحة قبل عمل أي شيء** — دون استثناء. قبل كتابة أي سطر كود، وقبل أي تعديل، وقبل أي مراجعة، قم بتحميل وتفعيل كل الـ Skills المثبتة في البيئة (`using-agent-skills` كـ meta-skill أولًا، ثم `spec-driven-development`، `planning-and-task-breakdown`، `incremental-implementation`، `frontend-ui-engineering`، `frontend-design`، `security-and-hardening`، `test-driven-development`، `code-review-and-quality`، `code-simplification`، `documentation-and-adrs`، `source-driven-development`، `doubt-driven-development`، `debugging-and-error-recovery`، `performance-optimization`، `git-workflow-and-versioning`، وغيرها). لا تبدأ التنفيذ إلا بعد تأكيد تحميلها.
> 2. هذا الملف **ملزم** لكل وكيل (Agent) وكل مساهم بشري. أي تعارض بين هذا الملف وأي تعليمات أخرى — **هذا الملف هو المرجع الأعلى** داخل هذا المشروع.
> 3. ممنوع الاجتهاد خارج هذا الملف. أي قرار معماري جديد يجب توثيقه هنا أولًا ثم تنفيذه.
> 4. اللغة الافتراضية للواجهة والتوثيق الموجه للمستخدم هي **العربية (RTL)**.

---

## 1) الفكرة والهدف (Spec)

**الفكرة:** زر واحد في واجهة الإكستنشن ينسخ روابط **جميع علامات التبويب المفتوحة** ويصدّرها في ملف `.txt` مرقّم بالتنسيق:

```text
1. https://example.com/page1
2. https://example.com/page2
3. https://example.com/page3
4. https://example.com/page4
```

**المستخدم:** أي شخص يريد حفظ/مشاركة جلسة تصفح (باحث، طالب، مسوّق، مطور).
**النجاح:** ضغطة واحدة → ملف TXT + نسخة في الحافظة + معاينة + سجل. بدون أخطاء، بدون صلاحيات زائدة، يعمل أوفلاين.

### Success Criteria (قابلة للاختبار)

- [ ] الزر الرئيسي ينتج ملفًا بصيغة `1. <url>` لكل تبويب محدد.
- [ ] النسخ للحافظة يعمل (Clipboard API + fallback).
- [ ] التحميل يعمل عبر `chrome.downloads` مع fallback `Blob+anchor`.
- [ ] العداد والـ Badge يعكسان عدد التبويبات الفعلي.
- [ ] الـ 10 خيارات كلها تعمل وتُحفظ في `chrome.storage.local`.
- [ ] الواجهة عربية RTL بالكامل، فاتح/داكن، متجاوبة داخل popup بعرض 400px.
- [ ] لا أخطاء في `chrome://extensions` (Errors) ولا تحذيرات CSP.

---

## 2) أفضل ممارسات Google الرسمية (المصدر: developer.chrome.com — تم البحث والتحقق 2026)

تم تطبيق التوصيات التالية حرفيًا (روابط التوثيق الرسمي محفوظة في سجل البحث):

| # | الممارسة الرسمية | كيف طُبقت هنا |
|---|---|---|
| 1 | **Manifest V3 إجباري** — لا V2 للعناصر الجديدة | `manifest_version: 3` + `minimum_chrome_version: 88` |
| 2 | **أقل صلاحيات ممكنة (Least Privilege)** | فقط `["tabs","storage","contextMenus","downloads"]` — لا `host_permissions`، لا `<all_urls>`، لا `web_accessible_resources` مكشوفة (`[]`) |
| 3 | **Service Worker بدل Background Page** — مستمعون top-level، لا DOM، لا XHR، لا timers عادية | `background.js` type module، كل المستمعين في أعلى الملف، `fetch` بدل XHR (لا نستخدم شبكة أصلًا)، الحفظ في `chrome.storage.local` بدل `localStorage` |
| 4 | **CSP صريح** — منع تنفيذ سلاسل نصية | `"content_security_policy": {"extension_pages": "script-src 'self'; object-src 'self';"}` — لا CDN للـ JS، لا `eval`، لا `innerHTML` لبيانات المستخدم (نستخدم `textContent` فقط) |
| 5 | **لا كود مستضاف عن بُعد (Remotely Hosted Code ممنوع)** — كل المنطق داخل الحزمة | كل JS محلي. الاستثناء الوحيد المسموح به: خطوط Google Fonts (CSS فقط، ليست منطقًا تنفيذيًا) + fallback محلي كامل عند انقطاع النت |
| 6 | **الأمان: `innerHTML` ممنوع مع مدخلات، تحقق من المرسل، قلّل `externally_connectable`** | `externally_connectable.matches: []`، كل العرض عبر `document.createElement + textContent`، تنظيف اسم الملف من `\/:*?"<>` |
| 7 | **الأداء: لا تُبطل bfcache، لا WebSocket في content-script** | لا content-scripts أصلًا (غير needed)، لا unload handlers، لا اتصالات دائمة |
| 8 | **UX: Onboarding من الـ Store Listing + UI بسيط غير مشتت** | زر رئيسي واحد واضح + خيارات متدرجة + `default_title` + أيقونات 16/32/48/128 + وصف عربي/إنجليزي |
| 9 | **Privacy: إفصاح + عدم جمع بيانات** | الإكستنشن لا يرسل أي بيانات لأي سيرفر. كل شيء `storage.local` على الجهاز. جاهز لتبويب Privacy في Web Store بـ "لا يجمع بيانات" |
| 10 | **اختبار + نشر تدريجي** | تحقق محلي (unpacked) → Beta → نشر. لا ميزة جديدة مع تغيير صلاحيات دون مبرر |

> **قاعدة ذهبية من جوجل طُبقت:** أي صلاحية جديدة = تحذير تثبيت = فقدان مستخدمين. لذلك اخترنا `Blob+anchor fallback` لتقليل الاعتماد على `downloads`، واحتفظنا بها فقط للتصدير من الخلفية (context menu / shortcut).

---

## 3) الهيكل (Structure) — المصدر الوحيد للحقيقة

```text
copy url/
├── AGENTS.md          ← هذا الملف (المرجع الملزم)
├── manifest.json      ← إعلان MV3 الوحيد (لا تعدّل الصلاحيات دون تحديث §2)
├── popup.html         ← الواجهة (RTL + عربي + a11y)
├── popup.css          ← نظام التصميم (فاتح/داكن بـ CSS Variables)
├── popup.js           ← منطق الواجهة (type=module, لا eval)
├── background.js      ← Service Worker (badge + قائمة سياق + تصدير سريع)
├── options.html       ← صفحة الإعدادات (مرآة نفس المفاتيح)
├── options.js         ← حفظ فوري في storage
└── icons/
    ├── icon16.png
    ├── icon32.png
    ├── icon48.png
    └── icon128.png    ← مطلوب لمتجر كروم (128 إجباري)
├── assets/
│   └── screenshots/   ← لقطات README (مولّدة بـ Playwright + stub لchrome APIs — ليست جزءًا من الإضافة)
└── README.md          ← صفحة الريبو التسويقية (عربي + سكرينشوتات)
```

**ممنوع:** إضافة أي ملف JS جديد دون تسجيله هنا. ممنوع إضافة مجلد `lib/` أو CDN للـ JS.

---

## 4) المميزات العشر (المواصفة الملزمة)

| # | الميزة | المفتاح في storage | السلوك |
|---|---|---|---|
| 1 | **نطاق النسخ** | `scope: current\|all` | الحالية فقط (افتراضي) أو كل النوافذ عبر `chrome.tabs.query` + `windows.getCurrent` |
| 2 | **تضمين عنوان الصفحة** | `includeTitles: bool` | سطر = `1. العنوان — الرابط` بدل `1. الرابط` |
| 3 | **إزالة المكرر** | `removeDuplicates: bool (true)` | `Set` على `url` قبل التنسيق |
| 4 | **تخطي صفحات النظام** | `skipSystem: bool (true)` | يتجاهل `chrome://, edge://, about:, chrome-extension://, view-source:` |
| 5 | **الترتيب** | `sortOrder: original\|az\|domain` | أصلي / أبجدي `localeCompare` / حسب `hostname` |
| 6 | **تنسيق الترقيم** | `numberFormat: dot\|paren\|dash` | `1. x` (المطلوب) / `1) x` / `- x` |
| 7 | **اسم ملف مخصص + ختم تاريخ** | `fileName: string` | `tabs-links-YYYY-MM-DD.txt` + تنظيف `\/:*?"<>` + حد 60 حرف |
| 8 | **نسخ تلقائي للحافظة** | `autoCopy: bool (true)` | `navigator.clipboard.writeText` + fallback `textarea+execCommand` |
| 9 | **الوضع الداكن (زر الهيدر فقط)** | `darkMode: bool` | زر شمس/قمر SVG في الهيدر — حُذف من قائمة الخيارات لمنع التكرار (صفحة `options.html` تحتفظ بالمرآة الكاملة) |
| 10 | **سجل آخر 10 تصديرات** | `saveHistory: bool (true)` | `ct_history` في storage: `{at,count,preview,full≤20k}` + إعادة تحميل + مسح |

**إضافات مدمجة (ليست خيارات منفصلة لكنها ملزمة):** بحث حي + تحديد فردي بـ checkbox + عدّاد + Badge + قائمة سياق (كليك يمين على الأيقونة) + اختصاران (`Ctrl+Shift+U` فتح، `Ctrl+Shift+E` تصدير سريع) + زر إعادة ضبط.

### مثال الإخراج (العقد الرسمي للتنسيق)

```text
1. https://www.google.com/
2. https://developer.chrome.com/docs/extensions/
3. https://github.com/
```

مع العناوين (`includeTitles=true`):

```text
1. Google — https://www.google.com/
2. Chrome Extensions — https://developer.chrome.com/docs/extensions/
```

---

## 5) الواجهة — نظام تصميم بريميوم عربي (ملزم)

- **الاتجاه:** `<html lang="ar" dir="rtl">` في كل صفحة. روابط URL تُعرض `direction:ltr; text-align:right` حتى لا تنكسر.
- **الخط:** `Cairo` أساسي + `Tajawal` احتياطي + `Segoe UI/Tahoma` fallback — عبر Google Fonts `<link>` فقط (مسموح: CSS ليس منطقًا). عند غياب النت يعمل fallback تلقائيًا.
- **الألوان (فاتح):** `--bg:#f7f8fc; --card:#fff; --text:#141826; --primary:#4f46e5→#7c3aed gradient; --radius:16px`.
- **الداكن (أسود حقيقي — ملزم):** الخلفية `#000000` والأسطح `#141417` بحدود شعرية `#26262b` (الفصل بالحدود لا بالظلال — الظل لا يُرى على الأسود)، النص `#fafafa` (21:1) والثانوي `#a1a1aa` (~7:1). **نظام accent المزدوج:** `--primary` الحيوية تبقى للتعبئات فقط (أزرار CTA/سويتش/سكرول — أبيض عليها يجتاز التباين)، بينما كل النصوص والأيقونات والحدود المضيئة تستخدم `--accent` (`#a5b4fc` في الداكن ≈7.5:1 على الأسود) و`--accent-soft` (`#1e1f3a` للخلفيات المحددة). في الفاتح `accent == primary` فلا يتغير شيء.
- **ممنوعات جمالية (AI Slop):** ممنوع بنفسجي طاغٍ خارج الهوية، ممنوع gradients صاخبة، ممنوع `rounded-2xl` عشوائي، ممنوع ظلال ثقيلة، ممنوع نصوص lorem. الالتزام بمقياس spacing بمضاعفات `0.25rem`.
- **السكرول بار (ملزم بعد تحديث 2026-10-13):** رفيع `5px` فقط (`4px` داخل القوائم)، `scrollbar-width:thin` لدعم Firefox، الـ thumb بتدرج الهوية `primary→primary-2` مع `border-radius:999px` وبدون track مرئي، وهو نفسه في الفاتح والداكن (الداكن بدرجات `6366f1→8b5cf6`). ممنوع أي سكرول عريض أو رمادي افتراضي.
- **نظام المسافات (ملزم):** كل الـ gaps/paddings بمضاعفات 4px فقط (`4/8/12/16`) — `.app` بـ `gap:12px`، `.card` بـ `padding:14px`، `.opt` بـ `10px 12px`، قائمة المعاينة `gap:8px + padding-inline-end:8px` (مسافة تنفس أوسع بين السكرول والعناصر)، السجل `padding-inline-end:4px`.
- **البحث القابل للتوسع (ملزم):** حقل البحث في المعاينة حقل واحد موحد (`‎.searchbox`) يبدأ كأيقونة عدسة فقط على **اليمين** (أول عنصر في RTL)، وعند الضغط تتوسع الخانة **بعد الأيقونة** (`width 0→160px + opacity` خلال `0.25s`) مع `focus` تلقائي، وزر العدسة يذوب داخل الحقل (`border transparent`). الإغلاق بزر العدسة مجددًا أو `Escape` (يمسح النص ويعيد المعاينة)، وزر `×` صغير في آخر الحقل يمسح النص مع بقاء البار مفتوحًا (متمركز `place-items:center` + `padding:0;margin:0;line-height:0` + `svg{display:block}` + مسافة `padding-inline:8px` على الجانبين حتى لا يلتصق الزر بالطرف الأيسر). الحقل المغلق `tabindex=-1` و`pointer-events:none` حتى لا يعيق التنقل.
- **توحيد أوزان الخيارات (ملزم):** كل نصوص صفوف الخيارات بوزن عادي `400` عبر `.opt` نفسه (العناوين الرئيسية والأزرار فقط bold) — لا فرق بين صفوف `label` وصفوف `switch`. ممنوع تنسيق جزئي لبعض الصفوف دون الباقي.
- **منع تحديد النصوص (ملزم):** `.app` بـ `user-select:none` لمنع التحديد العرضي عند الضغط المتكرر — مع استثناء المعاينة (`.preview li`) وحقول الإدخال (`#searchInput` + `.opt input`) بـ `user-select:text` للنسخ اليدوي والتحرير.
- **تركيز البحث حلقة واحدة (ملزم):** `outline:2px solid primary` على الحقل الموحد مع إبقاء الـ `border` بلونه الطبيعي — ممنوع `box-shadow` وممنوع تلوين الـ border مع الـ outline حتى لا يظهر إطار مزدوج. زر المسح الأصلي للمتصفح مخفي (`::-webkit-search-cancel-button: none`) — زر `×` المخصص يكفي.
- **القوائم المنسدلة Custom Select (ملزم — ليست native):** ممنوع `<select>` بمظهر الويندوز/كروم الافتراضي. كل اختيار (النطاق/الترتيب/الترقيم) يُبنى كمكوّن `.cselect` مستقل: زر `.cselect-btn` + نافذة منيو عائمة `.cselect-menu` (`position:absolute`, `radius:12px`, ظل `0 12px 32px`, أنيميشن `menu-in 0.16s`) + خيارات `.cselect-option` مع علامة `✓` للمحدد وتمييز `primary-soft` عند الـ hover. الـ `<select>` الأصلي يبقى مخفيًا (`display:none`) للمنطق فقط، والواجهة المخصصة تزامنه عبر `dispatchEvent(change)`. إتاحة كاملة: `role=listbox/option` + `aria-expanded/selected` + أسهم/Enter/Escape + إغلاق عند الضغط خارجًا.
- **الأزرار الأيقونية (ملزم بعد تحديث 2026-10-13):** كل زر ثانوي نصي يُستبدل بأيقونة SVG بسيطة مع `aria-label` + `title` عربي: إعادة الضبط (سهم دائري)، مسح السجل (سلة)، تحميل نسخة من السجل (سهم تحميل `mini-btn` بحجم 28px)، تبديل الثيم (شمس/قمر SVG يتبدلان عبر `hidden` — ممنوع الإيموجي). الأزرار الرئيسية فقط تبقى نصية تسويقية (CTA) مع أيقونة. التذييل سطر واحد متوسط: `صُنع بكل لُطف ❤️ Ahmed Yousry` (الاسم بـ `dir="ltr"` بلون الهوية). زر `الإعدادات المتقدمة` محذوف من الـ popup — كل الخيارات في الواجهة الرئيسية، وصفحة `options.html` تبقى مرآة تُفتح من تفاصيل الإضافة فقط.
- **الصياغة (ملزمة — بمهارة copywriting):** العنوان الفرعي `كل روابطك في ملف واحد — بضغطة واحدة`، الزر الرئيسي `احفظ كل روابطك الآن`، الأزرار السريعة `نسخ سريع` / `تحميل TXT`، قسم الخيارات `خصّص التصدير`، السجل `تصديراتك الأخيرة`. الصياغة benefits-first ومحددة — ممنوع الحشو التقني في الواجهة (مثل ذكر Manifest).
- **حالة فارغة بلا مسافة:** `.status:empty { display:none }` — ممنوع أي فراغ ظاهر بين الأزرار والمعاينة عند غياب الرسالة.
- **إتاحة (a11y):** كل زر له `aria-label`، كل input له `label`، الحالات عبر `role="status" aria-live="polite"`، تركيز مرئي `outline:2px solid primary`، تنقل كامل بلوحة المفاتيح (Tab).
- **العرض:** popup ثابت `400px`، `max-height:600px` مع scroll داخلي للمعاينة (170px) والسجل (120px).

---

## 6) الكود — القواعد والأنماط (ملزمة)

### 6.1 manifest.json (كامل — لا تختصر)

```json
{
  "manifest_version": 3,
  "name": "CopyTabs | ناسخ روابط التبويبات بضغطة واحدة",
  "version": "1.0.0",
  "description": "كل روابط تبويباتك في TXT مرقّم بضغطة واحدة — سريع وخاص ويعمل أوفلاين.",
  "author": "Ahmed Yousry",
  "minimum_chrome_version": "88",
  "action": { "default_popup": "popup.html" },
  "background": { "service_worker": "background.js", "type": "module" },
  "options_page": "options.html",
  "permissions": ["tabs", "storage", "contextMenus", "downloads"],
  "content_security_policy": { "extension_pages": "script-src 'self'; object-src 'self';" }
}
```

**قواعد الـ manifest (ملزمة):** ممنوع `theme_icons` داخل `action` (سبب خطأ تحميل شهير)، ممنوع مصفوفات فارغة (`web_accessible_resources: []` مرفوضة في MV3)، ممنوع `default_locale` دون مجلد `_locales`، الوصف ≤132 حرفًا (حد كروم الموصى به). أي حقل اختياري فارغ يُحذف ولا يُترك فارغًا.

(النسخة الكاملة الحية في `manifest.json` — عند أي تعديل حدّث هذا القسم).

### 6.2 الأنماط الإلزامية في JS

```js
// ✅ إعدادات: دائمًا عبر chrome.storage.local مع DEFAULTS + دمج آمن
const { ct_settings = {} } = await chrome.storage.local.get(['ct_settings']);
const s = { ...DEFAULTS, ...ct_settings };

// ✅ عرض بيانات تبويبات: textContent فقط — innerHTML محظور تمامًا
const div = document.createElement('div');
div.textContent = tab.url; // لا innerHTML أبدًا

// ✅ مستمعو background في أعلى الملف (top-level) — ممنوع داخل promise/callback
chrome.tabs.onCreated.addListener(refreshBadge);

// ✅ تنظيف اسم الملف دائمًا
name.replace(/[\\/:*?"<>|]/g, '-').slice(0, 60)

// ✅ تنزيل: downloads API أولًا ثم Blob fallback (يعمل دون صلاحيات)
await chrome.downloads.download({ url: 'data:text/plain;charset=utf-8,' + encodeURIComponent(text), filename });
```

### 6.3 ممنوعات صارمة (Never)

- `eval` / `new Function` / `executeScript` بسلاسل نصية — محظور MV3.
- `innerHTML` مع أي بيانات (حتى عنوان الصفحة) — استخدم `textContent`.
- `XMLHttpRequest` في الخلفية — استخدم `fetch` (ونحن لا نستخدم شبكة أصلًا).
- `localStorage` في الخلفية — استخدم `chrome.storage.local`.
- أي `host_permissions` أو `web_accessible_resources` جديدة دون تحديث §2 ومراجعة بشرية.
- أي مكتبة JS من CDN (`<script src="https://...">`) — حمّلها محليًا أو استغنِ عنها.

---

## 7) الأوامر (Commands) — نفّذ حرفيًا

```powershell
# التحميل للتطوير (بعد كل تعديل: Extensions → Reload):
# chrome://extensions → تفعيل Developer mode → Load unpacked → اختر مجلد "copy url"

# التحقق السريع (من داخل مجلد المشروع):
node --check popup.js
node --check background.js
node --check options.js
python3 -c "import json; json.load(open('manifest.json')); print('manifest OK')"
```

**لا يوجد build ولا bundler ولا npm** — المشروع vanilla متعمَّد (أخف، أسرع مراجعة للمتجر، صفر اعتماديات = صفر ثغرات سلسلة توريد).

---

## 8) الاختبار اليدوي (Checklist ملزم قبل أي تسليم)

- [ ] فتح 5 تبويبات (منها `chrome://extensions` للتحقق من التخطي) → الزر الرئيسي → ملف `tabs-links-YYYY-MM-DD.txt` بالصيغة `1. …`.
- [ ] لصق من الحافظة يطابق الملف (autoCopy).
- [ ] تبديل النطاق إلى "كل النوافذ" يزيد العدد.
- [ ] تفعيل `includeTitles` ينتج `1. العنوان — الرابط`.
- [ ] تكرار نفس الرابط + `removeDuplicates` → يظهر مرة واحدة.
- [ ] بحث "github" يُظهر فقط المطابق + إلغاء تحديد عنصر يُسقطه من التصدير.
- [ ] `darkMode` يحفظ بعد إغلاق/فتح الـ popup.
- [ ] السجل يحفظ 10 كحد أقصى + إعادة تحميل تعمل + المسح يعمل.
- [ ] `Ctrl+Shift+E` يصدّر دون فتح الـ popup.
- [ ] صفحة `chrome://extensions` لا تعرض Errors. الـ popup يعمل دون إنترنت (عدا الخط).

---

## 9) النشر على Chrome Web Store (ملزم)

1. أيقونة `128px` موجودة (تم) + لقطات شاشة عربية + وصف يطابق الوظيفة فعلًا.
2. تبويب Privacy: صرّح "لا يجمع بيانات المستخدم ولا ينقلها" (صحيح — تحقق من الكود: لا `fetch` خارجي).
3. الفئة: Productivity. اللغة: العربية + الإنجليزية.
4. ارفع ZIP للمجلد فقط (بدون `AGENTS.md` إن أردت، لكن وجوده لا يضر).
5. ابدأ بـ Trusted Testers ثم 20% ثم 100%. راقب التقييمات والأعطال أول 48 ساعة.
6. أي إصدار يطلب صلاحية جديدة يجب أن يبررها في الوصف — وإلا سيرفضه المستخدمون والمتجر.

---

## 10) الحدود (Boundaries) — ثلاثية المستويات

- **Always (دائمًا):** شغّل تحقق §8 قبل التسليم. حدّث هذا الملف مع أي قرار. استخدم `textContent`. نظّف اسم الملف. احفظ الإعدادات في `storage.local`. حافظ على RTL.
- **Ask first (اسأل أولًا):** إضافة صلاحية / `host_permission` / content-script / مكتبة خارجية / تغيير شكل ملف TXT / جمع أي بيانات.
- **Never (أبدًا):** أسرار في الكود، `eval`/`innerHTML`، كود من CDN، إرسال روابط المستخدم لأي سيرفر، كسر RTL، حذف السجل دون زر المستخدم.

---

## 11) سجل القرارات (ADRs مختصرة)

| التاريخ | القرار | السبب |
|---|---|---|
| 2026-10-13 | Vanilla JS بدون إطار | مراجعة المتجر أسرع + صفر supply-chain + أداء فوري في popup |
| 2026-10-13 | `downloads` + fallback `Blob` | تصدير من الخلفية يحتاج API؛ fallback يضمن العمل بأقل صلاحيات |
| 2026-10-13 | لا content-scripts | لا حاجة لها → سطح هجوم أصغر + bfcache سليم |
| 2026-10-13 | خط Cairo عبر Google Fonts link | CSS فقط (مسموح MV3) + fallback محلي؛ البديل التضمين المحلي لملف woff2 (مستقبلي) |
| 2026-10-13 | سجل ≤10 + قص النص 20k | منع امتلاء `storage.local` (كوتا ~5MB) |
| 2026-10-13 | حذف `default_locale` من manifest | كروم يرفض التحميل بدون مجلد `_locales` — العربية مضمّنة في HTML مباشرة ولا نستخدم `chrome.i18n` |
| 2026-10-13 | سكرول رفيع 5px + Custom Select menus | طلب UX: إزالة مظهر الويندوز الافتراضي — السكرول بلون الهوية، والقوائم نوافذ عائمة مستقلة مع a11y كاملة |
| 2026-10-13 | إصلاح manifest + صياغة تسويقية + أزرار أيقونية | حذف `theme_icons`/`web_accessible_resources:[]`/الحقول الفارغة (سبب خطأ التحميل) + اسم ووصف تسويقيان (≤132) + `Ahmed Yousry` + أيقونات SVG بدل النصوص + حذف زر الإعدادات من الـ popup |
| 2026-10-13 | إصلاح تبديل أيقونة الثيم (`toggleAttribute`) | عناصر SVG لا تعكس خاصية `hidden` (IDL على HTMLElement فقط) — التعيين المباشر `.hidden=` كان expando صامتًا؛ الحل `toggleAttribute('hidden', force)` |
| 2026-10-13 | إصلاح تمركز زر مسح البحث + مسافة اليسار | الـ `padding` الافتراضي للـ `button` كان يُزيح الـ SVG عن المركز — الحل `padding:0;margin:0;line-height:0` + `padding-inline-end:8px` على `.searchbox.open` حتى لا يلتصق الزر بالطرف الأيسر |

---

## 12) الملاحق — أين تجد كل شيء

- المنطق الكامل الحي: `popup.js` (واجهة) + `background.js` (خلفية) — هما المرجع التنفيذي، وهذا الملف هو المرجع التشريعي. عند التعارض اللفظي، **الكود الحي + هذا الملف يُراجَعان معًا** ويُحدَّث هذا الملف أولًا.
- التصميم الحي: `popup.css` (المتغيرات في `:root` و `body[data-theme="dark"]`).
- البنية الحية: `popup.html` (RTL) + `options.html`.
- الأيقونات: `icons/*.png` (مولّدة محليًا بـ Pillow — قابلة للاستبدال بتصميم احترافي دون تغيير الأسماء).

**تذييل ملزم:** أي وكيل يبدأ العمل في هذا المجلد يجب أن يقرأ هذا الملف كاملًا أولًا، ويؤكد تحميل جميع الـ Skills، ثم يعمل بخطوات صغيرة قابلة للتحقق (Implement → Test → Verify) — ولا يسلّم إلا بعد إتمام §8.
