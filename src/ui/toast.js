export function showToast(message, tone = 'default') {
  const existing = document.querySelectorAll('.toast');
  if (existing.length > 2) existing[0].remove();

  const el = document.createElement('div');
  el.className = `toast ${tone}`;
  el.setAttribute('role', 'status');
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => {
    el.classList.add('out');
    setTimeout(() => el.remove(), 220);
  }, 3000);
}
