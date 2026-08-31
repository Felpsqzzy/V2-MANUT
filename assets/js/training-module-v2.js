/* BIOTROP — Treinamentos V2
   Gestão por grupos + upload de vídeo local + player responsivo + progresso. */
(() => {
  'use strict';

  const GROUPS = [
    ['todos', 'Todos os usuários'],
    ['tecnico', 'Técnicos'],
    ['almoxarife', 'Almoxarifado'],
    ['pcm', 'PCM'],
    ['administrador', 'Administradores'],
    ['super_admin', 'Super administradores'],
    ['viewer', 'Visualização']
  ];
  const esc = value => String(value ?? '').replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const client = () => window.SB || null;
  const prod = () => window.BIOTROP_PRODUCTION_V2 || null;
  const state = () => prod()?.state || null;
  const profile = () => state()?.context?.profile || {};
  const canManage = () => Boolean(prod()?.hasPermission?.('trainings.manage'));
  const role = () => String(profile().role_code || profile().app_role || 'viewer').toLowerCase();

  function toast(message, kind = 'info') {
    const p = prod();
    if (typeof window.notify === 'function') return window.notify(message, kind);
    let el = document.querySelector('#training-v2-toast');
    if (!el) { el = document.createElement('div'); el.id = 'training-v2-toast'; document.body.appendChild(el); }
    el.textContent = message; el.dataset.kind = kind; el.classList.add('show');
    clearTimeout(el._timer); el._timer = setTimeout(() => el.classList.remove('show'), 3500);
  }

  function installCss() {
    if (document.getElementById('training-v2-css')) return;
    const s = document.createElement('style'); s.id = 'training-v2-css';
    s.textContent = `
      .trv2{max-width:1180px;margin:0 auto;padding:8px 0 60px}.trv2-head{display:flex;align-items:flex-start;justify-content:space-between;gap:20px;margin-bottom:18px}.trv2-eyebrow{font-size:10px;font-weight:900;letter-spacing:.14em;text-transform:uppercase;color:#15866b}.trv2-head h1{margin:5px 0 5px;font-size:30px;color:#123b33}.trv2-head p{margin:0;color:#6d7d77;font-size:13px}.trv2-actions{display:flex;gap:8px;flex-wrap:wrap}.trv2-btn{border:0;border-radius:11px;padding:11px 15px;font-weight:850;cursor:pointer;background:#edf5f1;color:#1d5044}.trv2-btn.primary{background:#003c41;color:#fff}.trv2-filter{display:flex;gap:7px;overflow:auto;padding:5px;background:#eef6f2;border-radius:13px;margin-bottom:18px}.trv2-filter button{white-space:nowrap;border:0;background:transparent;color:#5c7068;padding:9px 12px;border-radius:9px;font-weight:800;cursor:pointer}.trv2-filter button.active{background:#fff;color:#003c41;box-shadow:0 2px 8px #0001}.trv2-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}.trv2-card{background:#fff;border:1px solid #e1ebe6;border-radius:18px;overflow:hidden;box-shadow:0 5px 20px rgba(0,60,65,.05);display:flex;flex-direction:column}.trv2-cover{height:150px;background:linear-gradient(135deg,#003c41,#0e7767);display:grid;place-items:center;color:#bdeee0;position:relative}.trv2-cover .play{width:58px;height:58px;border-radius:50%;background:#fff;color:#003c41;display:grid;place-items:center;font-size:22px;padding-left:3px;box-shadow:0 10px 25px #0003}.trv2-badge{position:absolute;left:12px;top:12px;background:#ffffffdd;color:#17483d;border-radius:999px;padding:5px 9px;font-size:10px;font-weight:900}.trv2-body{padding:15px;display:flex;flex-direction:column;flex:1}.trv2-body h3{margin:6px 0 6px;font-size:17px;color:#173c34}.trv2-body p{margin:0 0 12px;color:#6b7b75;font-size:12px;line-height:1.5;min-height:36px}.trv2-meta{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px}.trv2-chip{background:#eef7f3;color:#397164;border-radius:999px;padding:5px 8px;font-size:10px;font-weight:800}.trv2-progress{height:6px;background:#edf2ef;border-radius:99px;overflow:hidden;margin-top:auto}.trv2-progress i{display:block;height:100%;background:#43c99c;border-radius:99px}.trv2-foot{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:10px;color:#70817a;font-size:11px}.trv2-empty{padding:55px 20px;text-align:center;border:1px dashed #d4e4dc;border-radius:18px;color:#71827b;background:#fff}.trv2-modal{position:fixed;inset:0;background:#003c416e;backdrop-filter:blur(7px);z-index:2147483000;display:grid;place-items:center;padding:18px}.trv2-dialog{width:min(900px,100%);max-height:94vh;overflow:auto;background:#fff;border-radius:20px;box-shadow:0 30px 100px #0006;padding:20px}.trv2-dialog-head{display:flex;justify-content:space-between;gap:15px;align-items:flex-start;margin-bottom:14px}.trv2-dialog h2{margin:0;color:#123b33}.trv2-close{border:0;background:#eef4f1;color:#23483e;width:36px;height:36px;border-radius:10px;font-size:21px;cursor:pointer}.trv2-player{width:100%;aspect-ratio:16/9;background:#061d1d;border-radius:14px;overflow:hidden;display:grid;place-items:center}.trv2-player video,.trv2-player iframe{width:100%;height:100%;border:0;display:block}.trv2-player video{object-fit:contain}.trv2-desc{margin-top:14px;color:#5d7069;font-size:13px;line-height:1.6}.trv2-form{display:grid;grid-template-columns:1fr 1fr;gap:12px}.trv2-form label{display:grid;gap:6px;color:#536a62;font-size:11px;font-weight:850}.trv2-form .full{grid-column:1/-1}.trv2-form input,.trv2-form select,.trv2-form textarea{width:100%;box-sizing:border-box;border:1px solid #d5e3dd;border-radius:10px;padding:11px;background:#fff;color:#173c34;font:14px system-ui}.trv2-groups{display:flex;flex-wrap:wrap;gap:8px}.trv2-group{border:1px solid #d7e6df;border-radius:10px;padding:9px 10px;background:#f8fbfa;display:flex;align-items:center;gap:7px;font-size:11px!important;font-weight:750!important}.trv2-group input{width:auto!important}.trv2-upload{border:1px dashed #9bcbb9;border-radius:12px;padding:13px;background:#f4faf7}.trv2-upload small{display:block;color:#71827b;margin-top:5px;font-weight:500}.trv2-footer{display:flex;justify-content:flex-end;gap:8px;border-top:1px solid #e5eee9;padding-top:14px;margin-top:16px}.trv2-role-note{padding:11px 13px;border-radius:12px;background:#f2f8f5;color:#557069;font-size:12px;margin-bottom:15px}.trv2-progress-text{font-weight:800;color:#45645b}.trv2-admin-row{display:flex;gap:6px}.trv2-icon-btn{border:0;background:#eef5f2;color:#245347;border-radius:9px;padding:7px;cursor:pointer}@media(max-width:950px){.trv2-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:700px){.trv2{padding:2px 0 80px}.trv2-head{flex-direction:column}.trv2-head h1{font-size:24px}.trv2-actions,.trv2-actions .trv2-btn{width:100%}.trv2-filter{margin-left:-2px;margin-right:-2px}.trv2-grid{grid-template-columns:1fr;gap:11px}.trv2-cover{height:135px}.trv2-dialog{padding:13px;border-radius:16px;max-height:96vh}.trv2-modal{padding:8px}.trv2-form{grid-template-columns:1fr}.trv2-form .full{grid-column:auto}.trv2-footer{flex-direction:column-reverse}.trv2-footer .trv2-btn{width:100%}.trv2-player{aspect-ratio:16/10}.trv2-foot{align-items:flex-start;flex-direction:column}.trv2-foot .trv2-btn{width:100%}}
      #training-v2-toast{position:fixed;right:18px;bottom:18px;z-index:2147483647;background:#003c41;color:#fff;padding:12px 15px;border-radius:12px;font:700 13px system-ui;opacity:0;transform:translateY(8px);pointer-events:none;transition:.2s}#training-v2-toast.show{opacity:1;transform:none}#training-v2-toast[data-kind=error]{background:#a32e2e}
    `;
    document.head.appendChild(s);
  }

  function currentCourses() {
    const st = state(); return Array.isArray(st?.trainings) ? st.trainings : [];
  }
  function visibleCourses() {
    if (canManage()) return currentCourses();
    const r = role();
    return currentCourses().filter(course => {
      const groups = Array.isArray(course.audience_groups) && course.audience_groups.length ? course.audience_groups.map(String) : ['todos'];
      return groups.includes('todos') || groups.includes(r);
    });
  }
  function progressFor(id) {
    const p = state()?.trainingProgress?.find(x => x.training_id === id && x.user_id === profile().id);
    return Math.max(0, Math.min(100, Number(p?.percentage || 0)));
  }
  function groupLabel(code) { return GROUPS.find(x => x[0] === code)?.[1] || code; }

  function render() {
    installCss();
    const courses = visibleCourses();
    const total = courses.length;
    const done = courses.filter(c => progressFor(c.id) >= 100).length;
    const groups = [...new Set(courses.flatMap(c => Array.isArray(c.audience_groups) ? c.audience_groups : ['todos']))];
    return `<section class="trv2">
      <header class="trv2-head"><div><div class="trv2-eyebrow">BIOSEG · CAPACITAÇÃO</div><h1>Treinamentos</h1><p>Conteúdos organizados por função, com progresso individual.</p></div><div class="trv2-actions">${canManage() ? '<button class="trv2-btn primary" id="trv2-new">＋ Novo treinamento</button>' : ''}</div></header>
      <div class="trv2-role-note"><b>${esc(profile().name || 'Usuário')}</b> · Grupo <b>${esc(groupLabel(role()))}</b> · ${done}/${total} treinamento(s) concluído(s).</div>
      ${groups.length > 1 ? `<div class="trv2-filter" id="trv2-filter">${groups.map(g => `<button data-group-filter="${esc(g)}">${esc(groupLabel(g))}</button>`).join('')}</div>` : ''}
      ${courses.length ? `<div class="trv2-grid" id="trv2-grid">${courses.map(card).join('')}</div>` : '<div class="trv2-empty"><b>Nenhum treinamento disponível para o seu grupo.</b><div style="margin-top:6px">Quando o PCM/administrador publicar um conteúdo para sua função, ele aparecerá aqui.</div></div>'}
    </section>`;
  }

  function card(course) {
    const pct = progressFor(course.id);
    const groups = Array.isArray(course.audience_groups) && course.audience_groups.length ? course.audience_groups : ['todos'];
    const hasContent = Boolean(course.video_path || course.video_url);
    return `<article class="trv2-card" data-course-card data-groups="${esc(groups.join(','))}">
      <div class="trv2-cover"><span class="trv2-badge">${esc(course.category || 'Treinamento')}</span><div class="play">▶</div></div>
      <div class="trv2-body"><div class="trv2-meta">${groups.slice(0,3).map(g => `<span class="trv2-chip">${esc(groupLabel(g))}</span>`).join('')}${course.mandatory ? '<span class="trv2-chip">Obrigatório</span>' : ''}</div><h3>${esc(course.title)}</h3><p>${esc(course.description || 'Conteúdo de capacitação corporativa.')}</p><div class="trv2-progress"><i style="width:${pct}%"></i></div><div class="trv2-foot"><span class="trv2-progress-text">${pct}% concluído</span>${hasContent ? `<button class="trv2-btn primary" data-watch="${esc(course.id)}">${pct >= 100 ? 'Reassistir' : 'Assistir'}</button>` : '<span>Conteúdo não publicado</span>'}</div></div>
    </article>`;
  }

  async function videoUrl(course) {
    const c = client();
    if (course.video_path) {
      const r = await c.storage.from('training-videos').createSignedUrl(course.video_path, 7200);
      if (r.error) throw r.error;
      return { type: 'video', url: r.data.signedUrl };
    }
    const u = String(course.video_url || '').trim();
    const yt = u.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{6,})/);
    if (yt) return { type: 'youtube', url: `https://www.youtube.com/embed/${yt[1]}?playsinline=1&rel=0` };
    return u ? { type: 'video', url: u } : null;
  }

  async function openPlayer(id) {
    const course = currentCourses().find(x => x.id === id); if (!course) return;
    const root = document.createElement('div'); root.className = 'trv2-modal';
    root.innerHTML = `<section class="trv2-dialog"><div class="trv2-dialog-head"><div><div class="trv2-eyebrow">${esc(course.category || 'TREINAMENTO')}</div><h2>${esc(course.title)}</h2></div><button class="trv2-close" data-close>×</button></div><div class="trv2-player" id="trv2-player">Carregando conteúdo…</div><div class="trv2-desc">${esc(course.description || '')}</div></section>`;
    document.body.appendChild(root); root.querySelector('[data-close]').onclick = () => root.remove(); root.onclick = e => { if (e.target === root) root.remove(); };
    try {
      const media = await videoUrl(course); if (!media) throw new Error('Este treinamento ainda não possui conteúdo.');
      const player = root.querySelector('#trv2-player');
      if (media.type === 'youtube') player.innerHTML = `<iframe src="${esc(media.url)}" title="${esc(course.title)}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`;
      else {
        player.innerHTML = `<video controls playsinline preload="metadata"><source src="${esc(media.url)}"><p>Seu navegador não conseguiu reproduzir este vídeo.</p></video>`;
        const v = player.querySelector('video');
        v.addEventListener('timeupdate', () => { if (v.duration && v.currentTime > 1) saveProgress(course.id, Math.min(99, Math.round(v.currentTime / v.duration * 100)), true); });
        v.addEventListener('ended', () => saveProgress(course.id, 100));
      }
      if (progressFor(course.id) < 1) await saveProgress(course.id, 1, true);
    } catch (e) { root.querySelector('#trv2-player').innerHTML = `<div style="padding:30px;text-align:center;color:#a32e2e">${esc(e.message || 'Não foi possível abrir o conteúdo.')}</div>`; }
  }

  let progressTimer = null;
  async function saveProgress(trainingId, percentage, quiet = false) {
    const c = client(); if (!c || !profile().id) return;
    const value = Math.max(0, Math.min(100, Math.round(Number(percentage) || 0)));
    if (quiet && value < 100) {
      clearTimeout(progressTimer); progressTimer = setTimeout(() => saveProgress(trainingId, value, true), 1200);
      return;
    }
    const { error } = await c.from('training_progress').upsert({training_id: trainingId,user_id: profile().id,percentage:value,completed_at:value >= 100 ? new Date().toISOString() : null},{onConflict:'training_id,user_id'});
    if (error) { if (!quiet) toast(`Progresso não salvo: ${error.message}`,'error'); return; }
    const st = state(); if (st) { const old = st.trainingProgress.find(x => x.training_id === trainingId && x.user_id === profile().id); if (old) { old.percentage=value; old.completed_at=value >= 100 ? new Date().toISOString() : null; } else st.trainingProgress.push({training_id:trainingId,user_id:profile().id,percentage:value,completed_at:value >= 100 ? new Date().toISOString() : null}); }
  }

  function editor() {
    const root = document.createElement('div'); root.className = 'trv2-modal';
    root.innerHTML = `<section class="trv2-dialog"><div class="trv2-dialog-head"><div><div class="trv2-eyebrow">GESTÃO DE CAPACITAÇÃO</div><h2>Novo treinamento</h2></div><button class="trv2-close" data-close>×</button></div><div class="trv2-form">
      <label class="full">Título<input id="trv2-title" required placeholder="Ex.: NR-10 — Segurança em Instalações Elétricas"></label>
      <label>Categoria<input id="trv2-category" placeholder="Segurança, Operação, Qualidade..."></label>
      <label>Duração aproximada<input id="trv2-duration" type="number" min="0" placeholder="Minutos"></label>
      <label class="full">Descrição<textarea id="trv2-description" rows="4" placeholder="Explique o que o colaborador aprenderá."></textarea></label>
      <label class="full">Grupos que poderão visualizar</label><div class="trv2-groups full">${GROUPS.map(([code,label]) => `<label class="trv2-group"><input type="checkbox" data-audience value="${code}" ${code === 'todos' ? 'checked' : ''}>${label}</label>`).join('')}</div>
      <label class="full">Vídeo salvo no computador</label><div class="trv2-upload full"><input id="trv2-video" type="file" accept="video/*"><small>Selecione MP4, WebM ou outro vídeo suportado pelo navegador. Limite atual: 500 MB.</small><small id="trv2-file-name"></small></div>
      <label class="full">Ou URL de vídeo (YouTube, por exemplo)<input id="trv2-url" type="url" placeholder="https://youtu.be/..." ></label>
      <label class="trv2-group full"><input id="trv2-mandatory" type="checkbox"> Treinamento obrigatório</label>
    </div><div class="trv2-footer"><button class="trv2-btn" data-close>Cancelar</button><button class="trv2-btn primary" id="trv2-save">Cadastrar treinamento</button></div></section>`;
    document.body.appendChild(root); root.querySelectorAll('[data-close]').forEach(b => b.onclick = () => root.remove());
    root.querySelector('#trv2-video').onchange = e => { const f=e.target.files?.[0]; root.querySelector('#trv2-file-name').textContent=f?`${f.name} · ${(f.size/1024/1024).toFixed(1)} MB`:''; };
    root.querySelector('[data-audience="todos"]')?.addEventListener('change', e => { if(e.target.checked) root.querySelectorAll('[data-audience]:not([value="todos"])').forEach(x=>x.checked=false); });
    root.querySelectorAll('[data-audience]:not([value="todos"])').forEach(x => x.addEventListener('change', () => { if(x.checked) root.querySelector('[data-audience="todos"]').checked=false; if(!root.querySelector('[data-audience]:checked')) root.querySelector('[data-audience="todos"]').checked=true; }));
    root.querySelector('#trv2-save').onclick = async () => {
      const c=client(), title=root.querySelector('#trv2-title').value.trim(), file=root.querySelector('#trv2-video').files?.[0], url=root.querySelector('#trv2-url').value.trim();
      if(!title) return toast('Informe o título.','error'); if(!file && !url) return toast('Selecione um vídeo do computador ou informe uma URL.','error'); if(file && file.size>500*1024*1024) return toast('O vídeo ultrapassa 500 MB.','error');
      let groups=[...root.querySelectorAll('[data-audience]:checked')].map(x=>x.value); if(!groups.length) groups=['todos']; if(groups.includes('todos')) groups=['todos'];
      const btn=root.querySelector('#trv2-save'); btn.disabled=true; btn.textContent='Salvando…';
      try {
        const insert=await c.from('training_courses').insert({title,category:root.querySelector('#trv2-category').value.trim()||null,description:root.querySelector('#trv2-description').value.trim()||null,duration_seconds:Math.round(Number(root.querySelector('#trv2-duration').value||0)*60),video_url:url||null,video_path:null,content_type:file?.type||'video',audience_groups:groups,mandatory:root.querySelector('#trv2-mandatory').checked,active:true,created_by:profile().id}).select('*').single();
        if(insert.error) throw insert.error;
        let course=insert.data;
        if(file){
          const safe=file.name.toLowerCase().replace(/[^a-z0-9._-]+/g,'-'); const path=`${profile().id}/${course.id}/${Date.now()}-${safe}`;
          const up=await c.storage.from('training-videos').upload(path,file,{upsert:false,contentType:file.type,cacheControl:'3600'}); if(up.error) throw up.error;
          const upd=await c.from('training_courses').update({video_path:path,video_url:null}).eq('id',course.id); if(upd.error) throw upd.error;
          course.video_path=path; course.video_url=null;
        }
        const st=state(); if(st) st.trainings.unshift(course); root.remove(); if(typeof window.navigateTo==='function') window.navigateTo('treinamentos'); toast('Treinamento cadastrado.','success');
      } catch(e) { toast(e.message||'Não foi possível cadastrar o treinamento.','error'); }
      finally { btn.disabled=false;btn.textContent='Cadastrar treinamento'; }
    };
  }

  function bind() {
    const root=document.querySelector('.trv2'); if(!root || root.dataset.bound) return; root.dataset.bound='1';
    root.querySelector('#trv2-new')?.addEventListener('click', editor);
    root.querySelectorAll('[data-watch]').forEach(b=>b.addEventListener('click',()=>openPlayer(b.dataset.watch)));
    root.querySelectorAll('[data-group-filter]').forEach(b=>b.addEventListener('click',()=>{root.querySelectorAll('[data-group-filter]').forEach(x=>x.classList.remove('active'));b.classList.add('active');const g=b.dataset.groupFilter;root.querySelectorAll('[data-course-card]').forEach(c=>{const gs=c.dataset.groups.split(',');c.style.display=(g==='todos'||gs.includes(g))?'':'none';});}));
    const first=root.querySelector('[data-group-filter]'); if(first) first.classList.add('active');
  }

  function install() {
    installCss();
    if (typeof window.renderTrainingArea !== 'function') return false;
    if (!window.__trainingV2Installed) {
      window.__trainingV2Installed=true;
      window.renderTrainingArea = render;
      window.attachTrainingEvents = bind;
      window.trainingNewModal = editor;
    }
    return true;
  }

  let tries=0; const timer=setInterval(()=>{tries++; if(install() || tries>80) clearInterval(timer);},250);
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>{install();setTimeout(bind,600)},{once:true}); else {install();setTimeout(bind,600);}
})();
