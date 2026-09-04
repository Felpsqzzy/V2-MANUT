(() => {
  'use strict';
  const frame=document.getElementById('legacy-app');
  const boot=document.getElementById('boot');
  const error=document.getElementById('error');
  const retry=document.getElementById('retry');
  const CSS_HREF='../rebuild/rebuild.css?v=20260904-3';
  const showError=()=>{boot?.classList.add('hidden');error?.classList.add('show')};
  const cleanupUndefinedText=doc=>{const w=doc.createTreeWalker(doc.body,NodeFilter.SHOW_TEXT),bad=[];let n;while((n=w.nextNode())){const v=n.nodeValue?.trim();if(v==='undefined'||v==='null')bad.push(n)}bad.forEach(n=>n.parentNode?.removeChild(n))};
  const injectStyle=doc=>{if(doc.querySelector('link[data-biotrop-rebuild]'))return;const l=doc.createElement('link');l.rel='stylesheet';l.href=CSS_HREF;l.dataset.biotropRebuild='1';l.onerror=()=>console.warn('[BIOTROP] camada visual não carregou');doc.head.appendChild(l)};
  const improveBrand=doc=>{doc.querySelectorAll('.sidebar-logo-icon,.logo-img-right').forEach(img=>{img.src='../assets/biotrop-logo.svg';img.alt='BIOTROP'})};
  const hardenClicks=doc=>{if(doc.documentElement.dataset.biotropClickLayer==='1')return;doc.documentElement.dataset.biotropClickLayer='1';doc.addEventListener('click',ev=>{const t=ev.target?.closest?.('button,a');if(!t||t.matches('[disabled],.disabled,[aria-disabled="true"]'))return;t.dataset.biotropPressed='1';setTimeout(()=>delete t.dataset.biotropPressed,180)},true)};
  const onLoaded=()=>{try{const doc=frame.contentDocument;if(!doc?.body||!doc.head)throw new Error('DOM indisponível');injectStyle(doc);improveBrand(doc);cleanupUndefinedText(doc);hardenClicks(doc);doc.documentElement.dataset.biotropRebuild='2026';doc.body.classList.add('biotrop-premium-shell');boot?.classList.add('hidden')}catch(e){console.error('[BIOTROP rebuild]',e);showError()}};
  frame?.addEventListener('load',()=>setTimeout(onLoaded,60));
  frame?.addEventListener('error',showError);
  retry?.addEventListener('click',()=>{error?.classList.remove('show');boot?.classList.remove('hidden');frame.src=`../app.html?rebuild=${Date.now()}`});
})();
