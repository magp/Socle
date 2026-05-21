// @vitest-environment happy-dom
import { describe, it, expect, afterEach } from 'vitest';
import '../../app/components/goal-card/goal-card.js';

HTMLElement.prototype.setPointerCapture = () => {};
HTMLElement.prototype.releasePointerCapture = () => {};

const GOAL = { id: 'abc-123', title: 'Run a marathon', completed: false };
const DONE_GOAL = { id: 'abc-123', title: 'Run a marathon', completed: true };

function mount(goal) {
  const el = document.createElement('goal-card');
  if (goal !== undefined) el.goal = goal;
  document.body.appendChild(el);
  return el;
}

afterEach(() => { document.body.innerHTML = ''; });

describe('goal-card — rendering', () => {
  it('renders shadow DOM with a <p> element', () => {
    const el = mount(GOAL);
    expect(el.shadowRoot.querySelector('p')).not.toBeNull();
  });

  it('displays goal title in the paragraph', () => {
    const el = mount(GOAL);
    expect(el.shadowRoot.querySelector('p').textContent).toBe('Run a marathon');
  });

  it('adds completed attribute when goal.completed is true', () => {
    const el = mount(DONE_GOAL);
    expect(el.hasAttribute('completed')).toBe(true);
  });

  it('has no completed attribute when goal.completed is false', () => {
    const el = mount(GOAL);
    expect(el.hasAttribute('completed')).toBe(false);
  });
});

describe('goal-card — accessibility', () => {
  it('has tabindex="0"', () => {
    const el = mount(GOAL);
    expect(el.getAttribute('tabindex')).toBe('0');
  });

  it('has role="button"', () => {
    const el = mount(GOAL);
    expect(el.getAttribute('role')).toBe('button');
  });

  it('aria-pressed is "false" for an incomplete goal', () => {
    const el = mount(GOAL);
    expect(el.getAttribute('aria-pressed')).toBe('false');
  });

  it('aria-pressed is "true" for a completed goal', () => {
    const el = mount(DONE_GOAL);
    expect(el.getAttribute('aria-pressed')).toBe('true');
  });

  it('aria-label is set to the goal title', () => {
    const el = mount(GOAL);
    expect(el.getAttribute('aria-label')).toBe('Run a marathon');
  });
});

describe('goal-card — property updates', () => {
  it('updates title when goal property changes after mount', () => {
    const el = mount({ id: '1', title: 'First', completed: false });
    el.goal = { id: '1', title: 'Updated', completed: false };
    expect(el.shadowRoot.querySelector('p').textContent).toBe('Updated');
  });

  it('adds completed attribute when goal changes to completed', () => {
    const el = mount(GOAL);
    el.goal = DONE_GOAL;
    expect(el.hasAttribute('completed')).toBe(true);
  });

  it('removes completed attribute when goal changes to incomplete', () => {
    const el = mount(DONE_GOAL);
    el.goal = GOAL;
    expect(el.hasAttribute('completed')).toBe(false);
  });

  it('updates aria-pressed when completed state changes', () => {
    const el = mount(GOAL);
    expect(el.getAttribute('aria-pressed')).toBe('false');
    el.goal = DONE_GOAL;
    expect(el.getAttribute('aria-pressed')).toBe('true');
  });

  it('updates aria-label when title changes', () => {
    const el = mount(GOAL);
    el.goal = { id: 'abc-123', title: 'New title', completed: false };
    expect(el.getAttribute('aria-label')).toBe('New title');
  });
});

describe('goal-card — events', () => {
  it('dispatches goal-tap on onTap() with goal id', () => {
    const el = mount(GOAL);
    let detail = null;
    document.body.addEventListener('goal-tap', e => { detail = e.detail; });
    el.onTap();
    expect(detail).toEqual({ id: 'abc-123' });
  });

  it('dispatches goal-delete on onLongPress() with goal id', () => {
    const el = mount(GOAL);
    let detail = null;
    document.body.addEventListener('goal-delete', e => { detail = e.detail; });
    el.onLongPress();
    expect(detail).toEqual({ id: 'abc-123' });
  });

  it('goal-tap bubbles and is composed', () => {
    const el = mount(GOAL);
    let event = null;
    document.body.addEventListener('goal-tap', e => { event = e; });
    el.onTap();
    expect(event.bubbles).toBe(true);
    expect(event.composed).toBe(true);
  });

  it('goal-delete bubbles and is composed', () => {
    const el = mount(GOAL);
    let event = null;
    document.body.addEventListener('goal-delete', e => { event = e; });
    el.onLongPress();
    expect(event.bubbles).toBe(true);
    expect(event.composed).toBe(true);
  });

  it('does not dispatch goal-tap when no goal is set', () => {
    const el = document.createElement('goal-card');
    document.body.appendChild(el);
    let fired = false;
    el.addEventListener('goal-tap', () => { fired = true; });
    el.onTap();
    expect(fired).toBe(false);
  });

  it('does not dispatch goal-delete when no goal is set', () => {
    const el = document.createElement('goal-card');
    document.body.appendChild(el);
    let fired = false;
    el.addEventListener('goal-delete', () => { fired = true; });
    el.onLongPress();
    expect(fired).toBe(false);
  });
});

describe('goal-card — keyboard', () => {
  it('Enter key dispatches goal-tap', () => {
    const el = mount(GOAL);
    let detail = null;
    document.body.addEventListener('goal-tap', e => { detail = e.detail; });
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(detail).toEqual({ id: 'abc-123' });
  });

  it('Space key dispatches goal-tap', () => {
    const el = mount(GOAL);
    let detail = null;
    document.body.addEventListener('goal-tap', e => { detail = e.detail; });
    el.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    expect(detail).toEqual({ id: 'abc-123' });
  });

  it('Delete key dispatches goal-delete', () => {
    const el = mount(GOAL);
    let detail = null;
    document.body.addEventListener('goal-delete', e => { detail = e.detail; });
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete', bubbles: true }));
    expect(detail).toEqual({ id: 'abc-123' });
  });

  it('Backspace key dispatches goal-delete', () => {
    const el = mount(GOAL);
    let detail = null;
    document.body.addEventListener('goal-delete', e => { detail = e.detail; });
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true }));
    expect(detail).toEqual({ id: 'abc-123' });
  });

  it('other keys do not dispatch goal-tap or goal-delete', () => {
    const el = mount(GOAL);
    let fired = false;
    document.body.addEventListener('goal-tap', () => { fired = true; });
    document.body.addEventListener('goal-delete', () => { fired = true; });
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(fired).toBe(false);
  });
});

describe('goal-card — lifecycle', () => {
  it('setting goal before mount does not throw', () => {
    const el = document.createElement('goal-card');
    expect(() => { el.goal = GOAL; }).not.toThrow();
  });

  it('keydown listener is removed after disconnect', () => {
    const el = mount(GOAL);
    document.body.removeChild(el);
    let fired = false;
    el.addEventListener('goal-tap', () => { fired = true; });
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(fired).toBe(false);
  });
});
