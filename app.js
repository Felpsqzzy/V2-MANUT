/* Ponte estável para compatibilidade com implantações existentes. */
(() => {
  'use strict';

  const loadAsset = (tag, attrs) => new Promise((resolve, reject) => {
    const selector = `script[data-${attrs.key}]`;
    const existing = document.querySelector(selector);
    if (existing) return resolve(existing);
    const el = document.createElement(tag);
    Object.entries(attrs).forEach(([key, value]) => {
      if (key === 'key') return;
      if (key === 'dataset') Object.assign(el.dataset, value);
      else el[key] = value;
    });
    el.onload = () => resolve(el);
    el.onerror = reject;
    document.head.appendChild(el);
  });

  const loadStyles = () => {
    if (document.querySelector('link[data-biotrop-dashboard-v3]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = './assets/css/dashboard-v3.css?v=3';
    link.dataset.biotropDashboardV3 = '1';
    document.head.appendChild(link);
  };

  window.addEventListener('biotrop:refresh', () => {
    window.BIOTROP_PRODUCTION_V2?.refreshData(true);
    window.BIOTROP_DASHBOARD_V3?.render?.();
  });

  const loadSafeNav = () => {
    loadStyles();
    if (document.querySelector('script[data-biotrop-safe-nav]')) {
      loadDashboard();
      return;
    }
    const s = document.createElement('script');
    s.src = './assets/js/role-navigation-safe-v1.js?v=2';
    s.async = true;
    s.dataset.biotropSafeNav = '1';
    s.onload = () => {
      if (document.querySelector('script[data-biotrop-role-shell]')) {
        loadDashboard();
        return;
      }
      const shell = document.createElement('script');
      shell.src = './assets/js/role-shell-v2.js?v=2';
      shell.async = false;
      shell.dataset.biotropRoleShell = '1';
      shell.onload = loadDashboard;
      document.body.appendChild(shell);
    };
    s.onerror = () => {
      console.warn('[BIOTROP] Navegação segura não carregou.');
      loadDashboard();
    };
    document.head.appendChild(s);
  };

  const loadDashboard = () => {
    if (document.querySelector('script[data-biotrop-dashboard-v3]')) return;
    const s = document.createElement('script');
    s.src = './assets/js/dashboard-v3.js?v=3';
    s.async = false;
    s.dataset.biotropDashboardV3 = '1';
    s.onerror = () => console.warn('[BIOTROP] Dashboard V3 não carregou; mantendo a tela original.');
    document.body.appendChild(s);
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', loadSafeNav, { once: true });
  else loadSafeNav();
})();
