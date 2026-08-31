/* BIOTROP PCM — loader seguro.
   O módulo não intercepta a navegação do menu. A gestão de PCM/SCI/SCM fica em workflow-fix.js. */
(()=>{
  'use strict';
  function load(){
    if(!document.querySelector('script[data-biotrop-workflow-fix]')){
      const s=document.createElement('script');
      s.src='./workflow-fix.js?v=2';
      s.async=true;
      s.dataset.biotropWorkflowFix='1';
      document.head.appendChild(s);
    }
    if(!document.querySelector('script[data-biotrop-training-v2]')){
      const s=document.createElement('script');
      s.src='./assets/js/training-module-v2.js?v=1';
      s.async=true;
      s.dataset.biotropTrainingV2='1';
      document.head.appendChild(s);
    }
    if(!document.querySelector('script[data-biotrop-training-v2-fix]')){
      const s=document.createElement('script');
      s.src='./assets/js/training-module-v2-fix.js?v=1';
      s.async=true;
      s.dataset.biotropTrainingV2Fix='1';
      document.head.appendChild(s);
    }
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',load,{once:true});
  else load();
})();
