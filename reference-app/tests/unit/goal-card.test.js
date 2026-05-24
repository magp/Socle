// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import '../../app/strings.js';
import '../../app/components/goal-card/goal-card.js';

HTMLElement.prototype.setPointerCapture = () => {};
HTMLElement.prototype.releasePointerCapture = () => {};

const GOAL = { id: 'abc-123', title: 'Run a marathon', completion: 0 };
const GOAL_50 = { id: 'abc-123', title: 'Run a marathon', completion: 50 };

function mount(goal) {
  const el = document.createElement('goal-card');
  if (goal !== undefined) el.goal = goal;
  document.body.appendChild(el);
  return el;
}

const pdown = (el, x = 0, y = 0) =>
  el.dispatchEvent(new PointerEvent('pointerdown', { clientX: x, clientY: y, button: 0, bubbles: true }));
const pmove = (el, x, y) =>
  el.dispatchEvent(new PointerEvent('pointermove', { clientX: x, clientY: y, bubbles: true }));
const pup = (el, x = 0, y = 0) =>
  el.dispatchEvent(new PointerEvent('pointerup', { clientX: x, clientY: y, bubbles: true }));

afterEach(() => { document.body.innerHTML = ''; });

describe('goal-card — rendering', () => {
  it('renders title in .title element', () => {
    const el = mount(GOAL);
    expect(el.shadowRoot.querySelector('.title').textContent).toBe('Run a marathon');
  });

  it('renders a progress bar', () => {
    const el = mount(GOAL);
    expect(el.shadowRoot.querySelector('.progress-bar')).not.toBeNull();
  });

  it('progress fill starts at 0% for completion 0', () => {
    const el = mount(GOAL);
    expect(el.shadowRoot.querySelector('.progress-fill').style.width).toBe('0%');
  });

  it('progress fill reflects completion value', () => {
    const el = mount(GOAL_50);
    expect(el.shadowRoot.querySelector('.progress-fill').style.width).toBe('50%');
  });
});

describe('goal-card — accessibility', () => {
  it('has tabindex="0" on the host', () => {
    const el = mount(GOAL);
    expect(el.getAttribute('tabindex')).toBe('0');
  });

  it('progress bar has role="slider"', () => {
    const el = mount(GOAL);
    expect(el.shadowRoot.querySelector('.progress-bar').getAttribute('role')).toBe('slider');
  });

  it('progress bar has aria-valuemin="0" and aria-valuemax="100"', () => {
    const el = mount(GOAL);
    const bar = el.shadowRoot.querySelector('.progress-bar');
    expect(bar.getAttribute('aria-valuemin')).toBe('0');
    expect(bar.getAttribute('aria-valuemax')).toBe('100');
  });

  it('progress bar aria-valuenow reflects completion', () => {
    const el = mount(GOAL_50);
    expect(el.shadowRoot.querySelector('.progress-bar').getAttribute('aria-valuenow')).toBe('50');
  });

  it('action buttons start with tabindex="-1"', () => {
    const el = mount(GOAL);
    expect(el.shadowRoot.querySelector('.btn-complete').getAttribute('tabindex')).toBe('-1');
    expect(el.shadowRoot.querySelector('.btn-delete').getAttribute('tabindex')).toBe('-1');
  });
});

