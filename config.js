window.BIOTROP_CONFIG = Object.freeze({
  supabaseUrl: 'https://hoikliqttxqdsyyjdnul.supabase.co',
  supabaseAnonKey: 'sb_publishable_PeiXiPCMENjp9ajwW-EbJw_IohMAt1h',
  apiBaseUrl: window.location.origin + '/api'
});

(function () {
  'use strict';
  let client = null, recoveryShown = false;
  const escHtml = v => String(v ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
  const isRecoveryUrl = () => { const h=new URLSearchParams((location.hash||'').replace(/^#/,'')),q=new URLSearchParams(location.search||''); return h.get('type')==='recovery'||q.get('type')==='recovery'||h.has('access_token')||h.has('refresh_token')||q.has('code'); };
  async function openRecovery(c){
    if(!c||recoveryShown||!isRecoveryUrl())return; recoveryShown=true;
    const code=new URLSearchParams(location.search||'').get('code');
    if(code&&c.auth.exchangeCodeForSession){try{const r=await c.auth.exchangeCodeForSession(code);if(r.error)throw r.error}catch(e){console.error('[BIOTROP] Recovery:',e);return}}
    try{const s=await c.auth.getSession();if(!s?.data?.session)return}catch(e){return}
    const root=document.createElement('div');root.id='biotrop-password-recovery';root.innerHTML=`<style>#biotrop-password-recovery{position:fixed;inset:0;z-index:999999;background:rgba(0,35,38,.62);display:flex;align-items:center;justify-content:center;padding:20px;font-family:system-ui,sans-serif}#biotrop-password-recovery .br-card{width:100%;max-width:430px;background:#fff;border-radius:20px;padding:28px;box-shadow:0 30px 90px rgba(0,0,0,.28)}#biotrop-password-recovery h2{margin:0 0 8px;color:#003c41;font-size:22px}#biotrop-password-recovery p{margin:0 0 18px;color:#60746d;font-size:13px;line-height:1.5}#biotrop-password-recovery label{display:block;font-size:12px;font-weight:700;color:#26463b;margin:14px 0 6px}#biotrop-password-recovery input{width:100%;box-sizing:border-box;border:1px solid #d7e6df;border-radius:10px;padding:12px;font-size:14px}#biotrop-password-recovery button{width:100%;border:0;border-radius:999px;background:#003c41;color:#fff;padding:12px;font-weight:800;margin-top:18px;cursor:pointer}.br-msg{margin-top:12px;padding:10px;border-radius:9px;font-size:12px}.br-error{background:#fdecec;color:#a62922}.br-success{background:#eef8f3;color:#176449}</style><div class="br-card"><h2>Redefinir senha</h2><p>Cadastre uma nova senha para acessar a Plataforma de Manutenção.</p><label>Nova senha</label><input id="br-new" type="password" autocomplete="new-password"><label>Confirmar nova senha</label><input id="br-confirm" type="password" autocomplete="new-password"><button id="br-save">Salvar nova senha</button><div id="br-msg"></div></div>`;
    document.body.appendChild(root);
    root.querySelector('#br-save').onclick=async function(){const a=root.querySelector('#br-new').value,b=root.querySelector('#br-confirm').value,m=root.querySelector('#br-msg');if(a.length<8){m.innerHTML='<div class="br-msg br-error">A senha precisa ter pelo menos 8 caracteres.</div>';return}if(a!==b){m.innerHTML='<div class="br-msg br-error">As senhas não conferem.</div>';return}this.disabled=true;this.textContent='Salvando...';try{const r=await c.auth.updateUser({password:a});if(r.error)throw r.error;m.innerHTML='<div class="br-msg br-success">Senha alterada com sucesso.</div>';setTimeout(async()=>{try{await c.auth.signOut()}catch(_){}history.replaceState({},document.title,location.pathname);location.reload()},1000)}catch(e){m.innerHTML='<div class="br-msg br-error">'+escHtml(e.message||'Não foi possível alterar a senha.')+'</div>';this.disabled=false;this.textContent='Salvar nova senha'}};
  }
  function patch(c){if(!c?.auth)return;client=c;if(c.auth.onAuthStateChange&&!c.__biotropRecovery){c.__biotropRecovery=true;c.auth.onAuthStateChange(e=>{if(e==='PASSWORD_RECOVERY')setTimeout(()=>openRecovery(c),0)})}if(isRecoveryUrl())setTimeout(()=>openRecovery(c),250)}
  function boot(){try{if(window.SB)patch(window.SB);Object.defineProperty(window,'SB',{configurable:true,get:()=>client,set:v=>{client=v;patch(v)}})}catch(_){patch(window.SB)}setInterval(()=>{if(window.SB)patch(window.SB)},700)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();

(function(){
  function boot(){
    const style=document.createElement('style');style.id='biotrop-tech-style';style.textContent=`
      .utility-control-room.tech-utilities-mode{max-width:980px!important;padding:18px 0 40px!important}.tech-utilities-mode .utility-command-header,.tech-utilities-mode .utility-summary-row,.tech-utilities-mode .utility-main-grid,.tech-utilities-mode .utility-history-card,.tech-utilities-mode .utility-side-stack{display:none!important}.tech-simple-header{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:18px}.tech-simple-header h1{margin:0;color:#17332b;font-size:24px;font-weight:800}.tech-simple-header p{margin:5px 0 0;color:#6b7a75;font-size:13px}.tech-simple-badge{background:#eef8f3;color:#176449;border-radius:999px;padding:8px 12px;font-size:12px;font-weight:800}.tech-utilities-mode .utility-meter-grid{grid-template-columns:repeat(auto-fit,minmax(230px,1fr))!important;gap:10px!important}.tech-utilities-mode .utility-meter-card{padding:14px!important;border-radius:13px!important;box-shadow:none!important}.tech-utilities-mode .utility-meter-card h3{font-size:14px!important}.tech-utilities-mode .utility-meter-actions .t-btn.green{width:100%;justify-content:center;padding:11px 14px!important;border-radius:10px!important}.tech-utilities-mode .utility-meter-footer span:last-child{display:none}@media(max-width:700px){.tech-simple-header h1{font-size:20px}.tech-utilities-mode .utility-meter-grid{grid-template-columns:1fr!important}}`;
    document.head.appendChild(style);
    const simplify=()=>{const r=document.querySelector('.utility-control-room');if(!r||document.querySelector('#utility-new-meter')||document.querySelector('.biotrop-v2-meter-admin')||!document.querySelector('[data-v2-reading]'))return;r.classList.add('tech-utilities-mode');if(!r.querySelector('.tech-simple-header')){const h=document.createElement('div');h.className='tech-simple-header';h.innerHTML='<div><h1>Apontamento de Utilidades</h1><p>Selecione o medidor e registre a leitura.</p></div><span class="tech-simple-badge">Apontamento</span>';r.insertBefore(h,r.firstElementChild)}};
    new MutationObserver(simplify).observe(document.body,{childList:true,subtree:true});simplify();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();

(function(){
  'use strict';
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
  function installStyle(){if(document.getElementById('biotrop-v13-style'))return;const s=document.createElement('style');s.id='biotrop-v13-style';s.textContent=`
    @media(min-width:769px){.shell{display:block!important;min-height:100vh}.sidebar{position:fixed!important;left:0!important;top:0!important;bottom:0!important;height:100vh!important;width:240px!important;z-index:1000!important;overflow:hidden!important;box-shadow:8px 0 28px rgba(0,35,38,.10);transition:width .22s ease!important}.main-area{margin-left:240px!important;min-height:100vh!important;transition:margin-left .22s ease!important}body.biotrop-sidebar-collapsed .sidebar{width:76px!important;padding-left:10px!important;padding-right:10px!important}body.biotrop-sidebar-collapsed .main-area{margin-left:76px!important}body.biotrop-sidebar-collapsed .sidebar-brand{justify-content:center;padding:0!important}body.biotrop-sidebar-collapsed .sidebar-brand>div,body.biotrop-sidebar-collapsed .nav-item>span:not(.nav-chevron),body.biotrop-sidebar-collapsed .nav-group>span:not(.nav-chevron),body.biotrop-sidebar-collapsed .user-chip>div:not(.user-avatar),body.biotrop-sidebar-collapsed .logout-btn>span{display:none!important}body.biotrop-sidebar-collapsed .nav-item{justify-content:center!important;padding:8px!important}body.biotrop-sidebar-collapsed .nav-chevron{display:none!important}body.biotrop-sidebar-collapsed .user-chip{justify-content:center;padding:0}.biotrop-sidebar-toggle{position:absolute;top:18px;right:-13px;width:28px;height:28px;border:1px solid rgba(255,255,255,.2);border-radius:50%;background:#0d5a5d;color:#fff;display:grid;place-items:center;cursor:pointer;z-index:1002;box-shadow:0 5px 14px rgba(0,0,0,.18)}body.biotrop-sidebar-collapsed .biotrop-sidebar-toggle{transform:rotate(180deg)}}#sci-familia{display:block!important;min-height:44px!important;background:#fff!important;color:#17332b!important;cursor:pointer!important}.sci-card #sci-familia option{color:#17332b!important;background:#fff!important}.sci-card{max-width:760px!important}@media(max-width:768px){.biotrop-sidebar-toggle{display:none!important}}`;
    document.head.appendChild(s);
  }
  function restoreFamilies(){
    try{
      if(typeof FAMILIES_SEED==='undefined'||typeof FAMILIES==='undefined')return;
      let saved=null;try{saved=JSON.parse(localStorage.getItem('biotrop_families_v1')||'null')}catch(_) {saved=null}
      const source=Array.isArray(saved)&&saved.length?saved:FAMILIES_SEED.map(f=>JSON.parse(JSON.stringify(f)));
      FAMILIES=source;
      const select=document.getElementById('sci-familia');
      if(select){
        const wanted=source.map(f=>String(f.id));
        const actual=Array.from(select.options||[]).map(o=>String(o.value));
        if(wanted.some(id=>!actual.includes(id))){const cur=select.value;select.innerHTML='<option value="">Selecione o tipo de material...</option>'+source.map(f=>'<option value="'+esc(f.id)+'">'+esc(f.nome)+'</option>').join('');if(cur)select.value=cur}
      }
      if(typeof saveFamilies==='function'&&!saveFamilies.__biotropV13){const old=saveFamilies;const wrapped=function(v){try{localStorage.setItem('biotrop_families_v1',JSON.stringify(v))}catch(_){}return old(v)};wrapped.__biotropV13=true;saveFamilies=wrapped}
    }catch(e){console.warn('[BIOTROP] SCI:',e)}
  }
  function installSidebar(){const sb=document.getElementById('sidebar');if(!sb||innerWidth<769)return;if(!sb.querySelector('.biotrop-sidebar-toggle')){const b=document.createElement('button');b.type='button';b.className='biotrop-sidebar-toggle';b.title='Recolher/expandir menu';b.setAttribute('aria-label','Recolher ou expandir menu lateral');b.innerHTML='<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>';b.onclick=()=>{document.body.classList.toggle('biotrop-sidebar-collapsed');try{localStorage.setItem('biotrop_sidebar_collapsed',document.body.classList.contains('biotrop-sidebar-collapsed')?'1':'0')}catch(_) {}};sb.appendChild(b)}try{if(localStorage.getItem('biotrop_sidebar_collapsed')==='1')document.body.classList.add('biotrop-sidebar-collapsed')}catch(_){}
  }
  function boot(){installStyle();let n=0;const t=setInterval(()=>{n++;restoreFamilies();installSidebar();if(n>80)clearInterval(t)},100);new MutationObserver(()=>{restoreFamilies();installSidebar()}).observe(document.body,{childList:true,subtree:true})}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();

/* Carrega o módulo PCM/Almoxarifado sem alterar a aplicação principal. */
(function(){
  function load(){if(document.querySelector('script[data-biotrop-pcm]'))return;const s=document.createElement('script');s.src='./pcm-module.js?v=2';s.async=true;s.dataset.biotropPcm='1';document.head.appendChild(s)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',load,{once:true});else load();
})();

/* FIX V3: carrega o módulo de treinamentos e corrige a ponte com o shell legado. */
(function(){
  function load(src, done){if(document.querySelector('script[src*="'+src+'"]')){done?.();return;}const s=document.createElement('script');s.src='./assets/js/'+src+'?v=3';s.async=false;s.onload=done;s.onerror=()=>console.error('[BIOTROP] Falha ao carregar '+src);document.body.appendChild(s)}
  function boot(){
    load('training-module-v2.js',()=>load('training-module-v2-fix.js',()=>load('training-runtime-fix-v3.js')));
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
