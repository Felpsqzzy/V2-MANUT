/* BIOTROP Default Workspace V4 — torna a visão geral a tela inicial oficial. */
(() => {
  'use strict';
  if (window.__BIOTROP_DEFAULT_WORKSPACE_V4__) return;
  window.__BIOTROP_DEFAULT_WORKSPACE_V4__ = true;

  const cleanHash = () => String(location.hash || '').toLowerCase().trim();
  const isAuthShellReady = () => Boolean(document.querySelector('.main-area') && document.querySelector('.bt-role-shell'));
  const isExcluded = () => {
    const h = cleanHash();
    return h.includes('/login') || h.includes('login') || h.includes('recuperar') || h.includes('reset');
  };

  function goDashboard() {
    if (isExcluded()) return;
    const h = cleanHash();
    if (!h || h === '#' || h === '#/' || h.includes('/home') || h === '#home' || h.includes('início') || h.includes('inicio')) {
      if (location.hash !== '#/dashboard') location.hash = '#/dashboard';
    }
  }

  function bindHomeLinks() {
    document.querySelectorAll('.bt-role-shell__item,.nav-item,.sidebar a,.sidebar button').forEach(el => {
      if (el.dataset.defaultWorkspaceBound === '1') return;
      const label = String(el.innerText || el.textContent || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
      if (!(label === 'inicio' || label.includes('início'))) return;
      el.dataset.defaultWorkspaceBound = '1';
      el.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        location.hash = '#/dashboard';
      }, true);
    });
  }

  function start() {
    const tick = () => {
      if (!isAuthShellReady()) return;
      bindHomeLinks();
      goDashboard();
    };
    tick();
    window.addEventListener('hashchange', tick);
    const obs = new MutationObserver(tick);
    obs.observe(document.body, { childList: true, subtree: true });
    setTimeout(tick, 300);
    setTimeout(tick, 1200);
    setTimeout(tick, 2500);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
