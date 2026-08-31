/* BIOTROP PCM — loader seguro.
   Gestão PCM/SCI/SCM e o painel live do Almoxarifado são carregados sem substituir o shell principal. */
(()=>{
  'use strict';
  function add(src,attr){
    if(document.querySelector(`script[${attr}]`))return;
    const s=document.createElement('script');s.src=src;s.async=true;s.setAttribute(attr,'1');document.head.appendChild(s);
  }
  function load(){
    add('./workflow-fix.js?v=3','data-biotrop-workflow-fix');
    add('./assets/js/almox-live-v2.js?v=1','data-biotrop-almox-live-v2');
    add('./assets/js/training-module-v2.js?v=1','data-biotrop-training-v2');
    add('./assets/js/training-module-v2-fix.js?v=1','data-biotrop-training-v2-fix');
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',load,{once:true});
  else load();
})();
