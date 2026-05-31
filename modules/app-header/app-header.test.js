// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest';
import '../../core/app-element.js';
import './app-header.js';

describe('app-header', () => {
  let el;

  beforeEach(() => {
    el = document.createElement('app-header');
    document.body.appendChild(el);
  });

  it('renders default slot content as title', () => {
    el.textContent = 'My App';
    const slot = el.shadowRoot.querySelector('.title slot');
    expect(slot).toBeTruthy();
    expect(el.textContent).toBe('My App');
  });

  it('has sticky positioning', () => {
    const inner = el.shadowRoot.querySelector('.inner');
    expect(inner).toBeTruthy();
    expect(el.shadowRoot.querySelector('.title')).toBeTruthy();
    expect(el.shadowRoot.querySelector('.action')).toBeTruthy();
  });

  it('exposes an action slot', () => {
    const btn = document.createElement('button');
    btn.setAttribute('slot', 'action');
    btn.textContent = 'Settings';
    el.appendChild(btn);
    const actionSlot = el.shadowRoot.querySelector('slot[name="action"]');
    expect(actionSlot).toBeTruthy();
  });
});
