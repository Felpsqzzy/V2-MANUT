/* Ponte estável para compatibilidade com implantações existentes. */
(() => {
  'use strict';
  window.addEventListener('biotrop:refresh', () => {
    window.BIOTROP_PRODUCTION_V2?.refreshData(true);
  });
  const loadSafeNav = () => {
    if (document.querySelector('script[data-biotrop-safe-nav]')) return;
    const s = document.createElement('script');
    s.src = './assets/js/role-navigation-safe-v1.js?v=1';
    s.async = true;
    s.dataset.biotropSafeNav = '1';
    s.onerror = () => console.warn('[BIOTROP] Navegação segura não carregou.');
    document.head.appendChild(s);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', loadSafeNav, { once: true });
  else loadSafeNav();
})();
