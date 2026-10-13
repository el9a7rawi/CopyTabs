<div dir="rtl">

<p align="center">
  <img src="icons/icon128.png" width="96" alt="CopyTabs" />
</p>

<h1 align="center">CopyTabs — ناسخ روابط التبويبات بضغطة واحدة</h1>

<p align="center">عندك عشرات التبويبات مفتوحة؟ احفظها كلها في ملف مرقّم جاهز للمشاركة — <b>بضغطة واحدة</b>.</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-1.0.0-4f46e5" alt="Version 1.0.0" />
  <img src="https://img.shields.io/badge/Manifest-V3-059669" alt="Manifest V3" />
  <img src="https://img.shields.io/badge/Chrome-88+-4285F4" alt="Chrome 88 plus" />
  <img src="https://img.shields.io/badge/Arabic-RTL-7c3aed" alt="Arabic RTL" />
  <img src="https://img.shields.io/badge/Works-Offline-059669" alt="Works offline" />
</p>

<p align="center">
  <img src="assets/screenshots/popup-light.png" width="280" alt="Light mode" />
  <img src="assets/screenshots/popup-dark.png" width="280" alt="True-black dark mode" />
</p>

---

## لماذا CopyTabs؟

الباحث فاتح 15 مصدرًا، والطالب مجمّع شروحات، والمسوّق يراجع منافسين — والنسخ اليدوي رابطًا رابطًا مضيعة للوقت، وضياع الجلسة كلها بإغلاق المتصفح كارثة. CopyTabs يجمع كل روابط تبويباتك في ملف `.txt` مرقّم **ونسخة فورية في حافظتك**، دون حساب ودون إنترنت ودون أن يغادر أي رابط جهازك.

```text
1. https://www.google.com/
2. https://developer.chrome.com/docs/extensions/
3. https://github.com/
```

## جولة في الواجهة

### زر واحد ينجز كل شيء

<p align="center"><img src="assets/screenshots/popup-light.png" width="280" alt="Main view" /></p>

الزر الرئيسي يصدّر ويحمل وينسخ في خطوة واحدة، وتحته زرّا «نسخ سريع» و«تحميل TXT» — مع عدّاد حي بعدد الروابط الجاهزة ومعاينة لكل رابط قبل التصدير.

### أسود حقيقي مريح للعين

<p align="center"><img src="assets/screenshots/popup-dark.png" width="280" alt="Dark mode" /></p>

وضع داكن بخلفية سوداء فعلية وتباين محسوب (21:1 للنص)، يُبدَّل بأيقونة شمس/قمر في الهيدر ويُحفَظ تلقائيًا.

### قوائم بتصميم خاص

<p align="center"><img src="assets/screenshots/popup-menu.png" width="280" alt="Custom menu" /></p>

لا قوائم ويندوز افتراضية: النطاق والترتيب والترقيم نوافذ عائمة أنيقة بعلامة تحديد ودعم كامل للوحة المفاتيح وقارئ الشاشة.

### بحث يظهر عند الحاجة

<p align="center"><img src="assets/screenshots/popup-search.png" width="280" alt="Expandable search" /></p>

أيقونة عدسة تتوسع منها خانة البحث بحركة ناعمة، تُرشّح المعاينة لحظيًا — مع تحديد فردي لكل رابط بزر.

### الإعدادات على الشاشات الكبيرة

<p align="center"><img src="assets/screenshots/options.png" width="480" alt="Options page" /></p>

صفحة إعدادات بنفس الخيارات وحفظ فوري، تُفتَح من تفاصيل الإضافة.

## التحميل على كروم

1. حمّل الريبو (**Code ← Download ZIP** وفك الضغط، أو `git clone`).
2. افتح `chrome://extensions` وفعّل **Developer mode**.
3. اختر **Load unpacked** وحدّد مجلد المشروع، ثم ثبّت الأيقونة 📌.

> لا build ولا اعتماديات — أي تعديل على الكود يلزمه **Reload** من صفحة الإضافات فقط.

## الخصوصية

- يعمل أوفلاين بالكامل — صفر طلبات شبكة.
- أقل صلاحيات ممكنة: `tabs` و`storage` و`contextMenus` و`downloads`.
- الإعدادات والسجل محفوظة محليًا على جهازك فقط.

## للمطورين

```text
├── manifest.json      ← إعلان Manifest V3
├── popup.html/css/js  ← الواجهة (Cairo + Tajawal)
├── background.js      ← Service Worker (شارة العدد + تصدير سريع)
├── options.html/js    ← مرآة الإعدادات
└── icons/             ← 16 / 32 / 48 / 128
```

القواعد المعمارية الكاملة في [`AGENTS.md`](AGENTS.md) — والتحقق السريع:

```powershell
python3 -c "import json; json.load(open('manifest.json')); print('manifest OK')"
```

## أسئلة شائعة

**لا يعمل بدون إنترنت؟**
يعمل بالكامل؛ فقط خط Cairo يُحمَّل من جوجل وله بديل تلقائي عند الانقطاع.

**هل تُجمَع بياناتي؟**
لا — لا يوجد أي كود شبكة في الإضافة، وراجع الكود بنفسك.

**أريد صيغة ترقيم مختلفة؟**
من «خصّص التصدير ← تنسيق الترقيم»: `1.` أو `1)` أو `-`.

---

<p align="center">صُنع بكل لُطف ❤️ <b>Ahmed Yousry</b></p>
<p align="center"><i>وفّرت عليك وقت؟ ⭐ على الريبو تساعد غيرك يوصلها.</i></p>

</div>
