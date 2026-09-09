/* Ponte de estabilidade — mantém a operação existente e aplica a camada visual industrial sem substituir módulos ou dados. */
(()=>{
'use strict';
const load=(href,key)=>{if(document.querySelector(`link[data-${key}]`))return;const l=document.createElement('link');l.rel='stylesheet';l.href=href;l.dataset[key]='1';document.head.appendChild(l)};
function boot(){document.body.classList.add('bt-ref-ui');load('./assets/css/industrial-v8.css?v=9','biotrop-industrial-v8');load('./assets/css/reference-v7-ui.css?v=1','biotrop-reference-v7');const s=document.createElement('script');s.src='./assets/js/role-navigation-safe-v1.js?v=3';s.async=true;s.dataset.biotropSafeNav='v2';document.head.appendChild(s)}
window.addEventListener('biotrop:refresh',()=>{window.BIOTROP_PRODUCTION_V2?.refreshData(true)});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
