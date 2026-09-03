(() => {
  'use strict';
  const frame = document.getElementById('legacy-app');
  const boot = document.getElementById('boot');
  const error = document.getElementById('error');
  const retry = document.getElementById('retry');
  const CSS_HREF = '../rebuild/rebuild.css?v=20260903';

  const showError = () => {
    boot?.classList.add('hidden');
    error?.classList.add('show');
  };

  const cleanupUndefinedText = (doc) => {
    const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
    const doomed = [];
    let node;
    while ((node = walker.nextNode())) {
      if (node.nodeValue?.trim() === 'undefined') doomed.push(node);
    }
    doomed.forEach((n) => n.parentNode?.removeChild(n));
  };

  const injectStyle = (doc) => {
    if (doc.querySelector('link[data-biotrop-rebuild]')) return;
    const link = doc.createElement('link');
    link.rel = 'stylesheet';
    link.href = CSS_HREF;
    link.dataset.biotropRebuild = '1';
    doc.head.appendChild(link);
  };

  const improveBrand = (doc) => {
    const brand = doc.querySelector('.sidebar-brand');
    if (brand) {
      const logo = brand.querySelector('.sidebar-logo-icon');
      if (logo) {
        logo.src = '../assets/biotrop-logo.svg';
        logo.alt = 'BIOTROP';
      }
    }
    const page = doc.querySelector('.login-wrap');
    if (page) {
      const logos = page.querySelectorAll('img');
      logos.forEach((img) => {
        if (/logo|biotrop|brand/i.test(`${img.src} ${img.alt}`)) img.src = '../assets/biotrop-logo.svg';
      });
    }
  };

  const hardenClicks = (doc) => {
    // Evita que um clique em um botão quebrado deixe o usuário preso em uma navegação sem resposta.
    doc.addEventListener('click', (ev) => {
      const target = ev.target?.closest?.('button,a');
      if (!target) return;
      if (target.matches('[disabled],.disabled,[aria-disabled="true"]')) return;
      target.classList.add('biotrop-clicked');
      window.setTimeout(() => target.classList.remove('biotrop-clicked'), 220);
    }, true);
  };

  const onLoaded = () => {
    try {
      const doc = frame.contentDocument;
      if (!doc?.body) throw new Error('DOM do aplicativo indisponível');
      injectStyle(doc);
      improveBrand(doc);
      cleanupUndefinedText(doc);
      hardenClicks(doc);
      doc.documentElement.dataset.biotropRebuild = '2026';
      boot?.classList.add('hidden');
    } catch (e) {
      console.error('[BIOTROP rebuild]', e);
      showError();
    }
  };

  frame.addEventListener('load', () => window.setTimeout(onLoaded, 40));
  frame.addEventListener('error', showError);
  retry?.addEventListener('click', () => {
    error?.classList.remove('show');
    boot?.classList.remove('hidden');
    frame.src = `../app.html?rebuild=${Date.now()}`;
  });
})();
