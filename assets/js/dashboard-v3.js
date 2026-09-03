(() => {
  'use strict';
  const VERSION = 'dashboard-v3';
  const state = () => window.BIOTROP_PRODUCTION_V2?.state || window.BIOTROP_STATE || {};
  const arr = (v) => Array.isArray(v) ? v : [];
  const first = (o, keys, fallback = '') => { for (const k of keys) if (o && o[k] != null && o[k] !== '') return o[k]; return fallback; };
  const esc = (v) => String(v ?? '').replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const num = (v) => Number.isFinite(Number(v)) ? Number(v) : 0;
  const date = (v) => { const d = new Date(v); return Number.isNaN(d.getTime()) ? null : d; };
  const fmtDate = (v) => { const d = date(v); return d ? d.toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'}) : '—'; };
  const pct = (a,b) => b ? Math.round((a/b)*100) : 0;
  const icon = (name) => ({users:'♙',book:'▤',alert:'!',check:'✓',clock:'◷',meter:'⌁',photo:'▣'}[name] || '•');

  function collections(){
    const s = state();
    return {
      profiles: arr(s.profiles || window.PROFILES || s.users || window.USERS),
      users: arr(s.users || window.USERS),
      trainings: arr(s.trainings || window.TRAININGS),
      progress: arr(s.trainingProgress || window.TRAINING_PROGRESS),
      readings: arr(s.readings || window.READINGS),
      meters: arr(s.meters || window.METERS),
      service: arr(s.serviceRequests || window.SCI_LIST),
      purchase: arr(s.purchaseRequests || window.SCM_LIST)
    };
  }

  function activeProfiles(c){ return c.profiles.filter(x => first(x,['active','is_active','enabled'],true) !== false); }
  function trainingStats(c){
    const progress = c.progress;
    const completed = progress.filter(x => ['completed','concluido','concluída','approved','aprovado','passed'].includes(String(first(x,['status','state'], '')).toLowerCase()) || first(x,['completed_at','completedAt'],null));
    const overdue = progress.filter(x => ['overdue','atrasado','vencido'].includes(String(first(x,['status','state'], '')).toLowerCase()));
    const certs = progress.filter(x => first(x,['certificate_url','certificate_path','certificate_issued_at','certified_at'],null));
    return {completed, overdue, certs};
  }

  function pendingCount(c){
    const open = x => !['closed','cancelled','cancelado','concluido','concluída','done','completed','approved','aprovado'].includes(String(first(x,['status','state'], '')).toLowerCase());
    return c.service.filter(open).length + c.purchase.filter(open).length;
  }

  function sectors(c){
    const map = new Map();
    for(const p of activeProfiles(c)){
      const sector = first(p,['sector','setor','department','departamento','area','area_name'],'Não informado');
      const key = String(sector);
      const cur = map.get(key) || {name:key,assigned:0,completed:0,overdue:0};
      cur.assigned++;
      map.set(key,cur);
    }
    for(const x of c.progress){
      const owner = first(x,['user_id','profile_id','employee_id'],null);
      const p = activeProfiles(c).find(u => String(first(u,['id','user_id'],'')) === String(owner));
      const sector = p ? first(p,['sector','setor','department','departamento','area','area_name'],'Não informado') : null;
      if(!sector) continue;
      const cur = map.get(String(sector)) || {name:String(sector),assigned:0,completed:0,overdue:0};
      const status = String(first(x,['status','state'],'')).toLowerCase();
      if(['completed','concluido','concluída','approved','aprovado','passed'].includes(status) || first(x,['completed_at','completedAt'],null)) cur.completed++;
      if(['overdue','atrasado','vencido'].includes(status)) cur.overdue++;
      map.set(String(sector),cur);
    }
    return [...map.values()].sort((a,b)=>b.assigned-a.assigned).slice(0,8);
  }

  function categoryStats(c){
    const m = new Map();
    for(const t of c.trainings){
      const cat = String(first(t,['category','categoria','category_name'],'Geral'));
      const cur = m.get(cat) || {name:cat,assigned:0,completed:0};
      cur.assigned++;
      m.set(cat,cur);
    }
    for(const p of c.progress){
      const tid = first(p,['training_id','course_id'],null);
      const t = c.trainings.find(x=>String(first(x,['id','training_id'],''))===String(tid));
      const cat = t ? String(first(t,['category','categoria','category_name'],'Geral')) : String(first(p,['category','categoria'],'Geral'));
      const cur = m.get(cat) || {name:cat,assigned:0,completed:0};
      const status = String(first(p,['status','state'],'')).toLowerCase();
      if(['completed','concluido','concluída','approved','aprovado','passed'].includes(status) || first(p,['completed_at','completedAt'],null)) cur.completed++;
      m.set(cat,cur);
    }
    return [...m.values()].map(x=>({...x,rate:pct(x.completed,x.assigned)})).sort((a,b)=>b.rate-a.rate).slice(0,6);
  }

  function recentReadings(c){
    return [...c.readings].sort((a,b)=>(date(first(b,['recorded_at','created_at','reading_at','date'],0))?.getTime()||0)-(date(first(a,['recorded_at','created_at','reading_at','date'],0))?.getTime()||0)).slice(0,6).map(r=>{
      const meter = c.meters.find(m=>String(first(m,['id','meter_id'],''))===String(first(r,['meter_id','meterId'],'')));
      return {meter:first(meter,['name','description','code'],first(r,['meter_name','meter','name'],'Medidor')),value:first(r,['reading_value','value','reading'],'—'),unit:first(meter,['unit','measurement_unit'],first(r,['unit'],'') ),tech:first(r,['technician_name','user_name','created_by_name','technician'],'—'),at:first(r,['recorded_at','created_at','reading_at','date'],null),photo:first(r,['photo_path','photo_url','evidence_path'],null)};
    });
  }

  function kpi(label,value,note,kind=''){ return `<article class="dash-kpi ${kind}"><div class="dash-kpi-label">${esc(label)}</div><div class="dash-kpi-value">${esc(value)}</div><div class="dash-kpi-note">${esc(note)}</div></article>`; }
  function tableRows(rows){ return rows.length ? rows.join('') : `<tr><td colspan="10"><div class="dash-empty">Nenhum registro disponível.</div></td></tr>`; }

  function render(){
    const host = document.querySelector('.main-area');
    if(!host || !isDashboard()) return false;
    if(host.querySelector('.dashboard-v3')) return true;
    const c = collections();
    const active = activeProfiles(c), ts = trainingStats(c), pending = pendingCount(c);
    const cats = categoryStats(c), secs = sectors(c), readings = recentReadings(c);
    const now = new Date();
    const monthAgo = now.getTime() - 30*86400000;
    const recent = c.readings.filter(r=>(date(first(r,['recorded_at','created_at','reading_at','date'],0))?.getTime()||0)>=monthAgo).length;
    const maxRate = Math.max(1,...cats.map(x=>x.rate));
    host.innerHTML = `<section class="dashboard-v3" aria-label="Dashboard executivo">
      <div class="dash-topbar">
        <div><p class="dash-kicker">Biotrop Manutenção</p><h1 class="dash-title">Visão geral da manutenção</h1><p class="dash-subtitle">Indicadores operacionais, treinamentos, solicitações e utilidades em um único lugar.</p></div>
        <div class="dash-actions"><span class="dash-updated"><span class="dash-live"></span>Atualizado ${esc(fmtDate(now))}</span><button class="dash-action" data-dash-action="refresh">Atualizar</button><button class="dash-action primary" data-dash-action="utilities">Registrar leitura</button></div>
      </div>
      <div class="dash-kpis">
        ${kpi('Usuários ativos',active.length,`${c.profiles.length} perfis cadastrados`,'good')}
        ${kpi('Treinamentos concluídos',ts.completed.length,`${c.progress.length} atribuições registradas`,'good')}
        ${kpi('Pendências',pending,'SCI/SCM em aberto',pending?'alert':'good')}
        ${kpi('Certificados emitidos',ts.certs.length,'Com evidência de conclusão','good')}
        ${kpi('Treinamentos vencidos',ts.overdue.length,'Exigem regularização',ts.overdue.length?'warn':'good')}
        ${kpi('Leituras · 30 dias',recent,`${c.readings.length} leituras no histórico`,'')}
      </div>
      <div class="dash-grid">
        <article class="dash-card"><header class="dash-card-head"><div><h2 class="dash-card-title">Conclusão por categoria</h2><p class="dash-card-desc">Acompanhamento da execução dos treinamentos disponíveis no sistema.</p></div><span class="dash-mini-link">${c.trainings.length} treinamentos</span></header><div class="dash-card-body"><div class="dash-bars">${cats.length?cats.map(x=>`<div class="dash-bar-row"><span class="dash-bar-label">${esc(x.name)}</span><span class="dash-bar-track"><span class="dash-bar-fill" style="width:${Math.max(2,x.rate/maxRate*100)}%"></span></span><span class="dash-bar-value">${x.completed}/${x.assigned} · ${x.rate}%</span></div>`).join(''):'<div class="dash-empty">Cadastre treinamentos e atribuições para visualizar a evolução.</div>'}</div></div></article>
        <article class="dash-card"><header class="dash-card-head"><div><h2 class="dash-card-title">Por setor</h2><p class="dash-card-desc">Distribuição dos usuários e situação das atribuições.</p></div></header><div class="dash-table-wrap"><table class="dash-table"><thead><tr><th>Setor</th><th>Atribuídos</th><th>Concluídos</th><th>Atrasados</th></tr></thead><tbody>${tableRows(secs.map(x=>`<tr><td>${esc(x.name)}</td><td class="num">${x.assigned}</td><td class="num">${x.completed}</td><td class="num">${x.overdue?`<span class="dash-pill alert">${x.overdue}</span>`:'0'}</td></tr>`))}</tbody></table></div></article>
      </div>
      <article class="dash-card dash-readings"><header class="dash-card-head"><div><h2 class="dash-card-title">Utilidades · últimas leituras</h2><p class="dash-card-desc">Registros recentes de medidores, com técnico, horário e evidência.</p></div><button class="dash-action" data-dash-action="readings">Ver utilidades</button></header><div class="dash-table-wrap"><table class="dash-table"><thead><tr><th>Medidor</th><th>Leitura</th><th>Unidade</th><th>Técnico</th><th>Data</th><th>Foto</th></tr></thead><tbody>${tableRows(readings.map(r=>`<tr><td>${esc(r.meter)}</td><td><strong>${esc(r.value)}</strong></td><td>${esc(r.unit||'—')}</td><td>${esc(r.tech)}</td><td>${esc(fmtDate(r.at))}</td><td class="dash-photo">${r.photo?'▣':'—'}</td></tr>`))}</tbody></table></div></article>
      <div class="dash-grid" style="margin-top:14px;margin-bottom:0">
        <article class="dash-card"><header class="dash-card-head"><div><h2 class="dash-card-title">Saúde do sistema</h2><p class="dash-card-desc">Indicadores de disponibilidade dos dados carregados no navegador.</p></div></header><div class="dash-card-body"><div class="dash-health"><div class="dash-health-item"><div class="dash-health-label">Perfis</div><div class="dash-health-value ${c.profiles.length?'ok':''}">${c.profiles.length?'OK':'Sem dados'}</div></div><div class="dash-health-item"><div class="dash-health-label">Treinamentos</div><div class="dash-health-value ${c.trainings.length?'ok':''}">${c.trainings.length?'OK':'Sem dados'}</div></div><div class="dash-health-item"><div class="dash-health-label">Utilidades</div><div class="dash-health-value ${c.meters.length?'ok':''}">${c.meters.length?`${c.meters.length} medidores`:'Sem medidores'}</div></div></div></div></article>
        <article class="dash-card"><header class="dash-card-head"><div><h2 class="dash-card-title">Ações rápidas</h2><p class="dash-card-desc">Acesso direto aos fluxos mais usados pela equipe.</p></div></header><div class="dash-card-body"><div class="dash-actions"><button class="dash-action primary" data-dash-action="utilities">Registrar horímetro/leitura</button><button class="dash-action" data-dash-action="training">Meus treinamentos</button><button class="dash-action" data-dash-action="requests">Solicitar material</button></div></div></article>
      </div>
    </section>`;
    bind(host);
    return true;
  }

  function isDashboard(){ const h=String(location.hash||'').toLowerCase(); return h.includes('/dashboard') || h==='#dashboard' || h.includes('dashboard'); }
  function go(path){ try{ location.hash=path; }catch(_){} }
  function bind(host){
    host.querySelectorAll('[data-dash-action]').forEach(btn=>btn.addEventListener('click',()=>{
      const a=btn.dataset.dashAction;
      if(a==='refresh'){ window.BIOTROP_PRODUCTION_V2?.refreshData?.(true); setTimeout(()=>{host.querySelector('.dashboard-v3')?.remove(); render();},500); }
      else if(a==='utilities') go('#/utilidades');
      else if(a==='training') go('#/treinamentos');
      else if(a==='requests') go('#/scm');
      else if(a==='readings') go('#/utilidades');
    }));
  }
  function boot(){
    const attempt=()=>{ if(isDashboard()) { render(); setTimeout(render,80); setTimeout(render,350); } };
    window.addEventListener('hashchange',()=>setTimeout(attempt,20));
    const observer=new MutationObserver(()=>{ if(isDashboard() && !document.querySelector('.dashboard-v3')) setTimeout(render,30); });
    observer.observe(document.body,{childList:true,subtree:true});
    attempt();
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true}); else boot();
  window.BIOTROP_DASHBOARD_V3={render};
})();
