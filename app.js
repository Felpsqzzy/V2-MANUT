/* BIOTROP application bridge — stable asset loading and official workspace bootstrap. */
(() => {
  'use strict';

  const loadStyles = () => {
    if (document.querySelector('link[data-biotrop-dashboard-v3]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = './assets/css/dashboard-v3.css?v=4';
    link.dataset.biotropDashboardV3 = '1';
    document.head.appendChild(link);
  };

  const loadScript = (src, datasetKey, onload) => {
    const selector = `script[data-${datasetKey}]`;
    const existing = document.querySelector(selector);
    if (existing) { if (onload) onload(); return existing; }
    const s = document.createElement('script');
    s.src = src;
    s.async = false;
    s.dataset[datasetKey] = '1';
    if (onload) s.onload = onload;
    document.body.appendChild(s);
    return s;
  };

  window.addEventListener('biotrop:refresh', () => {
    window.BIOTROP_PRODUCTION_V2?.refreshData?.(true);
    setTimeout(() => window.BIOTROP_DASHBOARD_V3?.render?.(), 250);
  });

  const loadDashboard = () => {
    loadStyles();
    loadScript('./assets/js/dashboard-v3.js?v=4', 'biotrop-dashboard-v3');
    loadScript('./assets/js/default-workspace-v4.js?v=4', 'biotrop-default-workspace-v4');
  };

  const loadSafeNav = () => {
    loadStyles();
    if (document.querySelector('script[data-biotrop-safe-nav]')) {
      loadDashboard();
      return;
    }
    const safe = document.createElement('script');
    safe.src = './assets/js/role-navigation-safe-v1.js?v=3';
    safe.async = true;
    safe.dataset.biotropSafeNav = '1';
    safe.onload = () => {
      if (document.querySelector('script[data-biotrop-role-shell]')) {
        loadDashboard();
        return;
      }
      const shell = document.createElement('script');
      shell.src = './assets/js/role-shell-v2.js?v=3';
      shell.async = false;
      shell.dataset.biotropRoleShell = '1';
      shell.onload = loadDashboard;
      shell.onerror = loadDashboard;
      document.body.appendChild(shell);
    };
    safe.onerror = () => loadDashboard();
    document.head.appendChild(safe);
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', loadSafeNav, { once: true });
  else loadSafeNav();
})();
