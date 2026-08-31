/* BIOTROP — Runtime fix V3 para Treinamentos
   Corrige a integração entre o módulo V2, o shell legado e o Supabase.
*/
(() => {
  'use strict';
  if (window.__BIOTROP_TRAINING_RUNTIME_V3__) return;
  window.__BIOTROP_TRAINING_RUNTIME_V3__ = true;

  const wait = (fn, ms = 250, max = 80) => new Promise(resolve => {
    let n = 0;
    const timer = setInterval(() => {
      n += 1;
      try {
        if (fn()) { clearInterval(timer); resolve(true); return; }
      } catch (_) {}
      if (n >= max) { clearInterval(timer); resolve(false); }
    }, ms);
  });

  async function loadTrainingData() {
    const sb = window.SB;
    const prod = window.BIOTROP_PRODUCTION_V2;
    const state = prod?.state;
    const profile = state?.context?.profile;
    if (!sb || !state || !profile?.id) return false;

    const courses = await sb.from('training_courses')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: false });
    if (courses.error) throw courses.error;

    const progress = await sb.from('training_progress')
      .select('id,training_id,user_id,percentage,completed_at,updated_at')
      .eq('user_id', profile.id);
    if (progress.error) throw progress.error;

    state.trainings = courses.data || [];
    state.trainingProgress = progress.data || [];
    return true;
  }

  function repairBindings() {
    if (typeof window.attachTrainingEvents === 'function') {
      window.attachTrainingAreaEvents = window.attachTrainingEvents;
    }
    if (typeof window.trainingNewModal === 'function' && !window.__BIOTROP_TRAINING_NEW_PATCHED__) {
      window.__BIOTROP_TRAINING_NEW_PATCHED__ = true;
    }
  }

  async function boot() {
    const ready = await wait(() => Boolean(
      window.SB &&
      window.BIOTROP_PRODUCTION_V2?.state?.context?.profile?.id &&
      typeof window.renderTrainingArea === 'function'
    ));
    if (!ready) return;

    repairBindings();
    try {
      await loadTrainingData();
      repairBindings();
      const state = window.BIOTROP_PRODUCTION_V2?.state;
      const area = state?.currentArea || state?.currentPage || window.STATE?.currentArea;
      if (area === 'treinamentos' && typeof window.navigateTo === 'function') {
        window.navigateTo('treinamentos');
      }
    } catch (error) {
      console.error('[BIOTROP][Treinamentos V3]', error);
      if (typeof window.notify === 'function') {
        window.notify('Não foi possível carregar os treinamentos: ' + (error.message || error), 'error');
      }
    }
  }

  window.addEventListener('biotrop:refresh', () => { boot(); });
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
