// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import '../../core/app-element.js';
import './app-header.js';

describe('app-header', () => {
  let el;

  beforeEach(() => {
    el = document.createElement('app-header');
    document.body.appendChild(el);
  });

  afterEach(() => {
    el.remove();
  });

  it('renders an h1 as the title element', () => {
    const title = el.shadowRoot.querySelector('h1.title');
    expect(title).toBeTruthy();
  });

  it('title h1 contains the default slot', () => {
    const slot = el.shadowRoot.querySelector('h1.title slot:not([name])');
    expect(slot).toBeTruthy();
  });

  it('projects slot text as title content', () => {
    el.textContent = 'My App';
    expect(el.textContent).toBe('My App');
  });

  it('exposes a named action slot', () => {
    const btn = document.createElement('button');
    btn.setAttribute('slot', 'action');
    btn.textContent = 'Settings';
    el.appendChild(btn);
    expect(el.shadowRoot.querySelector('slot[name="action"]')).toBeTruthy();
  });

  it('renders header, title, and action regions', () => {
    expect(el.shadowRoot.querySelector('header.inner')).toBeTruthy();
    expect(el.shadowRoot.querySelector('.title')).toBeTruthy();
    expect(el.shadowRoot.querySelector('.action')).toBeTruthy();
  });

  it('title h1 has margin-block reset to zero', () => {
    const styleText = el.shadowRoot.querySelector('style').textContent;
    expect(styleText).toContain('margin-block: 0');
  });
});
