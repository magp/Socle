// @vitest-environment happy-dom
import { describe, it, expect, afterEach, vi } from 'vitest';
import '../../app/strings.js';
import '../../app/components/year-header/year-header.js';

function stubDialog(el) {
  const dialog = el.shadowRoot.querySelector('dialog');
  dialog.showModal = vi.fn(() => dialog.setAttribute('open', ''));
  dialog.close     = vi.fn(() => {
    dialog.removeAttribute('open');
    dialog.dispatchEvent(new Event('close'));
  });
  return dialog;
}

function mount(year = 2026) {
  const el = document.createElement('year-header');
  document.body.appendChild(el);
  el.year = year;
  stubDialog(el);
  return el;
}

afterEach(() => { document.body.innerHTML = ''; vi.restoreAllMocks(); });

describe('year-header — structure', () => {
  it('renders prev and next buttons', () => {
    const el = mount();
    expect(el.shadowRoot.querySelector('#prev')).not.toBeNull();
    expect(el.shadowRoot.querySelector('#next')).not.toBeNull();
  });

  it('renders the year', () => {
    const el = mount(2025);
    expect(el.shadowRoot.querySelector('#year').textContent).toBe('2025');
  });

  it('renders the progress strip', () => {
    const el = mount();
    expect(el.shadowRoot.querySelector('#strip-fill')).not.toBeNull();
  });

  it('renders a menu button', () => {
    const el = mount();
    expect(el.shadowRoot.querySelector('#menu-btn')).not.toBeNull();
  });
});

describe('year-header — year strip', () => {
  it('shows 100% strip for a past year', () => {
    const el = mount(new Date().getFullYear() - 1);
    expect(el.shadowRoot.querySelector('#strip-fill').style.width).toBe('100%');
  });

  it('shows 0% strip for a future year', () => {
    const el = mount(new Date().getFullYear() + 1);
    expect(el.shadowRoot.querySelector('#strip-fill').style.width).toBe('0%');
  });
});

describe('year-header — navigation', () => {
  it('emits year-navigate with year - 1 on prev click', () => {
    const el = mount(2026);
    let detail;
    el.addEventListener('year-navigate', e => { detail = e.detail; }, { once: true });
    el.shadowRoot.querySelector('#prev').click();
    expect(detail.year).toBe(2025);
  });

  it('emits year-navigate with year + 1 on next click', () => {
    const el = mount(2026);
    let detail;
    el.addEventListener('year-navigate', e => { detail = e.detail; }, { once: true });
    el.shadowRoot.querySelector('#next').click();
    expect(detail.year).toBe(2027);
  });

  it('updates displayed year when year prop changes', () => {
    const el = mount(2026);
    el.year = 2027;
    expect(el.shadowRoot.querySelector('#year').textContent).toBe('2027');
  });
});

describe('year-header — menu', () => {
  it('opens menu dialog on menu button click', () => {
    const el = mount();
    const dialog = el.shadowRoot.querySelector('#menu');
    el.shadowRoot.querySelector('#menu-btn').click();
    expect(dialog.showModal).toHaveBeenCalledOnce();
  });

  it('shows year section in menu', () => {
    const el = mount();
    const labels = Array.from(el.shadowRoot.querySelectorAll('.menu-section-label'))
      .map(p => p.textContent);
    expect(labels).toContain('This year');
  });

  it('shows app section in menu', () => {
    const el = mount();
    const labels = Array.from(el.shadowRoot.querySelectorAll('.menu-section-label'))
      .map(p => p.textContent);
    expect(labels).toContain('App');
  });
});

describe('year-header — compact mode', () => {
  it('adds compact class when scrollY exceeds threshold', () => {
    const el = mount();
    Object.defineProperty(window, 'scrollY', { value: 100, configurable: true });
    window.dispatchEvent(new Event('scroll'));
    expect(el.classList.contains('compact')).toBe(true);
  });

  it('removes compact class when scrollY drops below revert threshold', () => {
    const el = mount();
    Object.defineProperty(window, 'scrollY', { value: 100, configurable: true });
    window.dispatchEvent(new Event('scroll'));
    Object.defineProperty(window, 'scrollY', { value: 10, configurable: true });
    window.dispatchEvent(new Event('scroll'));
    expect(el.classList.contains('compact')).toBe(false);
  });
});
