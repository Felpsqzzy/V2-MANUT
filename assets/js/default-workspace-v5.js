(() => {
  'use strict';
  if (window.__BIOTROP_WORKSPACE_V5__) return;
  window.__BIOTROP_WORKSPACE_V5__ = true;

  const clean = v => String(v ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
  const esc = v => String(v ?? '').replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const arr = v => Array.isArray(v) ? v : [];
  const pick = (o, keys, fallback='') => { for (const k of keys) if (o && o[k] !== undefined && o[k] !== null && o[k] !== '') return o[k]; return fallback; };
  const state = () => window.BIOTROP_PRODUCTION_V2?.state || window.STATE || window.BIOTROP_STATE || {};
  const currentUser = () => state().currentUser || window.currentUser || {};
  const role = () => {
    const u = currentUser();
    const s = clean([u.perfilId,u.roleCode,u.role_code,u.appRole,u.app_role,u.role,u.perfil,u.cargo].filter(Boolean).join(' '));
    if (/admin|administrador|super/.test(s)) return 'admin';
    if (/pcm|planejamento|controle/.test(s)) return 'pcm';
    if (/almox|warehouse/.test(s)) return 'almox';
    return 'tecnico';
  };
  const go = path => { try { location.hash = path; } catch {} };
  const data = () => {
    const s = state();
    const profiles = arr(s.profiles || window.PROFILES || s.users || window.USERS);
    const users = arr(s.users || window.USERS);
    const trainings = arr(s.trainings || window.TRAININGS);
    const progress = arr(s.trainingProgress || window.TRAINING_PROGRESS);
    const meters = arr(s.meters || window.METERS);
    const readings = arr(s.readings || window.READINGS);
    const service = arr(s.serviceRequests || window.SCI_LIST);
    const purchase = arr(s.purchaseRequests || window.SCM_LIST);
    const active = profiles.filter(p => pick(p,['active','is_active','enabled'],true) !== false);
    const done = progress.filter(p => ['completed','concluido','concluida','approved','aprovado','passed'].includes(clean(pick(p,['status','state'],''))) || pick(p,['completed_at','completedAt'],null));
    const overdue = progress.filter(p => ['overdue','atrasado','vencido'].includes(clean(pick(p,['status','state'],''))));
    const open = x => !['closed','cancelled','cancelado','done','completed','approved','aprovado','concluido','concluida'].includes(clean(pick(x,['status','state'],'')));
    return {profiles,users,trainings,progress,meters,readings,service,purchase,active,done,overdue,pending:service.filter(open).length+purchase.filter(open).length};
  };
  const pct = (a,b) => b ? Math.round(a/b*100) : 0;
  const date = v => { const d = new Date(v); return Number.isNaN(d.getTime()) ? null : d; };
  const fmt = v => { const d=date(v); return d ? d.toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'}) : '—'; };
  const latestReadings = d => [...d.readings].sort((a,b)=>(date(pick(b,['recorded_at','created_at','reading_at','date'],0))?.getTime()||0)-(date(pick(a,['recorded_at','created_at','reading_at','date'],0))?.getTime()||0)).slice(0,5).map(r => {
    const m=d.meters.find(x=>String(pick(x,['id','meter_id'],''))===String(pick(r,['meter_id','meterId'],'')));
    return {meter:pick(m,['name','description','code'],pick(r,['meter_name','meter'],'Medidor')),value:pick(r,['reading_value','value','reading'],'—'),unit:pick(m,['unit','measurement_unit'],pick(r,['unit'],'—')),tech:pick(r,['technician_name','user_name','created_by_name','technician'],'—'),at:pick(r,['recorded_at','created_at','reading_at','date'],null),photo:pick(r,['photo_path','photo_url','evidence_path'],null)};
  });

  function injectStyle(){
    if(document.getElementById('biotrop-workspace-v5-style')) return;
    const s=document.createElement('style'); s.id='biotrop-workspace-v5-style';
    s.textContent=`
      .bt-role-shell:not(.is-collapsed){width:240px!important}.main-area{margin-left:240px!important;padding:30px 36px!important;background:#f5f8f7;min-height:100vh}
      body.bt-role-collapsed .main-area{margin-left:72px!important}
      .bt-w5{max-width:1450px;margin:0 auto;color:#173b38}.bt-w5 *{box-sizing:border-box}.bt-w5 button{font:inherit}
      .bt-w5-head{display:flex;justify-content:space-between;align-items:flex-start;gap:18px;margin-bottom:20px}.bt-w5-kicker{margin:0 0 5px;font-size:11px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#78918b}.bt-w5-title{margin:0;font-size:29px;letter-spacing:-.035em;line-height:1.08}.bt-w5-sub{margin:7px 0 0;color:#718783;font-size:13px}.bt-w5-status{display:flex;align-items:center;gap:8px;padding:9px 12px;border:1px solid #d7e7e1;background:#fff;border-radius:12px;font-size:11px;font-weight:800;color:#35625b;white-space:nowrap}.bt-w5-dot{width:8px;height:8px;border-radius:50%;background:#18ad7d;box-shadow:0 0 0 4px rgba(24,173,125,.12)}
      .bt-w5-actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}.bt-w5-btn{border:1px solid #d6e5e0;background:#fff;color:#244b46;border-radius:10px;padding:10px 13px;font-weight:800;font-size:12px;cursor:pointer}.bt-w5-btn:hover{transform:translateY(-1px);box-shadow:0 7px 18px rgba(15,55,52,.08)}.bt-w5-btn.primary{background:#07575a;border-color:#07575a;color:#fff}
      .bt-w5-kpis{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px;margin-bottom:14px}.bt-w5-kpi{background:#fff;border:1px solid #dbe9e5;border-radius:15px;padding:17px 17px 15px;box-shadow:0 8px 24px rgba(16,57,54,.065);min-height:112px}.bt-w5-label{font-size:10.5px;text-transform:uppercase;letter-spacing:.06em;color:#78908b;font-weight:800}.bt-w5-value{font-size:30px;font-weight:850;letter-spacing:-.04em;margin-top:10px;line-height:1}.bt-w5-note{font-size:11px;color:#7b928c;margin-top:8px}.bt-w5-good{color:#148562}.bt-w5-warn{color:#c58a17}.bt-w5-danger{color:#d34851}
      .bt-w5-grid{display:grid;grid-template-columns:minmax(0,1.45fr) minmax(340px,.9fr);gap:14px;margin-bottom:14px}.bt-w5-card{background:#fff;border:1px solid #dbe9e5;border-radius:15px;box-shadow:0 8px 24px rgba(16,57,54,.065);overflow:hidden}.bt-w5-card-head{display:flex;justify-content:space-between;gap:18px;align-items:flex-start;padding:18px 18px 12px}.bt-w5-card-title{margin:0;font-size:15px;font-weight:850}.bt-w5-card-desc{margin:4px 0 0;color:#78908b;font-size:11.5px;line-height:1.45}.bt-w5-card-body{padding:0 18px 18px}
      .bt-w5-bars{display:flex;flex-direction:column;gap:15px}.bt-w5-bar{display:grid;grid-template-columns:115px 1fr 70px;gap:12px;align-items:center}.bt-w5-bar-name{font-size:12px;color:#45635e}.bt-w5-track{height:9px;background:#e6efec;border-radius:999px;overflow:hidden}.bt-w5-fill{height:100%;background:#22b58b;border-radius:999px}.bt-w5-bar-val{font-size:11px;color:#57716b;text-align:right;font-weight:700}
      .bt-w5-tablewrap{overflow:auto}.bt-w5-table{width:100%;border-collapse:collapse;min-width:620px;font-size:12px}.bt-w5-table th{background:#f5faf8;color:#69817c;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:.05em;padding:11px 12px;border-bottom:1px solid #dbe9e5}.bt-w5-table td{padding:11px 12px;border-bottom:1px solid #edf3f1;color:#244540;white-space:nowrap}.bt-w5-table tr:last-child td{border-bottom:0}.bt-w5-table .num{text-align:center}.bt-w5-pill{display:inline-flex;align-items:center;justify-content:center;min-width:24px;padding:3px 7px;border-radius:999px;background:#e9f5ef;color:#19745f;font-size:10px;font-weight:800}.bt-w5-pill.alert{background:#fbe8e9;color:#bf3c47}
      .bt-w5-quick{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.bt-w5-quick button{min-height:86px;text-align:left;border:1px solid #dce9e5;background:#fbfdfc;border-radius:12px;padding:13px;cursor:pointer}.bt-w5-quick strong{display:block;font-size:12px;color:#184b45}.bt-w5-quick span{display:block;margin-top:7px;font-size:11px;color:#78908b;line-height:1.4}.bt-w5-empty{text-align:center;padding:26px 10px;color:#78908b;font-size:12px}.bt-w5-footer{display:flex;justify-content:space-between;gap:12px;align-items:center;margin-top:14px;color:#78908b;font-size:11px}.bt-w5-version{font-weight:800;color:#47726b}
      @media(max-width:1200px){.bt-w5-kpis{grid-template-columns:repeat(3,1fr)}.bt-w5-grid{grid-template-columns:1fr}}
      @media(max-width:820px){.main-area{margin-left:72px!important;padding:22px 18px!important}.bt-w5-head{display:block}.bt-w5-actions{justify-content:flex-start;margin-top:14px}.bt-w5-kpis{grid-template-columns:repeat(2,1fr)}.bt-w5-quick{grid-template-columns:1fr}}
      @media(max-width:480px){.main-area{margin-left:64px!important;padding:16px 12px!important}.bt-w5-kpis{grid-template-columns:1fr}.bt-w5-title{font-size:24px}.bt-w5-bar{grid-template-columns:82px 1fr 50px;gap:7px}.bt-w5-card-head,.bt-w5-card-body{padding-left:13px;padding-right:13px}}
    `; document.head.appendChild(s);
  }

  function render(){
    if(clean(location.hash).includes('login') || clean(location.hash).includes('recuperar') || clean(location.hash).includes('reset')) return;
    const host=document.querySelector('.main-area'); if(!host) return;
    injectStyle();
    const d=data(), r=role(), now=new Date(), readings=latestReadings(d);
    const categories=new Map();
    d.trainings.forEach(t=>{const c=String(pick(t,['category','categoria','category_name'],'Geral')); const x=categories.get(c)||{name:c,assigned:0,completed:0}; x.assigned++; categories.set(c,x);});
    d.progress.forEach(p=>{const tid=pick(p,['training_id','course_id'],null); const t=d.trainings.find(x=>String(pick(x,['id','training_id'],''))===String(tid)); const c=String(pick(t||p,['category','categoria','category_name'],'Geral')); const x=categories.get(c)||{name:c,assigned:0,completed:0}; const st=clean(pick(p,['status','state'],'')); if(['completed','concluido','concluida','approved','aprovado','passed'].includes(st)||pick(p,['completed_at','completedAt'],null)) x.completed++; categories.set(c,x);});
    const cats=[...categories.values()].map(x=>({...x,rate:pct(x.completed,x.assigned)})).sort((a,b)=>b.rate-a.rate).slice(0,6);
    const sectors=new Map(); d.active.forEach(p=>{const n=String(pick(p,['sector','setor','department','departamento','area','area_name'],'Não informado')); const x=sectors.get(n)||{name:n,assigned:0,completed:0,overdue:0}; x.assigned++; sectors.set(n,x);});
    d.progress.forEach(p=>{const owner=pick(p,['user_id','profile_id','employee_id'],null); const prof=d.active.find(u=>String(pick(u,['id','user_id'],''))===String(owner)); if(!prof) return; const n=String(pick(prof,['sector','setor','department','departamento','area','area_name'],'Não informado')); const x=sectors.get(n)||{name:n,assigned:0,completed:0,overdue:0}; const st=clean(pick(p,['status','state'],'')); if(['completed','concluido','concluida','approved','aprovado','passed'].includes(st)||pick(p,['completed_at','completedAt'],null)) x.completed++; if(['overdue','atrasado','vencido'].includes(st)) x.overdue++; sectors.set(n,x);});
    const secs=[...sectors.values()].sort((a,b)=>b.assigned-a.assigned).slice(0,7);
    const isOperational=r==='tecnico'||r==='almox';
    const title=r==='admin'?'Dashboard executivo':r==='pcm'?'Centro de operações PCM':r==='almox'?'Central do almoxarifado':'Meu painel operacional';
    const subtitle=r==='tecnico'?'Acompanhe leituras, solicitações e treinamentos obrigatórios.':'Indicadores e operações do sistema de manutenção, com dados atuais do ambiente.';
    const kpis=r==='tecnico'?[['Meus treinamentos',d.progress.length,`${d.done.length} concluídos`,'good'],['Pendências',d.pending,'Solicitações em aberto',d.pending?'danger':'good'],['Medidores',d.meters.length,'Disponíveis para leitura','good'],['Leituras',d.readings.length,'Histórico registrado',''],['Vencidos',d.overdue.length,'Regularização necessária',d.overdue.length?'warn':'good']]:[['Usuários ativos',d.active.length,`${d.profiles.length} perfis`,'good'],['Treinamentos concluídos',d.done.length,`${d.progress.length} atribuições`,'good'],['Pendências',d.pending,'SCI/SCM em aberto',d.pending?'danger':'good'],['Certificados',d.done.filter(x=>pick(x,['certificate_url','certificate_path','certificate_issued_at','certified_at'],null)).length,'Conclusões com evidência','good'],['Vencidos',d.overdue.length,'Exigem regularização',d.overdue.length?'warn':'good']];
    const kpiHtml=kpis.map(k=>`<article class="bt-w5-kpi"><div class="bt-w5-label">${esc(k[0])}</div><div class="bt-w5-value bt-w5-${k[3]||''}">${esc(k[1])}</div><div class="bt-w5-note">${esc(k[2])}</div></article>`).join('');
    const catHtml=cats.length?cats.map(x=>`<div class="bt-w5-bar"><span class="bt-w5-bar-name">${esc(x.name)}</span><span class="bt-w5-track"><span class="bt-w5-fill" style="width:${Math.max(2,x.rate)}%"></span></span><span class="bt-w5-bar-val">${x.completed}/${x.assigned} · ${x.rate}%</span></div>`).join(''):`<div class="bt-w5-empty">Ainda não existem atribuições suficientes para gerar o gráfico.</div>`;
    const secHtml=secs.length?secs.map(x=>`<tr><td>${esc(x.name)}</td><td class="num">${x.assigned}</td><td class="num">${x.completed}</td><td class="num">${x.overdue?`<span class="bt-w5-pill alert">${x.overdue}</span>`:'0'}</td></tr>`).join(''):`<tr><td colspan="4"><div class="bt-w5-empty">Nenhum setor com dados disponíveis.</div></td></tr>`;
    const readHtml=readings.length?readings.map(x=>`<tr><td>${esc(x.meter)}</td><td><strong>${esc(x.value)}</strong></td><td>${esc(x.unit)}</td><td>${esc(x.tech)}</td><td>${esc(fmt(x.at))}</td><td>${x.photo?'✓':'—'}</td></tr>`).join(''):`<tr><td colspan="6"><div class="bt-w5-empty">Nenhuma leitura registrada no histórico.</div></td></tr>`;
    const quick=isOperational?`<div class="bt-w5-quick"><button data-w5-go="utilidades"><strong>Registrar leitura</strong><span>Abra o medidor, informe o valor e registre a evidência.</span></button><button data-w5-go="scm"><strong>Solicitar material</strong><span>Acesse o fluxo de materiais e acompanhe sua solicitação.</span></button><button data-w5-go="treinamentos"><strong>Meus treinamentos</strong><span>Veja pendências, prazos e certificados.</span></button></div>`:`<div class="bt-w5-quick"><button data-w5-go="treinamentos"><strong>Gerenciar treinamentos</strong><span>Trilhas obrigatórias, conteúdos, quiz e validade.</span></button><button data-w5-go="usuarios"><strong>Equipe e acessos</strong><span>Controle perfis, funções e permissões.</span></button><button data-w5-go="utilidades"><strong>Utilidades</strong><span>Medidores, leituras recentes e evidências.</span></button></div>`;
    host.innerHTML=`<section class="bt-w5" aria-label="${esc(title)}"><header class="bt-w5-head"><div><p class="bt-w5-kicker">BIOTROP · MANUTENÇÃO</p><h1 class="bt-w5-title">${esc(title)}</h1><p class="bt-w5-sub">${esc(subtitle)}</p></div><div><div class="bt-w5-status"><span class="bt-w5-dot"></span>Sistema conectado · dados do ambiente</div><div class="bt-w5-actions" style="margin-top:10px"><button class="bt-w5-btn" data-w5-refresh>Atualizar dados</button><button class="bt-w5-btn primary" data-w5-go="utilidades">Nova leitura</button></div></div></header><div class="bt-w5-kpis">${kpiHtml}</div><div class="bt-w5-grid"><article class="bt-w5-card"><header class="bt-w5-card-head"><div><h2 class="bt-w5-card-title">Conclusão por categoria</h2><p class="bt-w5-card-desc">Percentual calculado a partir das atribuições e conclusões registradas.</p></div><span class="bt-w5-card-desc">${d.trainings.length} treinamentos</span></header><div class="bt-w5-card-body"><div class="bt-w5-bars">${catHtml}</div></div></article><article class="bt-w5-card"><header class="bt-w5-card-head"><div><h2 class="bt-w5-card-title">Por setor</h2><p class="bt-w5-card-desc">Distribuição da equipe e situação dos treinamentos.</p></div></header><div class="bt-w5-tablewrap"><table class="bt-w5-table"><thead><tr><th>Setor</th><th>Atrib.</th><th>Concl.</th><th>Atrasados</th></tr></thead><tbody>${secHtml}</tbody></table></div></article></div><article class="bt-w5-card"><header class="bt-w5-card-head"><div><h2 class="bt-w5-card-title">Utilidades · últimas leituras</h2><p class="bt-w5-card-desc">Medidor, leitura, unidade, responsável, horário e evidência.</p></div><button class="bt-w5-btn" data-w5-go="utilidades">Ver utilidades</button></header><div class="bt-w5-tablewrap"><table class="bt-w5-table"><thead><tr><th>Medidor</th><th>Leitura</th><th>Unidade</th><th>Técnico</th><th>Data</th><th>Foto</th></tr></thead><tbody>${readHtml}</tbody></table></div></article><div class="bt-w5-grid" style="margin-top:14px;margin-bottom:0"><article class="bt-w5-card"><header class="bt-w5-card-head"><div><h2 class="bt-w5-card-title">Ações rápidas</h2><p class="bt-w5-card-desc">Os fluxos mais utilizados ficam a um clique.</p></div></header><div class="bt-w5-card-body">${quick}</div></article><article class="bt-w5-card"><header class="bt-w5-card-head"><div><h2 class="bt-w5-card-title">Integridade dos dados</h2><p class="bt-w5-card-desc">Visão rápida do que já está disponível no sistema.</p></div></header><div class="bt-w5-card-body"><div class="bt-w5-quick"><button data-w5-go="utilidades"><strong>${d.meters.length} medidores</strong><span>Cadastro de utilidades disponível.</span></button><button data-w5-go="treinamentos"><strong>${d.trainings.length} treinamentos</strong><span>${d.done.length} conclusões registradas.</span></button><button data-w5-go="scm"><strong>${d.pending} pendências</strong><span>Solicitações aguardando tratamento.</span></button></div></div></article></div><div class="bt-w5-footer"><span>Última atualização desta visão: ${esc(fmt(now))}</span><span class="bt-w5-version">BIOTROP Workspace V5</span></div></section>`;
    host.querySelectorAll('[data-w5-go]').forEach(b=>b.addEventListener('click',()=>{const target=b.dataset.w5Go; const map={usuarios:'usuarios',treinamentos:'treinamentos',utilidades:'utilidades',scm:'scm'}; go('#/'+(map[target]||target));}));
    const refresh=host.querySelector('[data-w5-refresh]'); if(refresh) refresh.addEventListener('click',()=>{window.BIOTROP_PRODUCTION_V2?.refreshData?.(true);setTimeout(render,650);});
  }

  function start(){
    const tick=()=>{if(document.querySelector('.main-area') && currentUser()) render();};
    tick(); setTimeout(tick,300);setTimeout(tick,900);setTimeout(tick,1800);setTimeout(tick,3000);
    window.addEventListener('hashchange',()=>setTimeout(()=>{ if(clean(location.hash).includes('/dashboard')||clean(location.hash).includes('/home')||!location.hash) render(); },80));
    const obs=new MutationObserver(()=>{ if(document.querySelector('.main-area') && currentUser() && !document.querySelector('.bt-w5')) setTimeout(render,30); }); obs.observe(document.body,{childList:true,subtree:true});
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true}); else start();
  window.BIOTROP_WORKSPACE_V5={render};
})();
