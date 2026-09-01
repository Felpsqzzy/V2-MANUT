(() => {
  'use strict';
  if (window.__BIOTROP_SAFE_NAV_V1__) return;
  window.__BIOTROP_SAFE_NAV_V1__ = true;

  const $$ = (s,r=document) => [...r.querySelectorAll(s)];
  const text = el => (el?.innerText || el?.textContent || '').trim().toLowerCase();
  const state = () => { try { return window.STATE || (typeof STATE !== 'undefined' ? STATE : null); } catch { return window.STATE || null; } };
  const currentUser = () => state()?.currentUser || {};
  const role = () => String(currentUser().perfilId || currentUser().roleCode || currentUser().role_code || currentUser().appRole || currentUser().app_role || currentUser().role || '').toLowerCase();
  const isTech = () => ['tecnico','viewer'].includes(role());
  const main = () => document.querySelector('.main-area') || document.querySelector('#main-content') || document.querySelector('main');

  function findNav(label){
    const wanted = label.toLowerCase();
    return $$('.sidebar button,.sidebar a,.nav-item,[role="button"]').find(el => {
      const t=text(el);
      return t===wanted || t.includes(wanted);
    });
  }

  function clickNav(label){
    const el=findNav(label); if(!el) return false;
    el.click(); return true;
  }

  function techShell(){
    if(!isTech()) return;
    document.body.classList.add('bt-tech-safe');
    const side=document.querySelector('.sidebar');
    if(!side) return;
    const labels=['Início','Treinamentos','Utilidades','Almoxarifado'];
    $$('.sidebar .nav-item,.sidebar button,.sidebar a').forEach(el=>{
      const t=text(el);
      if(!t) return;
      const keep=labels.some(x=>t===x.toLowerCase()||t.includes(x.toLowerCase())) || t.includes('sair') || t.includes('configurações');
      el.style.display=keep?'flex':'';
    });
  }

  function patchTechActions(){
    if(!isTech()) return;
    const root=main(); if(!root) return;
    const cards=$$('[data-tech-home],.tech-v4-card',root);
    cards.forEach(card=>{
      if(card.dataset.safeBound==='1') return;
      card.dataset.safeBound='1';
      card.addEventListener('click',e=>{
        const t=text(card);
        if(t.includes('trein')){e.preventDefault();e.stopPropagation();if(!clickNav('treinamentos')) window.navigateTo?.('treinamentos');}
        else if(t.includes('apontar')||t.includes('utilidade')||t.includes('horímetro')||t.includes('horimetro')){e.preventDefault();e.stopPropagation();if(!clickNav('utilidades')) window.navigateTo?.('utilidades');}
        else if(t.includes('almox')){e.preventDefault();e.stopPropagation();if(!clickNav('almoxarifado')) window.navigateTo?.('almoxarifado');}
      },true);
    });
  }

  function observe(){
    techShell();
    patchTechActions();
    const obs=new MutationObserver(()=>{techShell();patchTechActions();});
    obs.observe(document.body,{childList:true,subtree:true});
    setTimeout(()=>{techShell();patchTechActions();},300);
    setTimeout(()=>{techShell();patchTechActions();},1200);
    setTimeout(()=>{techShell();patchTechActions();},2500);
  }

  function start(){
    for(let i=0;i<50;i++){
      if(state()?.currentUser){observe();return;}
      setTimeout(()=>{if(i===49)observe();},i*200);
    }
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true}); else start();
})();
