/* Pequeno patch de UX para a seleção de grupos do editor de treinamentos. */
(() => {
  'use strict';
  document.addEventListener('change', event => {
    const input = event.target;
    if (!input.matches?.('.trv2-modal [data-audience]')) return;
    const root = input.closest('.trv2-modal');
    const all = root?.querySelector('[data-audience][value="todos"]');
    const specific = root ? [...root.querySelectorAll('[data-audience]:not([value="todos"])')] : [];
    if (!all) return;
    if (input.value === 'todos' && input.checked) specific.forEach(x => { x.checked = false; });
    if (input.value !== 'todos' && input.checked) all.checked = false;
    if (!root.querySelector('[data-audience]:checked')) all.checked = true;
  }, true);
})();
