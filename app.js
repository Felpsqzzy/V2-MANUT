/* Ponte mantida para compatibilidade com implantações antigas. */
(() => {
  'use strict';
  const load = (src) => new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const s = document.createElement('script'); s.src = src; s.async = true;
    s.onload = resolve; s.onerror = reject; document.head.appendChild(s);
  });
  window.addEventListener('biotrop:refresh', () => window.BIOTROP_PRODUCTION_V2?.refreshData(true));
  load('./assets/js/biotrop-modern-management.js?v=20260901').catch(() => {});
  load('./assets/js/meeting-minimum-functional.js').catch(() => {});
})();
