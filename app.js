/* BIOTROP application bridge — stable production loading. */
(() => {
  'use strict';
  const addStyles=(href,key)=>{if(document.querySelector(`link[data-${key}]`))return;const l=document.createElement('link');l.rel='stylesheet';l.href=href;l.dataset[key]='1';document.head.appendChild(l)};
  const load=(src,key,onload)=>{const q=`script[data-${key}]`;const old=document.querySelector(q);if(old){onload?.();return old}const s=document.createElement('script');s.src=src;s.async=false;s.dataset[key]='1';s.onload=onload;s.onerror=()=>console.warn('[BIOTROP] asset não carregou:',src);document.body.appendChild(s);return s};
  const workspace=()=>{addStyles('./assets/css/dashboard-v3.css?v=6','biotrop-dashboard-v3');addStyles('./assets/css/workspace-v5.css?v=1','biotrop-workspace-v5-style');load('./assets/js/dashboard-v3.js?v=6','biotrop-dashboard-v3');load('./assets/js/default-workspace-v6.js?v=1','biotrop-workspace-v6')};
  const boot=()=>{workspace();if(document.querySelector('script[data-biotrop-safe-nav]'))return;load('./assets/js/role-navigation-safe-v1.js?v=5','biotrop-safe-nav',()=>load('./assets/js/role-shell-v2.js?v=5','biotrop-role-shell',workspace))};
  window.addEventListener('biotrop:refresh',()=>{window.BIOTROP_PRODUCTION_V2?.refreshData?.(true);setTimeout(()=>window.BIOTROP_WORKSPACE_V6?.render?.(),500)});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
