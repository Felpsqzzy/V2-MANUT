(()=>{
  'use strict';
  if(window.__BIOTROP_EXECUTIVE_LIVE_V4)return;
  window.__BIOTROP_EXECUTIVE_LIVE_V4=true;

  const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const norm=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
  const isFinalStatus=s=>/aprovad|rejeit|recus|cancel|conclu/i.test(norm(s));
  const fmtNum=v=>Number(v||0).toLocaleString('pt-BR',{maximumFractionDigits:2});
  const fmtDate=v=>{try{return new Date(v).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})}catch{return '—'}};
  const monthKey=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
  const monthLabel=d=>d.toLocaleDateString('pt-BR',{month:'short'}).replace('.','');
  const sb=()=>window.SB;

  // Evita o flash da tela antiga enquanto a sessão e os dados reais carregam.
  function makeVeil(){
    if($('#biotrop-live-veil'))return;
    const v=document.createElement('div');v.id='biotrop-live-veil';
    v.innerHTML='<div class="blv-brand">BIOTROP</div><div class="blv-sub">Carregando Control Room...</div>';
    document.documentElement.classList.add('biotrop-live-loading');
    document.body.appendChild(v);
  }
  function removeVeil(){
    const v=$('#biotrop-live-veil'); if(v){v.classList.add('out');setTimeout(()=>v.remove(),250)}
    document.documentElement.classList.remove('biotrop-live-loading');
  }

  const style=document.createElement('style');style.id='biotrop-live-v4-style';style.textContent=`
  #biotrop-live-veil{position:fixed;inset:0;z-index:2147483647;background:#003c41;color:#fff;display:grid;place-items:center;align-content:center;gap:7px;font-family:Segoe UI,system-ui,sans-serif;opacity:1;transition:opacity .25s ease}.biotrop-live-loading body>*:not(#biotrop-live-veil){visibility:hidden}.blv-brand{font-weight:900;letter-spacing:.24em;font-size:27px}.blv-sub{font-size:11px;color:#a9d9c4;letter-spacing:.08em;text-transform:uppercase}.biotrop-live-loading{background:#003c41}.blv-brand:after{content:'';display:block;width:46px;height:3px;border-radius:99px;background:#21c8a0;margin:12px auto 0;animation:blvPulse 1.1s infinite}@keyframes blvPulse{50%{opacity:.28;transform:scaleX(.65)}}
  .biotrop-live-v4{--bg:#f4f8f6;--surface:#fff;--surface2:#f8fbfa;--ink:#123934;--muted:#73877f;--line:#dfebe6;--brand:#063f43;--accent:#13a982;--accent2:#42dcb5;--warning:#d89b32;--danger:#dc625c;background:var(--bg);color:var(--ink);border-radius:24px;padding:25px;min-height:calc(100vh - 64px);font-family:Inter,Segoe UI,system-ui,sans-serif;box-sizing:border-box}.dark .biotrop-live-v4,.theme-dark .biotrop-live-v4,html.dark .biotrop-live-v4{--bg:#07191a;--surface:#0d2526;--surface2:#112d2f;--ink:#eef8f5;--muted:#9fb8b1;--line:#1d3d3e;--brand:#062a2d;--accent:#24c9a0;--accent2:#53e4bd;--warning:#f0bd63;--danger:#ff877e}.biotrop-live-v4 *{box-sizing:border-box}.bl-head{display:flex;justify-content:space-between;align-items:flex-end;gap:18px;margin-bottom:16px}.bl-over{font-size:10px;font-weight:900;letter-spacing:.18em;text-transform:uppercase;color:var(--accent2);margin-bottom:7px}.bl-head h1{margin:0;font-size:clamp(28px,3vw,42px);line-height:1;letter-spacing:-1.5px}.bl-head p{margin:8px 0 0;font-size:11px;color:var(--muted)}.bl-live{display:flex;align-items:center;gap:7px;background:var(--surface);border:1px solid var(--line);padding:9px 12px;border-radius:999px;font-size:9px;font-weight:900;color:var(--muted);white-space:nowrap}.bl-live i{width:7px;height:7px;border-radius:50%;background:#22d5a5;box-shadow:0 0 0 5px rgba(34,213,165,.13);animation:blLive 1.8s infinite}@keyframes blLive{50%{transform:scale(1.45)}}
  .bl-hero{background:linear-gradient(125deg,#043e42,#0a6b61 62%,#0c9177);color:#fff;border-radius:20px;padding:22px 24px;display:flex;justify-content:space-between;align-items:flex-end;gap:18px;box-shadow:0 18px 44px rgba(3,67,61,.17);overflow:hidden;position:relative}.bl-hero:after{content:'';position:absolute;width:230px;height:230px;border:1px solid rgba(255,255,255,.12);border-radius:50%;right:-60px;top:-160px;box-shadow:0 0 0 34px rgba(255,255,255,.025),0 0 0 70px rgba(255,255,255,.02)}.bl-hero>*{position:relative;z-index:1}.bl-hero h2{margin:0;font-size:21px}.bl-hero p{margin:6px 0 0;color:#c5ebe3;font-size:11px}.bl-actions{display:flex;gap:8px;flex-wrap:wrap}.bl-btn{border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.09);color:#fff;border-radius:10px;padding:9px 12px;font-size:10px;font-weight:900;cursor:pointer}.bl-btn:hover{background:rgba(255,255,255,.16)}
  .bl-filterbar{display:flex;gap:9px;flex-wrap:wrap;align-items:center;margin:14px 0}.bl-select{border:1px solid var(--line);background:var(--surface);color:var(--ink);border-radius:10px;padding:10px 12px;font-size:11px;font-weight:800;min-width:170px;outline:none}.bl-select:focus{border-color:var(--accent)}.bl-filter-note{margin-left:auto;color:var(--muted);font-size:9px;font-weight:800}
  .bl-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}.bl-kpi{background:var(--surface);border:1px solid var(--line);border-radius:16px;padding:15px;min-height:112px;box-shadow:0 8px 24px rgba(12,56,50,.045);animation:blUp .45s ease both}.bl-kpi:nth-child(2){animation-delay:.05s}.bl-kpi:nth-child(3){animation-delay:.1s}.bl-kpi:nth-child(4){animation-delay:.15s}.bl-kpi small{display:block;font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:.1em;color:var(--muted)}.bl-kpi strong{display:block;margin-top:9px;font-size:28px;letter-spacing:-1.1px}.bl-kpi span{display:block;margin-top:4px;font-size:9px;color:var(--muted)}.bl-kpi em{display:inline-block;margin-top:8px;font-style:normal;font-size:9px;font-weight:900;color:var(--accent)}
  .bl-grid2{display:grid;grid-template-columns:minmax(0,1.6fr) minmax(280px,.85fr);gap:12px;margin-top:12px}.bl-card{background:var(--surface);border:1px solid var(--line);border-radius:17px;padding:17px;box-shadow:0 8px 24px rgba(12,56,50,.045)}.bl-cardhead{display:flex;justify-content:space-between;align-items:flex-start;gap:10px;margin-bottom:10px}.bl-cardhead h3{margin:0;font-size:13px}.bl-cardhead p{margin:4px 0 0;color:var(--muted);font-size:9px}.bl-pill{background:var(--surface2);border:1px solid var(--line);border-radius:999px;padding:5px 8px;font-size:8px;font-weight:900;color:var(--muted)}
  .bl-chart{width:100%;height:235px;display:block}.bl-chart text{font:700 9px Inter,Segoe UI,sans-serif;fill:var(--muted)}.bl-gridline{stroke:var(--line);stroke-width:1}.bl-bar{fill:url(#blg);animation:blBar .7s cubic-bezier(.2,.8,.2,1) both;transform-origin:bottom}@keyframes blBar{from{transform:scaleY(.03);opacity:.2}to{transform:scaleY(1);opacity:1}}.bl-line{fill:none;stroke:var(--accent);stroke-width:3;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:900;stroke-dashoffset:900;animation:blLine 1.1s ease .1s forwards}@keyframes blLine{to{stroke-dashoffset:0}}.bl-point{fill:var(--surface);stroke:var(--accent);stroke-width:3}
  .bl-approval{display:grid;grid-template-columns:1fr 1fr;gap:9px}.bl-approvalbox{border:1px solid var(--line);background:var(--surface2);border-radius:14px;padding:13px}.bl-approvalbox small{font-size:9px;font-weight:900;color:var(--muted);text-transform:uppercase;letter-spacing:.08em}.bl-approvalbox strong{display:block;margin-top:7px;font-size:30px;letter-spacing:-1px}.bl-approvalbox span{display:block;margin-top:3px;font-size:8px;color:var(--muted)}.bl-approvalbox.pending strong{color:var(--warning)}
  .bl-utilities{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.bl-u{padding:12px;border:1px solid var(--line);border-radius:13px;background:var(--surface2);overflow:hidden}.bl-u small{font-size:8px;font-weight:900;text-transform:uppercase;letter-spacing:.08em;color:var(--muted)}.bl-u strong{display:block;margin-top:7px;font-size:22px}.bl-u span{display:block;font-size:8px;color:var(--muted);margin-top:3px}.bl-u b{display:block;font-size:8px;color:var(--accent);margin-top:8px}
  .bl-camm{margin-top:12px}.bl-camm-table{width:100%;border-collapse:collapse;font-size:9px}.bl-camm-table th{text-align:left;color:var(--muted);font-size:8px;text-transform:uppercase;letter-spacing:.05em;padding:9px 7px;border-bottom:1px solid var(--line)}.bl-camm-table td{padding:10px 7px;border-bottom:1px solid var(--line)}.bl-camm-table tr:last-child td{border-bottom:0}.bl-camm-name{font-weight:900;color:var(--ink)}.bl-camm-tag{display:inline-block;padding:4px 7px;background:rgba(20,190,153,.1);color:var(--accent);border-radius:999px;font-weight:900;font-size:8px}.bl-muted{color:var(--muted)}
  .bl-recent{display:grid;gap:1px}.bl-row{display:grid;grid-template-columns:30px 1fr auto;gap:9px;align-items:center;padding:9px 2px;border-bottom:1px solid var(--line)}.bl-row:last-child{border-bottom:0}.bl-icon{width:30px;height:30px;border-radius:9px;display:grid;place-items:center;background:rgba(20,190,153,.1);color:var(--accent);font-size:9px;font-weight:900}.bl-row strong{display:block;font-size:9px}.bl-row span{display:block;margin-top:3px;font-size:8px;color:var(--muted)}.bl-time{font-size:8px;font-weight:900;color:var(--muted);white-space:nowrap}
  .bl-empty{text-align:center;color:var(--muted);padding:22px;font-size:9px}.bl-foot{text-align:right;margin-top:10px;color:var(--muted);font-size:8px}
  @keyframes blUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
  @media(max-width:1120px){.bl-kpis{grid-template-columns:repeat(2,1fr)}.bl-grid2{grid-template-columns:1fr}.bl-hero{align-items:flex-start;flex-direction:column}.bl-filter-note{margin-left:0}}@media(max-width:700px){.biotrop-live-v4{padding:13px;border-radius:16px}.bl-kpis{grid-template-columns:1fr 1fr}.bl-kpi{min-height:100px;padding:12px}.bl-kpi strong{font-size:23px}.bl-approval{grid-template-columns:1fr}.bl-utilities{grid-template-columns:1fr}.bl-select{min-width:0;width:100%}.bl-chart{height:210px}.bl-camm-table{font-size:8px}.bl-camm-table th,.bl-camm-table td{padding:8px 4px}}
  `;document.head.appendChild(style);

  let lastProfile=null,lastData=null,currentCamm='__ALL__',currentUtility='__ALL__',mounted=false,refreshTimer=null;

  async function getProfile(){
    try{const s=await sb()?.auth?.getSession();const u=s?.data?.session?.user;if(!u)return null;const r=await sb().from('profiles').select('id,name,email,role_code,app_role,active').eq('id',u.id).maybeSingle();return r.data||{id:u.id,email:u.email||'',role_code:'tecnico',app_role:'tecnico'};}catch{return null}
  }
  function isAdmin(p){return norm(p?.role_code)==='admin'||norm(p?.app_role)==='admin'}

  async function safe(table,select,limit=1000){try{const q=await sb().from(table).select(select).limit(limit);return q.error?[]:(q.data||[])}catch{return[]}}
  async function loadData(admin){
    const tasks=[
      safe('utility_meters','id,code,name,utility_type,location,unit,initial_reading,active',1000),
      safe('utility_readings','id,meter_id,user_id,reading_value,previous_reading,consumption,reading_date,server_timestamp,created_at,status,active,deleted_at',2000),
      safe('service_requests','id,request_number,status,created_at,description,requester_id',1000),
      safe('purchase_requests','id,code,status,created_at,description,requester_id',1000)
    ];
    if(admin)tasks.push(safe('profiles','id,name,email,role_code,app_role,active,is_active',1000));
    const [meters,readings,sci,scm,profiles]=await Promise.all(tasks);
    return {meters,readings,sci,scm,profiles:admin?(profiles||[]):[]};
  }

  function cammOf(m){
    const s=`${m?.location||''} ${m?.code||''} ${m?.name||''}`;
    const hit=s.match(/c\.?\s*log|c-?log|camm\s*\d+/i);return hit?hit[0].replace(/\s+/g,' ').toUpperCase().replace('C. LOG','C. LOG'):'Outros';
  }
  function utilityLabel(v){const n=norm(v);if(n==='agua')return'Água';if(n==='gas'||n==='gás')return'Gás';if(n==='energia')return'Energia';if(n==='horimetro'||n==='horímetro')return'Horímetro';return v||'Outros'}
  function calcRows(d){
    const meters=d.meters.filter(m=>m.active!==false&&!m.deleted_at);
    const meterMap=new Map(meters.map(m=>[m.id,m]));
    const readings=d.readings.filter(r=>r.active!==false&&!r.deleted_at).map(r=>{const m=meterMap.get(r.meter_id)||{};return {...r,meter:m,camm:cammOf(m),utility:utilityLabel(m.utility_type)}}).sort((a,b)=>new Date(a.reading_date||a.created_at)-new Date(b.reading_date||b.created_at));
    const fixed=[];const last={};
    readings.forEach(r=>{
      let prev=r.previous_reading;
      if(prev==null&&last[r.meter_id]!=null)prev=last[r.meter_id];
      let cons=r.consumption;
      if(cons==null&&prev!=null)cons=Math.max(0,Number(r.reading_value||0)-Number(prev));
      fixed.push({...r,previous_reading:prev,consumption:cons});last[r.meter_id]=Number(r.reading_value||0);
    });
    return {meters,readings:fixed,meterMap};
  }

  function filtered(d){
    const camm=(currentCamm==='__ALL__');
    let r=d.readings.filter(x=>(camm||x.camm===currentCamm)&&(currentUtility==='__ALL__'||x.utility===currentUtility));
    return r;
  }
  function monthly(readings,field='consumption'){
    const months=[...Array(6)].map((_,i)=>{const dt=new Date();dt.setMonth(dt.getMonth()-5+i,1);return{key:monthKey(dt),label:monthLabel(dt)}});
    return months.map(m=>{const v=readings.filter(x=>monthKey(new Date(x.reading_date||x.created_at))===m.key).reduce((a,x)=>a+Number(x[field]||0),0);return {...m,v}});
  }

  function chartSvg(readings){
    const months=monthly(readings),max=Math.max(1,...months.map(x=>x.v));
    const w=820,h=235,left=34,right=10,top=15,base=197,chartH=165,bw=72,gap=(w-left-right-months.length*bw)/(months.length-1||1);
    let bars='',labels='';
    months.forEach((m,i)=>{const x=left+i*(bw+gap),bh=(m.v/max)*chartH,y=base-bh;bars+=`<rect class="bl-bar" x="${x}" y="${y}" width="${bw}" height="${bh}" rx="7" style="animation-delay:${i*.05}s"></rect><text x="${x+bw/2}" y="${Math.max(11,y-6)}" text-anchor="middle">${fmtNum(m.v)}</text>`;labels+=`<text x="${x+bw/2}" y="220" text-anchor="middle">${esc(m.label)}</text>`});
    let lines=[0,.25,.5,.75,1].map(p=>{const y=base-chartH*p;return`<line class="bl-gridline" x1="${left}" y1="${y}" x2="${w-right}" y2="${y}"></line>`}).join('');
    return `<svg class="bl-chart" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><defs><linearGradient id="blg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#27cba2"/><stop offset="1" stop-color="#08705f"/></linearGradient></defs>${lines}${bars}${labels}</svg>`;
  }

  function buildHtml(profile,d){
    const {meters,readings}=calcRows(d),fr=filtered({meters,readings});
    const adm=isAdmin(profile);
    const sciPending=d.sci.filter(x=>!isFinalStatus(x.status));
    const scmPending=d.scm.filter(x=>!isFinalStatus(x.status));
    const totalUsers=adm?d.profiles.filter(x=>x.active!==false&&x.is_active!==false).length:null;
    const utilities=['Água','Gás','Energia'];
    const utilStats=utilities.map(u=>{const rs=fr.filter(x=>x.utility===u);const latest=rs.slice().sort((a,b)=>new Date(b.reading_date||b.created_at)-new Date(a.reading_date||a.created_at))[0];return{u,count:rs.length,cons:rs.reduce((a,x)=>a+Number(x.consumption||0),0),latest}});
    const camms=[...new Set(meters.map(cammOf))].filter(Boolean).sort((a,b)=>a==='Outros'?1:b==='Outros'?-1:a.localeCompare(b,'pt-BR',{numeric:true}));
    const activeCamm=currentCamm==='__ALL__'?'Todos os CAMMs':currentCamm;
    const totalCons=fr.reduce((a,x)=>a+Number(x.consumption||0),0);
    const months=monthly(fr);
    const recent=fr.slice().sort((a,b)=>new Date(b.reading_date||b.created_at)-new Date(a.reading_date||a.created_at)).slice(0,7);
    const cammRows=camms.map(c=>{const rr=readings.filter(x=>x.camm===c&&(currentUtility==='__ALL__'||x.utility===currentUtility));const by=u=>rr.filter(x=>x.utility===u);return{c,agua:by('Água'),gas:by('Gás'),energia:by('Energia')}});
    const utilityLabelForKpi=currentUtility==='__ALL__'?'Todas as utilidades':currentUtility;
    return `<section class="biotrop-live-v4">
      <div class="bl-head"><div><div class="bl-over">BIOTROP · EXECUTIVE CONTROL ROOM</div><h1>Gestão industrial em tempo real</h1><p>Dados diretamente do Supabase · filtro atual: <b>${esc(activeCamm)}</b> · ${esc(utilityLabelForKpi)}</p></div><div class="bl-live"><i></i> DADOS AO VIVO · ${fmtDate(new Date())}</div></div>
      <div class="bl-hero"><div><h2>Visão gerencial da planta</h2><p>Seus apontamentos de Água, Gás e Energia agora alimentam os indicadores e são separados por CAMM.</p></div><div class="bl-actions"><button class="bl-btn" id="bl-refresh">↻ Atualizar agora</button></div></div>
      <div class="bl-filterbar"><select class="bl-select" id="bl-camm"><option value="__ALL__">Todos os CAMMs</option>${camms.map(c=>`<option value="${esc(c)}" ${c===currentCamm?'selected':''}>${esc(c)}</option>`).join('')}</select><select class="bl-select" id="bl-utility"><option value="__ALL__">Todas as utilidades</option><option value="Água" ${currentUtility==='Água'?'selected':''}>Água</option><option value="Gás" ${currentUtility==='Gás'?'selected':''}>Gás</option><option value="Energia" ${currentUtility==='Energia'?'selected':''}>Energia</option><option value="Horímetro" ${currentUtility==='Horímetro'?'selected':''}>Horímetro</option></select><span class="bl-filter-note">${fr.length} apontamentos encontrados</span></div>
      <div class="bl-kpis">
        <article class="bl-kpi"><small>Apontamentos</small><strong>${fr.length}</strong><span>${esc(utilityLabelForKpi)} · ${esc(activeCamm)}</span><em>+ dados reais</em></article>
        <article class="bl-kpi"><small>Consumo acumulado</small><strong>${fmtNum(totalCons)}</strong><span>Soma do consumo calculado</span><em>Atual − anterior</em></article>
        <article class="bl-kpi"><small>SCI para aprovar</small><strong>${sciPending.length}</strong><span>Solicitações pendentes</span><em>Fila de aprovação</em></article>
        <article class="bl-kpi"><small>SCM para aprovar</small><strong>${scmPending.length}</strong><span>Solicitações pendentes</span><em>Fila de aprovação</em></article>
        ${adm?`<article class="bl-kpi"><small>Usuários ativos</small><strong>${totalUsers}</strong><span>Visível somente para administrador</span><em>Controle de acesso</em></article>`:''}
      </div>
      <div class="bl-grid2">
        <section class="bl-card"><div class="bl-cardhead"><div><h3>Consumo por mês</h3><p>Filtra pelos CAMMs e pela utilidade selecionada.</p></div><span class="bl-pill">6 meses</span></div>${fr.length?chartSvg(fr):'<div class="bl-empty">Faça um apontamento para começar a formar o gráfico.</div>'}</section>
        <section class="bl-card"><div class="bl-cardhead"><div><h3>Fila de aprovação</h3><p>Quantidade pronta para análise.</p></div><span class="bl-pill">SCI + SCM</span></div><div class="bl-approval"><div class="bl-approvalbox pending"><small>SCI</small><strong>${sciPending.length}</strong><span>serviços aguardando aprovação</span></div><div class="bl-approvalbox pending"><small>SCM</small><strong>${scmPending.length}</strong><span>compras aguardando aprovação</span></div></div><div class="bl-foot">Aprovados/rejeitados não entram na fila.</div></section>
      </div>
      <div class="bl-card bl-camm"><div class="bl-cardhead"><div><h3>Leituras por CAMM</h3><p>Resumo separado por CAMM para Água, Gás e Energia.</p></div><span class="bl-pill">${esc(activeCamm)}</span></div>${cammRows.length?`<div style="overflow:auto"><table class="bl-camm-table"><thead><tr><th>CAMM</th><th>Água</th><th>Gás</th><th>Energia</th></tr></thead><tbody>${cammRows.filter(r=>currentCamm==='__ALL__'||r.c===currentCamm).map(r=>`<tr><td><span class="bl-camm-tag">${esc(r.c)}</span></td><td>${r.agua.length} leituras · <b>${fmtNum(r.agua.reduce((a,x)=>a+Number(x.consumption||0),0))}</b></td><td>${r.gas.length} leituras · <b>${fmtNum(r.gas.reduce((a,x)=>a+Number(x.consumption||0),0))}</b></td><td>${r.energia.length} leituras · <b>${fmtNum(r.energia.reduce((a,x)=>a+Number(x.consumption||0),0))}</b></td></tr>`).join('')||'<tr><td colspan="4" class="bl-muted">Nenhum CAMM com registros para este filtro.</td></tr>'}</tbody></table></div>`:'<div class="bl-empty">Nenhum CAMM cadastrado.</div>'}</section>
      <div class="bl-grid2">
        <section class="bl-card"><div class="bl-cardhead"><div><h3>Indicadores de Utilidades</h3><p>Os apontamentos recém-lançados já aparecem aqui.</p></div><span class="bl-pill">${esc(activeCamm)}</span></div><div class="bl-utilities">${utilStats.map(x=>`<div class="bl-u"><small>${esc(x.u)}</small><strong>${x.count}</strong><span>apontamentos</span><b>${x.latest?`Última leitura ${fmtNum(x.latest.reading_value)} ${esc(x.latest.meter?.unit||'')}`:'Sem leitura'}</b><b>${x.cons?`Consumo ${fmtNum(x.cons)}`:'Consumo —'}</b></div>`).join('')}</div></section>
        <section class="bl-card"><div class="bl-cardhead"><div><h3>Atividade recente</h3><p>Últimos apontamentos registrados.</p></div><span class="bl-pill">${recent.length} itens</span></div><div class="bl-recent">${recent.length?recent.map(r=>`<div class="bl-row"><div class="bl-icon">${esc((r.utility||'?').slice(0,2).toUpperCase())}</div><div><strong>${esc(r.meter?.name||r.meter?.code||'Medidor')}</strong><span>${esc(r.utility)} · ${esc(r.camm)} · leitura ${fmtNum(r.reading_value)}</span></div><div class="bl-time">${fmtDate(r.reading_date||r.created_at)}</div></div>`).join(''):'<div class="bl-empty">Nenhum apontamento registrado.</div>'}</div></section>
      </div>
      <div class="bl-foot">Atualização automática a cada 20 segundos · Fonte: Supabase</div>
    </section>`;
  }

  function onHome(){
    if(!$('.main-area')||$('.login-wrap'))return false;
    const active=$('.nav-item.active');
    if(!active)return true;
    const t=norm(active.textContent);
    return /inicio|visao geral|dashboard|home/.test(t);
  }

  async function render(){
    const main=$('.main-area');
    if(!main)return;
    const session=await sb()?.auth?.getSession?.();
    if(!session?.data?.session){removeVeil();return}
    lastProfile=await getProfile();
    if(!lastProfile){removeVeil();return}
    if(!onHome()){removeVeil();const old=$('#biotrop-live-v4');if(old)old.remove();mounted=false;return}
    const adm=isAdmin(lastProfile);lastData=await loadData(adm);
    let root=$('#biotrop-live-v4');
    if(!root){root=document.createElement('div');root.id='biotrop-live-v4';main.insertBefore(root,main.firstChild)}
    root.innerHTML=buildHtml(lastProfile,lastData);mounted=true;removeVeil();
    // Esconde somente o dashboard V3 antigo, mantendo todas as telas restantes.
    $$('.bt-exec-dashboard').forEach(x=>{if(x!==root)x.style.display='none'});
    bind();
  }
  function bind(){
    const c=$('#bl-camm'),u=$('#bl-utility'),r=$('#bl-refresh');
    if(c)c.onchange=()=>{currentCamm=c.value;render()};if(u)u.onchange=()=>{currentUtility=u.value;render()};if(r)r.onclick=()=>render();
  }

  function installNavigationHooks(){
    const wrap=()=>{try{if(typeof window.navigateTo==='function'&&!window.navigateTo.__blv4){const old=window.navigateTo;const fn=function(){const out=old.apply(this,arguments);setTimeout(render,80);return out};fn.__blv4=true;window.navigateTo=fn}}catch{}};
    wrap();setInterval(wrap,700);
    document.addEventListener('click',e=>{const n=e.target.closest('.nav-item');if(n)setTimeout(render,100)},true);
    new MutationObserver(()=>{setTimeout(()=>{if(onHome()&&!$('#biotrop-live-v4')&&sb())render()},40)}).observe(document.body,{childList:true,subtree:true});
  }

  async function boot(){
    makeVeil();
    let tries=0;while(!sb()&&tries<80){await sleep(100);tries++}
    if(!sb()){removeVeil();return}
    installNavigationHooks();
    try{await render()}catch(e){console.error('[BIOTROP LIVE V4]',e);removeVeil()}
    if(refreshTimer)clearInterval(refreshTimer);refreshTimer=setInterval(()=>{if(onHome()&&sb())render()},20000);
    sb().auth.onAuthStateChange(()=>setTimeout(()=>render(),120));
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
