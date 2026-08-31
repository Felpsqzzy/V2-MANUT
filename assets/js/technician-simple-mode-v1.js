/* BIOTROP • Interface simples do Técnico + apontamento direto + visão PCM estável */
(() => {
  'use strict';
  if (window.__BIOTROP_TECH_SIMPLE_V4__) return;
  window.__BIOTROP_TECH_SIMPLE_V4__ = true;

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const getState = () => { try { return (typeof STATE !== 'undefined' && STATE) || window.STATE || null; } catch (_) { return window.STATE || null; } };
  const getSB = () => { try { return (typeof SB !== 'undefined' && SB) || window.SB || null; } catch (_) { return window.SB || null; } };
  const user = () => getState()?.currentUser || {};
  const role = () => String(user().perfilId || user().roleCode || user().role_code || user().appRole || user().app_role || user().role || '').toLowerCase();
  const isTech = () => role() === 'tecnico';
  const isManager = () => ['pcm', 'administrador', 'super_admin', 'admin'].includes(role());
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  const nav = area => { try { if (typeof navigateTo === 'function') navigateTo(area); } catch (e) { console.warn('[BIOTROP] navigation', e); } };

  const style = document.createElement('style');
  style.id = 'biotrop-tech-v4-style';
  style.textContent = `
    body.bt-tech-v4 .sidebar{width:220px!important;position:fixed!important;left:0!important;top:0!important;bottom:0!important;height:100vh!important;z-index:1000!important;overflow-y:auto!important}
    body.bt-tech-v4 .main-area{margin-left:220px!important;min-height:100vh!important;width:auto!important;padding:30px 38px!important}
    body.bt-tech-v4 .tech-v4-home{max-width:1080px;margin:0 auto}
    body.bt-tech-v4 .tech-v4-welcome{margin:8px 0 28px}
    body.bt-tech-v4 .tech-v4-welcome .kicker{font-size:10px;letter-spacing:.18em;text-transform:uppercase;font-weight:900;color:#168866}
    body.bt-tech-v4 .tech-v4-welcome h1{margin:6px 0 5px;color:#12352d;font-size:34px;letter-spacing:-.04em}
    body.bt-tech-v4 .tech-v4-welcome p{margin:0;color:#71817b;font-size:14px}
    body.bt-tech-v4 .tech-v4-actions{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px}
    body.bt-tech-v4 .tech-v4-card{appearance:none;width:100%;border:1px solid #e0ebe6;background:#fff;border-radius:20px;padding:24px;text-align:left;cursor:pointer;box-shadow:0 8px 26px rgba(0,55,45,.055);transition:.18s;font-family:inherit;min-height:190px}
    body.bt-tech-v4 .tech-v4-card:hover{transform:translateY(-3px);border-color:#a7d7c3;box-shadow:0 16px 34px rgba(0,55,45,.1)}
    body.bt-tech-v4 .tech-v4-icon{width:52px;height:52px;border-radius:15px;background:#eaf7f1;color:#08785b;display:grid;place-items:center;font-size:25px;margin-bottom:20px}
    body.bt-tech-v4 .tech-v4-card strong{display:block;font-size:18px;color:#17332b;margin-bottom:7px}
    body.bt-tech-v4 .tech-v4-card span{display:block;font-size:13px;line-height:1.5;color:#74847e}
    body.bt-tech-v4 .tech-v4-note{margin-top:18px;padding:16px 18px;border-radius:15px;background:#f0f8f4;color:#58716a;font-size:12px}
    body.bt-tech-v4 .tech-v4-sidebar-nav{display:grid;gap:5px;padding:4px 0}
    body.bt-tech-v4 .tech-v4-sidebar-nav button{width:100%;border:0;background:transparent;color:#d7ece5;padding:11px 12px;border-radius:10px;text-align:left;font:inherit;font-weight:700;cursor:pointer}
    body.bt-tech-v4 .tech-v4-sidebar-nav button:hover,body.bt-tech-v4 .tech-v4-sidebar-nav button.active{background:rgba(255,255,255,.11);color:#fff}

    .bt-v4-modal{position:fixed;inset:0;background:rgba(0,35,38,.62);backdrop-filter:blur(3px);z-index:100000;display:flex;align-items:center;justify-content:center;padding:18px}
    .bt-v4-dialog{width:min(720px,100%);max-height:92vh;overflow:auto;background:#fff;border-radius:22px;padding:24px;box-shadow:0 30px 100px rgba(0,0,0,.3);color:#17332b}
    .bt-v4-head{display:flex;align-items:flex-start;justify-content:space-between;gap:15px}.bt-v4-head h2{margin:0;color:#003c41;font-size:22px}.bt-v4-head p{margin:5px 0 0;color:#73827d;font-size:12px}.bt-v4-close{border:0;background:#eef5f2;color:#315b50;border-radius:50%;width:36px;height:36px;font-size:21px;cursor:pointer}
    .bt-v4-kicker{font-size:10px;font-weight:900;letter-spacing:.16em;text-transform:uppercase;color:#168866;margin-bottom:5px}
    .bt-v4-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:20px}.bt-v4-choice{border:1px solid #dfebe5;background:#fbfdfc;border-radius:16px;padding:18px;text-align:left;cursor:pointer;font-family:inherit}.bt-v4-choice:hover{border-color:#5bb995;box-shadow:0 9px 24px rgba(0,0,0,.06)}.bt-v4-choice strong{display:block;color:#003c41;font-size:16px}.bt-v4-choice span{display:block;color:#73847d;font-size:11px;margin-top:6px}.bt-v4-choice b{display:block;color:#178865;font-size:11px;margin-top:12px}
    .bt-v4-back{border:0;background:none;color:#168866;font-weight:800;cursor:pointer;padding:0;margin-bottom:10px}.bt-v4-list{display:grid;gap:10px;margin-top:18px}.bt-v4-meter{border:1px solid #e0ebe6;border-radius:14px;padding:15px;background:#fff;text-align:left;cursor:pointer;font-family:inherit}.bt-v4-meter:hover{border-color:#5bb995}.bt-v4-meter .type{font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:#168866;font-weight:900}.bt-v4-meter strong{display:block;color:#17332b;margin-top:6px;font-size:14px}.bt-v4-meter small{display:block;color:#778780;margin-top:5px}
    .bt-v4-form{display:grid;gap:14px;margin-top:20px}.bt-v4-field label{display:block;font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:.08em;color:#526860;margin-bottom:6px}.bt-v4-field input,.bt-v4-field textarea{width:100%;box-sizing:border-box;border:1.5px solid #d7e6df;border-radius:11px;padding:12px;font:inherit;outline:none}.bt-v4-field input:focus,.bt-v4-field textarea:focus{border-color:#168866}.bt-v4-last{background:#eff8f4;border-radius:14px;padding:14px}.bt-v4-last small{display:block;color:#6c8078;font-size:10px}.bt-v4-last strong{display:block;color:#003c41;font-size:22px;margin-top:3px}.bt-v4-file{border:1.5px dashed #a9cbbd;border-radius:14px;padding:14px;background:#f8fcfa}.bt-v4-file strong{font-size:12px}.bt-v4-file p{margin:4px 0 10px;color:#74847e;font-size:11px}.bt-v4-actions-row{display:flex;justify-content:flex-end;gap:9px;padding-top:4px}.bt-v4-btn{border:0;border-radius:999px;padding:11px 18px;font-weight:850;cursor:pointer}.bt-v4-btn.light{background:#edf5f1;color:#31574d}.bt-v4-btn.primary{background:#003c41;color:#fff}.bt-v4-msg{font-size:12px;padding:10px 12px;border-radius:10px;background:#fff3f1;color:#a43b2e}.bt-v4-success{background:#edf9f3;color:#1a6d52}

    .bt-v4-admin{max-width:1200px;margin:0 auto}.bt-v4-admin-head{display:flex;align-items:flex-end;justify-content:space-between;gap:18px;margin-bottom:20px}.bt-v4-admin-head h1{margin:0;color:#12352d;font-size:30px}.bt-v4-admin-head p{margin:5px 0 0;color:#71817b;font-size:13px}.bt-v4-kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:16px}.bt-v4-kpi{background:#fff;border:1px solid #e1ebe6;border-radius:16px;padding:15px}.bt-v4-kpi small{display:block;color:#72837c;text-transform:uppercase;font-size:9px;font-weight:900;letter-spacing:.1em}.bt-v4-kpi strong{display:block;color:#003c41;font-size:26px;margin-top:4px}.bt-v4-admin-box{background:#fff;border:1px solid #e1ebe6;border-radius:18px;overflow:hidden}.bt-v4-admin-box .toolbar{padding:14px 16px;border-bottom:1px solid #e9efec;display:flex;gap:10px;align-items:center;justify-content:space-between}.bt-v4-admin-box select{border:1px solid #d7e6df;border-radius:10px;padding:9px 11px;background:#fff}.bt-v4-table-wrap{overflow:auto}.bt-v4-table{width:100%;border-collapse:collapse;font-size:12px}.bt-v4-table th{background:#f7faf8;color:#657770;text-transform:uppercase;font-size:9px;letter-spacing:.08em;text-align:left;padding:11px}.bt-v4-table td{padding:12px 11px;border-top:1px solid #edf2ef;color:#334b43}.bt-v4-pill{display:inline-block;padding:4px 8px;border-radius:999px;background:#edf7f2;color:#187555;font-size:10px;font-weight:800}.bt-v4-muted{color:#82908b}.bt-v4-empty{padding:40px;text-align:center;color:#75857f}
    @media(max-width:900px){body.bt-tech-v4 .main-area{padding:22px 16px!important}.tech-v4-actions{grid-template-columns:1fr!important}.bt-v4-grid{grid-template-columns:1fr}.bt-v4-kpis{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);

  let meterCache = null;
  const cammOrder = ['CAMM 1','CAMM 2','CAMM 3','CLOG'];
  const iconFor = t => ({agua:'💧',gas:'🔥',energia:'⚡',horimetro:'⏱️'})[t] || '◉';
  const labelFor = t => ({agua:'Água',gas:'Gás',energia:'Energia',horimetro:'Horímetro'})[t] || t;

  async function getMeters(){
    const sb=getSB(); if(!sb) throw new Error('Conexão com o banco não disponível.');
    if(meterCache) return meterCache;
    const r=await sb.from('utility_meters').select('id,unit_id,code,name,utility_type,location,unit,active,initial_reading').eq('active',true).order('code');
    if(r.error) throw r.error;
    const meters=r.data||[];
    const ids=[...new Set(meters.map(m=>m.unit_id).filter(Boolean))];
    let units=[];
    if(ids.length){const ur=await sb.from('industrial_units').select('id,code,name,sort_order').in('id',ids);if(ur.error)throw ur.error;units=ur.data||[];}
    const map=new Map(units.map(u=>[u.id,u]));
    meters.forEach(m=>m._unit=map.get(m.unit_id)||null);
    meterCache=meters;
    return meters;
  }
  const cammName=m=>String(m?((m._unit?.code||m._unit?.name||'').trim() || ((m.name||'').match(/CAMM\s*\d+/i)?.[0] || 'CLOG')):'CLOG').replace(/^CAMM\s*(\d+)$/i,(_,n)=>`CAMM ${n}`);
  const sortCamm=(a,b)=>{const ia=cammOrder.indexOf(a),ib=cammOrder.indexOf(b);return (ia<0?99:ia)-(ib<0?99:ib)||a.localeCompare(b);};

  function sidebar(){
    if(!isTech()) return;
    const n=$('#sidebar-nav'); if(!n) return;
    n.innerHTML=`<div class="tech-v4-sidebar-nav">
      <button data-tech-nav="home">⌂ &nbsp; Início</button>
      <button data-tech-nav="treinamentos">▣ &nbsp; Treinamentos</button>
      <button data-tech-nav="apontar">⏱ &nbsp; Apontar Horímetros</button>
      <button data-tech-nav="almoxarifado">▤ &nbsp; Almoxarifado</button>
    </div>`;
    $$('.tech-v4-sidebar-nav button',n).forEach(b=>b.addEventListener('click',e=>{e.preventDefault();const a=b.dataset.techNav;if(a==='apontar')openWizard();else nav(a);}));
  }

  function techHome(){
    if(!isTech()) return;
    const main=$('#main-content'); if(!main) return;
    main.innerHTML=`<div class="tech-v4-home">
      <div class="tech-v4-welcome"><div class="kicker">PLATAFORMA DE MANUTENÇÃO</div><h1>Bom dia, ${esc(user().nome||user().full_name||'Técnico')} 👋</h1><p>Escolha o que você precisa fazer.</p></div>
      <div class="tech-v4-actions">
        <button class="tech-v4-card" data-tech-home="training"><div class="tech-v4-icon">📚</div><strong>Treinamentos</strong><span>Acesse seus treinamentos e acompanhe o que precisa concluir.</span></button>
        <button class="tech-v4-card" data-tech-home="reading"><div class="tech-v4-icon">⏱</div><strong>Apontar Horímetros</strong><span>Água, gás, energia e horímetros. Escolha o CAMM e faça a leitura.</span></button>
        <button class="tech-v4-card" data-tech-home="materials"><div class="tech-v4-icon">📦</div><strong>Almoxarifado</strong><span>Solicite materiais e acompanhe suas solicitações.</span></button>
      </div>
      <div class="tech-v4-note">A tela do técnico mostra somente o que é necessário para a operação. A gestão dos medidores e dos apontamentos fica com o PCM.</div>
    </div>`;
    $$('.tech-v4-card',main).forEach(b=>b.addEventListener('click',()=>{const a=b.dataset.techHome;if(a==='reading')openWizard();else if(a==='training')nav('treinamentos');else nav('almoxarifado');}));
  }

  function closeModal(){ $('#bt-v4-modal')?.remove(); }
  function modal(html){closeModal();document.body.insertAdjacentHTML('beforeend',`<div class="bt-v4-modal" id="bt-v4-modal"><div class="bt-v4-dialog">${html}</div></div>`);$('#bt-v4-modal')?.addEventListener('click',e=>{if(e.target.id==='bt-v4-modal')closeModal();});}
  const header=(k,t,p)=>`<div class="bt-v4-head"><div><div class="bt-v4-kicker">${esc(k)}</div><h2>${esc(t)}</h2><p>${esc(p)}</p></div><button class="bt-v4-close" data-v4-close>×</button></div>`;

  async function openWizard(){
    if(!isTech()) return;
    try{
      modal(`${header('APONTAMENTO','Escolha o CAMM','Selecione a unidade onde você está fazendo a leitura.')}<div class="bt-v4-grid" id="bt-v4-camms"><div class="bt-v4-muted">Carregando...</div></div>`);
      $('#bt-v4-modal [data-v4-close]').onclick=closeModal;
      const meters=await getMeters();
      const cams=[...new Set(meters.map(cammName))].sort(sortCamm);
      $('#bt-v4-camms').innerHTML=cams.map(c=>{const count=meters.filter(m=>cammName(m)===c).length;return `<button class="bt-v4-choice" data-v4-camm="${esc(c)}"><strong>${esc(c)}</strong><span>Unidade industrial</span><b>${count} opção(ões) →</b></button>`}).join('');
      $$('#bt-v4-camms [data-v4-camm]').forEach(b=>b.onclick=()=>typeStep(meters,b.dataset.v4Camm));
    }catch(e){showError(e);}
  }

  function typeStep(meters,camm){
    const types=[...new Set(meters.filter(m=>cammName(m)===camm).map(m=>m.utility_type))];
    modal(`${header(camm,'O que você vai apontar?','Escolha o tipo de medição.')}<button class="bt-v4-back" data-v4-back>← Voltar</button><div class="bt-v4-grid">${types.map(t=>{const n=meters.filter(m=>cammName(m)===camm&&m.utility_type===t).length;return `<button class="bt-v4-choice" data-v4-type="${esc(t)}"><strong>${iconFor(t)} ${esc(labelFor(t))}</strong><span>Medidores disponíveis</span><b>${n} medidor(es) →</b></button>`}).join('')}</div>`);
    $('#bt-v4-modal [data-v4-close]').onclick=closeModal;$('#bt-v4-modal [data-v4-back]').onclick=()=>openWizard();
    $$('#bt-v4-modal [data-v4-type]').forEach(b=>b.onclick=()=>meterStep(meters,camm,b.dataset.v4Type));
  }

  function meterStep(meters,camm,type){
    const list=meters.filter(m=>cammName(m)===camm&&m.utility_type===type);
    modal(`${header(`${camm} · ${labelFor(type)}`,'Escolha o medidor','Selecione somente o equipamento que você está lendo.')}<button class="bt-v4-back" data-v4-back>← Voltar</button><div class="bt-v4-list">${list.map(m=>`<button class="bt-v4-meter" data-v4-meter="${m.id}"><div class="type">${iconFor(type)} ${esc(labelFor(type))}</div><strong>${esc(m.name||m.code)}</strong><small>${esc(m.code)} · ${esc(m.location||'Local não informado')}</small></button>`).join('')}</div>`);
    $('#bt-v4-modal [data-v4-close]').onclick=closeModal;$('#bt-v4-modal [data-v4-back]').onclick=()=>typeStep(meters,camm);
    $$('#bt-v4-modal [data-v4-meter]').forEach(b=>b.onclick=()=>readingForm(meters.find(m=>m.id===b.dataset.v4Meter),camm));
  }

  async function getPrevious(meter){
    const sb=getSB();let previous=meter.initial_reading==null?null:Number(meter.initial_reading);
    if(sb){const r=await sb.from('utility_readings').select('reading_value,reading_date').eq('meter_id',meter.id).eq('active',true).order('server_timestamp',{ascending:false}).limit(1).maybeSingle();if(!r.error&&r.data)previous=Number(r.data.reading_value);}
    return previous;
  }

  async function readingForm(meter,camm){
    if(!meter) return;
    const previous=await getPrevious(meter);
    modal(`${header(`${camm} · ${labelFor(meter.utility_type)}`,'Registrar leitura',meter.name||meter.code)}
      <button class="bt-v4-back" data-v4-back>← Voltar para medidores</button>
      <div class="bt-v4-last"><small>ÚLTIMA LEITURA</small><strong>${previous==null?'Sem leitura':previous.toLocaleString('pt-BR',{minimumFractionDigits:0,maximumFractionDigits:3})} ${esc(meter.unit||'')}</strong></div>
      <form class="bt-v4-form" id="bt-v4-form">
        <div class="bt-v4-field"><label>Leitura atual (${esc(meter.unit||'un')})</label><input id="bt-v4-value" type="number" min="0" step="0.001" required autofocus placeholder="Digite a leitura"></div>
        <div class="bt-v4-field"><label>Observação <span style="font-weight:500;text-transform:none;letter-spacing:0">(opcional)</span></label><textarea id="bt-v4-observation" rows="3" placeholder="Se necessário, informe uma observação"></textarea></div>
        <div class="bt-v4-file"><strong>📷 Foto do medidor <span style="font-weight:500;color:#71817b">(opcional)</span></strong><p>Você pode anexar a foto, mas ela não é obrigatória.</p><input id="bt-v4-photo" type="file" accept="image/*" capture="environment"></div>
        <div id="bt-v4-status"></div>
        <div class="bt-v4-actions-row"><button class="bt-v4-btn light" type="button" data-v4-close>Cancelar</button><button class="bt-v4-btn primary" type="submit">Salvar apontamento</button></div>
      </form>`);
    $('#bt-v4-modal [data-v4-close]').onclick=closeModal;$('#bt-v4-modal [data-v4-back]').onclick=()=>meterStep(meterCache,camm);
    const form=$('#bt-v4-form');
    form.onsubmit=async e=>{e.preventDefault();await saveReading(meter);};
  }

  async function getPosition(){
    return new Promise(resolve=>{
      if(!navigator.geolocation)return resolve({latitude:null,longitude:null});
      navigator.geolocation.getCurrentPosition(p=>resolve({latitude:p.coords.latitude,longitude:p.coords.longitude}),()=>resolve({latitude:null,longitude:null}),{enableHighAccuracy:true,timeout:5000,maximumAge:60000});
    });
  }

  async function saveReading(meter){
    const sb=getSB(), value=Number($('#bt-v4-value')?.value);if(!sb)return showError(new Error('Banco de dados indisponível.'));
    if(!Number.isFinite(value)||value<0)return showStatus('Digite uma leitura válida.');
    const btn=$('#bt-v4-form button[type="submit"]');if(btn)btn.disabled=true;
    showStatus('Salvando...');
    try{
      const uid=user().dbId||user().id;let photoPath=null;
      const file=$('#bt-v4-photo')?.files?.[0];
      if(file){const safe=file.name.replace(/[^a-zA-Z0-9._-]/g,'_');const path=`${uid||'user'}/${meter.id}/${Date.now()}-${safe}`;const up=await sb.storage.from('utility-evidence').upload(path,file,{upsert:false,contentType:file.type||'image/jpeg'});if(up.error)throw new Error('Não foi possível salvar a foto. Você pode tentar novamente ou remover a foto e salvar sem ela.');photoPath=path;}
      const pos=await getPosition();
      const payload={meter_id:meter.id,reading_value:value,observation:$('#bt-v4-observation')?.value?.trim()||null,latitude:pos.latitude,longitude:pos.longitude,photo_path:photoPath,captured_at:new Date().toISOString()};
      const r=await sb.from('utility_readings').insert(payload).select('id').single();
      if(r.error)throw r.error;
      showStatus('Apontamento salvo com sucesso.',true);
      setTimeout(closeModal,700);
    }catch(e){showStatus(e?.message||'Não foi possível salvar o apontamento.');if(btn)btn.disabled=false;}
  }
  function showStatus(msg,ok=false){const x=$('#bt-v4-status');if(x)x.innerHTML=`<div class="bt-v4-msg ${ok?'bt-v4-success':''}">${esc(msg)}</div>`;}
  function showError(e){console.error('[BIOTROP] utility',e);showStatus(e?.message||'Não foi possível carregar os dados.');}

  async function pcmView(){
    if(!isManager() || getState()?.activeArea!=='utilidades')return;
    const main=$('#main-content');if(!main)return;
    main.innerHTML=`<div class="bt-v4-admin"><div class="bt-v4-admin-head"><div><div class="bt-v4-kicker">PCM · CONTROLE</div><h1>Apontamentos de utilidades</h1><p>Consulta rápida das leituras registradas pelos técnicos.</p></div></div><div class="bt-v4-kpis"><div class="bt-v4-kpi"><small>Apontamentos</small><strong id="bt-kpi-total">—</strong></div><div class="bt-v4-kpi"><small>Pendentes</small><strong id="bt-kpi-pending">—</strong></div><div class="bt-v4-kpi"><small>Com foto</small><strong id="bt-kpi-photo">—</strong></div></div><div class="bt-v4-admin-box"><div class="toolbar"><strong>Últimos registros</strong><select id="bt-admin-filter"><option value="all">Todos os CAMMs</option></select></div><div class="bt-v4-table-wrap"><table class="bt-v4-table"><thead><tr><th>Data</th><th>CAMM</th><th>Medidor</th><th>Leitura</th><th>Responsável</th><th>Status</th><th>Foto</th></tr></thead><tbody id="bt-admin-body"><tr><td colspan="7" class="bt-v4-empty">Carregando...</td></tr></tbody></table></div></div></div>`;
    try{
      const sb=getSB();if(!sb)throw new Error('Banco de dados indisponível.');
      const mr=await sb.from('utility_meters').select('id,code,name,utility_type,unit,unit_id').eq('active',true);if(mr.error)throw mr.error;
      const meters=mr.data||[];const units=[...new Set(meters.map(m=>m.unit_id).filter(Boolean))];let ud=[];if(units.length){const ur=await sb.from('industrial_units').select('id,code,name').in('id',units);if(ur.error)throw ur.error;ud=ur.data||[];}const um=new Map(ud.map(u=>[u.id,u]));meters.forEach(m=>m._unit=um.get(m.unit_id)||null);
      const rr=await sb.from('utility_readings').select('id,meter_id,reading_value,reading_date,status,photo_path,user_id').eq('active',true).order('server_timestamp',{ascending:false}).limit(100);if(rr.error)throw rr.error;const rows=rr.data||[];
      const ids=[...new Set(rows.map(r=>r.user_id).filter(Boolean))];let prof=[];if(ids.length){const pr=await sb.from('profiles').select('id,name,full_name,email').in('id',ids);if(pr.error)throw pr.error;prof=pr.data||[];}const pm=new Map(prof.map(p=>[p.id,p]));const mm=new Map(meters.map(m=>[m.id,m]));
      const cams=[...new Set(meters.map(cammName))].sort(sortCamm);const filter=$('#bt-admin-filter');filter.innerHTML='<option value="all">Todos os CAMMs</option>'+cams.map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join('');
      const render=()=>{const f=filter.value;const data=rows.filter(r=>f==='all'||cammName(mm.get(r.meter_id))===f);$('#bt-kpi-total').textContent=rows.length;$('#bt-kpi-pending').textContent=rows.filter(r=>String(r.status).toLowerCase()==='pendente').length;$('#bt-kpi-photo').textContent=rows.filter(r=>!!r.photo_path).length;$('#bt-admin-body').innerHTML=data.length?data.map(r=>{const m=mm.get(r.meter_id)||{};const p=pm.get(r.user_id)||{};return `<tr><td>${new Date(r.reading_date).toLocaleString('pt-BR')}</td><td><span class="bt-v4-pill">${esc(cammName(m))}</span></td><td>${esc(m.name||m.code||'—')}</td><td><strong>${Number(r.reading_value).toLocaleString('pt-BR')} ${esc(m.unit||'')}</strong></td><td>${esc(p.full_name||p.name||p.email||'—')}</td><td>${esc(r.status||'pendente')}</td><td>${r.photo_path?'📷 Sim':'—'}</td></tr>`}).join(''):'<tr><td colspan="7" class="bt-v4-empty">Nenhum apontamento encontrado.</td></tr>';};
      filter.onchange=render;render();
    }catch(e){console.error('[BIOTROP] PCM utility',e);$('#bt-admin-body').innerHTML=`<tr><td colspan="7" class="bt-v4-empty">Não foi possível carregar os apontamentos. ${esc(e?.message||'Erro desconhecido')}</td></tr>`;}
  }

  function apply(){
    const s=getState();if(!s?.currentUser)return;
    document.body.classList.add('bt-tech-v4');
    if(isTech()){
      sidebar();
      if(s.activeArea==='home')techHome();
      if(s.activeArea==='utilidades'){nav('home');setTimeout(openWizard,80);}
    }else if(isManager()){
      pcmView();
    }
  }

  let last='';
  function tick(){const s=getState();const key=`${s?.currentUser?.id||s?.currentUser?.dbId||''}|${s?.activeArea||''}|${role()}`;if(key!==last){last=key;setTimeout(apply,60);} }
  const start=()=>{tick();setInterval(tick,700);};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
