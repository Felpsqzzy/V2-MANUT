window.BIOTROP_CONFIG = Object.freeze({
  supabaseUrl: 'https://hoikliqttxqdsyyjdnul.supabase.co',
  supabaseAnonKey: 'sb_publishable_PeiXiPCMENjp9ajwW-EbJw_IohMAt1h',
  apiBaseUrl: window.location.origin + '/api'
});

/* ================= BIOTROP AUTH / PASSWORD RECOVERY =================
   A configuração anterior apontava para o projeto Supabase antigo e o
   recovery era ligado a window.supabase, enquanto a aplicação V2 usa
   window.SB. Esta camada funciona com o cliente real usado pela V2.
*/
(function () {
  'use strict';

  let recoveryModalOpen = false;
  let recoveryClient = null;
  let recoveryListenerAttached = false;
  let resetMethodPatched = false;
  let codeExchanged = false;

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, function (ch) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch];
    });
  }

  function isRecoveryUrl() {
    const hash = new URLSearchParams((window.location.hash || '').replace(/^#/, ''));
    const query = new URLSearchParams(window.location.search || '');
    return hash.get('type') === 'recovery' ||
      query.get('type') === 'recovery' ||
      hash.has('access_token') ||
      hash.has('refresh_token') ||
      query.has('code');
  }

  function showRecoveryModal(client) {
    if (!client || recoveryModalOpen || document.getElementById('biotrop-password-recovery')) return;
    recoveryModalOpen = true;

    const root = document.createElement('div');
    root.id = 'biotrop-password-recovery';
    root.innerHTML = `
      <style>
        #biotrop-password-recovery{position:fixed;inset:0;z-index:999999;background:rgba(0,35,38,.62);display:flex;align-items:center;justify-content:center;padding:20px;font-family:'Segoe UI',system-ui,sans-serif}
        #biotrop-password-recovery .br-card{width:100%;max-width:430px;background:#fff;border-radius:20px;padding:28px;box-shadow:0 30px 90px rgba(0,0,0,.28)}
        #biotrop-password-recovery h2{margin:0 0 8px;color:#003C41;font-size:22px}
        #biotrop-password-recovery p{margin:0 0 20px;color:#60746d;font-size:13px;line-height:1.55}
        #biotrop-password-recovery label{display:block;font-size:12px;font-weight:700;color:#26463b;margin:14px 0 6px}
        #biotrop-password-recovery input{width:100%;box-sizing:border-box;border:1.5px solid #d7e6df;border-radius:10px;padding:12px 13px;font-size:14px;outline:none}
        #biotrop-password-recovery input:focus{border-color:#1a8f6b}
        #biotrop-password-recovery .br-btn{width:100%;border:0;border-radius:999px;background:#003C41;color:#fff;padding:12px 16px;font-size:14px;font-weight:800;margin-top:20px;cursor:pointer}
        #biotrop-password-recovery .br-btn:disabled{opacity:.6;cursor:wait}
        #biotrop-password-recovery .br-msg{margin-top:12px;padding:10px 12px;border-radius:9px;font-size:12px;line-height:1.45}
        #biotrop-password-recovery .br-error{background:#fdecec;color:#a62922}
        #biotrop-password-recovery .br-success{background:#eef8f3;color:#176449}
        #biotrop-password-recovery .br-rules{font-size:11px;color:#789087;margin-top:8px}
      </style>
      <div class="br-card" role="dialog" aria-modal="true" aria-labelledby="br-title">
        <h2 id="br-title">Redefinir senha</h2>
        <p>O link de recuperação foi validado. Cadastre uma nova senha para acessar a Plataforma de Manutenção.</p>
        <label for="br-new-password">Nova senha</label>
        <input id="br-new-password" type="password" autocomplete="new-password" placeholder="Digite a nova senha">
        <label for="br-confirm-password">Confirmar nova senha</label>
        <input id="br-confirm-password" type="password" autocomplete="new-password" placeholder="Repita a nova senha">
        <div class="br-rules">Use uma senha forte e diferente das senhas anteriores.</div>
        <button id="br-submit" class="br-btn" type="button">Salvar nova senha</button>
        <div id="br-message" aria-live="polite"></div>
      </div>`;

    document.body.appendChild(root);

    const newPass = root.querySelector('#br-new-password');
    const confirmPass = root.querySelector('#br-confirm-password');
    const submit = root.querySelector('#br-submit');
    const message = root.querySelector('#br-message');

    submit.onclick = async function () {
      const password = newPass.value;
      const confirmation = confirmPass.value;
      message.innerHTML = '';

      if (password.length < 8) {
        message.innerHTML = '<div class="br-msg br-error">A senha precisa ter pelo menos 8 caracteres.</div>';
        return;
      }
      if (password !== confirmation) {
        message.innerHTML = '<div class="br-msg br-error">As senhas não conferem.</div>';
        return;
      }

      submit.disabled = true;
      submit.textContent = 'Salvando...';

      try {
        const result = await client.auth.updateUser({ password });
        if (result.error) throw result.error;

        message.innerHTML = '<div class="br-msg br-success">Senha alterada com sucesso. Você será levado para a tela de login.</div>';
        setTimeout(async function () {
          try { await client.auth.signOut(); } catch (_) {}
          window.history.replaceState({}, document.title, window.location.pathname);
          window.location.reload();
        }, 1200);
      } catch (error) {
        message.innerHTML = '<div class="br-msg br-error">Não foi possível alterar a senha: ' + escapeHtml(error.message || 'erro desconhecido') + '</div>';
        submit.disabled = false;
        submit.textContent = 'Salvar nova senha';
      }
    };

    newPass.focus();
  }

  function patchClient(client) {
    if (!client || !client.auth) return;
    recoveryClient = client;

    if (!recoveryListenerAttached && typeof client.auth.onAuthStateChange === 'function') {
      recoveryListenerAttached = true;
      client.auth.onAuthStateChange(function (event) {
        if (event === 'PASSWORD_RECOVERY') {
          setTimeout(function () { showRecoveryModal(client); }, 0);
        }
      });
    }

    if (!resetMethodPatched && typeof client.auth.resetPasswordForEmail === 'function') {
      resetMethodPatched = true;
      const originalReset = client.auth.resetPasswordForEmail.bind(client.auth);
      client.auth.resetPasswordForEmail = function (email, options) {
        const opts = Object.assign({}, options || {}, {
          redirectTo: (options && options.redirectTo) || (window.location.origin + window.location.pathname)
        });
        return originalReset(email, opts);
      };
    }

    if (isRecoveryUrl()) handleRecoveryUrl(client);
  }

  async function handleRecoveryUrl(client) {
    if (!client || codeExchanged) return;

    const query = new URLSearchParams(window.location.search || '');
    const code = query.get('code');
    if (code && typeof client.auth.exchangeCodeForSession === 'function') {
      codeExchanged = true;
      try {
        const result = await client.auth.exchangeCodeForSession(code);
        if (result.error) throw result.error;
      } catch (error) {
        console.error('[BIOTROP] Falha ao validar código de recuperação:', error);
        return;
      }
    }

    setTimeout(async function () {
      try {
        const result = await client.auth.getSession();
        if (result && result.data && result.data.session && isRecoveryUrl()) {
          showRecoveryModal(client);
        }
      } catch (error) {
        console.error('[BIOTROP] Falha ao obter sessão de recuperação:', error);
      }
    }, 250);
  }

  function watchForClient() {
    if (window.SB) patchClient(window.SB);
    if (window.supabase && window.supabase.auth) patchClient(window.supabase);
    if (window.supabase && typeof window.supabase.createClient === 'function') {
      const lib = window.supabase;
      if (!lib.__biotropCreateClientPatched) {
        lib.__biotropCreateClientPatched = true;
        const originalCreateClient = lib.createClient.bind(lib);
        lib.createClient = function () {
          const client = originalCreateClient.apply(null, arguments);
          patchClient(client);
          return client;
        };
      }
    }
  }

  function installSBWatcher() {
    try {
      let current = window.SB;
      Object.defineProperty(window, 'SB', {
        configurable: true,
        get: function () { return current; },
        set: function (value) {
          current = value;
          patchClient(value);
        }
      });
      if (current) patchClient(current);
    } catch (_) {
      watchForClient();
    }
  }

  function bootRecovery() {
    installSBWatcher();
    watchForClient();
    let attempts = 0;
    const timer = setInterval(function () {
      watchForClient();
      attempts += 1;
      if (recoveryClient || attempts > 80) clearInterval(timer);
    }, 100);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootRecovery, { once: true });
  } else {
    bootRecovery();
  }
})();
