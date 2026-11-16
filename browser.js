// browser.js — كشف المتصفح المضيف ومخططات صفحات النظام التي يتخطاها التصدير.

const UA = typeof navigator !== 'undefined' ? navigator.userAgent || '' : '';

export function detectBrowser() {
  if (/Firefox\//.test(UA)) return { id: 'firefox', scheme: 'about:' };
  if (/Edg\//.test(UA)) return { id: 'edge', scheme: 'edge://' };
  if (/OPR\//.test(UA)) return { id: 'opera', scheme: 'opera://' };
  if (/Brave\//.test(UA) || (typeof navigator !== 'undefined' && navigator.brave)) {
    return { id: 'brave', scheme: 'brave://' };
  }
  if (/Chrome\//.test(UA)) return { id: 'chrome', scheme: 'chrome://' };
  return { id: 'unknown', scheme: '' };
}

// التصفية تستخدم كل المخططات: لو فشل كشف المتصفح أو أخطأ، لا تتسرب صفحات نظام.
export const SYSTEM_PREFIXES = [
  'chrome://',
  'edge://',
  'brave://',
  'opera://',
  'about:',
  'chrome-extension://',
  'moz-extension:',
  'view-source:'
];
