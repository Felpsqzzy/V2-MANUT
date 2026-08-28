(() => {
  'use strict';
  if (window.__BIOTROP_UTILITY_READING_V2__) return;
  window.__BIOTROP_UTILITY_READING_V2__ = true;

  const $ = (s,r=document)=>r.querySelector(s);
  const esc = v => String(v ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const sb = ()=>window.SB || window.supabaseClient || null;
  let stream=null;

  const css=document.createElement('style');
  css.textContent=`
    .ur2-modal{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;padding:18px;background:rgba(0,28,31,.78);backdrop-filter:blur(7px)}
    .ur2-dialog{width:min(780px,100%);max-height:94vh;overflow:auto;background:#fff;color:#17332b;border-radius:18px;padding:24px;box-shadow:0 30px 100px rgba(0,0,0,.4);font-family:system-ui,-apple-system,Segoe UI,sans-serif}
    .ur2-head{display:flex;justify-content:space-between;gap:14px;margin-bottom:18px}.ur2-head h2{margin:0;color:#003c41}.ur2-head p{margin:5px 0 0;color:#6b7a75;font-size:13px}.ur2-x{border:0;border-radius:9px;width:36px;height:36px;font-size:22px;cursor:pointer;background:#edf4f1;color:#23483e}
    .ur2-grid{display:grid;grid-template-columns:1fr 1fr;gap:13px}.ur2-full{grid-column:1/-1}.ur2-field{display:flex;flex-direction:column;gap:6px}.ur2-field label{font-size:12px;font-weight:800;color:#47645a}.ur2-field input,.ur2-field textarea{width:100%;box-sizing:border-box;border:1px solid #d6e4de;border-radius:10px;padding:11px 12px;background:#fbfdfc;color:#17332b;font:14px system-ui}.ur2-field input:focus,.ur2-field textarea:focus{outline:0;border-color:#1a8f6b;box-shadow:0 0 0 3px rgba(26,143,107,.1)}
    .ur2-info{background:#eef8f3;border-radius:11px;padding:12px;color:#33584c;font-size:13px}.ur2-info strong{display:block;font-size:17px;color:#003c41;margin-top:3px}.ur2-info small{display:block;margin-top:3px}
    .ur2-evidence{border:1px dashed #bcd7cc;border-radius:14px;padding:14px;margin-top:15px}.ur2-title{font-weight:800;color:#003c41}.ur2-sub{font-size:12px;color:#6b7a75;margin:3px 0 12px}.ur2-video,.ur2-img{display:none;width:100%;max-height:330px;object-fit:contain;border-radius:10px;background:#082426}.ur2-img{margin-top:10px;background:#eef4f1}.ur2-actions{display:flex;gap:8px;flex-wrap:wrap}.ur2-btn{border:0;border-radius:9px;padding:10px 14px;font-weight:800;cursor:pointer}.ur2-secondary{background:#edf4f1;color:#23483e}.ur2-primary{background:#003c41;color:#fff}.ur2-msg{font-size:12px;margin-top:9px}.ur2-footer{display:flex;justify-content:flex-end;gap:8px;margin-top:19px;padding-top:15px;border-top:1px solid #e7efeb}@media(max-width:650px){.ur2-grid{grid-template-columns:1fr}.ur2-full{grid-column:auto}.ur2-dialog{padding:17px}.ur2-footer{flex-direction:column-reverse}.ur2-btn{width:100%}}
    @media(min-width:769px){body .shell>.sidebar{position:fixed!important;left:0!important;top:0!important;bottom:0!important;height:100vh!important;z-index:1000!important;overflow:hidden}.shell>.sidebar+.main,.shell>.sidebar~.main,.shell>.sidebar~main,.shell>.sidebar~section{margin-left:240px!important;width:calc(100% - 240px)!important;min-width:0}}
  `;
  document.head.appendChild(css);

  const notify=(msg,error=false)=>{let t=$('#ur2-toast');if(!t){t=document.createElement('div');t.id='ur2-toast';t.style.cssText='position:fixed;right:18px;top:18px;z-index:2147483001;padding:12px 16px;border-radius:10px;color:#fff;font:700 13px system-ui;box-shadow:0 12px 35px rgba(0,0,0,.25)';document.body.appendChild(t)}t.textContent=msg;t.style.background=error?'#a52b2b':'#003c41';t.style.display='block';clearTimeout(t._x);t._x=setTimeout(()=>t.style.display='none',4000)};
  const stop=()=>{if(stream){stream.getTracks().forEach(t=>t.stop());stream=null}};
  const close=root=>{stop();root.remove()};
  const nowLocal=()=>{const d=new Date(Date.now()-new Date().getTimezoneOffset()*60000);return d.toISOString().slice(0,16)};

  async function loadMeters(client, selected){
    let {data,error}=await client.from('utility_meters').select('id,code,name,utility_type,location,unit,initial_reading,active').eq('active',true).order('location').order('name');
    if(error) throw error;
    data=data||[];
    if(selected && !data.some(m=>String(m.id)===String(selected))){
      const legacy=await client.from('meters').select('id,code,name,location,unit,initial_reading,status').eq('id',selected).maybeSingle();
      if(legacy.data)data.push({...legacy.data,active:true,utility_type:/kwh|energia/i.test(`${legacy.data.unit} ${legacy.data.name}`)?'energia':/m³|m3|agua|hidro/i.test(`${legacy.data.unit} ${legacy.data.name}`)?'agua':/nm³|nm3|gas/i.test(`${legacy.data.unit} ${legacy.data.name}`)?'gas':'horimetro'});
    }
    return data;
  }

  async function openReading(selected){
    const client=sb();
    if(!client)return notify('Supabase não está disponível nesta página.',true);
    const auth=await client.auth.getSession();
    const user=auth?.data?.session?.user;
    if(!user)return notify('Faça login novamente para registrar a leitura.',true);
    const meters=await loadMeters(client,selected);
    if(!meters.length)return notify('Nenhum medidor ativo cadastrado.',true);
    const root=document.createElement('div');root.className='ur2-modal';
    root.innerHTML=`<section class="ur2-dialog" role="dialog" aria-modal="true">
      <div class="ur2-head"><div><h2>Registrar leitura</h2><p>Apontamento rastreável: medição + data/hora + localização + foto do marcador.</p></div><button class="ur2-x" data-close type="button">×</button></div>
      <div class="ur2-grid">
        <div class="ur2-field ur2-full"><label>Medidor / equipamento</label><select id="ur2-meter" style="width:100%;box-sizing:border-box;border:1px solid #d6e4de;border-radius:10px;padding:11px 12px;background:#fbfdfc;color:#17332b;font:14px system-ui">${meters.map(m=>`<option value="${esc(m.id)}" ${String(m.id)===String(selected)?'selected':''}>${esc(m.name)} · ${esc(m.code||'')} · ${esc(m.unit||'')}</option>`).join('')}</select></div>
        <div class="ur2-info ur2-full" id="ur2-prev">Carregando última leitura...</div>
        <div class="ur2-field"><label>Leitura atual *</label><input id="ur2-value" type="number" min="0" step="0.001" inputmode="decimal" placeholder="Ex.: 1250.500"></div>
        <div class="ur2-field"><label>Data e hora da medição *</label><input id="ur2-date" type="datetime-local" value="${nowLocal()}"></div>
        <div class="ur2-field ur2-full"><label>Local da medição</label><input id="ur2-location" readonly value="Obtendo GPS..." placeholder="Latitude, longitude"></div>
        <div class="ur2-field ur2-full"><label>Observação</label><textarea id="ur2-note" rows="3" placeholder="Opcional"></textarea></div>
      </div>
      <div class="ur2-evidence"><div class="ur2-title">Evidência fotográfica obrigatória *</div><div class="ur2-sub">A foto deve mostrar claramente o marcador no momento da leitura.</div><video id="ur2-video" class="ur2-video" autoplay playsinline></video><img id="ur2-img" class="ur2-img" alt="Evidência da leitura"><div class="ur2-actions"><button id="ur2-camera" class="ur2-btn ur2-secondary" type="button">Abrir câmera</button><button id="ur2-take" class="ur2-btn ur2-secondary" type="button" disabled>Tirar foto</button><label class="ur2-btn ur2-secondary">Escolher foto<input id="ur2-file" type="file" accept="image/*" capture="environment" hidden></label></div><div id="ur2-msg" class="ur2-msg" style="color:#a52b2b">Nenhuma foto selecionada.</div></div>
      <div class="ur2-footer"><button class="ur2-btn ur2-secondary" data-close type="button">Cancelar</button><button id="ur2-save" class="ur2-btn ur2-primary" type="button">Salvar apontamento</button></div>
    </section>`;
    document.body.appendChild(root);

    const meterEl=$('#ur2-meter',root),prevEl=$('#ur2-prev',root),valueEl=$('#ur2-value',root),dateEl=$('#ur2-date',root),locEl=$('#ur2-location',root),fileEl=$('#ur2-file',root),img=$('#ur2-img',root),video=$('#ur2-video',root),msg=$('#ur2-msg',root);let photo=null;
    const meter=()=>meters.find(m=>String(m.id)===String(meterEl.value));
    const loadPrev=async()=>{const m=meter();if(!m)return;const q=await client.from('utility_readings').select('reading_value,reading_date').eq('meter_id',m.id).order('reading_date',{ascending:false}).limit(1).maybeSingle();if(q.error){prevEl.textContent='Não foi possível carregar a leitura anterior.';root.dataset.previous=String(m.initial_reading||0);return}const p=Number(q.data?.reading_value??m.initial_reading??0);root.dataset.previous=String(p);prevEl.innerHTML=`Última leitura<strong>${p.toLocaleString('pt-BR',{maximumFractionDigits:3})} ${esc(m.unit||'')}</strong><small>${q.data?.reading_date?new Date(q.data.reading_date).toLocaleString('pt-BR'):'Leitura inicial'}</small>`};
    await loadPrev();meterEl.addEventListener('change',loadPrev);
    if(navigator.geolocation){navigator.geolocation.getCurrentPosition(p=>{root.dataset.lat=p.coords.latitude;root.dataset.lng=p.coords.longitude;locEl.value=`${p.coords.latitude.toFixed(6)}, ${p.coords.longitude.toFixed(6)}`},()=>locEl.value='Localização não autorizada pelo navegador',{enableHighAccuracy:true,timeout:10000,maximumAge:0})}else locEl.value='GPS indisponível';
    const setPhoto=f=>{if(!f)return;if(f.size>15*1024*1024)return notify('A foto deve ter no máximo 15 MB.',true);photo=f;img.src=URL.createObjectURL(f);img.style.display='block';msg.textContent='Foto pronta para salvar.';msg.style.color='#146b4f'};
    fileEl.addEventListener('change',e=>setPhoto(e.target.files?.[0]));
    $('#ur2-camera',root).onclick=async()=>{if(!navigator.mediaDevices?.getUserMedia)return notify('Câmera não disponível. Use Escolher foto.',true);try{stop();stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'},width:{ideal:1280},height:{ideal:720}},audio:false});video.srcObject=stream;video.style.display='block';$('#ur2-take',root).disabled=false}catch(e){notify('Permissão da câmera negada. Você pode usar Escolher foto.',true)}};
    $('#ur2-take',root).onclick=()=>{if(!video.videoWidth)return;const c=document.createElement('canvas');c.width=video.videoWidth;c.height=video.videoHeight;c.getContext('2d').drawImage(video,0,0);c.toBlob(b=>{setPhoto(new File([b],`leitura-${Date.now()}.jpg`,{type:'image/jpeg'}));stop();video.style.display='none';$('#ur2-take',root).disabled=true},'image/jpeg',.9)};
    $('#ur2-save',root).onclick=async()=>{const m=meter(),value=Number(valueEl.value),previous=Number(root.dataset.previous||0),btn=$('#ur2-save',root);if(!m||!Number.isFinite(value))return notify('Informe a leitura atual.',true);if(value<previous)return notify(`A leitura atual não pode ser menor que ${previous}.`,true);if(!photo)return notify('A foto do marcador é obrigatória.',true);const dt=new Date(dateEl.value);if(Number.isNaN(dt.getTime()))return notify('Data/hora inválida.',true);btn.disabled=true;btn.textContent='Salvando...';try{const stamp=new Date().toISOString(),ext=(photo.name.split('.').pop()||'jpg').toLowerCase(),path=`${user.id}/${m.id}/${Date.now()}.${ext}`;const up=await client.storage.from('utility-evidence').upload(path,photo,{upsert:false,contentType:photo.type||'image/jpeg',cacheControl:'3600'});if(up.error)throw up.error;const row={meter_id:m.id,user_id:user.id,reading_value:value,previous_reading:previous,consumption:value-previous,reading_date:dt.toISOString(),server_timestamp:stamp,captured_at:stamp,latitude:root.dataset.lat?Number(root.dataset.lat):null,longitude:root.dataset.lng?Number(root.dataset.lng):null,status:'pending',observation:$('#ur2-note',root).value.trim()||null,photo_path:path,inconsistent:false,correction_requested:false};const ins=await client.from('utility_readings').insert(row).select().single();if(ins.error){await client.storage.from('utility-evidence').remove([path]);throw ins.error}close(root);notify('Apontamento registrado com sucesso.');const detail=ins.data;['biotrop:reading-saved','utility:reading-saved','utility-reading-saved'].forEach(n=>window.dispatchEvent(new CustomEvent(n,{detail})));window.dispatchEvent(new Event('utility-data-updated'));if(typeof window.refresh==='function')setTimeout(()=>window.refresh(),150);if(typeof window.render==='function')setTimeout(()=>window.render(),200)}catch(e){btn.disabled=false;btn.textContent='Salvar apontamento';notify('Erro ao salvar: '+(e.message||e),true)}};
    root.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>close(root));root.addEventListener('click',e=>{if(e.target===root)close(root)});
  }

  // Captura no window antes das rotinas antigas do documento. Usa SEMPRE o data-utility-open do botão.
  window.addEventListener('click',e=>{const b=e.target.closest?.('[data-utility-open]');if(!b)return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();openReading(b.getAttribute('data-utility-open')).catch(err=>notify('Não foi possível abrir o apontamento: '+(err.message||err),true))},true);
})();
