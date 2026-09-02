/* BIOTROP ROLE SHELL V2 — sidebar limpa, fixa, recolhível e por perfil. */
(() => {
  'use strict';
  if (window.__BIOTROP_ROLE_SHELL_V2__) return;
  window.__BIOTROP_ROLE_SHELL_V2__ = true;

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clean = v => String(v ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

  const ICONS = {
    home: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 10.8 12 3l9 7.8v8.2a2 2 0 0 1-2 2h-5v-6H10v6H5a2 2 0 0 1-2-2z"/><path d="M9 21v-6h6v6"/></svg>',
    box: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 8 4.2v9.6L12 21l-8-4.2V7.2z"/><path d="m4.3 7.2 7.7 4 7.7-4M12 11.2V21"/></svg>',
    clipboard: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4.5V3h6v1.5M8.5 10h7M8.5 14h7M8.5 18h4"/></svg>',
    cart: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 4h2l2.1 11.2a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 1.9-1.4L21 8H6"/><circle cx="10" cy="20" r="1"/><circle cx="18" cy="20" r="1"/></svg>',
    bolt: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 2 4.5 13h6L10 22l9.5-12h-6z"/></svg>',
    graduation: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 9 9-5 9 5-9 5z"/><path d="M7 11.2V16c2.7 2 7.3 2 10 0v-4.8M21 9v6"/></svg>',
    users: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8" r="3"/><path d="M3.5 20c.5-3.5 2.3-5 5.5-5s5 1.5 5.5 5M16 6.5a3 3 0 0 1 0 5.8M17 15c2.2.2 3.5 1.7 3.8 4"/></svg>',
    settings: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z"/><path d="m19.4 15 .1.1-1.8 3.1-.2-.1a2.1 2.1 0 0 0-2.1 0l-.3.2a2.1 2.1 0 0 0-1 1.8v.2H10.6v-.2a2.1 2.1 0 0 0-1-1.8l-.3-.2a2.1 2.1 0 0 0-2.1 0l-.2.1-1.8-3.1.1-.1a2.1 2.1 0 0 0 0-2.1l-.2-.3a2.1 2.1 0 0 0-1.8-1H3V8.1h.3a2.1 2.1 0 0 0 1.8-1l.2-.3a2.1 2.1 0 0 0 0-2.1l-.1-.1L7 1.5l.2.1a2.1 2.1 0 0 0 2.1 0l.3-.2a2.1 2.1 0 0 0 1-1.8V-.5h3.6v.2a2.1 2.1 0 0 0 1 1.8l.3.2a2.1 2.1 0 0 0 2.1 0l.2-.1 1.8 3.1-.1.1a2.1 2.1 0 0 0 0 2.1l.2.3a2.1 2.1 0 0 0 1.8 1h.3v3.6h-.3a2.1 2.1 0 0 0-1.8 1l-.2.3a2.1 2.1 0 0 0 0 2.1Z" transform="scale(.85) translate(2 2)"/></svg>',
    logout: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h5M14 8l4 4-4 4M18 12H9"/></svg>',
    chevron: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>'
  };

  const roleOf = () => {
    try {
      const u = window.STATE?.currentUser || window.currentUser || {};
      const p = [u.perfilId, u.roleCode, u.role_code, u.appRole, u.app_role, u.role, u.perfil, u.profile, u.cargo].filter(Boolean).join(' ');
      const n = clean(p);
      if (/(admin|administrador|superuser|super usuario)/.test(n)) return 'admin';
      if (/(almox|almoxarif|warehouse)/.test(n)) return 'almox';
      if (/(pcm|planejamento|controle manut)/.test(n)) return 'pcm';
      if (/(tecnico|tecnica|viewer)/.test(n)) return 'tecnico';
      return n || 'tecnico';
    } catch (_) { return 'tecnico'; }
  };

  const menuFor = role => ({
    admin: [
      ['home','Visão geral','Início'],
      ['box','Almoxarifado','Almoxarifado'],
      ['clipboard','PCM','PCM'],
      ['bolt','Utilidades','Utilidades'],
      ['graduation','Treinamentos','Treinamentos'],
      ['users','Usuários','Usuários'],
      ['settings','Configurações','Configurações']
    ],
    almox: [
      ['home','Início','Início'],
      ['box','SCI','SCI'],
      ['cart','SCM','SCM'],
      ['clipboard','Aprovações','Aprovações'],
      ['graduation','Treinamentos','Treinamentos']
    ],
    pcm: [
      ['home','Início','Início'],
      ['bolt','Utilidades','Utilidades'],
      ['clipboard','Apontamentos','Apontamentos'],
      ['box','Almoxarifado','Almoxarifado'],
      ['graduation','Treinamentos','Treinamentos']
    ],
    tecnico: [
      ['home','Início','Início'],
      ['bolt','Apontar utilidades','Utilidades'],
      ['box','Almoxarifado','Almoxarifado'],
      ['graduation','Treinamentos','Treinamentos']
    ]
  }[role] || []);

  const findLegacy = label => {
    const wanted = clean(label);
    const els = $$('.sidebar button,.sidebar a,.nav-item,[role="button"]');
    return els.find(el => {
      if (el.closest('.bt-role-shell')) return false;
      const t = clean(el.innerText || el.textContent);
      return t === wanted || t.includes(wanted);
    });
  };

  const navigate = target => {
    const legacy = findLegacy(target);
    if (legacy) { legacy.click(); return; }
    const nav = window.navigateTo;
    if (typeof nav === 'function') { nav(target.toLowerCase()); return; }
    const aliases = { 'início':'home', 'visão geral':'home', 'apontar utilidades':'utilidades', 'apontamentos':'utilidades' };
    if (typeof nav === 'function') nav(aliases[clean(target)] || clean(target));
  };

  function installStyle() {
    if ($('#bt-role-shell-style')) return;
    const s = document.createElement('style'); s.id = 'bt-role-shell-style';
    s.textContent = `
      :root{--bt-sidebar:228px;--bt-sidebar-mini:72px;--bt-ink:#173b38;--bt-muted:#71837e;--bt-line:#e4eeea;--bt-brand:#0b5d5d;--bt-accent:#34c49b}
      body{overflow-x:hidden!important}
      .bt-role-shell{position:fixed;z-index:100000;inset:0 auto 0 0;width:var(--bt-sidebar);height:100vh;background:linear-gradient(180deg,#063f42 0%,#064b4c 55%,#05383a 100%);color:#fff;display:flex;flex-direction:column;padding:16px 12px;box-shadow:10px 0 35px rgba(0,34,35,.13);transition:width .22s ease;overflow:visible;font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif}
      .bt-role-shell__brand{height:60px;display:flex;align-items:center;gap:11px;padding:0 10px 13px;border-bottom:1px solid rgba(255,255,255,.10);margin-bottom:14px}
      .bt-role-shell__logo{width:34px;height:34px;object-fit:contain;flex:0 0 auto}.bt-role-shell__brandtext{min-width:0}.bt-role-shell__name{font-size:15px;font-weight:850;line-height:1.1;letter-spacing:-.02em}.bt-role-shell__sub{font-size:10px;color:#a7d8ca;margin-top:3px}
      .bt-role-shell__toggle{position:absolute;right:-14px;top:22px;width:28px;height:28px;border:1px solid rgba(255,255,255,.18);border-radius:50%;background:#0c6564;color:#fff;display:grid;place-items:center;cursor:pointer;box-shadow:0 5px 15px rgba(0,0,0,.18)}.bt-role-shell__toggle svg{width:15px;height:15px;fill:none;stroke:currentColor;stroke-width:2.3;transition:transform .2s}
      .bt-role-shell__nav{display:flex;flex-direction:column;gap:5px;flex:1;min-height:0;overflow:visible}
      .bt-role-shell__item{appearance:none;border:0;width:100%;min-height:46px;border-radius:12px;background:transparent;color:rgba(255,255,255,.76);display:flex;align-items:center;gap:12px;padding:10px 12px;text-align:left;font:650 13px/1.1 inherit;cursor:pointer;transition:background .18s,color .18s,transform .18s;position:relative}
      .bt-role-shell__item:hover{background:rgba(255,255,255,.08);color:#fff;transform:translateX(2px)}.bt-role-shell__item.is-active{background:linear-gradient(135deg,rgba(54,210,169,.27),rgba(255,255,255,.07));color:#fff;box-shadow:inset 3px 0 0 #54d6ad}.bt-role-shell__item svg{width:19px;height:19px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;flex:0 0 auto}.bt-role-shell__label{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .bt-role-shell__footer{border-top:1px solid rgba(255,255,255,.10);padding-top:12px}.bt-role-shell__user{display:flex;align-items:center;gap:10px;padding:7px 8px 10px}.bt-role-shell__avatar{width:34px;height:34px;border-radius:50%;background:#29ad88;color:#063c37;display:grid;place-items:center;font-weight:900;font-size:13px;flex:0 0 auto;overflow:hidden}.bt-role-shell__avatar img{width:100%;height:100%;object-fit:cover}.bt-role-shell__usertext{min-width:0}.bt-role-shell__username{font-size:12.5px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.bt-role-shell__role{font-size:10px;color:#a7d8ca;margin-top:2px;text-transform:capitalize}.bt-role-shell__logout{width:100%;border:1px solid rgba(255,255,255,.10);background:rgba(255,255,255,.06);color:#fff;border-radius:10px;min-height:38px;display:flex;align-items:center;justify-content:center;gap:8px;font:700 12px inherit;cursor:pointer}.bt-role-shell__logout:hover{background:rgba(255,255,255,.12)}.bt-role-shell__logout svg{width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}
      .bt-role-shell.is-collapsed{width:var(--bt-sidebar-mini);padding-left:9px;padding-right:9px}.bt-role-shell.is-collapsed .bt-role-shell__brand{justify-content:center;padding-left:0;padding-right:0}.bt-role-shell.is-collapsed .bt-role-shell__brandtext,.bt-role-shell.is-collapsed .bt-role-shell__label,.bt-role-shell.is-collapsed .bt-role-shell__usertext{display:none}.bt-role-shell.is-collapsed .bt-role-shell__item{justify-content:center;padding-left:0;padding-right:0}.bt-role-shell.is-collapsed .bt-role-shell__user{justify-content:center;padding-left:0;padding-right:0}.bt-role-shell.is-collapsed .bt-role-shell__logout span{display:none}.bt-role-shell.is-collapsed .bt-role-shell__toggle svg{transform:rotate(180deg)}
      .shell{display:block!important;min-height:100vh!important}.shell>.sidebar{display:none!important}.main-area{margin-left:var(--bt-sidebar)!important;min-height:100vh!important;padding:30px 38px!important;overflow-x:hidden!important;transition:margin-left .22s ease}.bt-role-shell.is-collapsed~* .main-area,.bt-role-shell.is-collapsed + .shell .main-area{margin-left:var(--bt-sidebar-mini)!important}
      body.bt-role-collapsed .main-area{margin-left:var(--bt-sidebar-mini)!important}
      @media(max-width:900px){.bt-role-shell{width:var(--bt-sidebar-mini)}.bt-role-shell__brandtext,.bt-role-shell__label,.bt-role-shell__usertext{display:none}.bt-role-shell__brand,.bt-role-shell__item,.bt-role-shell__user{justify-content:center;padding-left:0;padding-right:0}.main-area{margin-left:var(--bt-sidebar-mini)!important;padding:22px 18px!important}.bt-role-shell__toggle{display:none}}
      @media(max-width:560px){.bt-role-shell{width:64px}.main-area{margin-left:64px!important;padding:18px 12px!important}}
    `;
    document.head.appendChild(s);
  }

  function profileFallback(done) {
    const existing = window.STATE?.currentUser;
    if (existing) return done(existing);
    let tries = 0;
    const t = setInterval(() => {
      const u = window.STATE?.currentUser;
      if (u || ++tries > 40) { clearInterval(t); done(u || {}); }
    }, 150);
  }

  function build() {
    installStyle();
    const old = $('#bt-role-shell');
    if (old) old.remove();
    const role = roleOf();
    const items = menuFor(role);
    if (!items.length) return;

    const shell = document.createElement('aside');
    shell.id = 'bt-role-shell'; shell.className = 'bt-role-shell';
    const u = window.STATE?.currentUser || {};
    const name = u.name || u.full_name || u.nome || u.email || 'Usuário';
    const initials = clean(name).split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join('').toUpperCase() || 'U';
    shell.innerHTML = `
      <div class="bt-role-shell__brand">
        <img class="bt-role-shell__logo" src="./assets/biotrop-logo.svg" alt="Biotrop">
        <div class="bt-role-shell__brandtext"><div class="bt-role-shell__name">BIOTROP</div><div class="bt-role-shell__sub">Manutenção</div></div>
      </div>
      <button class="bt-role-shell__toggle" type="button" aria-label="Recolher menu">${ICONS.chevron}</button>
      <nav class="bt-role-shell__nav" aria-label="Menu principal"></nav>
      <div class="bt-role-shell__footer">
        <div class="bt-role-shell__user"><div class="bt-role-shell__avatar">${initials}</div><div class="bt-role-shell__usertext"><div class="bt-role-shell__username"></div><div class="bt-role-shell__role"></div></div></div>
        <button class="bt-role-shell__logout" type="button">${ICONS.logout}<span>Sair</span></button>
      </div>`;

    const nav = $('.bt-role-shell__nav', shell);
    items.forEach(([icon, label, target]) => {
      const b = document.createElement('button'); b.type='button'; b.className='bt-role-shell__item'; b.dataset.target=target; b.innerHTML=ICONS[icon] + `<span class="bt-role-shell__label">${label}</span>`;
      b.addEventListener('click', () => { $$('.bt-role-shell__item', shell).forEach(x=>x.classList.remove('is-active')); b.classList.add('is-active'); navigate(target); });
      nav.appendChild(b);
    });
    $('.bt-role-shell__username', shell).textContent = name;
    $('.bt-role-shell__role', shell).textContent = role === 'almox' ? 'Almoxarifado' : role === 'pcm' ? 'PCM' : role === 'admin' ? 'Administrador' : 'Técnico';

    $('.bt-role-shell__toggle', shell).onclick = () => {
      const collapsed = shell.classList.toggle('is-collapsed'); document.body.classList.toggle('bt-role-collapsed', collapsed);
      try { localStorage.setItem('biotrop_role_shell_collapsed', collapsed ? '1' : '0'); } catch (_) {}
    };
    $('.bt-role-shell__logout', shell).onclick = () => {
      const legacy = findLegacy('Sair'); if (legacy) legacy.click();
      else if (window.SB?.auth?.signOut) window.SB.auth.signOut().then(()=>location.reload());
    };

    document.body.appendChild(shell);
    try { if (localStorage.getItem('biotrop_role_shell_collapsed') === '1') { shell.classList.add('is-collapsed'); document.body.classList.add('bt-role-collapsed'); } } catch (_) {}

    // Mantém apenas a navegação nova visível; remove os elementos flutuantes/scrollbars antigos.
    $$('.sidebar').forEach(x => { if (x !== shell) x.style.display='none'; });
    $$('.bt-floating-actions,.bt-context-toolbar,.bt-float-theme,.bt-settings-inline').forEach(x=>x.style.display='none');
  }

  function boot() {
    profileFallback(() => {
      build();
      let last = roleOf();
      setInterval(() => { const now = roleOf(); if (now !== last) { last = now; build(); } }, 1200);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true}); else boot();
})();
