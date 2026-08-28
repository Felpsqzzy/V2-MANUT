(() => {
  'use strict';
  // Camada de compatibilidade: a experiência atual de Utilidades vive em
  // assets/js/horimeter-v2.js e usa Supabase para leituras/evidências.
  // O Service Worker ainda injeta este arquivo em instalações antigas, então
  // garantimos que a camada atual seja carregada uma única vez.
  function loadCurrentUtilityLayer() {
    if (window.__BIOTROP_UTILITY_V3_LOADED) return;
    window.__BIOTROP_UTILITY_V3_LOADED = true;
    if (document.querySelector('script[data-biotrop-utility-v3]')) return;
    const s = document.createElement('script');
    s.src = './assets/js/horimeter-v2.js?v=25';
    s.async = true;
    s.dataset.biotropUtilityV3 = '1';
    document.head.appendChild(s);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', loadCurrentUtilityLayer);
  else loadCurrentUtilityLayer();
})();
