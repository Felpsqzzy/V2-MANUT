(() => {
  'use strict';

  if (typeof SB === 'undefined' || typeof STATE === 'undefined') return;

  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmt = v => Number(v).toLocaleString('pt-BR', { maximumFractionDigits: 3 });
  const icon = (name, size = 22) => typeof window.icon === 'function' ? window.icon(name, size) : '';
  let technician = false;
  let ctx = null;
  let step = 'home';
  let selectedType = null;
  let selectedUnit = null;
  let selectedMeter = null;
  let optionalPhoto = null;
  let busy = false;

  async function init() {
    try {
      const { data } = await SB.rpc('get_my_access_context');
      ctx = data || {};
      const perms = new Set(ctx.permissions || []);
      const roleText = [...(ctx.roles || []).map(r => `${r.code || ''} ${r.name || ''}`), STATE.currentUser?.role || '', STATE.currentUser?.perfilId || ''].join(' ').toLowerCase();
      technician = /tecnic|technician/.test(roleText) || (perms.has('readings.create') && !perms.has('readings.view_all') && !perms.has('meters.manage') && !perms.has('users.view'));
      if (technician) {
        await loadMeters();
        applyTechnicianShell();
        routeRender();
      }
    } catch (e) {
      console.warn('[TECH UI]', e);
    }
  }

  async function loadMeters() {
    const { data, error } = await SB.from('v_utility_meter_status').select('*').eq('active', true).order('unit_sort_order').order('utility_type').order('name');
    if (!error) window.__biotropMeters = data || [];
  }

  function applyTechnicianShell() {
    if (!document.getElementById('utility-tech-css')) {
      const style = document.createElement('style');
      style.id = 'utility-tech-css';
      style.textContent = `
        .tech-shell-home{max-width:980px;margin:0 auto;padding:36px 28px 60px}
        .tech-greeting{font-size:15px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#0a8f70;margin-bottom:10px}
        .tech-home-title{font-size:clamp(36px,5vw,62px);line-height:1.02;margin:0;color:#073f42;letter-spacing:-.04em}
        .tech-home-sub{font-size:18px;color:#667773;margin:16px 0 34px;max-width:620px}
        .tech-start{width:min(100%,720px);border:0;border-radius:24px;padding:30px;text-align:left;background:linear-gradient(135deg,#003f42,#00645b);color:#fff;cursor:pointer;box-shadow:0 18px 42px rgba(0,63,66,.18);transition:.2s}
        .tech-start:hover{transform:translateY(-2px)}
        .tech-start strong{display:block;font-size:26px;margin-bottom:7px}.tech-start span{opacity:.8;font-size:15px}
        .tech-utility-wrap{max-width:1000px;margin:0 auto;padding:28px}
        .tech-eyebrow{font-size:12px;font-weight:900;letter-spacing:.14em;text-transform:uppercase;color:#078c70;margin-bottom:8px}
        .tech-title{font-size:42px;line-height:1.05;color:#073f42;margin:0 0 8px;letter-spacing:-.035em}.tech-sub{color:#70807b;margin:0 0 26px}
        .tech-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
        .tech-option{border:1px solid #dce7e3;background:#fff;border-radius:18px;padding:22px;display:flex;align-items:center;gap:16px;text-align:left;cursor:pointer;box-shadow:0 7px 22px rgba(20,50,45,.05);transition:.18s}
        .tech-option:hover{border-color:#70c9ad;transform:translateY(-1px)}
        .tech-option .tech-icon{width:48px;height:48px;border-radius:14px;background:#eaf8f2;color:#087b64;display:grid;place-items:center;flex:none}
        .tech-option strong{display:block;font-size:18px;color:#103f3d}.tech-option small{display:block;color:#82908c;margin-top:4px}
        .tech-back{border:0;background:transparent;color:#087b64;font-weight:800;cursor:pointer;padding:0;margin-bottom:20px}
        .tech-card{background:#fff;border:1px solid #e0ebe7;border-radius:20px;padding:24px;max-width:620px;box-shadow:0 12px 34px rgba(20,50,45,.06)}
        .tech-label{font-size:12px;text-transform:uppercase;letter-spacing:.1em;font-weight:900;color:#71827d}.tech-last{margin:6px 0 18px;color:#53635f}
        .tech-input{width:100%;box-sizing:border-box;border:1px solid #cddbd6;border-radius:14px;padding:15px;font-size:22px;outline:none}.tech-input:focus{border-color:#2aaa87;box-shadow:0 0 0 3px rgba(42,170,135,.12)}
        .tech-submit{margin-top:16px;width:100%;border:0;border-radius:14px;background:#007c63;color:#fff;padding:15px;font-size:16px;font-weight:900;cursor:pointer}.tech-submit:disabled{opacity:.55;cursor:not-allowed}
        .tech-photo{margin-top:15px;font-size:13px;color:#63736e}.tech-photo input{margin-top:8px;width:100%}
        .tech-empty{padding:30px;background:#f7faf9;border-radius:16px;color:#687873}
        @media(max-width:760px){.tech-list{grid-template-columns:1fr}.tech-utility-wrap,.tech-shell-home{padding:24px 16px 40px}.tech-title{font-size:34px}.tech-home-title{font-size:42px}}
        @media(min-width:769px){.tech-mode .sidebar{position:fixed;left:0;top:0;height:100vh;box-sizing:border-box;z-index:50}.tech-mode .main-area{margin-left:240px;width:calc(100% - 240px)}}
      `;
      document.head.appendChild(style);
    }
    document.body.classList.add('tech-mode');
    const nav = document.getElementById('sidebar-nav');
    if (nav) {
      nav.innerHTML = `
        <button class="nav-item active" data-tech-nav="home">${icon('home',18)}<span>Início</span></button>
        <button class="nav-item" data-tech-nav="utilidades">${icon('gauge',18)}<span>Apontamentos</span></button>`;
      nav.onclick = e => {
        const b = e.target.closest('[data-tech-nav]');
        if (!b) return;
        const target = b.dataset.techNav;
        step = target === 'home' ? 'home' : 'type';
        selectedType = selectedUnit = selectedMeter = null;
        updateTechNav(target);
        routeRender();
      };
    }
    const title = document.querySelector('.sb-sub');
    if (title) title.textContent = 'Operação';
  }

  function updateTechNav(active) {
    document.querySelectorAll('[data-tech-nav]').forEach(b => b.classList.toggle('active', b.dataset.techNav === active));
  }

  function routeRender() {
    if (!technician) return;
    const main = document.getElementById('main-content');
    if (!main) return;
    main.innerHTML = step === 'home' ? renderHome() : renderUtility();
    bind();
  }

  function renderHome() {
    const name = STATE.currentUser?.nome?.split(' ')[0] || 'Técnico';
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
    return `<section class="tech-shell-home">
      <div class="tech-greeting">${greeting}, ${esc(name)}</div>
      <h1 class="tech-home-title">Tudo pronto para o apontamento?</h1>
      <p class="tech-home-sub">Registre a leitura da água, gás, energia ou horímetro da planta de forma rápida e simples.</p>
      <button class="tech-start" data-action="start"><strong>Fazer apontamento</strong><span>Escolher utilidade → CAMM → medidor → leitura</span></button>
    </section>`;
  }

  function unitsForType(type) {
    const source = (window.__biotropMeters || []).filter(m => m.active !== false && m.utility_type === type);
    const map = new Map();
    source.forEach(m => { const key = m.unit_id || m.unit_name || m.location || 'Sem unidade'; if (!map.has(key)) map.set(key, {id:m.unit_id || key,name:m.unit_name || m.location || 'Sem unidade',meters:[]}); map.get(key).meters.push(m); });
    return [...map.values()].sort((a,b)=>String(a.name).localeCompare(String(b.name),'pt-BR'));
  }

  function metersFor(type, unit) {
    return (window.__biotropMeters || []).filter(m => m.active !== false && m.utility_type === type && (m.unit_id || m.unit_name || m.location || 'Sem unidade') === unit.id);
  }

  function renderUtility() {
    const types = [['agua','droplets','Água','Leitura em m³'],['gas','flame','Gás','Leitura de consumo'],['energia','zap','Energia','Leitura em kWh'],['horimetro','gauge','Horímetro','Horas do equipamento']];
    if (step === 'type') return `<section class="tech-utility-wrap"><div class="tech-eyebrow">Utilidades</div><h1 class="tech-title">O que você vai apontar?</h1><p class="tech-sub">Escolha uma opção para continuar.</p><div class="tech-list">${types.map(([id,ic,label,sub])=>`<button class="tech-option" data-type="${id}"><span class="tech-icon">${icon(ic,24)}</span><span><strong>${label}</strong><small>${sub}</small></span></button>`).join('')}</div></section>`;
    if (step === 'unit') { const units=unitsForType(selectedType); return `<section class="tech-utility-wrap"><button class="tech-back" data-back="type">← Voltar</button><div class="tech-eyebrow">${esc(labelType(selectedType))}</div><h1 class="tech-title">Escolha o CAMM</h1><p class="tech-sub">Selecione a unidade onde está o medidor.</p><div class="tech-list">${units.length ? units.map(u=>`<button class="tech-option" data-unit="${esc(u.id)}"><span class="tech-icon">${icon('factory',22)}</span><span><strong>${esc(u.name)}</strong><small>${u.meters.length} medidor(es)</small></span></button>`).join('') : '<div class="tech-empty">Nenhum CAMM disponível para esta utilidade.</div>'}</div></section>`; }
    if (step === 'meter') { const meters=metersFor(selectedType,selectedUnit); return `<section class="tech-utility-wrap"><button class="tech-back" data-back="unit">← Voltar para CAMMs</button><div class="tech-eyebrow">${esc(selectedUnit?.name || '')}</div><h1 class="tech-title">Escolha o medidor</h1><p class="tech-sub">Selecione o medidor que você está lendo.</p><div class="tech-list">${meters.length ? meters.map(m=>`<button class="tech-option" data-meter="${m.id}"><span class="tech-icon">${icon(m.utility_type==='agua'?'droplets':m.utility_type==='gas'?'flame':m.utility_type==='energia'?'zap':'gauge',22)}</span><span><strong>${esc(m.name)}</strong><small>${esc(m.code || '')}</small></span></button>`).join('') : '<div class="tech-empty">Nenhum medidor cadastrado neste CAMM.</div>'}</div></section>`; }
    const last=selectedMeter?.last_reading_value ?? selectedMeter?.reading_value ?? null;
    return `<section class="tech-utility-wrap"><button class="tech-back" data-back="meter">← Voltar para medidores</button><div class="tech-eyebrow">${esc(selectedUnit?.name || '')}</div><h1 class="tech-title">Registrar leitura</h1><p class="tech-sub">${esc(selectedMeter?.name || '')}</p><div class="tech-card"><div class="tech-label">Última leitura</div><div class="tech-last">${last===null||last===undefined?'Primeiro apontamento':`${fmt(last)} ${esc(selectedMeter.unit || '')}`}</div><label class="tech-label" for="tech-reading">Nova leitura</label><input id="tech-reading" class="tech-input" type="number" step="any" min="0" inputmode="decimal" placeholder="Digite a leitura"><div class="tech-photo">Foto da medição <strong>(opcional)</strong><input id="tech-photo" type="file" accept="image/*" capture="environment"></div><button class="tech-submit" data-action="save">Salvar apontamento</button></div></section>`;
  }

  function labelType(t){return ({agua:'Água',gas:'Gás',energia:'Energia',horimetro:'Horímetro'})[t] || t;}

  function bind() {
    document.querySelector('[data-action="start"]')?.addEventListener('click',()=>{step='type';updateTechNav('utilidades');routeRender();});
    document.querySelectorAll('[data-type]').forEach(b=>b.addEventListener('click',()=>{selectedType=b.dataset.type;step='unit';routeRender();}));
    document.querySelectorAll('[data-unit]').forEach(b=>b.addEventListener('click',()=>{selectedUnit=unitsForType(selectedType).find(u=>String(u.id)===String(b.dataset.unit));step='meter';routeRender();}));
    document.querySelectorAll('[data-meter]').forEach(b=>b.addEventListener('click',()=>{selectedMeter=(window.__biotropMeters||[]).find(m=>String(m.id)===String(b.dataset.meter));step='reading';routeRender();}));
    document.querySelectorAll('[data-back]').forEach(b=>b.addEventListener('click',()=>{step=b.dataset.back;routeRender();}));
    document.querySelector('[data-action="save"]')?.addEventListener('click',saveReading);
    document.querySelector('#tech-photo')?.addEventListener('change',e=>{optionalPhoto=e.target.files?.[0] || null;});
  }

  async function saveReading(){
    if(busy||!selectedMeter)return;
    const input=document.querySelector('#tech-reading'); const value=Number(input?.value);
    if(!Number.isFinite(value)||value<0){alert('Informe uma leitura válida.');return;}
    const last=selectedMeter.last_reading_value ?? selectedMeter.reading_value;
    if(last!==null&&last!==undefined&&value<Number(last)){alert(`A leitura não pode ser menor que a anterior (${fmt(last)}).`);return;}
    busy=true; const btn=document.querySelector('[data-action="save"]'); if(btn){btn.disabled=true;btn.textContent='Salvando...';}
    try{
      let photoPath=null;
      if(optionalPhoto){const ext=(optionalPhoto.name.split('.').pop()||'jpg').toLowerCase().replace(/[^a-z0-9]/g,'')||'jpg';const uid=STATE.currentUser?.id||'user';photoPath=`${uid}/${selectedMeter.id}/${Date.now()}.${ext}`;const upload=await SB.storage.from('utility-evidence').upload(photoPath,optionalPhoto,{upsert:false,contentType:optionalPhoto.type||'image/jpeg'});if(upload.error)throw upload.error;}
      let latitude=null,longitude=null;
      if(navigator.geolocation){try{const pos=await new Promise((resolve,reject)=>navigator.geolocation.getCurrentPosition(resolve,reject,{enableHighAccuracy:true,timeout:5000,maximumAge:0}));latitude=pos.coords.latitude;longitude=pos.coords.longitude;}catch(_){} }
      const {error}=await SB.rpc('create_utility_reading',{p_meter_id:selectedMeter.id,p_reading_value:value,p_observation:null,p_photo_path:photoPath,p_latitude:latitude,p_longitude:longitude});
      if(error)throw error;
      alert('Apontamento registrado com sucesso.');
      await loadMeters(); optionalPhoto=null; selectedType=selectedUnit=selectedMeter=null; step='home'; updateTechNav('home'); routeRender();
    }catch(e){console.error(e);alert(`Não foi possível salvar o apontamento. ${e.message||''}`);}finally{busy=false;}
  }

  init();
})();
