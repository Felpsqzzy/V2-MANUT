/* BIOTROP FINAL UI FIX — executado por último pelo Service Worker */
(() => {
  'use strict';
  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => [...r.querySelectorAll(s)];
  const client = () => window.SB || null;
  let user = null;
  let meters = [];

  const css = document.createElement('style');
  css.textContent = `
    .v12-float,.bt-floating-actions,.bt-context-toolbar,.bt-float-theme,.bt-settings-inline{display:none!important}
    .bt-final-modal{position:fixed!important;inset:0!important;z-index:999999!important;display:flex!important;align-items:center!important;justify-content:center!important;padding:24px!important;background:rgba(2,18,18,.82)!important;backdrop-filter:blur(9px)!important}
    .bt-final-dialog{width:min(760px,calc(100vw - 32px));max-height:88vh;overflow:auto;background:#0b2929;color:#effaf5;border:1px solid rgba(140,220,202,.18);border-radius:20px;box-shadow:0 35px 90px rgba(0,0,0,.5);padding:24px;font-family:system-ui,sans-serif}
    .bt-final-dialog h2{margin:0;font-size:23px}.bt-final-dialog .sub{margin:7px 0 22px;color:#82aaa0;font-size:13px}.bt-final-head{display:flex;justify-content:space-between;gap:16px}.bt-final-x{width:36px;height:36px;border:0;border-radius:10px;background:#123536;color:#dff6ef;font-size:22px;cursor:pointer}
    .bt-final-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.bt-final-grid .full{grid-column:1/-1}.bt-final-grid label{display:flex;flex-direction:column;gap:7px;color:#9bc0b6;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.05em}.bt-final-grid input,.bt-final-grid select,.bt-final-grid textarea{width:100%;border:1px solid rgba(140,220,202,.16);border-radius:10px;background:#061e1f;color:#effaf5;padding:11px 12px;font:600 14px system-ui;outline:0;text-transform:none;letter-spacing:0}.bt-final-grid input:focus,.bt-final-grid select:focus,.bt-final-grid textarea:focus{border-color:#39c99a;box-shadow:0 0 0 3px rgba(57,201,154,.1)}.bt-final-grid select option{background:#092323}.bt-final-footer{display:flex;justify-content:flex-end;gap:10px;border-top:1px solid rgba(140,220,202,.12);padding-top:16px;margin-top:20px}.bt-final-btn{border:0;border-radius:10px;padding:11px 16px;font-weight:800;cursor:pointer}.bt-final-btn.primary{background:#39c99a;color:#06241e}.bt-final-btn.ghost{background:transparent;color:#b9d9d0;border:1px solid rgba(140,220,202,.18)}.bt-final-btn:disabled{opacity:.55;cursor:wait}
    .bt-final-photo{display:grid;grid-template-columns:150px 1fr;gap:18px;align-items:start}.bt-final-avatar{width:150px;height:150px;border-radius:22px;overflow:hidden;display:grid;place-items:center;background:linear-gradient(135deg,#0d6f59,#3ac99a);font-size:48px;font-weight:900}.bt-final-avatar img{width:100%;height:100%;object-fit:cover}.bt-final-file{border:1px dashed rgba(57,201,154,.3);padding:14px;border-radius:12px;color:#9bc0b6}.bt-final-file input{margin-top:8px}.bt-final-toast{position:fixed;right:22px;top:22px;z-index:1000000;background:#0b2929;border:1px solid rgba(140,220,202,.2);border-radius:12px;padding:12px 15px;color:#effaf5;box-shadow:0 18px 45px rgba(0,0,0,.35);font:700 13px system-ui;opacity:0;transform:translateY(-8px);transition:.2s}.bt-final-toast.show{opacity:1;transform:none}.bt-final-toast.error{border-color:rgba(255,100,100,.4)}
    @media(max-width:650px){.bt-final-grid{grid-template-columns:1fr}.bt-final-grid .full{grid-column:auto}.bt-final-photo{grid-template-columns:1fr}.bt-final-avatar{margin:auto}.bt-final-footer{flex-direction:column-reverse}.bt-final-btn{width:100%}}
  `;
  document.head.appendChild(css);

  function toast(msg, error=false){ let t=$('.bt-final-toast'); if(!t){t=document.createElement('div');t.className='bt-final-toast';document.body.appendChild(t)} t.textContent=msg;t.classList.toggle('error',error);t.classList.add('show');clearTimeout(t._x);t._x=setTimeout(()=>t.classList.remove('show'),3000); }
  function closeLegacy(){
    $$('.v12-float,.bt-floating-actions,.bt-context-toolbar,.bt-float-theme,.bt-settings-inline,.bt-v10-modal-backdrop').forEach(x=>x.remove());
    $$('.training-modal').forEach(x=>{ if(x.classList.contains('v12-settings') || $('.v12-settings',x)) x.remove(); });
    $$('.modal-backdrop').forEach(x=>{ const tx=(x.textContent||'').replace(/\s+/g,' ').trim(); if(/Configurações|Modo escuro|Modo claro|Tema/i.test(tx)) x.remove(); });
    $$('button,a,[role="button"]').forEach(b=>{
      const tx=(b.innerText||b.textContent||'').replace(/\s+/g,' ').trim();
      if(/^(?:☾\s*)?Tema$/i.test(tx) || /^(?:🌙\s*)?Modo escuro$/i.test(tx) || /^(?:☀️\s*)?Modo claro$/i.test(tx) || /^⚙?\s*Configurações$/i.test(tx)) b.remove();
      const s=getComputedStyle(b); if(/^Registrar hor[ií]metro$/i.test(tx) && (s.position==='fixed'||s.position==='absolute')) b.remove();
    });
  }

  async function getUser(){
    try{const {data}=await client().auth.getSession();user=data?.session?.user||null;return user}catch(e){return null}
  }
  async function getProfile(){
    if(!user) await getUser(); if(!user) return {};
    const {data}=await client().from('profiles').select('*').eq('id',user.id).maybeSingle(); return data||{};
  }
  function modal(title,sub,body,buttons){
    $$('.bt-final-modal').forEach(x=>x.remove());
    const root=document.createElement('div');root.className='bt-final-modal';
    root.innerHTML=`<section class="bt-final-dialog"><div class="bt-final-head"><div><h2>${title}</h2><div class="sub">${sub}</div></div><button class="bt-final-x" data-close>×</button></div>${body}<div class="bt-final-footer">${buttons}</div></section>`;
    root.addEventListener('click',e=>{if(e.target===root||e.target.closest('[data-close]'))root.remove()});document.body.appendChild(root);return root;
  }

  async function settings(){
    closeLegacy();
    const p=await getProfile();
    const initial=p.avatar_url?`<img src="${p.avatar_url}" alt="Foto">`:(p.name||'U').charAt(0).toUpperCase();
    const root=modal('Configurações do usuário','Perfil, notificações e segurança — sem configuração de tema.','<div class="bt-final-photo"><div class="bt-final-avatar" id="final-avatar">'+initial+'</div><div class="bt-final-file"><b>Foto de perfil</b><div>Escolha uma nova foto para o seu perfil.</div><input id="final-photo" type="file" accept="image/png,image/jpeg,image/webp"></div></div><div class="bt-final-grid" style="margin-top:18px"><label>Nome<input id="final-name"></label><label>E-mail<input id="final-email" disabled></label><label>Telefone<input id="final-phone"></label><label style="justify-content:center"><span><input id="final-notify" type="checkbox" style="width:auto;margin-right:8px"> Receber notificações</span></label><label>Nova senha<input id="final-pass" type="password" placeholder="Deixe vazio para manter"></label><label>Confirmar senha<input id="final-pass2" type="password" placeholder="Repita a senha"></label></div>','<button class="bt-final-btn ghost" data-close>Fechar</button><button id="final-save-settings" class="bt-final-btn primary">Salvar alterações</button>');
    $('#final-name',root).value=p.name||p.full_name||'';$('#final-email',root).value=p.email||user?.email||'';$('#final-phone',root).value=p.phone||'';$('#final-notify',root).checked=p.notifications_enabled!==false;
    $('#final-photo',root).onchange=e=>{const f=e.target.files?.[0];if(!f)return;if(f.size>5*1024*1024){toast('Foto acima de 5 MB.',true);e.target.value='';return}$('#final-avatar',root).innerHTML=`<img src="${URL.createObjectURL(f)}" alt="Foto">`};
    $('#final-save-settings',root).onclick=async()=>{
      const name=$('#final-name',root).value.trim(),phone=$('#final-phone',root).value.trim(),pass=$('#final-pass',root).value,pass2=$('#final-pass2',root).value,file=$('#final-photo',root).files?.[0];
      if(!name)return toast('Informe o nome.',true);if(pass!==pass2)return toast('As senhas não conferem.',true);
      const btn=$('#final-save-settings',root);btn.disabled=true;btn.textContent='Salvando…';
      try{
        let avatar_url=p.avatar_url||null;
        if(file){const ext=(file.name.split('.').pop()||'jpg').toLowerCase(),path=`${user.id}/profile-${Date.now()}.${ext}`;const up=await client().storage.from('profile-pictures').upload(path,file,{upsert:true,contentType:file.type});if(up.error)throw up.error;avatar_url=client().storage.from('profile-pictures').getPublicUrl(path).data.publicUrl}
        const upd=await client().from('profiles').update({name,full_name:name,phone,avatar_url,notifications_enabled:$('#final-notify',root).checked,updated_at:new Date().toISOString()}).eq('id',user.id);if(upd.error)throw upd.error;
        if(pass){const pw=await client().auth.updateUser({password:pass});if(pw.error)throw pw.error}
        root.remove();paintUser({name,full_name:name,avatar_url});toast('Configurações salvas.');
      }catch(e){toast(e.message||'Erro ao salvar.',true)}finally{btn.disabled=false;btn.textContent='Salvar alterações'}
    };
  }
  function paintUser(p){const name=p.name||p.full_name||'Usuário';$$('.user-name').forEach(x=>x.textContent=name);$$('.user-avatar').forEach(x=>{x.innerHTML=p.avatar_url?`<img src="${p.avatar_url}" alt="Foto">`:name.charAt(0).toUpperCase()})}

  async function loadMeters(){const r=await client().from('utility_meters').select('*').eq('active',true).order('name');if(r.error)throw r.error;meters=r.data||[];return meters}
  async function registerReading(){
    closeLegacy();
    try{await loadMeters()}catch(e){return toast('Erro ao carregar medidores: '+e.message,true)}
    if(!meters.length)return toast('Nenhum medidor cadastrado. Use “Cadastrar medidor” primeiro.',true);
    const options=meters.map(m=>`<option value="${m.id}">${m.name} · ${m.code} · ${m.unit}</option>`).join('');
    const root=modal('Registrar apontamento','Leitura vinculada ao medidor, usuário, data/hora e evidência fotográfica.','<div class="bt-final-grid"><label class="full">Medidor / equipamento<select id="final-meter">'+options+'</select></label><label>Leitura atual<input id="final-value" type="number" min="0" step="0.001"></label><label>Localização<input id="final-location" readonly value="Obtendo localização…"></label><label class="full">Observação<textarea id="final-note" rows="3" placeholder="Opcional"></textarea></label><label class="full">Evidência fotográfica<input id="final-reading-photo" type="file" accept="image/*" capture="environment"><small style="color:#759b91;text-transform:none;letter-spacing:0">A foto do marcador é obrigatória.</small></label></div>','<button class="bt-final-btn ghost" data-close>Cancelar</button><button id="final-save-reading" class="bt-final-btn primary">Salvar apontamento</button>');
    navigator.geolocation?.getCurrentPosition(pos=>$('#final-location',root).value=`${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`,()=>$('#final-location',root).value='Não disponível',{enableHighAccuracy:true,timeout:6000});
    $('#final-save-reading',root).onclick=async()=>{
      const meterId=$('#final-meter',root).value,value=Number($('#final-value',root).value),photo=$('#final-reading-photo',root).files?.[0],meter=meters.find(m=>m.id===meterId);
      if(!Number.isFinite(value))return toast('Informe a leitura atual.',true);if(!photo)return toast('A foto do marcador é obrigatória.',true);if(photo.size>10*1024*1024)return toast('A foto deve ter até 10 MB.',true);
      const btn=$('#final-save-reading',root);btn.disabled=true;btn.textContent='Salvando…';
      try{
        const last=await client().from('utility_readings').select('reading_value').eq('meter_id',meterId).order('reading_date',{ascending:false}).limit(1).maybeSingle();if(last.error)throw last.error;const previous=Number(last.data?.reading_value??meter.initial_reading??0),consumption=value-previous;if(consumption<0)throw new Error('A leitura atual não pode ser menor que a anterior.');
        const ext=(photo.name.split('.').pop()||'jpg').toLowerCase(),path=`${user.id}/${meterId}/${Date.now()}.${ext}`;const up=await client().storage.from('utility-evidence').upload(path,photo,{upsert:false,contentType:photo.type});if(up.error)throw up.error;
        const loc=$('#final-location',root).value.split(',').map(Number);const ins=await client().from('utility_readings').insert({meter_id:meterId,user_id:user.id,reading_value:value,previous_reading:previous,consumption,reading_date:new Date().toISOString(),server_timestamp:new Date().toISOString(),latitude:Number.isFinite(loc[0])?loc[0]:null,longitude:Number.isFinite(loc[1])?loc[1]:null,status:'pendente',observation:$('#final-note',root).value.trim()||null,photo_path:path,captured_at:new Date().toISOString()});if(ins.error)throw ins.error;
        root.remove();toast('Apontamento salvo no banco de dados.');if(typeof render==='function')render();
      }catch(e){toast(e.message||'Erro ao salvar apontamento.',true)}finally{btn.disabled=false;btn.textContent='Salvar apontamento'}
    };
  }
  function registerMeter(){
    closeLegacy();
    const root=modal('Cadastrar medidor','Cadastre o equipamento uma vez para liberar os apontamentos.','<div class="bt-final-grid"><label>Nome<input id="fm-name" placeholder="Ex.: Horímetro Compressor 01"></label><label>Código<input id="fm-code" placeholder="Ex.: COMP-001"></label><label>Tipo<select id="fm-type"><option value="horimetro">Horímetro</option><option value="agua">Água</option><option value="gas">Gás</option><option value="energia">Energia</option></select></label><label>Unidade<input id="fm-unit" value="h"></label><label class="full">Local / equipamento<input id="fm-location"></label><label>Leitura inicial<input id="fm-initial" type="number" min="0" step="0.001" value="0"></label></div>','<button class="bt-final-btn ghost" data-close>Cancelar</button><button id="fm-save" class="bt-final-btn primary">Salvar medidor</button>');
    $('#fm-type',root).onchange=e=>$('#fm-unit',root).value=e.target.value==='agua'?'m³':e.target.value==='gas'?'Nm³':e.target.value==='energia'?'kWh':'h';
    $('#fm-save',root).onclick=async()=>{const p={name:$('#fm-name',root).value.trim(),code:$('#fm-code',root).value.trim(),utility_type:$('#fm-type',root).value,unit:$('#fm-unit',root).value.trim()||'h',location:$('#fm-location',root).value.trim(),initial_reading:Number($('#fm-initial',root).value||0),active:true};if(!p.name||!p.code)return toast('Informe nome e código.',true);const b=$('#fm-save',root);b.disabled=true;b.textContent='Salvando…';try{const r=await client().from('utility_meters').insert(p);if(r.error)throw r.error;root.remove();toast('Medidor cadastrado e disponível para apontamento.');if(typeof render==='function')render()}catch(e){toast(e.message||'Erro ao cadastrar medidor.',true)}finally{b.disabled=false;b.textContent='Salvar medidor'}};
  }

  function bind(){
    closeLegacy();
    $$('button,a,[role="button"]').forEach(el=>{
      const tx=(el.innerText||el.textContent||'').replace(/\s+/g,' ').trim();
      if(/^(?:☾\s*)?Tema$/i.test(tx)||/^(?:🌙\s*)?Modo escuro$/i.test(tx)||/^(?:☀️\s*)?Modo claro$/i.test(tx)||/^⚙?\s*Configurações$/i.test(tx))el.remove();
    });
  }
  document.addEventListener('click',async e=>{
    const target=e.target.closest?.('button,a,[role="button"]');if(!target)return;
    const tx=(target.innerText||target.textContent||'').replace(/\s+/g,' ').trim();
    if(target.closest('.user-chip')){e.preventDefault();e.stopImmediatePropagation();await settings();return}
    if(/^\+?\s*Cadastrar medidor$/i.test(tx)){e.preventDefault();e.stopImmediatePropagation();await registerMeter();return}
    if(/^Registrar (?:leitura|hor[ií]metro)$/i.test(tx)){e.preventDefault();e.stopImmediatePropagation();await registerReading();return}
  },true);
  const observer=new MutationObserver(()=>bind());observer.observe(document.documentElement,{childList:true,subtree:true});
  const start=async()=>{bind();user=await getUser();if(user){const p=await getProfile();paintUser(p)}};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
