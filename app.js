/* Ponte mantida para compatibilidade com implantações antigas.
   A implementação de produção é carregada por app.html. */
(() => {
  'use strict';
  window.addEventListener('biotrop:refresh', () => {
    window.BIOTROP_PRODUCTION_V2?.refreshData(true);
  });
})();
