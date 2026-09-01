window.BIOTROP_CONFIG = Object.freeze({
  supabaseUrl: 'https://hoikliqttxqdsyyjdnul.supabase.co',
  supabaseAnonKey: 'sb_publishable_PeiXiPCMENjp9ajwW-EbJw_IohMAt1h',
  apiBaseUrl: window.location.origin + '/api'
});

(function () {
  'use strict';
  let client = null, recoveryShown = false;
  const escHtml = v => String(v ?? '').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'})[c]);
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
  const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
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

/* BIOTROP MODERN UI V1 — visual refresh only, no workflow/database changes. */
(function(){
  'use strict';
  const STYLE_ID='biotrop-modern-ui-v1';
  const inject=()=>{
    if(document.getElementById(STYLE_ID))return;
    const s=document.createElement('style');s.id=STYLE_ID;s.textContent=`
      :root{--ui-bg:#f5f8f7;--ui-surface:#fff;--ui-text:#173b38;--ui-muted:#6f807b;--ui-border:#e1ebe8;--ui-brand:#087c67;--ui-brand-2:#0b5d5d;--ui-shadow:0 14px 40px rgba(15,54,48,.07);--ui-radius:20px}
      html,body{background:var(--ui-bg)!important;color:var(--ui-text)}body{font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;letter-spacing:-.01em}
      .main-area{background:radial-gradient(circle at 92% 0%,rgba(65,194,153,.08),transparent 28%),var(--ui-bg)!important}
      .sidebar{background:linear-gradient(180deg,#073f42 0%,#06383b 100%)!important;border-right:0!important;box-shadow:8px 0 34px rgba(0,30,32,.12)!important}
      .sidebar-brand{border-bottom:1px solid rgba(255,255,255,.08)!important}.nav-item{border-radius:12px!important;margin:4px 8px!important;color:rgba(255,255,255,.74)!important;transition:transform .18s ease,background .18s ease,color .18s ease!important}.nav-item:hover{background:rgba(255,255,255,.08)!important;color:#fff!important;transform:translateX(2px)}.nav-item.active{background:linear-gradient(135deg,rgba(52,191,151,.24),rgba(255,255,255,.08))!important;color:#fff!important;box-shadow:inset 3px 0 0 #54d6ad}
      .user-chip{border-top:1px solid rgba(255,255,255,.08)!important}
      .card,.panel,.dashboard-card,.metric-card,.stat-card,.module-card,.section-card,.table-card,.form-card,.training-card,.sci-card,.scm-card,.utility-meter-card,.almox-card{border:1px solid var(--ui-border)!important;border-radius:var(--ui-radius)!important;background:var(--ui-surface)!important;box-shadow:var(--ui-shadow)!important}
      button,.btn,.action-btn{transition:transform .18s ease,box-shadow .18s ease,filter .18s ease!important}.btn:hover,.action-btn:hover{transform:translateY(-1px);filter:saturate(1.04)}
      input,select,textarea{border-radius:12px!important;border-color:#d8e5e1!important;background:#fff!important}input:focus,select:focus,textarea:focus{border-color:#54b99b!important;box-shadow:0 0 0 4px rgba(84,185,155,.12)!important;outline:none!important}
      h1,h2,h3{letter-spacing:-.035em}.page-title,.dashboard-title{font-weight:850!important}.muted,.text-muted,.subtitle{color:var(--ui-muted)!important}
      .table-wrap,.table-container{border:1px solid var(--ui-border);border-radius:16px;overflow:auto;background:#fff;box-shadow:0 8px 24px rgba(15,54,48,.04)}table{border-collapse:separate!important;border-spacing:0!important}thead th{background:#f6faf8!important;color:#48625c!important;font-size:11px!important;text-transform:uppercase;letter-spacing:.08em}tbody tr{transition:background .15s ease}tbody tr:hover{background:#f7fbf9!important}
      .modal-backdrop,.modal-overlay{backdrop-filter:blur(10px)!important;background:rgba(4,32,34,.38)!important}.modal,.dialog,.modal-card{border:1px solid rgba(255,255,255,.6)!important;border-radius:24px!important;box-shadow:0 30px 100px rgba(0,0,0,.22)!important}
      .badge,.status-badge,.chip{border-radius:999px!important}
      .empty-state{border:1px dashed #cbdad5!important;border-radius:18px!important;background:rgba(255,255,255,.6)!important}
      @keyframes biotropFadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
      .main-area>*,.main-area .card,.main-area .panel,.main-area .dashboard-card{animation:biotropFadeUp .45s ease both}
      .main-area .card:nth-child(2),.main-area .panel:nth-child(2){animation-delay:.04s}.main-area .card:nth-child(3),.main-area .panel:nth-child(3){animation-delay:.08s}.main-area .card:nth-child(4),.main-area .panel:nth-child(4){animation-delay:.12s}
      .login-page,.login-screen{background:radial-gradient(circle at 20% 10%,rgba(71,211,166,.15),transparent 30%),linear-gradient(145deg,#f6faf8,#eaf5f1)!important}
      .login-card{border:1px solid rgba(255,255,255,.8)!important;border-radius:28px!important;box-shadow:0 30px 90px rgba(0,54,55,.14)!important;backdrop-filter:blur(14px)}
      @media(max-width:768px){.main-area{background:var(--ui-bg)!important}.card,.panel,.dashboard-card,.metric-card,.module-card,.section-card{border-radius:16px!important}.main-area{padding-left:12px!important;padding-right:12px!important}}
      /* Dark mode: consistent surfaces and contrast, without changing the existing toggle/logic. */
      body.v12-dark,body.dark,body.dark-mode{--ui-bg:#0b1718;--ui-surface:#122224;--ui-text:#e8f2ef;--ui-muted:#9bb0aa;--ui-border:#284044;--ui-brand:#57d4ad;--ui-brand-2:#69cfc0;--ui-shadow:0 18px 50px rgba(0,0,0,.28);background:var(--ui-bg)!important;color:var(--ui-text)!important}
      body.v12-dark .main-area,body.dark .main-area,body.dark-mode .main-area{background:radial-gradient(circle at 92% 0%,rgba(63,201,159,.08),transparent 30%),var(--ui-bg)!important}
      body.v12-dark .card,body.v12-dark .panel,body.v12-dark .dashboard-card,body.v12-dark .metric-card,body.v12-dark .module-card,body.v12-dark .section-card,body.v12-dark .table-card,body.v12-dark .form-card,body.v12-dark .training-card,body.v12-dark .sci-card,body.v12-dark .scm-card,body.v12-dark .utility-meter-card,body.v12-dark .almox-card,body.dark .card,body.dark .panel,body.dark .dashboard-card,body.dark .metric-card,body.dark .module-card,body.dark .section-card,body.dark .table-card,body.dark .form-card,body.dark .training-card,body.dark .sci-card,body.dark .scm-card,body.dark .utility-meter-card,body.dark .almox-card,body.dark-mode .card,body.dark-mode .panel,body.dark-mode .dashboard-card,body.dark-mode .metric-card,body.dark-mode .module-card,body.dark-mode .section-card,body.dark-mode .table-card,body.dark-mode .form-card,body.dark-mode .training-card,body.dark-mode .sci-card,body.dark-mode .scm-card,body.dark-mode .utility-meter-card,body.dark-mode .almox-card{background:var(--ui-surface)!important;border-color:var(--ui-border)!important;color:var(--ui-text)!important;box-shadow:var(--ui-shadow)!important}
      body.v12-dark input,body.v12-dark select,body.v12-dark textarea,body.dark input,body.dark select,body.dark textarea,body.dark-mode input,body.dark-mode select,body.dark-mode textarea{background:#0f1d1f!important;color:#e8f2ef!important;border-color:#30484b!important}body.v12-dark input::placeholder,body.dark input::placeholder,body.dark-mode input::placeholder{color:#738983!important}
      body.v12-dark .table-wrap,body.v12-dark .table-container,body.dark .table-wrap,body.dark .table-container,body.dark-mode .table-wrap,body.dark-mode .table-container{background:#101e20!important;border-color:#2a4245!important}body.v12-dark thead th,body.dark thead th,body.dark-mode thead th{background:#172b2d!important;color:#a8bcb7!important}body.v12-dark tbody tr:hover,body.dark tbody tr:hover,body.dark-mode tbody tr:hover{background:#182b2d!important}
      body.v12-dark .empty-state,body.dark .empty-state,body.dark-mode .empty-state{background:#101e20!important;border-color:#365054!important;color:#a8bcb7!important}
      body.v12-dark .login-page,body.v12-dark .login-screen,body.dark .login-page,body.dark .login-screen,body.dark-mode .login-page,body.dark-mode .login-screen{background:radial-gradient(circle at 20% 10%,rgba(63,201,159,.10),transparent 32%),linear-gradient(145deg,#091516,#0d2022)!important}
      @media(prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.01ms!important;transition-duration:.01ms!important}}
    `;document.head.appendChild(s);
  };
  const boot=()=>{inject();document.documentElement.classList.add('biotrop-modern');};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
