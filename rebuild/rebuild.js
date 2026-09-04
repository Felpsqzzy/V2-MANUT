(() => {
  'use strict';

  const frame = document.getElementById('legacy-app');
  const boot = document.getElementById('boot');
  const error = document.getElementById('error');
  const retry = document.getElementById('retry');
  const CSS_HREF = '../rebuild/rebuild.css?v=20260904-2';

  const showError = () => {
    boot?.classList.add('hidden');
    error?.classList.add('show');
  };

  const hideBoot = () => boot?.classList.add('hidden');

  const cleanupUndefinedText = (doc) => {
    const root = doc.body;
    if (!root) return;
    const walker = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const doomed = [];
    let node;
    while ((node = walker.nextNode())) {
      const value = node.nodeValue?.trim();
      if (value === 'undefined' || value === 'null') doomed.push(node);
    }
    doomed.forEach((n) => n.parentNode?.removeChild(n));
  };

  const injectStyle = (doc) => {
    if (doc.querySelector('link[data-biotrop-rebuild]')) return;
    const link = doc.createElement('link');
    link.rel = 'stylesheet';
    link.href = CSS_HREF;
    link.dataset.biotropRebuild = '1';
    link.onerror = () => console.warn('[BIOTROP] camada visual não carregou');
    doc.head.appendChild(link);
  };

  const improveBrand = (doc) => {
    const logos = doc.querySelectorAll('.sidebar-logo-icon, .logo-img-right');
    logos.forEach((img) => {
      img.src = '../assets/biotrop-logo.svg';
      img.alt = 'BIOTROP';
      img.removeAttribute('onerror');
    });
  };

  const hardenClicks = (doc) => {
    if (doc.documentElement.dataset.biotropClickLayer === '1') return;
    doc.documentElement.dataset.biotropClickLayer = '1';
    doc.addEventListener('click', (ev) => {
      const target = ev.target?.closest?.('button,a');
      if (!target) return;
      if (target.matches('[disabled],.disabled,[aria-disabled="true"]')) return;
      target.dataset.biotropPressed = '1';
      window.setTimeout(() => delete target.dataset.biotropPressed, 180);
    }, true);
  };

  const markReady = (doc) => {
    doc.documentElement.dataset.biotropRebuild = '2026';
    doc.body.classList.add('biotrop-premium-shell');
    hideBoot();
  };

  const onLoaded = () => {
    try {
      const doc = frame.contentDocument;
      if (!doc?.body || !doc.head) throw new Error('DOM do aplicativo indisponível');
      injectStyle(doc);
      improveBrand(doc);
      cleanupUndefinedText(doc);
      hardenClicks(doc);
      markReady(doc);
    } catch (e) {
      console.error('[BIOTROP rebuild]', e);
      showError();
    }
  };

  frame?.addEventListener('load', () => window.setTimeout(onLoaded, 60));
  frame?.addEventListener('error', showError);

  retry?.addEventListener('click', () => {
    error?.classList.remove('show');
    boot?.classList.remove('hidden');
    frame.src = `../app.html?rebuild=${Date.now()}`;
  });
})();
