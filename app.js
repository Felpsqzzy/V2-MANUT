/* BIOTROP application bridge — stable loading. */
(() => {
  'use strict';

  const addStyles = (href, key) => {
    if (document.querySelector(`link[data-${key}]`)) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.dataset[key] = '1';
    document.head.appendChild(link);
  };

  const loadScript = (src, key, onload) => {
    const selector = `script[data-${key}]`;
    const existing = document.querySelector(selector);
    if (existing) { if (onload) onload(); return existing; }
    const s = document.createElement('script');
    s.src = src;
    s.async = false;
    s.dataset[key] = '1';
    if (onload) s.onload = onload;
    s.onerror = () => console.warn(`[BIOTROP] Falha ao carregar ${src}`);
    document.body.appendChild(s);
    return s;
  };

  const loadWorkspace = () => {
    addStyles('./assets/css/dashboard-v3.css?v=5', 'biotrop-dashboard-v3');
    addStyles('./assets/css/workspace-v5.css?v=1', 'biotrop-workspace-v5-style');
    loadScript('./assets/js/dashboard-v3.js?v=5', 'biotrop-dashboard-v3');
    loadScript('./assets/js/default-workspace-v5.js?v=1', 'biotrop-workspace-v5');
  };

  const loadShell = () => {
    loadWorkspace();
    if (document.querySelector('script[data-biotrop-safe-nav]')) return;
    const safe = document.createElement('script');
    safe.src = './assets/js/role-navigation-safe-v1.js?v=4';
    safe.async = true;
    safe.dataset.biotropSafeNav = '1';
    safe.onload = () => loadScript('./assets/js/role-shell-v2.js?v=4', 'biotrop-role-shell', loadWorkspace);
    safe.onerror = () => loadScript('./assets/js/role-shell-v2.js?v=4', 'biotrop-role-shell', loadWorkspace);
    document.head.appendChild(safe);
  };

  window.addEventListener('biotrop:refresh', () => {
    window.BIOTROP_PRODUCTION_V2?.refreshData?.(true);
    setTimeout(() => window.BIOTROP_WORKSPACE_V5?.render?.(), 500);
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', loadShell, { once: true });
  else loadShell();
})();
