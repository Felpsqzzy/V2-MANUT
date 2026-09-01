(()=>{
  const boot=()=>{
    if(window.__BT_MODERN_V2)return;
    window.__BT_MODERN_V2=1;
    const $=(s,r=document)=>r.querySelector(s);
    const $$=(s,r=document)=>[...r.querySelectorAll(s)];
    const sb=()=>window.SB;
    let profile=null;

    const style=document.createElement('style');
    style.id='bt-modern-dashboard-v2-style';
    style.textContent=`
      .bt-home-dashboard{--bt-bg:#f4f8f6;--bt-surface:#fff;--bt-surface2:#f8fbfa;--bt-text:#123b35;--bt-muted:#718780;--bt-line:#e3eee9;--bt-primary:#087c67;--bt-primary2:#0aa88a;--bt-deep:#063f43;--bt-shadow:0 16px 45px rgba(3,55,49,.08);color:var(--bt-text);font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;animation:btPageIn .45s ease both}
      html.dark .bt-home-dashboard,body.dark .bt-home-dashboard,.dark .bt-home-dashboard{--bt-bg:#071b1c;--bt-surface:#0d2728;--bt-surface2:#102f30;--bt-text:#edf8f4;--bt-muted:#9ab5ae;--bt-line:#1b3c3d;--bt-shadow:0 18px 50px rgba(0,0,0,.22)}
      .bt-home-dashboard *{box-sizing:border-box}
      .bt-home-top{display:flex;align-items:center;justify-content:space-between;gap:18px;margin-bottom:22px}
      .bt-eyebrow{font-size:11px;font-weight:900;letter-spacing:.16em;text-transform:uppercase;color:var(--bt-primary2);margin-bottom:7px}
      .bt-home-top h1{margin:0;font-size:clamp(28px,3vw,42px);line-height:1.02;letter-spacing:-1.4px;color:var(--bt-text)}
      .bt-home-top p{margin:8px 0 0;color:var(--bt-muted);font-size:13px}
      .bt-live{display:inline-flex;align-items:center;gap:8px;padding:9px 12px;border:1px solid var(--bt-line);border-radius:999px;background:var(--bt-surface);font-size:11px;font-weight:800;color:var(--bt-muted);white-space:nowrap;box-shadow:var(--bt-shadow)}
      .bt-live i{width:8px;height:8px;border-radius:50%;background:#24c79d;box-shadow:0 0 0 5px rgba(36,199,157,.12);animation:btPulse 1.8s infinite}
      .bt-hero{position:relative;overflow:hidden;border-radius:26px;padding:28px 30px;margin-bottom:18px;background:linear-gradient(135deg,#063f43 0%,#075d58 52%,#0a8b70 100%);color:#fff;box-shadow:0 22px 55px rgba(2,65,58,.22)}
      .bt-hero:before,.bt-hero:after{content:"";position:absolute;border-radius:50%;pointer-events:none}.bt-hero:before{width:300px;height:300px;right:-90px;top:-180px;border:1px solid rgba(255,255,255,.16);box-shadow:0 0 0 45px rgba(255,255,255,.035),0 0 0 90px rgba(255,255,255,.02)}.bt-hero:after{width:150px;height:150px;left:45%;bottom:-115px;background:rgba(70,230,190,.13)}
      .bt-hero-inner{position:relative;z-index:1;display:flex;align-items:flex-end;justify-content:space-between;gap:24px}.bt-hero h2{margin:0 0 7px;font-size:24px;letter-spacing:-.7px}.bt-hero p{margin:0;color:#c8ebe2;font-size:13px;max-width:680px}.bt-hero-actions{display:flex;gap:9px;flex-wrap:wrap}.bt-hero-btn{border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.1);color:#fff;border-radius:12px;padding:10px 13px;font-weight:800;font-size:12px;cursor:pointer;backdrop-filter:blur(8px)}.bt-hero-btn:hover{background:rgba(255,255,255,.18)}
      .bt-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:13px;margin-bottom:18px}.bt-kpi{position:relative;overflow:hidden;background:var(--bt-surface);border:1px solid var(--bt-line);border-radius:18px;padding:18px;box-shadow:var(--bt-shadow);animation:btCardIn .55s ease both}.bt-kpi:nth-child(2){animation-delay:.05s}.bt-kpi:nth-child(3){animation-delay:.1s}.bt-kpi:nth-child(4){animation-delay:.15s}.bt-kpi-top{display:flex;align-items:center;justify-content:space-between;gap:8px}.bt-kpi small{font-size:10px;letter-spacing:.1em;text-transform:uppercase;font-weight:900;color:var(--bt-muted)}.bt-kpi-icon{width:34px;height:34px;border-radius:11px;display:grid;place-items:center;background:rgba(10,168,138,.1);color:var(--bt-primary2);font-weight:900}.bt-kpi strong{display:block;font-size:31px;letter-spacing:-1.3px;margin-top:10px;color:var(--bt-text)}.bt-kpi span{display:block;margin-top:2px;color:var(--bt-muted);font-size:11px}.bt-kpi .bt-trend{position:absolute;right:15px;bottom:15px;font-size:10px;font-weight:900;color:#20a986}
      .bt-grid{display:grid;grid-template-columns:minmax(0,1.65fr) minmax(300px,.9fr);gap:15px;margin-bottom:15px}.bt-card{background:var(--bt-surface);border:1px solid var(--bt-line);border-radius:20px;padding:20px;box-shadow:var(--bt-shadow);animation:btCardIn .55s ease both}.bt-card-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:15px}.bt-card h3{margin:0;font-size:15px;color:var(--bt-text);letter-spacing:-.2px}.bt-card p{margin:4px 0 0;color:var(--bt-muted);font-size:11px}.bt-card-badge{padding:6px 9px;border-radius:999px;background:var(--bt-surface2);color:var(--bt-muted);font-size:10px;font-weight:900}
      .bt-chart{height:230px;display:flex;align-items:stretch;gap:14px}.bt-yaxis{width:28px;display:flex;flex-direction:column;justify-content:space-between;color:var(--bt-muted);font-size:9px;padding:6px 0}.bt-plot{position:relative;flex:1;display:flex;align-items:flex-end;gap:clamp(8px,1.5vw,18px);padding:10px 4px 24px;border-bottom:1px solid var(--bt-line);background:linear-gradient(to bottom,transparent 24%,var(--bt-line) 25%,transparent 25%,transparent 49%,var(--bt-line) 50%,transparent 50%,transparent 74%,var(--bt-line) 75%,transparent 75%)}.bt-bar-col{height:100%;flex:1;min-width:24px;display:flex;align-items:flex-end;justify-content:center;position:relative}.bt-bar{width:min(42px,72%);height:var(--h);min-height:4px;border-radius:9px 9px 3px 3px;background:linear-gradient(180deg,#19c99f,#087c67);box-shadow:0 8px 18px rgba(8,124,103,.16);transform-origin:bottom;animation:btBarRise .7s cubic-bezier(.2,.8,.2,1) both}.bt-bar-col b{position:absolute;bottom:-20px;font-size:9px;color:var(--bt-muted);font-weight:800}.bt-bar-col em{position:absolute;bottom:calc(var(--h) + 5px);font-size:9px;color:var(--bt-text);font-style:normal;font-weight:900;opacity:.9}
      .bt-donut-wrap{height:230px;display:grid;place-items:center}.bt-donut{width:165px;height:165px;border-radius:50%;background:conic-gradient(#0aa88a var(--p),#e6efec 0);position:relative;display:grid;place-items:center;box-shadow:inset 0 0 0 1px rgba(0,0,0,.02)}.dark .bt-donut,html.dark .bt-donut{background:conic-gradient(#0aa88a var(--p),#183536 0)}.bt-donut:after{content:"";width:105px;height:105px;border-radius:50%;background:var(--bt-surface);box-shadow:0 6px 18px rgba(0,0,0,.06);position:absolute}.bt-donut-center{position:relative;z-index:2;text-align:center}.bt-donut-center strong{display:block;font-size:28px;letter-spacing:-1px}.bt-donut-center span{font-size:9px;color:var(--bt-muted);font-weight:800;text-transform:uppercase;letter-spacing:.08em}.bt-legend{display:flex;justify-content:center;gap:14px;margin-top:2px;font-size:10px;color:var(--bt-muted);font-weight:800}.bt-legend i{display:inline-block;width:7px;height:7px;border-radius:50%;background:#0aa88a;margin-right:5px}.bt-legend i.muted{background:#b8c8c3}
      .bt-bottom{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(300px,.8fr);gap:15px}.bt-activity{display:flex;flex-direction:column;gap:2px}.bt-activity-row{display:grid;grid-template-columns:32px 1fr auto;align-items:center;gap:10px;padding:11px 4px;border-bottom:1px solid var(--bt-line)}.bt-activity-row:last-child{border-bottom:0}.bt-activity-dot{width:28px;height:28px;border-radius:10px;background:rgba(10,168,138,.1);color:#0aa88a;display:grid;place-items:center;font-size:11px;font-weight:900}.bt-activity-main strong{display:block;font-size:11px;color:var(--bt-text)}.bt-activity-main span{display:block;color:var(--bt-muted);font-size:10px;margin-top:2px}.bt-activity-time{font-size:9px;color:var(--bt-muted);font-weight:800;white-space:nowrap}
      .bt-queue{display:flex;flex-direction:column;gap:9px}.bt-queue-row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px;border:1px solid var(--bt-line);background:var(--bt-surface2);border-radius:13px}.bt-queue-left{min-width:0}.bt-queue-left strong{display:block;font-size:11px;color:var(--bt-text)}.bt-queue-left span{display:block;font-size:9px;color:var(--bt-muted);margin-top:3px}.bt-status{padding:5px 8px;border-radius:999px;background:#fff0d7;color:#936000;font-size:9px;font-weight:900;white-space:nowrap}.dark .bt-status{background:#3b2e18;color:#f2c46d}.bt-empty{padding:26px 10px;text-align:center;color:var(--bt-muted);font-size:11px}
      .bt-footer-line{margin-top:15px;color:var(--bt-muted);font-size:9px;text-align:right}
      .bt-notif{position:fixed;right:22px;top:18px;z-index:99990;width:44px;height:44px;border:1px solid var(--bt-line);background:var(--bt-surface);border-radius:14px;box-shadow:0 12px 35px rgba(0,60,65,.16);cursor:pointer;color:var(--bt-deep)}.bt-dot{position:absolute;right:4px;top:3px;width:9px;height:9px;border-radius:50%;background:#ef6a5b;display:none;box-shadow:0 0 0 3px var(--bt-surface)}
      @keyframes btPageIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}@keyframes btCardIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}@keyframes btBarRise{from{transform:scaleY(.15);opacity:.2}to{transform:scaleY(1);opacity:1}}@keyframes btPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.35)}}
      @media(max-width:1050px){.bt-kpis{grid-template-columns:repeat(2,1fr)}.bt-grid,.bt-bottom{grid-template-columns:1fr}.bt-hero-inner{align-items:flex-start;flex-direction:column}}
      @media(max-width:680px){.bt-home-top{align-items:flex-start;flex-direction:column}.bt-live{align-self:flex-start}.bt-hero{padding:22px}.bt-kpis{grid-template-columns:1fr 1fr;gap:9px}.bt-kpi{padding:14px}.bt-kpi strong{font-size:25px}.bt-card{padding:15px}.bt-chart{height:200px}.bt-notif{right:12px;top:12px}.bt-hero-actions{width:100%}.bt-hero-btn{flex:1}.bt-home-top h1{font-size:30px}}
    `;
    document.head.appendChild(style);

    async function getProfile(){try{const s=await sb()?.auth?.getSession();const u=s?.data?.session?.user;if(!u)return null;const r=await sb().from('profiles').select('*').eq('id',u.id).maybeSingle();profile=r.data||{};return profile}catch{return null}}
    function role(){return String(profile?.app_role||profile?.role_code||profile?.role||'').toLowerCase()}
    function isTech(){return role()==='tecnico'||role()==='viewer'}
    function main(){return document.querySelector('.main-area')||document.querySelector('main')||document.querySelector('#app')}
    function homeActive(){const active=$('.nav-item.active');const txt=(active?.innerText||'').toLowerCase();return txt.includes('início')||txt.includes('inicio')||txt.includes('dashboard')||location.hash==='#inicio'}
    async function q(table,select='*',opts={}){try{let query=sb().from(table).select(select);if(opts.limit)query=query.limit(opts.limit);if(opts.order)query=query.order(opts.order,{ascending:false});const r=await query;return r.error?[]:(r.data||[])}catch{return[]}}
    async function loadData(){const [sci,scm,read,users]=await Promise.all([q('service_requests','id,status,created_at,requester_name,description',{limit:500}),q('purchase_requests','id,status,created_at,requester_name,description',{limit:500}),q('utility_readings','id,created_at,reading_value,meter_id,created_by',{limit:500,order:'created_at'}),q('profiles','id,name,email,app_role,active',{limit:500})]);return{sci,scm,read,users}}
    function pending(items){return items.filter(x=>/pend|aguard|analise|revis|aprova/i.test(String(x.status||'')))}
    function monthSeries(items){const now=new Date();return [...Array(6)].map((_,i)=>{const d=new Date(now.getFullYear(),now.getMonth()-5+i,1);const key=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;return{label:d.toLocaleDateString('pt-BR',{month:'short'}).replace('.',''),n:items.filter(x=>String(x.created_at||'').slice(0,7)===key).length}})}
    function fmtDate(v){if(!v)return '—';try{return new Date(v).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})}catch{return '—'}}
    function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
    function greeting(){const h=new Date().getHours();return h<12?'Bom dia':h<18?'Boa tarde':'Boa noite'}

    async function dashboard(){
      if(isTech()||!homeActive())return;
      const m=main();if(!m)return;
      if(m.querySelector('.bt-home-dashboard'))return;
      const d=await loadData();
      if(!homeActive())return;
      const all=[...d.sci.map(x=>({...x,w:'SCI'})),...d.scm.map(x=>({...x,w:'SCM'}))];
      const pSci=pending(d.sci),pScm=pending(d.scm),pend=[...pSci.map(x=>({...x,w:'SCI'})),...pScm.map(x=>({...x,w:'SCM'}))];
      const months=monthSeries(all),max=Math.max(1,...months.map(x=>x.n));
      const total=all.length, done=Math.max(0,total-pend.length),pct=total?Math.round(done/total*100):0;
      const recent=[...d.read.map(x=>({...x,w:'Apontamento'})),...all.map(x=>({...x,w:x.w}))].sort((a,b)=>new Date(b.created_at||0)-new Date(a.created_at||0)).slice(0,6);
      const userName=profile?.name||profile?.email?.split('@')[0]||'Gestor';
      m.innerHTML=`<div class="bt-home-dashboard">
        <div class="bt-home-top"><div><div class="bt-eyebrow">BIOTROP · CENTRO DE GESTÃO</div><h1>${greeting()}, ${esc(userName.split(' ')[0])}.</h1><p>Visão executiva da manutenção, solicitações e apontamentos em um único lugar.</p></div><div class="bt-live"><i></i> Dados atualizados agora</div></div>
        <section class="bt-hero"><div class="bt-hero-inner"><div><h2>Operação sob controle.</h2><p>Acompanhe o fluxo de SCI, SCM e Utilidades sem navegar por dezenas de telas.</p></div><div class="bt-hero-actions"><button class="bt-hero-btn" data-go="almox">Almoxarifado</button><button class="bt-hero-btn" data-go="util">Utilidades</button><button class="bt-hero-btn" data-go="pcm">PCM</button></div></div></section>
        <div class="bt-kpis">
          <div class="bt-kpi"><div class="bt-kpi-top"><small>SCI</small><div class="bt-kpi-icon">S</div></div><strong>${d.sci.length}</strong><span>solicitações registradas</span><b class="bt-trend">${pSci.length} pendentes</b></div>
          <div class="bt-kpi"><div class="bt-kpi-top"><small>SCM</small><div class="bt-kpi-icon">C</div></div><strong>${d.scm.length}</strong><span>compras registradas</span><b class="bt-trend">${pScm.length} pendentes</b></div>
          <div class="bt-kpi"><div class="bt-kpi-top"><small>Utilidades</small><div class="bt-kpi-icon">U</div></div><strong>${d.read.length}</strong><span>apontamentos registrados</span><b class="bt-trend">últimos registros</b></div>
          <div class="bt-kpi"><div class="bt-kpi-top"><small>Usuários</small><div class="bt-kpi-icon">P</div></div><strong>${d.users.length}</strong><span>perfis ativos no sistema</span><b class="bt-trend">base corporativa</b></div>
        </div>
        <div class="bt-grid">
          <section class="bt-card"><div class="bt-card-head"><div><h3>Movimentação das solicitações</h3><p>SCI + SCM criados nos últimos 6 meses</p></div><span class="bt-card-badge">${total} no total</span></div><div class="bt-chart"><div class="bt-yaxis"><span>${max}</span><span>${Math.round(max*.66)}</span><span>${Math.round(max*.33)}</span><span>0</span></div><div class="bt-plot">${months.map(x=>`<div class="bt-bar-col" style="--h:${Math.max(5,Math.round(x.n/max*175))}px"><em>${x.n}</em><div class="bt-bar"></div><b>${esc(x.label)}</b></div>`).join('')}</div></div></section>
          <section class="bt-card"><div class="bt-card-head"><div><h3>Saúde da fila</h3><p>Itens concluídos x aguardando análise</p></div><span class="bt-card-badge">${pct}% concluído</span></div><div class="bt-donut-wrap"><div><div class="bt-donut" style="--p:${pct}%"><div class="bt-donut-center"><strong>${pct}%</strong><span>concluído</span></div></div><div class="bt-legend"><span><i></i>${done} concluídos</span><span><i class="muted"></i>${pend.length} pendentes</span></div></div></div></section>
        </div>
        <div class="bt-bottom">
          <section class="bt-card"><div class="bt-card-head"><div><h3>Atividade recente</h3><p>Últimos movimentos registrados no sistema</p></div></div><div class="bt-activity">${recent.length?recent.map(x=>`<div class="bt-activity-row"><div class="bt-activity-dot">${x.w==='Apontamento'?'U':x.w[0]}</div><div class="bt-activity-main"><strong>${esc(x.w)}${x.description?' · '+esc(String(x.description).slice(0,55)):''}</strong><span>${x.requester_name?esc(x.requester_name):x.reading_value!=null?'Leitura registrada':'Registro operacional'}</span></div><div class="bt-activity-time">${fmtDate(x.created_at)}</div></div>`).join(''):`<div class="bt-empty">Nenhuma atividade encontrada.</div>`}</div></section>
          <section class="bt-card"><div class="bt-card-head"><div><h3>Fila de aprovação</h3><p>O que precisa da atenção da gestão</p></div><span class="bt-card-badge">${pend.length} itens</span></div><div class="bt-queue">${pend.slice(0,5).map(x=>`<div class="bt-queue-row"><div class="bt-queue-left"><strong>${esc(x.w)} · ${esc(x.description||'Solicitação')}</strong><span>${fmtDate(x.created_at)}</span></div><span class="bt-status">Aguardando</span></div>`).join('')||'<div class="bt-empty">Tudo em dia. Nenhuma aprovação pendente.</div>'}</div></section>
        </div>
        <div class="bt-footer-line">Fonte: Supabase · painel executivo da manutenção</div>
      </div>`;
      $$('.bt-hero-btn',m).forEach(b=>b.addEventListener('click',()=>{const target=b.dataset.go;const candidates=$$('.nav-item');const n=candidates.find(x=>(x.innerText||'').toLowerCase().includes(target==='almox'?'almoxarifado':target==='util'?'utilidades':'pcm'));n?.click()}));
    }

    async function notifications(){
      if(!profile)return;
      try{const list=await sb().from('app_notifications').select('*').eq('user_id',profile.id).is('read_at',null).order('created_at',{ascending:false}).limit(20);const old=$('.bt-notif');old?.remove();const btn=document.createElement('button');btn.className='bt-notif';btn.title='Notificações';btn.innerHTML='◉<i class="bt-dot"></i>';document.body.appendChild(btn);const dot=$('.bt-dot',btn);dot.style.display=(list.data||[]).length?'block':'none';btn.onclick=()=>{const rows=list.data||[];alert(rows.length?rows.map(x=>`${x.title}\n${x.body||''}`).join('\n\n'):'Nenhuma notificação pendente');if(rows.length)sb().from('app_notifications').update({read_at:new Date().toISOString()}).eq('user_id',profile.id).is('read_at',null).then(()=>dot.style.display='none')};}catch{}
    }

    async function start(){
      for(let i=0;i<50&&!sb();i++)await new Promise(r=>setTimeout(r,250));
      if(!sb())return;
      await getProfile();
      if(isTech())return;
      notifications();
      let timer=0;
      const render=()=>{clearTimeout(timer);timer=setTimeout(()=>dashboard(),250)};
      const obs=new MutationObserver(()=>{if(homeActive()&&!$('.bt-home-dashboard'))render()});
      obs.observe(document.body,{childList:true,subtree:true});
      setTimeout(render,900);
      window.addEventListener('biotrop:refresh',()=>{if(homeActive()){const old=$('.bt-home-dashboard');old?.remove();render()}});
    }
    start();
  };
  boot();
})();
