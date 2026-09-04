(() => {
  'use strict';
  const frame=document.getElementById('legacy-app'),boot=document.getElementById('boot'),error=document.getElementById('error'),retry=document.getElementById('retry');
  const CSS_HREF='../rebuild/rebuild.css?v=20260904-6';
  const showError=()=>{boot?.classList.add('hidden');error?.classList.add('show')};
  const cleanUndefined=doc=>{const w=doc.createTreeWalker(doc.body,NodeFilter.SHOW_TEXT),bad=[];let n;while((n=w.nextNode()))if((n.nodeValue||'').trim()==='undefined')bad.push(n);bad.forEach(n=>n.parentNode?.removeChild(n))};
  const inject=doc=>{if(doc.querySelector('link[data-biotrop-rebuild]'))return;const l=doc.createElement('link');l.rel='stylesheet';l.href=CSS_HREF;l.dataset.biotropRebuild='1';doc.head.appendChild(l)};
  const logo=doc=>doc.querySelectorAll('.sidebar-logo-icon,.logo-img-right').forEach(img=>{img.src='../assets/biotrop-logo.svg';img.alt='BIOTROP'});
  const clicks=doc=>{if(doc.documentElement.dataset.btClicks)return;doc.documentElement.dataset.btClicks='1';doc.addEventListener('click',ev=>{const t=ev.target?.closest?.('button,a');if(!t||t.matches('[disabled],.disabled,[aria-disabled="true"]'))return;t.dataset.biotropPressed='1';setTimeout(()=>delete t.dataset.biotropPressed,180)},true)};
  const ready=()=>{try{const doc=frame.contentDocument;if(!doc?.body||!doc.head)throw new Error('DOM indisponível');inject(doc);logo(doc);cleanUndefined(doc);clicks(doc);doc.documentElement.dataset.biotropRebuild='2026';doc.body.classList.add('biotrop-premium-shell');boot?.classList.add('hidden')}catch(e){console.error('[BIOTROP]',e);showError()}};
  frame?.addEventListener('load',()=>setTimeout(ready,60));
  frame?.addEventListener('error',showError);
  retry?.addEventListener('click',()=>{error?.classList.remove('show');boot?.classList.remove('hidden');frame.src=`../app.html?rebuild=${Date.now()}`});
})();
