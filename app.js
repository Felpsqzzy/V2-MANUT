/* Ponte mantida apenas para compatibilidade com implantações antigas. */
(() => {
  'use strict';
  window.addEventListener('biotrop:refresh', () => {
    window.BIOTROP_PRODUCTION_V2?.refreshData(true);
  });
})();
