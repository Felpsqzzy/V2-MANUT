window.BIOTROP_CONFIG = Object.freeze({
  supabaseUrl: 'https://xxqipgvdksughongzpqj.supabase.co',
  supabaseAnonKey: 'sb_publishable_hI0bUzs2tJYE9noTc5Df0Q_rF8nJ8n',
  apiBaseUrl: window.location.origin + '/api'
});

/* ================= BIOTROP PASSWORD RECOVERY =================
   O app antigo apenas enviava o e-mail. Quando o usuário clicava no
   link, o Supabase devolvia a sessão de recuperação, mas a aplicação
   não tratava o evento PASSWORD_RECOVERY.
*/
(function () {
  let supabaseLib = null;
  let clientPatched = false;
  let recoveryPending = null;

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, function (ch) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch];
    });
  }

  function showRecoveryModal(client) {
    if (!client || document.getElementById('biotrop-password-recovery')) return;

    const root = document.createElement('div');
    root.id = 'biotrop-password-recovery';
    root.innerHTML = `
      <style>
        #biotrop-password-recovery{position:fixed;inset:0;z-index:99999;background:rgba(0,35,38,.58);display:flex;align-items:center;justify-content:center;padding:20px;font-family:'Segoe UI',system-ui,sans-serif}
        #biotrop-password-recovery .br-card{width:100%;max-width:430px;background:#fff;border-radius:20px;padding:28px;box-shadow:0 30px 90px rgba(0,0,0,.25)}
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
          window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
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
    if (!client || client.__biotropRecoveryPatched) return client;
    client.__biotropRecoveryPatched = true;

    client.auth.onAuthStateChange(function (event, session) {
      if (event === 'PASSWORD_RECOVERY') {
        recoveryPending = { client, session };
        setTimeout(function () {
          showRecoveryModal(client);
        }, 0);
      }
    });

    return client;
  }

  try {
    Object.defineProperty(window, 'supabase', {
      configurable: true,
      get: function () { return supabaseLib; },
      set: function (value) {
        supabaseLib = value;
        if (!value || typeof value.createClient !== 'function' || clientPatched) return;

        const originalCreateClient = value.createClient.bind(value);
        value.createClient = function () {
          const client = originalCreateClient.apply(null, arguments);
          return patchClient(client);
        };
        clientPatched = true;
      }
    });
  } catch (_) {}

  window.addEventListener('DOMContentLoaded', function () {
    if (recoveryPending) showRecoveryModal(recoveryPending.client);
  });
})();
