(() => {
  'use strict';
  if (window.__BIOTROP_HOURMETER_BUTTON__) return;
  window.__BIOTROP_HOURMETER_BUTTON__ = true;

  const inject = () => {
    if (document.getElementById('biotrop-hourmeter-register')) return;
    const pageText = (document.body?.innerText || '').toLowerCase();
    if (!pageText.includes('painel de medidores') && !pageText.includes('medidores')) return;

    const style = document.createElement('style');
    style.textContent = `
      #biotrop-hourmeter-register{position:fixed;top:22px;right:28px;z-index:99990;border:0;border-radius:12px;padding:12px 18px;background:#1a8f6b;color:#fff;font:800 13px system-ui,-apple-system,Segoe UI,sans-serif;box-shadow:0 10px 28px rgba(0,0,0,.22);cursor:pointer;display:flex;align-items:center;gap:9px;transition:.18s}
      #biotrop-hourmeter-register:hover{transform:translateY(-1px);box-shadow:0 14px 34px rgba(0,0,0,.28)}
      #biotrop-hourmeter-register:active{transform:translateY(0)}
      #biotrop-hourmeter-register svg{width:17px;height:17px;flex:0 0 auto}
      @media(max-width:700px){#biotrop-hourmeter-register{top:auto;right:16px;bottom:18px;padding:13px 16px;border-radius:999px}}
    `;
    document.head.appendChild(style);

    const btn = document.createElement('button');
    btn.id = 'biotrop-hourmeter-register';
    btn.type = 'button';
    btn.title = 'Registrar apontamento de horímetro';
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"></circle><path d="M12 7v5l3 2"></path></svg><span>Registrar horímetro</span>';
    btn.addEventListener('click', () => {
      if (typeof window.BIOTROP_openUtilityReading === 'function') {
        window.BIOTROP_openUtilityReading(null);
      } else {
        const fallback = document.querySelector('[data-utility-open]');
        if (fallback) fallback.click();
        else window.alert('O módulo de apontamento ainda está carregando. Tente novamente.');
      }
    });
    document.body.appendChild(btn);
  };

  const observe = () => {
    inject();
    const observer = new MutationObserver(() => inject());
    observer.observe(document.body, {childList:true,subtree:true});
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', observe, {once:true});
  else observe();
})();