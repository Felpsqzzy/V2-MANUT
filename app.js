/* Ponte estável para compatibilidade com implantações existentes. */
(() => {
  'use strict';
  window.addEventListener('biotrop:refresh', () => {
    window.BIOTROP_PRODUCTION_V2?.refreshData(true);
  });
  const loadSafeNav = () => {
    if (document.querySelector('script[data-biotrop-safe-nav]')) return;
    const s = document.createElement('script');
    s.src = './assets/js/role-navigation-safe-v1.js?v=2';
    s.async = true;
    s.dataset.biotropSafeNav = '1';
    s.onload = () => {
      if (document.querySelector('script[data-biotrop-role-shell]')) return;
      const shell = document.createElement('script');
      shell.src = './assets/js/role-shell-v2.js?v=2';
      shell.async = false;
      shell.dataset.biotropRoleShell = '1';
      document.body.appendChild(shell);
    };
    s.onerror = () => console.warn('[BIOTROP] Navegação segura não carregou.');
    document.head.appendChild(s);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', loadSafeNav, { once: true });
  else loadSafeNav();
})();