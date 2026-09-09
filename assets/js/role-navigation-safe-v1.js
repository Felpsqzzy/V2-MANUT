(()=>{
'use strict';
/*
 * BIOTROP — Sidebar Pro
 *
 * Regra principal: este arquivo NÃO recria nem substitui a navegação existente.
 * A árvore, permissões, data-nav, data-group e handlers do app.html continuam
 * sendo a fonte da verdade. Aqui cuidamos somente da experiência visual,
 * acessibilidade, colapso desktop e pequenos detalhes de usabilidade.
 */
const BODY_CLASS='bt-sidebar-pro';
const COLLAPSED_CLASS='bt-sidebar-collapsed';
const STORAGE_KEY='biotrop_sidebar_collapsed_v2';
const STYLE_ID='biotrop-sidebar-pro-style-v2';

const q=(s,r=document)=>r.querySelector(s);
const qa=(s,r=document)=>Array.from(r.querySelectorAll(s));

function injectStyles(){
  if(q('#'+STYLE_ID)) return;
  const style=document.createElement('style');
  style.id=STYLE_ID;
  style.textContent=`
    :root{
      --bt-side-width:286px;
      --bt-side-bg-1:#062d30;
      --bt-side-bg-2:#073f42;
      --bt-side-bg-3:#0b5559;
      --bt-side-text:rgba(255,255,255,.78);
      --bt-side-muted:rgba(255,255,255,.46);
      --bt-side-line:rgba(255,255,255,.10);
      --bt-side-hover:rgba(255,255,255,.075);
      --bt-side-active:rgba(65,210,174,.19);
      --bt-side-accent:#66ddbf;
    }

    body.${BODY_CLASS} .shell{
      min-height:100vh;
      width:100%;
    }

    body.${BODY_CLASS} .sidebar{
      width:var(--bt-side-width)!important;
      min-width:var(--bt-side-width)!important;
      min-height:100vh!important;
      padding:20px 14px 16px!important;
      background:
        radial-gradient(circle at 12% 0%,rgba(84,214,184,.10),transparent 30%),
        linear-gradient(180deg,var(--bt-side-bg-1) 0%,var(--bt-side-bg-2) 46%,var(--bt-side-bg-1) 100%)!important;
      border-right:1px solid rgba(255,255,255,.06)!important;
      box-shadow:10px 0 38px rgba(0,31,33,.16)!important;
      position:sticky!important;
      top:0!important;
      align-self:flex-start!important;
      overflow:hidden!important;
      z-index:1000!important;
    }

    body.${BODY_CLASS} .sidebar::before{
      content:"";
      position:absolute;
      inset:0;
      pointer-events:none;
      background:linear-gradient(180deg,rgba(255,255,255,.025),transparent 28%,transparent 72%,rgba(0,0,0,.10));
    }

    body.${BODY_CLASS} .sidebar-brand{
      position:relative;
      min-height:62px;
      margin:0 4px 14px!important;
      padding:7px 8px 14px!important;
      border-bottom:1px solid var(--bt-side-line)!important;
      gap:11px!important;
    }

    body.${BODY_CLASS} .sidebar-logo-icon{
      width:36px!important;
      height:36px!important;
      object-fit:contain!important;
      filter:brightness(0) invert(1)!important;
      opacity:.96;
    }

    body.${BODY_CLASS} .sb-name{
      font-size:15px!important;
      line-height:1.1!important;
      letter-spacing:.075em!important;
      color:#fff!important;
    }

    body.${BODY_CLASS} .sb-sub{
      margin-top:4px!important;
      font-size:10px!important;
      color:rgba(255,255,255,.50)!important;
      letter-spacing:.03em!important;
    }

    body.${BODY_CLASS} .sidebar-nav{
      position:relative;
      flex:1 1 auto!important;
      min-height:0!important;
      overflow-y:auto!important;
      overflow-x:hidden!important;
      padding:2px 1px 12px!important;
      scrollbar-width:thin;
      scrollbar-color:rgba(255,255,255,.16) transparent;
    }
    body.${BODY_CLASS} .sidebar-nav::-webkit-scrollbar{width:5px}
    body.${BODY_CLASS} .sidebar-nav::-webkit-scrollbar-track{background:transparent}
    body.${BODY_CLASS} .sidebar-nav::-webkit-scrollbar-thumb{background:rgba(255,255,255,.14);border-radius:99px}

    body.${BODY_CLASS} .nav-item{
      position:relative!important;
      width:100%!important;
      min-height:44px!important;
      margin:3px 0!important;
      padding:10px 12px!important;
      border:1px solid transparent!important;
      border-radius:13px!important;
      display:flex!important;
      align-items:center!important;
      gap:11px!important;
      color:var(--bt-side-text)!important;
      background:transparent!important;
      font-size:13px!important;
      font-weight:600!important;
      letter-spacing:.005em!important;
      transition:background .16s ease,color .16s ease,transform .16s ease,border-color .16s ease!important;
    }

    body.${BODY_CLASS} .nav-item svg,
    body.${BODY_CLASS} .nav-item .icon,
    body.${BODY_CLASS} .nav-item > svg:first-child{
      flex:0 0 auto;
      width:18px;
      height:18px;
      opacity:.88;
    }

    body.${BODY_CLASS} .nav-item:hover{
      color:#fff!important;
      background:var(--bt-side-hover)!important;
      transform:translateX(2px);
      border-color:rgba(255,255,255,.055)!important;
    }

    body.${BODY_CLASS} .nav-item.active{
      color:#fff!important;
      background:linear-gradient(90deg,var(--bt-side-active),rgba(255,255,255,.055))!important;
      border-color:rgba(101,222,191,.12)!important;
      box-shadow:inset 3px 0 0 var(--bt-side-accent),0 7px 18px rgba(0,0,0,.07)!important;
      font-weight:800!important;
    }

    body.${BODY_CLASS} .nav-item.active svg{opacity:1}

    body.${BODY_CLASS} .nav-item-lvl1{
      min-height:40px!important;
      padding-left:38px!important;
      font-size:12.5px!important;
      color:rgba(255,255,255,.69)!important;
    }

    body.${BODY_CLASS} .nav-item-lvl2{
      min-height:38px!important;
      padding-left:57px!important;
      font-size:12px!important;
      color:rgba(255,255,255,.58)!important;
    }

    body.${BODY_CLASS} .nav-item-lvl1.active,
    body.${BODY_CLASS} .nav-item-lvl2.active{
      color:#fff!important;
    }

    body.${BODY_CLASS} .nav-children{
      margin:1px 0 5px;
      padding-left:3px;
      border-left:1px solid rgba(255,255,255,.10);
    }

    body.${BODY_CLASS} .nav-group{
      background:rgba(255,255,255,.025)!important;
    }
    body.${BODY_CLASS} .nav-group:hover{background:rgba(255,255,255,.075)!important}

    body.${BODY_CLASS} .nav-chevron{
      margin-left:auto!important;
      color:rgba(255,255,255,.48)!important;
      transition:transform .18s ease,color .18s ease!important;
    }
    body.${BODY_CLASS} .nav-group:hover .nav-chevron{color:rgba(255,255,255,.80)!important}
    body.${BODY_CLASS} .nav-chevron.expanded{transform:rotate(0deg)!important}

    body.${BODY_CLASS} .sidebar-footer{
      position:relative;
      margin:4px 2px 0!important;
      padding:12px 4px 0!important;
      border-top:1px solid var(--bt-side-line)!important;
    }

    body.${BODY_CLASS} .user-chip{
      margin:0 0 10px!important;
      padding:9px!important;
      min-height:58px;
      border:1px solid rgba(255,255,255,.075);
      border-radius:14px;
      background:rgba(255,255,255,.045);
      gap:10px!important;
    }

    body.${BODY_CLASS} .user-avatar{
      width:36px!important;
      height:36px!important;
      background:linear-gradient(145deg,#2aa889,#14725f)!important;
      box-shadow:0 6px 16px rgba(0,0,0,.16);
      font-size:12px!important;
    }

    body.${BODY_CLASS} .user-name{
      max-width:175px;
      overflow:hidden;
      text-overflow:ellipsis;
      white-space:nowrap;
      color:#fff!important;
      font-size:12.5px!important;
    }

    body.${BODY_CLASS} .user-role{
      margin-top:2px;
      color:var(--bt-side-muted)!important;
      font-size:10.5px!important;
    }

    body.${BODY_CLASS} .logout-btn{
      min-height:42px!important;
      border:1px solid rgba(255,255,255,.07)!important;
      border-radius:12px!important;
      background:rgba(255,255,255,.045)!important;
      color:rgba(255,255,255,.76)!important;
      transition:.16s ease!important;
    }
    body.${BODY_CLASS} .logout-btn:hover{
      color:#fff!important;
      background:rgba(196,69,76,.14)!important;
      border-color:rgba(255,140,140,.13)!important;
    }

    .biotrop-sidebar-toggle{
      position:absolute!important;
      top:17px!important;
      right:-12px!important;
      width:28px!important;
      height:28px!important;
      border:1px solid rgba(255,255,255,.18)!important;
      border-radius:50%!important;
      background:#0c6365!important;
      color:#fff!important;
      display:grid!important;
      place-items:center!important;
      padding:0!important;
      cursor:pointer!important;
      z-index:1100!important;
      box-shadow:0 7px 18px rgba(0,0,0,.20)!important;
      transition:transform .18s ease,background .18s ease!important;
    }
    .biotrop-sidebar-toggle:hover{background:#147879!important}
    body.${BODY_CLASS}.${COLLAPSED_CLASS} .biotrop-sidebar-toggle{transform:rotate(180deg)}

    body.${BODY_CLASS}.${COLLAPSED_CLASS} .sidebar{
      width:82px!important;
      min-width:82px!important;
      padding-inline:9px!important;
    }
    body.${BODY_CLASS}.${COLLAPSED_CLASS} .sidebar-brand{
      justify-content:center!important;
      padding-inline:0!important;
    }
    body.${BODY_CLASS}.${COLLAPSED_CLASS} .sidebar-brand>div,
    body.${BODY_CLASS}.${COLLAPSED_CLASS} .nav-item>span:not(.nav-chevron),
    body.${BODY_CLASS}.${COLLAPSED_CLASS} .nav-group>span:not(.nav-chevron),
    body.${BODY_CLASS}.${COLLAPSED_CLASS} .nav-chevron,
    body.${BODY_CLASS}.${COLLAPSED_CLASS} .user-chip>div:not(.user-avatar),
    body.${BODY_CLASS}.${COLLAPSED_CLASS} .logout-btn>span{
      display:none!important;
    }
    body.${BODY_CLASS}.${COLLAPSED_CLASS} .nav-item{
      justify-content:center!important;
      padding-inline:0!important;
    }
    body.${BODY_CLASS}.${COLLAPSED_CLASS} .nav-item-lvl1,
    body.${BODY_CLASS}.${COLLAPSED_CLASS} .nav-item-lvl2{
      padding-left:0!important;
    }
    body.${BODY_CLASS}.${COLLAPSED_CLASS} .nav-children{
      padding-left:0!important;
      border-left:0!important;
    }
    body.${BODY_CLASS}.${COLLAPSED_CLASS} .user-chip{justify-content:center}
    body.${BODY_CLASS}.${COLLAPSED_CLASS} .logout-btn{justify-content:center}

    @media(min-width:769px){
      body.${BODY_CLASS} .main-area{
        min-width:0;
        transition:margin-left .20s ease!important;
      }
      body.${BODY_CLASS}.${COLLAPSED_CLASS} .main-area{
        margin-left:-204px;
      }
    }

    @media(max-width:768px){
      body.${BODY_CLASS} .sidebar{
        position:fixed!important;
        top:0!important;
        left:0!important;
        bottom:0!important;
        width:280px!important;
        min-width:280px!important;
        transform:translateX(-105%)!important;
        transition:transform .22s ease,box-shadow .22s ease!important;
        z-index:1001!important;
      }
      body.${BODY_CLASS} .sidebar.open{
        transform:translateX(0)!important;
        box-shadow:18px 0 50px rgba(0,0,0,.30)!important;
      }
      .biotrop-sidebar-toggle{display:none!important}
      body.${BODY_CLASS}.${COLLAPSED_CLASS} .sidebar,
      body.${BODY_CLASS}.${COLLAPSED_CLASS} .sidebar.open{
        width:280px!important;
        min-width:280px!important;
        transform:translateX(-105%)!important;
      }
      body.${BODY_CLASS}.${COLLAPSED_CLASS} .sidebar.open{
        transform:translateX(0)!important;
      }
    }

    @media(prefers-reduced-motion:reduce){
      body.${BODY_CLASS} .nav-item,
      .biotrop-sidebar-toggle,
      body.${BODY_CLASS} .sidebar{transition:none!important}
    }
  `;
  document.head.appendChild(style);
}

function ensureToggle(){
  const sidebar=q('#sidebar');
  if(!sidebar || window.innerWidth<769) return;
  if(q('.biotrop-sidebar-toggle',sidebar)) return;
  const btn=document.createElement('button');
  btn.type='button';
  btn.className='biotrop-sidebar-toggle';
  btn.setAttribute('aria-label','Recolher ou expandir menu lateral');
  btn.setAttribute('title','Recolher menu');
  btn.innerHTML='<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"></polyline></svg>';
  btn.addEventListener('click',()=>{
    const collapsed=document.body.classList.toggle(COLLAPSED_CLASS);
    btn.setAttribute('aria-label',collapsed?'Expandir menu lateral':'Recolher menu lateral');
    btn.title=collapsed?'Expandir menu':'Recolher menu';
    try{localStorage.setItem(STORAGE_KEY,collapsed?'1':'0')}catch{}
  });
  sidebar.appendChild(btn);
}

function restoreCollapsedPreference(){
  if(window.innerWidth<769) return;
  try{
    if(localStorage.getItem(STORAGE_KEY)==='1'){
      document.body.classList.add(COLLAPSED_CLASS);
    }
  }catch{}
}

function addNavigationAccessibility(){
  const sidebar=q('#sidebar');
  if(!sidebar) return;

  qa('.nav-item',sidebar).forEach(btn=>{
    if(!btn.hasAttribute('type')) btn.setAttribute('type','button');
    const label=(btn.textContent||'').replace(/\s+/g,' ').trim();
    if(label && !btn.getAttribute('aria-label')) btn.setAttribute('aria-label',label);
    if(label && !btn.title) btn.title=label;
  });

  qa('[data-group]',sidebar).forEach(btn=>{
    const expanded=btn.querySelector('.nav-chevron.expanded')!=null;
    btn.setAttribute('aria-expanded',expanded?'true':'false');
  });
}

function markBody(){
  document.body.classList.add(BODY_CLASS);
}

function boot(){
  markBody();
  injectStyles();
  restoreCollapsedPreference();
  ensureToggle();
  addNavigationAccessibility();

  /* A navegação original renderiza novamente a árvore ao abrir grupos.
     Observamos apenas para reaplicar atributos visuais/acessíveis; nunca
     substituímos os nós e nunca instalamos handlers concorrentes. */
  const observer=new MutationObserver(()=>{
    markBody();
    ensureToggle();
    addNavigationAccessibility();
  });
  observer.observe(document.body,{childList:true,subtree:true});
}

if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',boot,{once:true});
}else{
  boot();
}
})();