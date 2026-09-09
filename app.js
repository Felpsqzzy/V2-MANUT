/* Ponte de estabilidade — mantém a operação existente e aplica a camada visual industrial sem inventar módulos ou dados. */
(() => {
  'use strict';

  const loadCss = () => {
    if (document.querySelector('link[data-biotrop-industrial-v8]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = './assets/css/industrial-v8.css?v=8';
    link.dataset.biotropIndustrialV8 = '1';
    document.head.appendChild(link);
  };

  const syncTheme = () => {
    const body = document.body;
    body.classList.add('bt-v8');

    // Respeita o tema já escolhido pelo sistema/usuário. A camada visual só
    // fornece os tokens; ela não deve forçar claro ou escuro por conta própria.
    const stored = (() => {
      try {
        return localStorage.getItem('biotrop_theme') || localStorage.getItem('theme') || '';
      } catch (_) {
        return '';
      }
    })().toLowerCase();

    const explicitDark =
      body.classList.contains('dark') ||
      body.classList.contains('dark-mode') ||
      body.dataset.theme === 'dark' ||
      stored === 'dark';

    const explicitLight =
      body.classList.contains('light') ||
      body.classList.contains('light-mode') ||
      body.dataset.theme === 'light' ||
      stored === 'light';

    if (explicitDark && !explicitLight) {
      body.classList.remove('bt-light-v8');
      return;
    }

    if (explicitLight) {
      body.classList.add('bt-light-v8');
      return;
    }

    // Sem preferência explícita, preserva o comportamento atual do sistema:
    // claro como fallback para a camada industrial.
    body.classList.add('bt-light-v8');
  };

  const cleanupUndefinedArtifacts = (root = document) => {
    root.querySelectorAll('text, span, small, div, p, button, a, label').forEach((el) => {
      if (el.childElementCount !== 0) return;
      if (el.textContent.trim().toLowerCase() !== 'undefined') return;
      el.remove();
    });

    root.querySelectorAll('[title="undefined"], [aria-label="undefined"]').forEach((el) => {
      el.removeAttribute('title');
      el.removeAttribute('aria-label');
    });
  };

  const syncMobileSidebar = () => {
    const sidebar = document.querySelector('.sidebar');
    const menu = document.querySelector('.mobile-menu-btn');
    if (!sidebar || !menu || menu.dataset.btBound === '1') return;

    menu.dataset.btBound = '1';
    menu.addEventListener('click', () => {
      const open = sidebar.classList.toggle('sidebar-open');
      menu.setAttribute('aria-expanded', String(open));
    });

    sidebar.addEventListener('click', (event) => {
      const target = event.target instanceof Element ? event.target : null;
      if (!target) return;
      const navItem = target.closest('.nav-item');
      if (navItem && window.matchMedia('(max-width: 700px)').matches) {
        sidebar.classList.remove('sidebar-open');
        menu.setAttribute('aria-expanded', 'false');
      }
    });
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
    syncTheme();
    cleanupUndefinedArtifacts();
    syncMobileSidebar();
    loadSafeNav();
  };

  window.addEventListener('biotrop:refresh', () => {
    window.BIOTROP_PRODUCTION_V2?.refreshData(true);
    window.setTimeout(() => cleanupUndefinedArtifacts(), 50);
  });

  // Alguns módulos são renderizados depois do boot. Um observer discreto
  // limpa apenas artefatos literais "undefined", sem tocar nos dados reais.
  const observeLateRender = () => {
    if (!document.body || document.body.dataset.btUndefinedObserver === '1') return;
    document.body.dataset.btUndefinedObserver = '1';
    let scheduled = false;
    const observer = new MutationObserver(() => {
      if (scheduled) return;
      scheduled = true;
      queueMicrotask(() => {
        scheduled = false;
        cleanupUndefinedArtifacts();
      });
    });
    observer.observe(document.body, { subtree: true, childList: true });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      boot();
      observeLateRender();
    }, { once: true });
  } else {
    boot();
    observeLateRender();
  }
})();