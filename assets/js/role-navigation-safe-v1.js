(()=>{
'use strict';
if(window.__BIOTROP_ROLE_SIDEBAR_V2__)return;window.__BIOTROP_ROLE_SIDEBAR_V2__=true;
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const state=()=>{try{return window.STATE||window.BIOTROP_PRODUCTION_V2?.state||null}catch{return null}};
const user=()=>state()?.currentUser||state()?.context?.profile||{};
const role=()=>String(user().perfilId||user().roleCode||user().role_code||user().appRole||user().app_role||user().role||'').toLowerCase();
const name=()=>user().full_name||user().fullName||user().nome||user().name||'Usuário';
const email=()=>user().email||user().corporate_email||'';
const fallback={Inicio:'inicio',Almoxarifado:'almoxarifado',PCM:'pcm',Utilidades:'utilidades',Treinamentos:'treinamentos',Usuários:'usuarios',Configurações:'configuracoes'};
const icons={Inicio:'⌂',SCI:'▣',SCM:'▤',Aprovações:'✓',Utilidades:'◉',Apontamentos:'◷',Almoxarifado:'▦',Treinamentos:'◇',PCM:'◫',Usuários:'♙',Configurações:'⚙'};
function findExisting(label){const wanted=label.toLowerCase();return $$('.sidebar button,.sidebar a,.nav-item').find(x=>(x.textContent||'').trim().toLowerCase().includes(wanted));}
function go(label,tab){const ex=findExisting(label);if(ex&&ex.dataset.refSidebar!=='1'){ex.click();}else if(typeof window.navigateTo==='function'){window.navigateTo(fallback[label]||'inicio');}else{location.hash='#/'+(fallback[label]||'inicio');}
 if(tab){setTimeout(()=>{const t=findExisting(tab);if(t&&t!==document.activeElement)t.click();},180);}
}
function menus(r){
 if(r==='almoxarife')return [['OPERAÇÃO',[['Início','Inicio'],['SCI','SCI'],['SCM','SCM'],['Aprovações','Aprovações'],['Treinamentos','Treinamentos']]]];
 if(r==='pcm')return [['PCM',[['Início','Inicio'],['Utilidades','Utilidades'],['Apontamentos','Apontamentos'],['Almoxarifado','Almoxarifado'],['Treinamentos','Treinamentos']]]];
 if(['administrador','super_admin','admin'].includes(r))return [['GESTÃO',[['Início','Inicio'],['Almoxarifado','Almoxarifado'],['PCM','PCM'],['Utilidades','Utilidades'],['Treinamentos','Treinamentos'],['Usuários','Usuários'],['Configurações','Configurações']]]];
 return [['MINHA OPERAÇÃO',[['Início','Inicio'],['Treinamentos','Treinamentos'],['Apontamentos','Apontamentos'],['Almoxarifado','Almoxarifado']]]];
}
function render(){
 const side=$('.sidebar');if(!side)return;
 const r=role();const sig=r+'|'+(location.hash||'#');
 if(side.dataset.refSignature===sig)return;
 side.dataset.refSignature=sig;side.classList.add('bt-ref-sidebar');
 const initials=name().split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join('').toUpperCase()||'U';
 side.innerHTML=`<div class="ref-brand"><img src="./assets/biotrop-logo.svg" alt="BIOTROP"><div><strong>BIOTROP</strong><small>Manutenção</small></div></div><button class="ref-collapse" type="button" aria-label="Recolher menu">‹</button><div class="ref-role"><span class="ref-avatar">${initials}</span><div><b>${name()}</b><small>${r==='super_admin'?'Administrador':r||'Usuário'}</small></div></div><nav class="ref-nav">${menus(r).map(([g,items])=>`<div class="ref-group"><span>${g}</span>${items.map(([label,key])=>`<button type="button" data-ref-nav="${key}"><i>${icons[label]||'•'}</i><em>${label}</em></button>`).join('')}</div>`).join('')}</nav><div class="ref-footer"><div class="ref-online"><span></span> Sistema conectado</div><button type="button" class="ref-exit" data-ref-exit><i>↪</i><em>Sair</em></button></div>`;
 $$('.ref-nav button',side).forEach(b=>{b.onclick=()=>{go(b.dataset.refNav);setTimeout(updateActive,60)}});
 $('[data-ref-exit]',side).onclick=()=>{if(typeof window.signOut==='function')window.signOut();else if(typeof window.logout==='function')window.logout();};
 $('.ref-collapse',side).onclick=()=>{document.body.classList.toggle('bt-sidebar-collapsed');try{localStorage.setItem('bt_sidebar_collapsed',document.body.classList.contains('bt-sidebar-collapsed')?'1':'0')}catch{}};
 const saved=(()=>{try{return localStorage.getItem('bt_sidebar_collapsed')==='1'}catch{return false}})();if(saved)document.body.classList.add('bt-sidebar-collapsed');
 updateActive();
}
function updateActive(){const h=(location.hash||'').toLowerCase();$$('.ref-nav button').forEach(b=>{const l=b.dataset.refNav.toLowerCase();b.classList.toggle('active',h.includes(l)||((l==='inicio'||l==='apontamentos')&&h.includes('utilidades')))});}
function boot(){render();updateActive();}
window.addEventListener('hashchange',()=>{updateActive();setTimeout(render,80)});
let tries=0;const timer=setInterval(()=>{render();if(++tries>80)clearInterval(timer)},250);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