describe('goal-card — property updates', () => {
  it('updates title when goal property changes after mount', () => {
    const el = mount(GOAL);
    el.goal = { id: '1', title: 'Updated', completion: 0 };
    expect(el.shadowRoot.querySelector('.title').textContent).toBe('Updated');
  });

  it('updates progress fill when goal changes', () => {
    const el = mount(GOAL);
    el.goal = GOAL_50;
    expect(el.shadowRoot.querySelector('.progress-fill').style.width).toBe('50%');
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

describe('goal-card — slider keyboard', () => {
  it('ArrowRight increases completion by 5', () => {
    const el = mount(GOAL_50);
    const bar = el.shadowRoot.querySelector('.progress-bar');
    bar.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(bar.getAttribute('aria-valuenow')).toBe('55');
  });

  it('ArrowLeft decreases completion by 5', () => {
    const el = mount(GOAL_50);
    const bar = el.shadowRoot.querySelector('.progress-bar');
    bar.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    expect(bar.getAttribute('aria-valuenow')).toBe('45');
  });

  it('ArrowUp increases completion by 5', () => {
    const el = mount(GOAL_50);
    const bar = el.shadowRoot.querySelector('.progress-bar');
    bar.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    expect(bar.getAttribute('aria-valuenow')).toBe('55');
  });

  it('ArrowDown decreases completion by 5', () => {
    const el = mount(GOAL_50);
    const bar = el.shadowRoot.querySelector('.progress-bar');
    bar.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    expect(bar.getAttribute('aria-valuenow')).toBe('45');
  });

  it('Home sets completion to 0', () => {
    const el = mount(GOAL_50);
    const bar = el.shadowRoot.querySelector('.progress-bar');
    bar.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
    expect(bar.getAttribute('aria-valuenow')).toBe('0');
  });

  it('End sets completion to 100', () => {
    const el = mount(GOAL_50);
    const bar = el.shadowRoot.querySelector('.progress-bar');
    bar.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
    expect(bar.getAttribute('aria-valuenow')).toBe('100');
  });

  it('ArrowRight clamps at 100', () => {
    const el = mount({ id: '1', title: 'T', completion: 98 });
    const bar = el.shadowRoot.querySelector('.progress-bar');
    bar.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    bar.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(bar.getAttribute('aria-valuenow')).toBe('100');
  });

  it('ArrowLeft clamps at 0', () => {
    const el = mount({ id: '1', title: 'T', completion: 2 });
    const bar = el.shadowRoot.querySelector('.progress-bar');
    bar.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    bar.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    expect(bar.getAttribute('aria-valuenow')).toBe('0');
  });

  it('ArrowRight dispatches goal-completion-change', () => {
    const el = mount(GOAL_50);
    const bar = el.shadowRoot.querySelector('.progress-bar');
    let detail = null;
    document.body.addEventListener('goal-completion-change', e => { detail = e.detail; });
    bar.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(detail).toEqual({ id: 'abc-123', completion: 55 });
  });

  it('End dispatches goal-completion-change with completion 100', () => {
    const el = mount(GOAL_50);
    const bar = el.shadowRoot.querySelector('.progress-bar');
    let detail = null;
    document.body.addEventListener('goal-completion-change', e => { detail = e.detail; });
    bar.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
    expect(detail).toEqual({ id: 'abc-123', completion: 100 });
  });

  it('unrelated key does not dispatch goal-completion-change', () => {
    const el = mount(GOAL_50);
    const bar = el.shadowRoot.querySelector('.progress-bar');
    let fired = false;
    document.body.addEventListener('goal-completion-change', () => { fired = true; });
    bar.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
    expect(fired).toBe(false);
  });
});

describe('goal-card — keyboard arming', () => {
  it('ArrowLeft on host arms left (slides card left, reveals delete)', () => {
    const el = mount(GOAL);
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    expect(el._armed).toBe('left');
  });

  it('ArrowRight on host arms right (slides card right, reveals complete)', () => {
    const el = mount(GOAL);
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(el._armed).toBe('right');
  });

  it('ArrowLeft on already-armed host dismisses', () => {
    const el = mount(GOAL);
    el._arm('left');
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    expect(el._armed).toBeNull();
  });

  it('ArrowRight on already-armed host dismisses', () => {
    const el = mount(GOAL);
    el._arm('right');
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(el._armed).toBeNull();
  });
});

describe('goal-card — aria-hidden on action panels', () => {
  it('both action panels start with aria-hidden="true"', () => {
    const el = mount(GOAL);
    expect(el.shadowRoot.querySelector('.action-left').getAttribute('aria-hidden')).toBe('true');
    expect(el.shadowRoot.querySelector('.action-right').getAttribute('aria-hidden')).toBe('true');
  });

  it('_arm left removes aria-hidden from action-right (delete panel)', () => {
    const el = mount(GOAL);
    el._arm('left');
    expect(el.shadowRoot.querySelector('.action-right').getAttribute('aria-hidden')).toBeNull();
  });

  it('_arm left keeps action-left aria-hidden', () => {
    const el = mount(GOAL);
    el._arm('left');
    expect(el.shadowRoot.querySelector('.action-left').getAttribute('aria-hidden')).toBe('true');
  });

  it('_arm right removes aria-hidden from action-left (complete panel)', () => {
    const el = mount(GOAL);
    el._arm('right');
    expect(el.shadowRoot.querySelector('.action-left').getAttribute('aria-hidden')).toBeNull();
  });

  it('_arm right keeps action-right aria-hidden', () => {
    const el = mount(GOAL);
    el._arm('right');
    expect(el.shadowRoot.querySelector('.action-right').getAttribute('aria-hidden')).toBe('true');
  });

  it('_dismiss restores aria-hidden on both action panels', () => {
    const el = mount(GOAL);
    el._arm('left');
    el._dismiss();
    expect(el.shadowRoot.querySelector('.action-left').getAttribute('aria-hidden')).toBe('true');
    expect(el.shadowRoot.querySelector('.action-right').getAttribute('aria-hidden')).toBe('true');
  });
});

describe('goal-card — swipe reveal', () => {
  it('onTap dispatches goal-tap when not armed', () => {
    const el = mount(GOAL);
    let detail = null;
    document.body.addEventListener('goal-tap', e => { detail = e.detail; });
    el.onTap();
    expect(detail).toEqual({ id: 'abc-123' });
  });

  it('onTap dismisses when armed (no goal-tap event)', () => {
    const el = mount(GOAL);
    el._arm('left');
    let fired = false;
    document.body.addEventListener('goal-tap', () => { fired = true; });
    el.onTap();
    expect(fired).toBe(false);
    expect(el._armed).toBeNull();
  });

  it('_arm left sets card-inner translateX to negative reveal distance', () => {
    const el = mount(GOAL);
    el._arm('left');
    expect(el._cardInner.style.transform).toContain('translateX(-80px)');
  });

  it('_arm right sets card-inner translateX to positive reveal distance', () => {
    const el = mount(GOAL);
    el._arm('right');
    expect(el._cardInner.style.transform).toContain('translateX(80px)');
  });

  it('_arm left makes btn-delete focusable', () => {
    const el = mount(GOAL);
    el._arm('left');
    expect(el._btnDelete.getAttribute('tabindex')).toBe('0');
  });

  it('_arm right makes btn-complete focusable', () => {
    const el = mount(GOAL);
    el._arm('right');
    expect(el._btnComplete.getAttribute('tabindex')).toBe('0');
  });

  it('_dismiss resets card-inner to translateX(0)', () => {
    const el = mount(GOAL);
    el._arm('left');
    el._dismiss();
    expect(el._cardInner.style.transform).toBe('translateX(0)');
  });

  it('_dismiss restores button tabindex to -1', () => {
    const el = mount(GOAL);
    el._arm('left');
    el._dismiss();
    expect(el._btnDelete.getAttribute('tabindex')).toBe('-1');
    expect(el._btnComplete.getAttribute('tabindex')).toBe('-1');
  });

  it('btn-complete click sets completion to 100, dispatches goal-completion-change, and dismisses', () => {
    const el = mount(GOAL);
    let detail = null;
    document.body.addEventListener('goal-completion-change', e => { detail = e.detail; });
    el._arm('right');
    el._btnComplete.click();
    expect(detail).toEqual({ id: 'abc-123', completion: 100 });
    expect(el._completion).toBe(100);
    expect(el._armed).toBeNull();
  });

  it('btn-delete click dispatches goal-delete and dismisses', () => {
    const el = mount(GOAL);
    let detail = null;
    document.body.addEventListener('goal-delete', e => { detail = e.detail; });
    el._arm('left');
    el._btnDelete.click();
    expect(detail).toEqual({ id: 'abc-123' });
    expect(el._armed).toBeNull();
  });

  it('btn-complete goal-completion-change is bubbles and composed', () => {
    const el = mount(GOAL);
    let event = null;
    document.body.addEventListener('goal-completion-change', e => { event = e; });
    el._arm('right');
    el._btnComplete.click();
    expect(event.bubbles).toBe(true);
    expect(event.composed).toBe(true);
  });

  it('goal-delete bubbles and is composed', () => {
    const el = mount(GOAL);
    let event = null;
    document.body.addEventListener('goal-delete', e => { event = e; });
    el._arm('left');
    el._btnDelete.click();
    expect(event.bubbles).toBe(true);
    expect(event.composed).toBe(true);
  });

  it('swipe snaps to arm when distance exceeds threshold', () => {
    const el = mount(GOAL);
    el.onSwipe({ direction: 'left', distance: 200, velocity: 0 });
    expect(el._armed).toBe('left');
  });

  it('swipe snaps to arm on fast velocity even if short', () => {
    const el = mount(GOAL);
    el.onSwipe({ direction: 'right', distance: 10, velocity: 0.7 });
    expect(el._armed).toBe('right');
  });

  it('swipe dismisses when return distance exceeds 65% of reveal', () => {
    const el = mount(GOAL);
    el._arm('left');
    el.onSwipe({ direction: 'right', distance: 100, velocity: 0 });
    expect(el._armed).toBeNull();
  });

  it('swipe snaps back to armed when return distance is below threshold', () => {
    const el = mount(GOAL);
    el._arm('left');
    el.onSwipe({ direction: 'right', distance: 20, velocity: 0.1 });
    expect(el._armed).toBe('left');
  });

  it('btn-complete when completion is 100 resets to 0', () => {
    const el = mount({ id: 'abc-123', title: 'Run', completion: 100 });
    let completionDetail = null;
    document.body.addEventListener('goal-completion-change', e => { completionDetail = e.detail; });
    el._arm('right');
    el._btnComplete.click();
    expect(completionDetail).toEqual({ id: 'abc-123', completion: 0 });
    expect(el._completion).toBe(0);
  });

  it('_updateActionLeft shows "Reset" when completion is 100', () => {
    const el = mount({ id: '1', title: 'T', completion: 100 });
    expect(el._btnComplete.textContent).toBe('Reset');
  });

  it('_updateActionLeft shows "Done" when completion is below 100', () => {
    const el = mount(GOAL_50);
    expect(el._btnComplete.textContent).toBe('Done');
  });
});

describe('goal-card — completion change event', () => {
  it('dispatches goal-completion-change on holdDragEnd via _dispatchCompletionChange', () => {
    const el = mount(GOAL);
    el._completion = 75;
    let detail = null;
    document.body.addEventListener('goal-completion-change', e => { detail = e.detail; });
    el._dispatchCompletionChange();
    expect(detail).toEqual({ id: 'abc-123', completion: 75 });
  });

  it('goal-completion-change bubbles and is composed', () => {
    const el = mount(GOAL);
    let event = null;
    document.body.addEventListener('goal-completion-change', e => { event = e; });
    el._dispatchCompletionChange();
    expect(event.bubbles).toBe(true);
    expect(event.composed).toBe(true);
  });
});

describe('goal-card — events when no goal set', () => {
  it('does not dispatch goal-tap when no goal', () => {
    const el = document.createElement('goal-card');
    document.body.appendChild(el);
    let fired = false;
    el.addEventListener('goal-tap', () => { fired = true; });
    el.onTap();
    expect(fired).toBe(false);
  });

  it('does not dispatch goal-delete when no goal', () => {
    const el = document.createElement('goal-card');
    document.body.appendChild(el);
    let fired = false;
    el.addEventListener('goal-delete', () => { fired = true; });
    el._dispatchDelete();
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
