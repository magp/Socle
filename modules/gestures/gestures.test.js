// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Gestures } from './gestures.js';

// happy-dom does not implement pointer capture
HTMLElement.prototype.setPointerCapture = () => {};
HTMLElement.prototype.releasePointerCapture = () => {};

let tapSpy, longPressSpy;

customElements.define('t-tap', class extends Gestures(HTMLElement) {
  onTap(e) { tapSpy(e); }
});

customElements.define('t-lp', class extends Gestures(HTMLElement) {
  onLongPress(e) { longPressSpy(e); }
});

customElements.define('t-both', class extends Gestures(HTMLElement) {
  onTap(e) { tapSpy(e); }
  onLongPress(e) { longPressSpy(e); }
});

customElements.define('t-none', class extends Gestures(HTMLElement) {});

const pdown = (el, x = 0, y = 0) =>
  el.dispatchEvent(new PointerEvent('pointerdown', { clientX: x, clientY: y, button: 0, bubbles: true }));
const pmove = (el, x, y) =>
  el.dispatchEvent(new PointerEvent('pointermove', { clientX: x, clientY: y, bubbles: true }));
const pup = (el, x = 0, y = 0) =>
  el.dispatchEvent(new PointerEvent('pointerup', { clientX: x, clientY: y, bubbles: true }));
const pcancel = (el) =>
  el.dispatchEvent(new PointerEvent('pointercancel', { bubbles: true }));

describe('Gestures — tap', () => {
  let el;

  beforeEach(() => {
    tapSpy = vi.fn();
    el = document.createElement('t-tap');
    document.body.appendChild(el);
  });

  afterEach(() => { document.body.innerHTML = ''; });

  it('fires onTap on pointerup within threshold', () => {
    pdown(el); pup(el);
    expect(tapSpy).toHaveBeenCalledTimes(1);
  });

  it('does not fire when movement exceeds 10px', () => {
    pdown(el, 0, 0); pmove(el, 15, 0); pup(el, 15, 0);
    expect(tapSpy).not.toHaveBeenCalled();
  });

  it('does not fire on pointercancel', () => {
    pdown(el); pcancel(el);
    expect(tapSpy).not.toHaveBeenCalled();
  });

  it('fires for multiple sequential taps', () => {
    pdown(el); pup(el);
    pdown(el); pup(el);
    expect(tapSpy).toHaveBeenCalledTimes(2);
  });

  it('ignores non-primary button', () => {
    el.dispatchEvent(new PointerEvent('pointerdown', { button: 2, bubbles: true }));
    pup(el);
    expect(tapSpy).not.toHaveBeenCalled();
  });

  it('passes normalised event to onTap', () => {
    pdown(el, 10, 20); pup(el, 11, 21);
    const e = tapSpy.mock.calls[0][0];
    expect(e.type).toBe('tap');
    expect(e.startX).toBe(10);
    expect(e.startY).toBe(20);
    expect(e.endX).toBe(11);
    expect(e.endY).toBe(21);
    expect(typeof e.distance).toBe('number');
    expect(typeof e.duration).toBe('number');
    expect(e.direction).toBeNull();
    expect(e.velocity).toBeNull();
    expect(e.originalEvent).toBeInstanceOf(PointerEvent);
  });

  it('sets touch-action: manipulation', () => {
    expect(el.style.touchAction).toBe('manipulation');
  });
});

describe('Gestures — long press', () => {
  let el;

  beforeEach(() => {
    vi.useFakeTimers();
    longPressSpy = vi.fn();
    el = document.createElement('t-lp');
    document.body.appendChild(el);
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  it('fires onLongPress after 500ms with no movement', () => {
    pdown(el);
    vi.advanceTimersByTime(500);
    expect(longPressSpy).toHaveBeenCalledTimes(1);
  });

  it('does not fire before 500ms', () => {
    pdown(el);
    vi.advanceTimersByTime(499);
    expect(longPressSpy).not.toHaveBeenCalled();
  });

  it('does not fire when movement exceeds 10px before timer', () => {
    pdown(el, 0, 0);
    pmove(el, 15, 0);
    vi.advanceTimersByTime(500);
    expect(longPressSpy).not.toHaveBeenCalled();
  });

  it('does not fire when pointerup before 500ms', () => {
    pdown(el);
    vi.advanceTimersByTime(300);
    pup(el);
    vi.advanceTimersByTime(200);
    expect(longPressSpy).not.toHaveBeenCalled();
  });

  it('passes normalised event to onLongPress', () => {
    pdown(el, 5, 10);
    vi.advanceTimersByTime(500);
    const e = longPressSpy.mock.calls[0][0];
    expect(e.type).toBe('longpress');
    expect(e.startX).toBe(5);
    expect(e.startY).toBe(10);
    expect(e.endX).toBe(5);
    expect(e.endY).toBe(10);
    expect(e.distance).toBe(0);
    expect(e.direction).toBeNull();
    expect(e.velocity).toBeNull();
    expect(e.originalEvent).toBeInstanceOf(PointerEvent);
  });

  it('sets user-select: none', () => {
    expect(el.style.userSelect).toBe('none');
  });
});

describe('Gestures — tap suppressed after long press', () => {
  let el;

  beforeEach(() => {
    vi.useFakeTimers();
    tapSpy = vi.fn();
    longPressSpy = vi.fn();
    el = document.createElement('t-both');
    document.body.appendChild(el);
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  it('does not fire onTap after onLongPress fires', () => {
    pdown(el);
    vi.advanceTimersByTime(500);
    pup(el);
    expect(longPressSpy).toHaveBeenCalledTimes(1);
    expect(tapSpy).not.toHaveBeenCalled();
  });
});

describe('Gestures — no handlers registered', () => {
  afterEach(() => { document.body.innerHTML = ''; });

  it('does not set touch-action', () => {
    const el = document.createElement('t-none');
    document.body.appendChild(el);
    expect(el.style.touchAction).toBe('');
  });
});

describe('Gestures — lifecycle', () => {
  let el;

  beforeEach(() => {
    tapSpy = vi.fn();
    el = document.createElement('t-tap');
    document.body.appendChild(el);
  });

  afterEach(() => { document.body.innerHTML = ''; });

  it('does not fire after disconnect', () => {
    pdown(el);
    document.body.removeChild(el);
    pup(el);
    expect(tapSpy).not.toHaveBeenCalled();
  });

  it('fires after reconnect', () => {
    document.body.removeChild(el);
    document.body.appendChild(el);
    pdown(el); pup(el);
    expect(tapSpy).toHaveBeenCalledTimes(1);
  });
});
