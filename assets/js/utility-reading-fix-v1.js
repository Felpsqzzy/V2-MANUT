(() => {
  'use strict';
  if (window.__BIOTROP_UTILITY_READING_FIX__) return;
  window.__BIOTROP_UTILITY_READING_FIX__ = true;

  const $ = (s, r = document) => r.querySelector(s);
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const sb = () => window.SB || null;
  let cameraStream = null;

  const style = document.createElement('style');
  style.textContent = `
    .ur-modal{position:fixed;inset:0;z-index:1000001;display:flex;align-items:center;justify-content:center;padding:18px;background:rgba(0,25,27,.78);backdrop-filter:blur(8px)}
    .ur-dialog{width:min(760px,100%);max-height:92vh;overflow:auto;background:#fff;color:#17332b;border-radius:18px;box-shadow:0 30px 90px rgba(0,0,0,.35);padding:24px;font-family:system-ui,-apple-system,Segoe UI,sans-serif}
    .ur-head{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;margin-bottom:20px}.ur-head h2{margin:0;color:#003c41;font-size:22px}.ur-head p{margin:6px 0 0;color:#6b7a75;font-size:13px}.ur-x{border:0;background:#eef4f1;color:#24453c;width:36px;height:36px;border-radius:9px;font-size:22px;cursor:pointer}
    .ur-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}.ur-full{grid-column:1/-1}.ur-field{display:flex;flex-direction:column;gap:6px}.ur-field label{font-size:12px;font-weight:800;color:#47645a}.ur-field input,.ur-field select,.ur-field textarea{width:100%;box-sizing:border-box;border:1px solid #d6e4de;border-radius:10px;padding:11px 12px;background:#fbfdfc;color:#17332b;font:14px system-ui;outline:0}.ur-field input:focus,.ur-field select:focus,.ur-field textarea:focus{border-color:#1a8f6b;box-shadow:0 0 0 3px rgba(26,143,107,.1)}
    .ur-prev{background:#eef8f3;border-radius:10px;padding:12px;color:#33584c;font-size:13px}.ur-prev b{display:block;color:#003c41;font-size:16px;margin-top:3px}.ur-prev small{display:block;margin-top:4px;color:#6b7a75}
    .ur-evidence{margin-top:16px;border:1px dashed #bcd7cc;border-radius:14px;padding:14px}.ur-evidence-title{font-weight:800;color:#003c41}.ur-evidence-sub{font-size:12px;color:#6b7a75;margin:3px 0 12px}.ur-camera{display:none;width:100%;max-height:320px;object-fit:cover;border-radius:10px;background:#061e1f}.ur-preview{display:none;width:100%;max-height:280px;object-fit:contain;border-radius:10px;margin-top:10px;background:#eef4f1}.ur-actions{display:flex;gap:8px;flex-wrap:wrap}.ur-btn{border:0;border-radius:9px;padding:10px 14px;font-weight:800;cursor:pointer}.ur-secondary{background:#eef4f1;color:#23483e}.ur-primary{background:#003c41;color:#fff}.ur-footer{display:flex;justify-content:flex-end;gap:8px;margin-top:20px;padding-top:16px;border-top:1px solid #e7efeb}.ur-error{margin-top:10px;color:#a52b2b;font-size:12px}.ur-ok{margin-top:10px;color:#146b4f;font-size:12px}
    @media(max-width:650px){.ur-grid{grid-template-columns:1fr}.ur-full{grid-column:auto}.ur-dialog{padding:18px}.ur-footer{flex-direction:column-reverse}.ur-btn{width:100%}}
  `;
  document.head.appendChild(style);

  function toast(msg, error = false) {
    let t = document.querySelector('#ur-toast');
    if (!t) { t = document.createElement('div'); t.id = 'ur-toast'; t.style.cssText='position:fixed;right:18px;top:18px;z-index:1000002;padding:12px 16px;border-radius:10px;background:#003c41;color:#fff;font:700 13px system-ui;box-shadow:0 12px 35px rgba(0,0,0,.25)'; document.body.appendChild(t); }
    t.textContent = msg; t.style.background = error ? '#a52b2b' : '#003c41'; t.style.display='block'; clearTimeout(t._t); t._t=setTimeout(()=>t.style.display='none',3500);
  }

  function closeModal(root){ stopCamera(); root?.remove(); }
  function stopCamera(){ if(cameraStream){cameraStream.getTracks().forEach(t=>t.stop());cameraStream=null;} }
  function localDateTime(){ const d=new Date(Date.now()-new Date().getTimezoneOffset()*60000); return d.toISOString().slice(0,16); }

  async function openReadingModal(preselectedId = null){
    const client = sb();
    if (!client) return toast('Conexão com o Supabase não encontrada.', true);
    const {data:{session}} = await client.auth.getSession();
    if (!session?.user) return toast('Faça login novamente para registrar uma leitura.', true);

    const {data:meters,error} = await client.from('utility_meters').select('id,code,name,utility_type,location,unit,initial_reading,active').eq('active',true).order('location').order('name');
    if (error) return toast('Erro ao carregar medidores: '+error.message, true);
    if (!meters?.length) return toast('Nenhum medidor ativo cadastrado.', true);

    const root=document.createElement('div'); root.className='ur-modal';
    root.innerHTML=`<section class="ur-dialog" role="dialog" aria-modal="true">
      <div class="ur-head"><div><h2>Registrar leitura</h2><p>Registre medição, data/hora, local e evidência fotográfica para alimentar o histórico e os gráficos.</p></div><button class="ur-x" type="button" data-close>×</button></div>
      <div class="ur-grid">
        <div class="ur-field ur-full"><label>Medidor / equipamento</label><select id="ur-meter">${meters.map(m=>`<option value="${esc(m.id)}" ${String(m.id)===String(preselectedId)?'selected':''}>${esc(m.name)} · ${esc(m.code)} · ${esc(m.unit||'')}</option>`).join('')}</select></div>
        <div class="ur-prev ur-full" id="ur-prev">Carregando última leitura...</div>
        <div class="ur-field"><label>Leitura atual</label><input id="ur-value" type="number" min="0" step="0.001" inputmode="decimal" required placeholder="Ex.: 1250.500"></div>
        <div class="ur-field"><label>Data e hora da medição</label><input id="ur-date" type="datetime-local" value="${localDateTime()}"></div>
        <div class="ur-field ur-full"><label>Local da medição</label><input id="ur-location" readonly value="Obtendo localização GPS..." placeholder="Localização"></div>
        <div class="ur-field ur-full"><label>Observação</label><textarea id="ur-note" rows="3" placeholder="Opcional"></textarea></div>
      </div>
      <div class="ur-evidence">
        <div class="ur-evidence-title">Evidência fotográfica obrigatória</div>
        <div class="ur-evidence-sub">A foto deve mostrar o marcador no momento da leitura.</div>
        <video id="ur-camera" class="ur-camera" autoplay playsinline></video>
        <img id="ur-preview" class="ur-preview" alt="Prévia da evidência">
        <div class="ur-actions">
          <button type="button" class="ur-btn ur-secondary" id="ur-open-camera">Abrir câmera</button>
          <button type="button" class="ur-btn ur-secondary" id="ur-take" disabled>Tirar foto</button>
          <label class="ur-btn ur-secondary">Escolher foto<input id="ur-file" type="file" accept="image/*" capture="environment" hidden></label>
        </div>
        <div id="ur-evidence-msg" class="ur-error">Nenhuma foto selecionada.</div>
      </div>
      <div class="ur-footer"><button type="button" class="ur-btn ur-secondary" data-close>Cancelar</button><button type="button" class="ur-btn ur-primary" id="ur-save">Salvar apontamento</button></div>
    </section>`;
    document.body.appendChild(root);

    const meterEl=$('#ur-meter',root), valueEl=$('#ur-value',root), dateEl=$('#ur-date',root), locEl=$('#ur-location',root), fileEl=$('#ur-file',root), preview=$('#ur-preview',root), video=$('#ur-camera',root), msg=$('#ur-evidence-msg',root);
    let photo=null;

    const loadPrevious=async()=>{
      const meter=meters.find(m=>String(m.id)===String(meterEl.value)); if(!meter)return;
      const {data,error}=await client.from('utility_readings').select('reading_value,reading_date').eq('meter_id',meter.id).order('reading_date',{ascending:false}).limit(1).maybeSingle();
      if(error){$('#ur-prev',root).innerHTML='Não foi possível carregar a leitura anterior.';return;}
      const previous=Number(data?.reading_value ?? meter.initial_reading ?? 0); root.dataset.previous=String(previous);
      $('#ur-prev',root).innerHTML=`Última leitura <b>${previous.toLocaleString('pt-BR',{maximumFractionDigits:3})} ${esc(meter.unit||'')}</b>${data?.reading_date?`<small>${new Date(data.reading_date).toLocaleString('pt-BR')}</small>`:'<small>Leitura inicial</small>'}`;
    };
    meterEl.addEventListener('change',loadPrevious); await loadPrevious();

    if(navigator.geolocation){ navigator.geolocation.getCurrentPosition(p=>{root.dataset.lat=p.coords.latitude;root.dataset.lng=p.coords.longitude;locEl.value=`${p.coords.latitude.toFixed(6)}, ${p.coords.longitude.toFixed(6)}`;},()=>{locEl.value='Localização não autorizada';},{enableHighAccuracy:true,timeout:10000,maximumAge:0}); } else locEl.value='GPS indisponível';

    const setPhoto=f=>{ if(!f)return; if(f.size>15*1024*1024){msg.textContent='A foto deve ter no máximo 15 MB.';return;} photo=f;preview.src=URL.createObjectURL(f);preview.style.display='block';msg.className='ur-ok';msg.textContent='Foto pronta para salvar.'; };
    fileEl.addEventListener('change',e=>setPhoto(e.target.files?.[0]));
    $('#ur-open-camera',root).onclick=async()=>{try{stopCamera();cameraStream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'},width:{ideal:1280},height:{ideal:720}},audio:false});video.srcObject=cameraStream;video.style.display='block';$('#ur-take',root).disabled=false;}catch(e){toast('Não foi possível abrir a câmera. Dê permissão ao navegador ou use Escolher foto.',true);}};
    $('#ur-take',root).onclick=()=>{if(!video.videoWidth)return;const c=document.createElement('canvas');c.width=video.videoWidth;c.height=video.videoHeight;c.getContext('2d').drawImage(video,0,0);c.toBlob(b=>{setPhoto(new File([b],`medicao-${Date.now()}.jpg`,{type:'image/jpeg'}));stopCamera();video.style.display='none';$('#ur-take',root).disabled=true;},'image/jpeg',.9);};

    $('#ur-save',root).onclick=async()=>{
      const meter=meters.find(m=>String(m.id)===String(meterEl.value)); const value=Number(valueEl.value); const previous=Number(root.dataset.previous||0); const btn=$('#ur-save',root);
      if(!meter||!Number.isFinite(value))return toast('Selecione o medidor e informe a leitura atual.',true);
      if(value<previous)return toast(`A leitura atual não pode ser menor que ${previous}.`,true);
      if(!photo)return toast('A foto do marcador é obrigatória.',true);
      const measuredAt=new Date(dateEl.value); if(Number.isNaN(measuredAt.getTime()))return toast('Informe uma data e hora válidas.',true);
      btn.disabled=true;btn.textContent='Salvando...';
      try{
        const stamp=new Date().toISOString(); const ext=(photo.name.split('.').pop()||'jpg').toLowerCase(); const path=`${session.user.id}/${meter.id}/${Date.now()}.${ext}`;
        const up=await client.storage.from('utility-evidence').upload(path,photo,{upsert:false,contentType:photo.type,cacheControl:'3600'}); if(up.error)throw up.error;
        const consumption=value-previous; const row={meter_id:meter.id,user_id:session.user.id,reading_value:value,previous_reading:previous,consumption,reading_date:measuredAt.toISOString(),server_timestamp:stamp,captured_at:stamp,latitude:root.dataset.lat?Number(root.dataset.lat):null,longitude:root.dataset.lng?Number(root.dataset.lng):null,status:'pending',observation:$('#ur-note',root).value.trim()||null,photo_path:path,inconsistent:false,correction_requested:false};
        const ins=await client.from('utility_readings').insert(row).select().single(); if(ins.error){await client.storage.from('utility-evidence').remove([path]);throw ins.error;}
        closeModal(root); toast('Leitura registrada com sucesso.');
        window.dispatchEvent(new CustomEvent('biotrop:reading-saved',{detail:ins.data}));
        setTimeout(()=>{ if(typeof window.refresh==='function')window.refresh(); else if(typeof window.render==='function')window.render(); },100);
      }catch(e){toast('Erro ao salvar apontamento: '+(e.message||e),true);btn.disabled=false;btn.textContent='Salvar apontamento';}
    };
    root.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>closeModal(root));
    root.addEventListener('click',e=>{if(e.target===root)closeModal(root)});
  }

  window.BIOTROP_openUtilityReading = openReadingModal;

  document.addEventListener('click',e=>{
    const button=e.target.closest('button,a,[role="button"]'); if(!button)return;
    const text=(button.innerText||button.textContent||'').replace(/\s+/g,' ').trim().toLowerCase();
    if(text.includes('registrar leitura')){
      e.preventDefault(); e.stopPropagation(); if(e.stopImmediatePropagation)e.stopImmediatePropagation();
      const meterId=button.getAttribute('data-utility-open')||null;
      openReadingModal(meterId).catch(err=>toast(err.message||'Erro ao abrir registro.',true));
    }
  },true);
})();