let container = null;
let stylesInjected = false;

function ensureStyles() {
  if (stylesInjected) return;
  stylesInjected = true;
  const s = document.createElement('style');
  s.textContent = `
    #toast-container {
      position: fixed;
      inset-block-end: calc(var(--space-4, 16px) + var(--safe-area-bottom, 0px));
      inset-inline-start: 50%;
      transform: translateX(-50%);
      display: flex;
      flex-direction: column-reverse;
      align-items: center;
      gap: var(--space-2, 8px);
      z-index: 9999;
      pointer-events: none;
    }
    .socle-toast {
      padding: var(--space-2, 8px) var(--space-4, 16px);
      border-radius: var(--radius-md, 6px);
      font-size: var(--font-size-body, 1rem);
      font-family: var(--font-family, sans-serif);
      line-height: var(--line-height-normal, 1.5);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      pointer-events: auto;
      white-space: nowrap;
      animation: socle-toast-in 0.2s ease;
    }
    .socle-toast-info    { background: var(--color-surface, #fff); color: var(--color-text-primary, #111); }
    .socle-toast-success { background: var(--color-success, #3D9A6E); color: var(--color-text-primary, #1C1C1E); }
    .socle-toast-error   { background: var(--color-danger, #ef4444);  color: var(--color-text-inverse); }
    @keyframes socle-toast-in {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0); }
    }
  `;
  document.head.appendChild(s);
}

function getContainer() {
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.setAttribute('aria-live', 'polite');
    container.setAttribute('aria-atomic', 'false');
    document.body.appendChild(container);
  }
  return container;
}

export function toast(message, type = 'info') {
  ensureStyles();
  const c = getContainer();
  const el = document.createElement('div');
  el.className = `socle-toast socle-toast-${type}`;
  el.setAttribute('role', 'status');
  el.textContent = message;
  c.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

// Reset for test isolation
export function _resetToast() {
  container?.remove();
  container = null;
  stylesInjected = false;
}
