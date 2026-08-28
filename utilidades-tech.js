(() => {
  'use strict';

  const STYLE_ID = 'utilidades-tech-style';
  const ROOT_ID = 'utilidades-tech-root';
  let lastUserId = null;

  const escTech = (value) => String(value ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#039;');

  function isManager() {
    try {
      const user = STATE?.currentUser;
      if (!user) return false;
      if (typeof isAdminUser === 'function' && isAdminUser(user)) return true;
      const perms = typeof getPerms === 'function' ? getPerms(user) : {};
      return !!perms?.pcm?.acesso;
    } catch (_) {
      return false;
    }
  }

  function meters() {
    try {
      return (typeof getUtilityData === 'function' ? getUtilityData() : []) || [];
    } catch (_) {
      return [];
    }
  }

  function readings() {
    try {
      return (typeof getUtilityReadings === 'function' ? getUtilityReadings() : []) || [];
    } catch (_) {
      return [];
    }
  }

  function typeLabel(type) {
    return ({ agua: 'Água', gas: 'Gás', energia: 'Energia', horimetro: 'Horímetro' }[type] || type || 'Utilidade');
  }

  function typeIcon(type) {
    return ({ agua: 'droplets', gas: 'flame', energia: 'zap', horimetro: 'clock-3' }[type] || 'gauge');
  }

  function getLast(meterId) {
    return readings()
      .filter(r => r.meterId === meterId)
      .sort((a, b) => new Date(b.at) - new Date(a.at))[0] || null;
  }

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .ut-tech-page{max-width:980px;margin:0 auto;padding:8px 4px 48px}
      .ut-tech-head{padding:10px 2px 24px}
      .ut-tech-eyebrow{font-size:11px;font-weight:800;letter-spacing:1.6px;color:#1a8f6b;text-transform:uppercase;margin-bottom:8px}
      .ut-tech-title{margin:0;color:#17332b;font-size:30px;line-height:1.1;font-weight:800}
      .ut-tech-sub{margin:8px 0 0;color:#6b7a75;font-size:14px}
      .ut-tech-list{display:grid;gap:12px}
      .ut-tech-group{margin-top:8px}
      .ut-tech-group-title{display:flex;align-items:center;gap:9px;margin:18px 0 8px;color:#17332b;font-size:14px;font-weight:800}
      .ut-tech-group-title .ut-tech-icon{width:30px;height:30px}
      .ut-tech-card{background:#fff;border:1px solid #e3ece8;border-radius:14px;padding:15px 16px;display:flex;align-items:center;gap:14px;box-shadow:0 2px 10px rgba(0,60,65,.035)}
      .ut-tech-card-info{min-width:0;flex:1}
      .ut-tech-card-name{font-size:15px;font-weight:750;color:#17332b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .ut-tech-card-meta{font-size:12px;color:#7b8b84;margin-top:3px}
      .ut-tech-icon{width:42px;height:42px;border-radius:11px;background:#eef8f3;color:#1a8f6b;display:grid;place-items:center;flex:0 0 auto}
      .ut-tech-btn{border:0;background:#003c41;color:#fff;border-radius:999px;padding:10px 17px;font:700 13px 'Segoe UI',system-ui,sans-serif;cursor:pointer;white-space:nowrap}
      .ut-tech-btn:hover{background:#002f33}
      .ut-tech-empty{background:#fff;border:1px dashed #d7e6df;border-radius:14px;padding:42px 20px;text-align:center;color:#6b7a75}
      .ut-tech-modal-back{position:fixed;inset:0;background:rgba(0,35,38,.38);display:grid;place-items:center;padding:18px;z-index:1000}
      .ut-tech-modal{width:min(470px,100%);background:#fff;border-radius:18px;padding:22px;box-shadow:0 20px 60px rgba(0,0,0,.18)}
      .ut-tech-modal-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:18px}
      .ut-tech-modal-title{margin:0;color:#17332b;font-size:19px;font-weight:800}
      .ut-tech-close{border:0;background:#f3f7f5;color:#52665d;width:32px;height:32px;border-radius:50%;cursor:pointer;font-size:20px;line-height:1}
      .ut-tech-last{background:#f3f8f5;border-radius:11px;padding:11px 13px;margin-bottom:15px;font-size:12px;color:#60756b}
      .ut-tech-last strong{display:block;font-size:19px;color:#17332b;margin-top:2px}
      .ut-tech-label{display:block;font-size:12px;font-weight:700;color:#355048;margin:0 0 6px}
      .ut-tech-input{width:100%;height:48px;border:1.5px solid #d7e6df;border-radius:11px;padding:0 13px;font:600 17px 'Segoe UI',system-ui,sans-serif;color:#17332b;outline:none}
      .ut-tech-input:focus{border-color:#1a8f6b}
      .ut-tech-file{width:100%;padding:11px;border:1.5px dashed #cbdcd4;border-radius:11px;background:#fbfdfc;font:13px 'Segoe UI',system-ui,sans-serif;color:#52665d}
      .ut-tech-required{margin-top:6px;font-size:11px;color:#71857c}
      .ut-tech-actions{display:flex;justify-content:flex-end;gap:9px;margin-top:18px}
      .ut-tech-cancel{border:1px solid #d7e6df;background:#fff;color:#355048;border-radius:999px;padding:10px 16px;font:700 13px 'Segoe UI',system-ui,sans-serif;cursor:pointer}
      .ut-tech-save{border:0;background:#003c41;color:#fff;border-radius:999px;padding:10px 18px;font:700 13px 'Segoe UI',system-ui,sans-serif;cursor:pointer}
      .ut-tech-save:disabled{opacity:.55;cursor:not-allowed}
      .ut-tech-status{margin-top:10px;font-size:12px;color:#b3261e;display:none}
      @media(max-width:700px){
        .ut-tech-page{padding:4px 0 28px}
        .ut-tech-title{font-size:26px}
        .ut-tech-card{padding:13px}
        .ut-tech-card-name{font-size:14px}
        .ut-tech-btn{padding:10px 14px}
      }
    `;
    document.head.appendChild(style);
  }

  function renderTechPage() {
    const list = meters();
    const grouped = {};
    list.forEach(m => {
      const key = m.type || 'outros';
      (grouped[key] ||= []).push(m);
    });

    const order = ['agua', 'gas', 'energia', 'horimetro'];
    const keys = [...order.filter(k => grouped[k]?.length), ...Object.keys(grouped).filter(k => !order.includes(k))];

    const groups = keys.map(type => `
      <section class="ut-tech-group">
        <div class="ut-tech-group-title">
          <span class="ut-tech-icon">${typeof icon === 'function' ? icon(typeIcon(type), 16) : ''}</span>
          <span>${escTech(typeLabel(type))}</span>
        </div>
        <div class="ut-tech-list">
          ${grouped[type].map(m => `
            <article class="ut-tech-card">
              <span class="ut-tech-icon">${typeof icon === 'function' ? icon(typeIcon(type), 19) : ''}</span>
              <div class="ut-tech-card-info">
                <div class="ut-tech-card-name">${escTech(m.name)}</div>
                <div class="ut-tech-card-meta">${escTech(m.asset || 'Selecione para registrar a leitura')}</div>
              </div>
              <button class="ut-tech-btn" data-ut-tech-meter="${escTech(m.id)}">Apontar</button>
            </article>`).join('')}
        </div>
      </section>`).join('');

    const root = document.getElementById('main-content');
    if (!root) return;
    root.innerHTML = `
      <div id="${ROOT_ID}" class="ut-tech-page">
        <header class="ut-tech-head">
          <div class="ut-tech-eyebrow">UTILIDADES</div>
          <h1 class="ut-tech-title">Fazer apontamento</h1>
          <p class="ut-tech-sub">Selecione o medidor e informe a leitura.</p>
        </header>
        ${groups || '<div class="ut-tech-empty">Nenhum medidor disponível para apontamento.</div>'}
      </div>`;

    root.querySelectorAll('[data-ut-tech-meter]').forEach(btn => {
      btn.addEventListener('click', () => openReading(btn.getAttribute('data-ut-tech-meter')));
    });
  }

  function openReading(meterId) {
    const meter = meters().find(m => String(m.id) === String(meterId));
    if (!meter) return;
    const last = getLast(meter.id);
    const previous = last ? Number(last.reading) : Number(meter.initial || 0);
    const now = new Date();
    const root = document.createElement('div');
    root.className = 'ut-tech-modal-back';
    root.innerHTML = `
      <div class="ut-tech-modal" role="dialog" aria-modal="true">
        <div class="ut-tech-modal-head">
          <div>
            <div class="ut-tech-eyebrow">${escTech(typeLabel(meter.type))}</div>
            <h2 class="ut-tech-modal-title">${escTech(meter.name)}</h2>
          </div>
          <button class="ut-tech-close" type="button" aria-label="Fechar">×</button>
        </div>
        <div class="ut-tech-last">Última leitura<strong>${previous.toLocaleString('pt-BR',{maximumFractionDigits:2})} ${escTech(meter.unit || '')}</strong></div>
        <label class="ut-tech-label" for="ut-tech-reading">Nova leitura</label>
        <input id="ut-tech-reading" class="ut-tech-input" type="number" min="0" step="0.01" inputmode="decimal" placeholder="Digite a leitura">
        <div style="height:14px"></div>
        <label class="ut-tech-label" for="ut-tech-photo">Foto do medidor</label>
        <input id="ut-tech-photo" class="ut-tech-file" type="file" accept="image/*" capture="environment">
        <div class="ut-tech-required">A foto deve ser feita no momento do apontamento.</div>
        <div id="ut-tech-status" class="ut-tech-status"></div>
        <div class="ut-tech-actions">
          <button type="button" class="ut-tech-cancel">Cancelar</button>
          <button type="button" class="ut-tech-save">Registrar apontamento</button>
        </div>
      </div>`;
    document.body.appendChild(root);

    const close = () => root.remove();
    root.querySelector('.ut-tech-close').onclick = close;
    root.querySelector('.ut-tech-cancel').onclick = close;
    root.addEventListener('click', e => { if (e.target === root) close(); });

    const input = root.querySelector('#ut-tech-reading');
    const photo = root.querySelector('#ut-tech-photo');
    const status = root.querySelector('#ut-tech-status');
    const save = root.querySelector('.ut-tech-save');
    input.focus();

    save.onclick = () => {
      const value = Number(input.value);
      const file = photo.files?.[0];
      if (!Number.isFinite(value)) {
        status.textContent = 'Informe a nova leitura.';
        status.style.display = 'block';
        return;
      }
      if (value < previous) {
        status.textContent = `A leitura não pode ser menor que a anterior (${previous}).`;
        status.style.display = 'block';
        return;
      }
      if (!file) {
        status.textContent = 'Tire a foto do medidor antes de registrar.';
        status.style.display = 'block';
        return;
      }

      try {
        const currentReadings = readings();
        const next = {
          id: 'r' + Date.now(),
          meterId: meter.id,
          meterName: meter.name,
          reading: value,
          consumption: currentReadings.filter(r => r.meterId === meter.id).length ? value - previous : null,
          photo: true,
          user: STATE.currentUser?.usuario || STATE.currentUser?.email,
          at: now.toISOString()
        };
        const updated = [...currentReadings, next];
        if (typeof saveUtilityReadings !== 'function') throw new Error('Função de gravação indisponível.');
        saveUtilityReadings(updated);
        close();
        setTimeout(() => renderTechPage(), 80);
        alert('Apontamento registrado com sucesso.');
      } catch (err) {
        status.textContent = err?.message || 'Não foi possível registrar o apontamento.';
        status.style.display = 'block';
      }
    };
  }

  function shouldRender() {
    const main = document.getElementById('main-content');
    return !!main?.querySelector('.utility-control-room');
  }

  function apply() {
    if (!document.getElementById('main-content')) return;
    if (!shouldRender()) {
      lastUserId = null;
      return;
    }
    if (isManager()) return;
    const userId = STATE?.currentUser?.id || STATE?.currentUser?.usuario || STATE?.currentUser?.email || 'user';
    if (document.getElementById(ROOT_ID) && lastUserId === userId) return;
    lastUserId = userId;
    injectStyle();
    renderTechPage();
  }

  function boot() {
    injectStyle();
    const observer = new MutationObserver(() => {
      clearTimeout(boot._timer);
      boot._timer = setTimeout(apply, 30);
    });
    const target = document.getElementById('main-content') || document.body;
    observer.observe(target, { childList: true, subtree: true });
    setTimeout(apply, 80);
    setTimeout(apply, 500);
    setTimeout(apply, 1200);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
