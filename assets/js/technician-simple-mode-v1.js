/* BIOTROP • Modo Técnico V3 — operação simples, listas de materiais restauradas */
(() => {
  'use strict';
  if (window.__BIOTROP_TECH_SIMPLE_V3__) return;
  window.__BIOTROP_TECH_SIMPLE_V3__ = true;

  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const state=()=>{try{return(typeof STATE!=='undefined'&&STATE)||null}catch(_){return null}};
  const isTech=()=>{const u=state()?.currentUser;return !!u&&String(u.perfilId||u.role||'').toLowerCase()==='tecnico'};
  const nav=area=>{try{if(typeof navigateTo==='function')navigateTo(area)}catch(e){console.warn('[BIOTROP] tech nav',e)}};
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  const css=document.createElement('style');
  css.textContent=`
    /* Sidebar sempre fixa, inclusive em telas menores */
    body.bt-technician-simple .sidebar{width:220px!important;padding:18px 12px!important;position:fixed!important;left:0!important;top:0!important;bottom:0!important;height:100vh!important;min-height:100vh!important;z-index:1000!important;overflow-y:auto!important}
    body.bt-technician-simple .main-area{margin-left:220px!important;padding:28px 34px!important;min-height:100vh!important;width:auto!important}
    body.bt-technician-simple .sidebar-nav{gap:5px}
    body.bt-technician-simple .tech-home{max-width:980px;margin:0 auto}
    body.bt-technician-simple .tech-welcome{margin-bottom:26px}
    body.bt-technician-simple .tech-welcome h1{margin:0;color:#17332b;font-size:28px;font-weight:850}
    body.bt-technician-simple .tech-welcome p{margin:7px 0 0;color:#6b7a75;font-size:14px}
    body.bt-technician-simple .tech-actions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}
    body.bt-technician-simple .tech-action{border:1px solid #e2ece7;background:#fff;border-radius:18px;padding:24px;text-align:left;cursor:pointer;box-shadow:0 8px 25px rgba(0,45,42,.06);transition:.16s;font-family:inherit}
    body.bt-technician-simple .tech-action:hover{transform:translateY(-2px);box-shadow:0 14px 32px rgba(0,45,42,.1);border-color:#b8dacc}
    body.bt-technician-simple .tech-action .ico{width:48px;height:48px;border-radius:14px;background:#eaf7f1;color:#087657;display:grid;place-items:center;font-size:24px;margin-bottom:16px}
    body.bt-technician-simple .tech-action strong{display:block;color:#17332b;font-size:18px;margin-bottom:5px}
    body.bt-technician-simple .tech-action span{display:block;color:#71827b;font-size:13px;line-height:1.45}
    body.bt-technician-simple .tech-quick{margin-top:18px;background:#003c41;color:#fff;border-radius:16px;padding:18px 20px;display:flex;align-items:center;justify-content:space-between;gap:16px}
    body.bt-technician-simple .tech-quick b{font-size:15px}.tech-quick small{display:block;color:#b8ddd1;margin-top:3px}
    body.bt-technician-simple .tech-quick button{border:0;border-radius:10px;background:#39c99a;color:#06241e;font-weight:850;padding:11px 16px;cursor:pointer}
    body.bt-technician-simple #main-content .page-title-row p{display:none}
    body.bt-technician-simple #main-content .page-title-row{margin-bottom:18px}
    body.bt-technician-simple .tech-hidden{display:none!important}
    /* Nunca exigir foto no apontamento de medidor/horímetro. A foto continua disponível, mas opcional. */
    body.bt-technician-simple .utility-photo-required,
    body.bt-technician-simple .meter-photo-required{display:none!important}
    @media(max-width:800px){
      body.bt-technician-simple .sidebar{width:220px!important;padding:18px 10px!important}
      body.bt-technician-simple .main-area{margin-left:220px!important;padding:20px 16px!important;min-width:calc(100vw - 220px)!important}
      body.bt-technician-simple .tech-actions{grid-template-columns:1fr}
    }
  `;
  document.head.appendChild(css);

  function setPermissions(){
    try{
      if(typeof PROFILES==='undefined')return;
      const p=PROFILES.find(x=>x.id==='tecnico');if(!p)return;
      p.permissoes=p.permissoes||{};
      p.permissoes.almoxarifado=Object.assign({},p.permissoes.almoxarifado,{acesso:true,solicitacoes:true,familias:true,scm_acesso:true,scm_gestao:false,scm_aprovacao:false});
      p.permissoes.pcm={acesso:false};
      p.permissoes.utilidades={acesso:true};
      if(typeof saveProfiles==='function')saveProfiles(PROFILES);
    }catch(e){console.warn('[BIOTROP] tech permissions',e)}
  }

  let sidebarBuilt=false;
  function rebuildSidebar(){
    const n=$('#sidebar-nav');if(!n||typeof renderSidebarNav!=='function')return;
    if(sidebarBuilt&&n.querySelector('.nav-item[data-nav="home"]'))return;
    try{
      n.innerHTML=renderSidebarNav();
      const allowed=['home','utilidades','almoxarifado'];
      $$('[data-nav]',n).forEach(b=>{
        const id=b.getAttribute('data-nav');
        if(!allowed.includes(id)||/pcm|admin|trein/i.test(id))b.classList.add('tech-hidden');
      });
      $$('[data-group]',n).forEach(b=>{
        const id=b.getAttribute('data-group');
        if(id!=='grp_almoxarifado'&&id!=='grp_utilidades')b.classList.add('tech-hidden');
      });
      sidebarBuilt=true;
    }catch(e){console.warn('[BIOTROP] tech sidebar',e)}
  }

  function renderHome(){
    if(!isTech()||state()?.activeArea!=='home')return;
    const main=$('#main-content');if(!main||main.dataset.techHome==='1')return;
    main.dataset.techHome='1';
    main.innerHTML=`<div class="tech-home">
      <div class="tech-welcome"><h1>Olá, ${esc(state()?.currentUser?.nome||'Técnico')}.</h1><p>Escolha o que você precisa registrar.</p></div>
      <div class="tech-actions">
        <button class="tech-action" type="button" data-tech-action="reading"><div class="ico">▣</div><strong>Registrar leitura</strong><span>Água, gás e energia.</span></button>
        <button class="tech-action" type="button" data-tech-action="hourmeter"><div class="ico">◷</div><strong>Registrar horímetro</strong><span>Informe a leitura do equipamento.</span></button>
        <button class="tech-action" type="button" data-tech-action="material"><div class="ico">▤</div><strong>Solicitar material</strong><span>Abra as listas de materiais e faça sua SC.</span></button>
      </div>
    </div>`;
  }

  function resetHomeMarker(){const main=$('#main-content');if(main&&state()?.activeArea!=='home')delete main.dataset.techHome}

  function openReading(){
    nav('utilidades');
    let tries=0;
    const timer=setInterval(()=>{tries++;const b=document.querySelector('[data-utility-open]');if(b){clearInterval(timer);b.click()}if(tries>=35)clearInterval(timer)},150);
  }

  /* Remove required da foto somente quando o usuário está no módulo de utilidades.
     Não remove upload de materiais/SCs nem altera as fotos já salvas. */
  function makeMeterPhotoOptional(){
    if(!isTech()||state()?.activeArea!=='utilidades')return;
    const candidates=$$('input[type="file"]');
    candidates.forEach(input=>{
      const box=input.closest('form,.modal,.modal-backdrop,[role="dialog"],section,div');
      const text=(box?.innerText||'').toLowerCase();
      const utilityContext=/medidor|horímetro|horimetro|leitura|utilidade/.test(text);
      const photoContext=/foto|imagem|marcador|comprovante/.test(text);
      if(utilityContext&&photoContext){
        input.removeAttribute('required');
        input.required=false;
        input.setCustomValidity('');
        input.setAttribute('aria-required','false');
        const label=input.closest('label');
        if(label)label.querySelectorAll('span,strong,small').forEach(el=>{el.textContent=el.textContent.replace(/\*\s*obrigat[óo]ri[oa]?/ig,'').replace(/obrigat[óo]ri[oa]?/ig,'opcional')});
      }
    });
    $$('label,[class*="photo"],[class*="foto"]').forEach(el=>{
      if(/foto.*(medidor|leitura|marcador)|medidor.*foto|foto.*hor[ií]metro/i.test(el.innerText||'')){
        el.innerHTML=el.innerHTML.replace(/obrigat[óo]ri[oa]?/ig,'opcional').replace(/\*\s*(?=<)/g,'');
      }
    });
  }

  document.addEventListener('click',e=>{
    const b=e.target.closest?.('[data-tech-action]');if(!b||!isTech())return;
    e.preventDefault();e.stopPropagation();
    const a=b.getAttribute('data-tech-action');
    if(a==='reading'||a==='hourmeter')openReading();
    else if(a==='material')nav('almoxarifado');
  },true);

  let applying=false;
  function apply(){
    if(!isTech()||applying)return;
    applying=true;
    try{
      document.body.classList.add('bt-technician-simple');
      setPermissions();
      rebuildSidebar();
      renderHome();
      resetHomeMarker();
      makeMeterPhotoOptional();
    }finally{applying=false}
  }

  let lastKey='';
  const tick=()=>{
    if(!isTech())return;
    const s=state();const key=(s?.currentUser?.id||'')+'|'+(s?.activeArea||'');
    if(key!==lastKey){lastKey=key;sidebarBuilt=false;setTimeout(apply,80)}
    else if(!document.body.classList.contains('bt-technician-simple'))apply();
    if(s?.activeArea==='utilidades')makeMeterPhotoOptional();
  };
  const start=()=>{tick();setInterval(tick,1000);new MutationObserver(()=>{if(isTech())makeMeterPhotoOptional()}).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['required']})};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
