import { esc } from '../core/sanitize.js';

let keyBound = false;

export function closeModal() {
  const active = document.querySelector('.overlay');
  if (active) active.remove();
}

export function openModal(title, bodyHtml, actions = []) {
  closeModal();

  if (!keyBound) {
    document.addEventListener('keydown', ev => {
      if (ev.key === 'Escape') closeModal();
    });
    keyBound = true;
  }

  const overlay = document.createElement('div');
  overlay.className = 'overlay';
  overlay.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true" aria-label="${esc(title)}">
      <header>
        <h3>${esc(title)}</h3>
        <button class="x" type="button" aria-label="Cerrar">&times;</button>
      </header>
      <div class="mbody">${bodyHtml}</div>
      <footer></footer>
    </div>`;

  const footer = overlay.querySelector('footer');
  actions.forEach(action => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `btn ${action.cls || ''}`.trim();
    btn.textContent = action.t;
    btn.addEventListener('click', () => action.fn(overlay));
    footer.appendChild(btn);
  });

  overlay.querySelector('.x').addEventListener('click', closeModal);
  overlay.addEventListener('mousedown', ev => {
    if (ev.target === overlay) closeModal();
  });

  document.body.appendChild(overlay);
  return overlay;
}

export function confirmDialog(title, messageHtml, confirmText, onConfirm, danger = false) {
  return openModal(title, `<p>${messageHtml}</p>`, [
    { t: 'Cancelar', fn: closeModal },
    {
      t: confirmText,
      cls: danger ? 'danger' : 'pri',
      fn: () => {
        closeModal();
        onConfirm();
      }
    }
  ]);
}
