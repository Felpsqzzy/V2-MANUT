(()=>{
  'use strict';
  function loadCurrentUtilityLayer() {
    if (!window.__BIOTROP_UTILITY_V3_LOADED) {
      window.__BIOTROP_UTILITY_V3_LOADED = true;
      if (!document.querySelector('script[data-biotrop-utility-v3]')) {
        const s = document.createElement('script');
        s.src = './assets/js/horimeter-v2.js?v=26';
        s.async = true;
        s.dataset.biotropUtilityV3 = '1';
        document.head.appendChild(s);
      }
    }
    if (!document.querySelector('script[data-biotrop-utility-v4]')) {
      const s2 = document.createElement('script');
      s2.src = './assets/js/utility-tech-flow-v4.js?v=1';
      s2.async = true;
      s2.dataset.biotropUtilityV4 = '1';
      document.head.appendChild(s2);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', loadCurrentUtilityLayer);
  else loadCurrentUtilityLayer();
})();