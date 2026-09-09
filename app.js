/* Ponte de estabilidade — mantém a operação existente e aplica a camada visual industrial sem inventar módulos ou dados. */
(() => {
  'use strict';

  const loadCss = () => {
    if (document.querySelector('link[data-biotrop-industrial-v8]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = './assets/css/industrial-v8.css?v=9';
    link.dataset.biotropIndustrialV8 = '1';
    document.head.appendChild(link);
  };

  const applyReferenceVisual = () => {
    if (document.querySelector('style[data-biotrop-reference-v7]')) return;
    const style = document.createElement('style');
    style.dataset.biotropReferenceV7 = '1';
    style.textContent = `
      body.bt-v8{font-family:"Segoe UI",system-ui,sans-serif!important;background:radial-gradient(circle at top left,rgba(13,95,100,.10),transparent 28%),var(--bt-bg)!important}
      body.bt-v8 .sidebar{width:290px!important;padding:24px 18px!important;background:linear-gradient(180deg,#052e31,#0e4f54 52%,#072f32)!important}
      body.bt-v8 .sidebar-brand{padding:0 6px 22px!important;margin-bottom:18px!important;gap:10px!important;border-bottom:1px solid rgba(255,255,255,.12)!important}
      body.bt-v8 .sidebar-logo-icon{height:34px!important}
      body.bt-v8 .sidebar-nav{gap:8px!important}
      body.bt-v8 .nav-item{padding:12px 14px!important;border-radius:16px!important;color:rgba(255,255,255,.78)!important;font-size:13.5px!important}
      body.bt-v8 .nav-item:hover{background:rgba(255,255,255,.08)!important;color:#fff!important;transform:none!important}
      body.bt-v8 .nav-item.active{background:rgba(255,255,255,.14)!important;box-shadow:none!important;color:#fff!important}
      body.bt-v8 .main-area{margin-left:290px!important;width:calc(100% - 290px)!important;padding:0!important;background:linear-gradient(180deg,#eef4f4,#e7efee)!important;color:#102427!important}
      body.bt-v8 .topbar{position:sticky!important;top:0!important;z-index:5!important;display:flex!important;justify-content:space-between!important;align-items:center!important;gap:16px!important;flex-wrap:wrap!important;padding:20px 28px!important;background:rgba(255,255,255,.78)!important;backdrop-filter:blur(16px)!important;border-bottom:1px solid #d8e6e4!important}
      body.bt-v8 .page{padding:24px 28px 40px!important;display:grid!important;gap:24px!important}
      body.bt-v8 .page-title-row{background:linear-gradient(145deg,#fff,#f6fbfa)!important;border:1px solid #d8e6e4!important;border-radius:24px!important;padding:26px!important;box-shadow:0 16px 38px rgba(10,38,40,.10)!important}
      body.bt-v8 .page-title-row h1{color:#102427!important;font-size:22px!important}
      body.bt-v8 .page-title-row p{color:#688184!important}
      body.bt-v8 .page-icon{background:#d9f1ef!important;color:#0d5f64!important;border-radius:12px!important}
      body.bt-v8 .card,body.bt-v8 .dashboard-card,body.bt-v8 .table-card,body.bt-v8 .empty-card,body.bt-v8 .modal,body.bt-v8 .settings-modal,body.bt-v8 .approval-modal{background:#fff!important;border:1px solid #d8e6e4!important;border-radius:20px!important;box-shadow:0 16px 38px rgba(10,38,40,.10)!important;color:#102427!important}
      body.bt-v8 input,body.bt-v8 textarea,body.bt-v8 select,body.bt-v8 .modal-input{background:#f6fbfa!important;color:#102427!important;border:1px solid #d8e6e4!important;border-radius:14px!important;padding:14px 16px!important}
      body.bt-v8 .primary-btn,body.bt-v8 .btn-primary,body.bt-v8 .btn--primary{background:linear-gradient(135deg,#0d5f64,#083f43)!important;color:#fff!important;border-radius:14px!important}
      body.bt-v8 .ghost-btn,body.bt-v8 .btn-ghost{background:transparent!important;color:#102427!important;border:1px solid #d8e6e4!important;border-radius:14px!important}
      body.bt-v8 .kpi{background:#fff!important;border:1px solid #d8e6e4!important;border-radius:20px!important;box-shadow:0 16px 38px rgba(10,38,40,.10)!important;color:#102427!important}
      body.bt-v8 .kpi__label,body.bt-v8 .kpi__hint,body.bt-v8 .label,body.bt-v8 .muted{color:#688184!important}
      body.bt-v8 .kpi__value,body.bt-v8 .value{color:#102427!important}
      body.bt-v8 .badge{border-radius:999px!important}
      body.bt-v8 .users-table th{background:#f6fbfa!important;color:#688184!important;border-bottom:1px solid #d8e6e4!important}
      body.bt-v8 .users-table td{color:#102427!important;border-bottom:1px solid #edf2f0!important}
      body.bt-v8 .bt-floating-actions{border-radius:16px!important;background:rgba(255,255,255,.92)!important;border:1px solid #d8e6e4!important;box-shadow:0 18px 45px rgba(10,38,40,.16)!important;backdrop-filter:blur(16px)!important}
      @media(max-width:1050px){body.bt-v8 .sidebar{width:290px!important;position:relative!important;min-height:auto!important}body.bt-v8 .main-area{margin-left:0!important;width:100%!important}body.bt-v8 .topbar{padding-inline:18px!important}body.bt-v8 .page{padding-inline:18px!important}}
      @media(max-width:700px){body.bt-v8 .sidebar{position:fixed!important;width:290px!important;transform:translateX(-102%)!important}body.bt-v8 .sidebar.sidebar-open{transform:translateX(0)!important}body.bt-v8 .main-area{padding:0!important}body.bt-v8 .topbar{padding:16px 18px!important}body.bt-v8 .page{padding:18px 14px 96px!important}}
      body.bt-v8 [data-biotrop-demo],body.bt-v8 .demo-profiles,body.bt-v8 .demo-note{display:none!important}
    `;
    document.head.appendChild(style);
  };

  const syncTheme = () => {
    const body = document.body;
    body.classList.add('bt-v8');
    const stored = (() => {
      try { return localStorage.getItem('biotrop_theme') || localStorage.getItem('theme') || ''; } catch (_) { return ''; }
    })().toLowerCase();
    const explicitDark = body.classList.contains('dark') || body.classList.contains('dark-mode') || body.dataset.theme === 'dark' || stored === 'dark';
    const explicitLight = body.classList.contains('light') || body.classList.contains('light-mode') || body.dataset.theme === 'light' || stored === 'light';
    if (explicitDark && !explicitLight) body.classList.remove('bt-light-v8');
    else body.classList.add('bt-light-v8');
  };

  const cleanupUndefinedArtifacts = (root = document) => {
    root.querySelectorAll('[title="undefined"],[aria-label="undefined"]').forEach((el) => { el.removeAttribute('title'); el.removeAttribute('aria-label'); });
  };

  const syncMobileSidebar = () => {
    const sidebar = document.querySelector('.sidebar');
    const menu = document.querySelector('.mobile-menu-btn');
    if (!sidebar || !menu || menu.dataset.btBound === '1') return;
    menu.dataset.btBound = '1';
    menu.setAttribute('aria-expanded','false');
    menu.addEventListener('click', () => {
      const open = sidebar.classList.toggle('sidebar-open');
      menu.setAttribute('aria-expanded', String(open));
    });
    sidebar.addEventListener('click', (event) => {
      const target = event.target instanceof Element ? event.target : null;
      if (target && target.closest('.nav-item') && window.matchMedia('(max-width:700px)').matches) {
        sidebar.classList.remove('sidebar-open');
        menu.setAttribute('aria-expanded','false');
      }
    });
  };

  const loadSafeNav = () => {
    if (document.querySelector('script[data-biotrop-safe-nav]')) return;
    const s = document.createElement('script');
    s.src = './assets/js/role-navigation-safe-v1.js?v=2';
    s.async = true;
    s.dataset.biotropSafeNav = '1';
    document.head.appendChild(s);
  };

  const boot = () => {
    loadCss();
    applyReferenceVisual();
    syncTheme();
    cleanupUndefinedArtifacts();
    syncMobileSidebar();
    loadSafeNav();
  };

  window.addEventListener('biotrop:refresh', () => {
    window.BIOTROP_PRODUCTION_V2?.refreshData(true);
    window.setTimeout(() => cleanupUndefinedArtifacts(), 50);
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();