import { esc, escAttr } from '../../core/sanitize.js';
import { showToast } from '../../ui/toast.js';

export function createLoginView({ authService }) {
  function render() {
    const accounts = authService.getAvailableAccounts();
    const presets = accounts
      .map(
        acc => `
        <button type="button" class="preset-btn" data-fill-email="${escAttr(acc.email)}">
          <div><b>${esc(acc.name)}</b> · ${esc(acc.role)}</div>
          <span>${esc(acc.email)}</span>
        </button>`
      )
      .join('');

    return `
      <div class="auth-screen">
        <div class="auth-card">
          <div class="auth-head">
            <div class="brand-mark">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6zM8 20h8M12 16v4"/></svg>
            </div>
            <div>
              <h2>SIGAI Institucional</h2>
              <p>Acceso a la plataforma de activos informáticos</p>
            </div>
          </div>
          <form id="login-form" class="auth-form">
            <label class="fld">
              <span>Correo institucional</span>
              <input id="login-email" type="email" value="admin@sigai.edu.pe" required autocomplete="username">
            </label>
            <label class="fld">
              <span>Contraseña</span>
              <input id="login-pass" type="password" value="sigai2026" required autocomplete="current-password">
            </label>
            <p class="auth-error" id="login-err"></p>
            <button type="submit" class="btn pri" id="login-submit">Ingresar al sistema</button>
          </form>
          <div class="auth-presets">
            <small>Cuentas institucionales disponibles (clave: sigai2026)</small>
            <div class="preset-list">${presets}</div>
          </div>
        </div>
      </div>`;
  }

  function bind(root) {
    const form = root.querySelector('#login-form');
    const emailInput = root.querySelector('#login-email');
    const passInput = root.querySelector('#login-pass');
    const errEl = root.querySelector('#login-err');
    const submitBtn = root.querySelector('#login-submit');

    root.querySelectorAll('[data-fill-email]').forEach(btn => {
      btn.addEventListener('click', () => {
        emailInput.value = btn.dataset.fillEmail;
        passInput.value = 'sigai2026';
        errEl.textContent = '';
      });
    });

    form.addEventListener('submit', async ev => {
      ev.preventDefault();
      errEl.textContent = '';
      submitBtn.disabled = true;
      submitBtn.textContent = 'Validando credenciales...';
      const res = await authService.login(emailInput.value, passInput.value);
      if (!res.ok) {
        errEl.textContent = res.error;
        submitBtn.disabled = false;
        submitBtn.textContent = 'Ingresar al sistema';
        return;
      }
      showToast(`Sesión iniciada como ${res.user.name}`);
    });
  }

  return { render, bind };
}
