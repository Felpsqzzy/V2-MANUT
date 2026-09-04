/* Ponte estavel — funcionalidade existente + ativacao da camada visual industrial-v8. */
(() => {
  'use strict';

  const loadCss = () => {
    if (document.querySelector('link[data-biotrop-industrial-v8]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = './assets/css/industrial-v8.css?v=8';
    link.dataset.biotropIndustrialV8 = '1';
    document.head.appendChild(link);

    // A folha existente foi criada para ser opt-in por classe.
    document.body.classList.add('bt-v8');
    document.body.classList.add('bt-light-v8');
  };

  const syncMobileSidebar = () => {
    const sidebar = document.querySelector('.sidebar');
    const menu = document.querySelector('.mobile-menu-btn');
    if (!sidebar) return;
    if (menu && !menu.dataset.btBound) {
      menu.dataset.btBound = '1';
      menu.addEventListener('click', () => sidebar.classList.toggle('sidebar-open'));
    }
  };

  const loadSafeNav = () => {
    if (document.querySelector('script[data-biotrop-safe-nav]')) return;
    const s = document.createElement('script');
    s.src = './assets/js/role-navigation-safe-v1.js?v=1';
    s.async = true;
    s.dataset.biotropSafeNav = '1';
    s.onerror = () => console.warn('[BIOTROP] Navegação segura não carregou.');
    document.head.appendChild(s);
  };

  const boot = () => {
    loadCss();
    syncMobileSidebar();
    loadSafeNav();
  };

  window.addEventListener('biotrop:refresh', () => {
    window.BIOTROP_PRODUCTION_V2?.refreshData(true);
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
