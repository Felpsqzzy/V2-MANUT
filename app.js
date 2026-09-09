/* Ponte de estabilidade — mantém a operação existente. */
(()=>{
'use strict';
const load=(href,key)=>{if(document.querySelector(`link[data-${key}]`))return;const l=document.createElement('link');l.rel='stylesheet';l.href=href;l.dataset[key]='1';document.head.appendChild(l)};
function loadScript(src,key){if(document.querySelector(`script[data-${key}]`))return;const s=document.createElement('script');s.src=src;s.async=true;s.dataset[key]='1';document.head.appendChild(s)}
function boot(){
 document.body.classList.add('bt-ref-ui','bt-plan-ui');
 load('./assets/css/industrial-v8.css?v=9','biotrop-industrial-v8');
 load('./assets/css/reference-v7-ui.css?v=1','biotrop-reference-v7');
 load('./assets/css/plan-inspired-v1.css?v=1','biotrop-plan-inspired');
 loadScript('./assets/js/role-navigation-safe-v1.js?v=3','biotrop-safe-nav');
 loadScript('./assets/js/plan-ui-v1.js?v=1','biotrop-plan-ui');
}
window.addEventListener('biotrop:refresh',()=>{window.BIOTROP_PRODUCTION_V2?.refreshData(true)});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
