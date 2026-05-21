# /gesture

Scaffold a new gesture type in the gesture library.

## Usage
/gesture <name>

Example: `/gesture swipe`

---

## Architecture — read before writing anything

The gesture library uses a **hybrid model**. Understand both layers before touching any code.

### Layer 1 — Mixin (host-level gestures, zero boilerplate)

The common case. Components declare intent by overriding handler methods:

```js
class GoalCard extends Gestures(AppElement) {
  onTap(e)       { /* tap on the card */ }
  onLongPress(e) { /* long press on the card */ }
  onSwipe(e)     { /* swipe on the card */ }
}
```

The mixin detects which handlers are defined at `connectedCallback`, wires pointer events, manages `touch-action`, coordinates gesture state (so swipe cancels tap, long-press suppresses tap, etc.), and cleans up on `disconnectedCallback`. Zero manual cleanup.

**Use this layer when the gesture is on the host element itself.**

### Layer 2 — `Gestures.attach` (child-element gestures, explicit)

For gestures on sub-elements that are not their own Web Components — a drag handle inside a progress bar, a sliding button within a CTA. This static method returns a cleanup function.

```js
class ProgressBar extends Gestures(AppElement) {
  onTap(e) { /* host-level tap */ }

  subscribe() {
    // Gesture on a child element within the shadow DOM
    this._cleanupHandle = Gestures.attach(
      this.shadowRoot.querySelector('.handle'),
      'drag',
      e => this.onHandleDrag(e)
    );
  }

  unsubscribe() {
    this._cleanupHandle?.();
  }

  onHandleDrag(e) { /* drag on the handle div */ }
}
```

`Gestures.attach(element, type, handler)` returns a cleanup function that removes all listeners. The handler receives the same normalised event object as the mixin layer.

Child-element gestures are **independent** of host gestures — a drag on `.handle` does not cancel the card's tap, because they are separate elements with separate gesture state.

**Use this layer when the gesture is on a child element that is not its own Web Component.**

### When to make the child a Web Component instead

If the child element has its own visual state, its own events, or will be reused elsewhere — make it a component and give it gestures via the mixin. The `Gestures.attach` layer is for structural sub-elements (drag handles, swipe rows) where the parent component owns the interaction semantics.

---

## Implementing a new gesture

### 1. Read the existing code first

Read `modules/gestures/gestures.js` in full. Understand:
- The bind-once guard (`if (!this._pointerDown)`) in `connectedCallback`
- The in-flight listener pattern (`_gestureRemoveInflight`, called from three sites)
- The shared gesture state object (`this._gesture`) and how it coordinates tap/longpress
- The `_gestureEvent` builder and the normalised event shape

### 2. Extend the mixin (Layer 1)

- Add handler detection in `connectedCallback`: `typeof this.onSwipe === 'function'`
- Add any new state fields to `this._gesture` in `_gestureDown`
- Extend `_gestureMove` or `_gestureUp` with the new gesture's firing logic
- Update `disconnectedCallback` cleanup if new timers or state are added
- Update `touch-action` logic for the new gesture:
  - `tap` only → `'manipulation'`
  - `longPress` → additionally set `user-select: none`
  - `swipe` (horizontal) → `'pan-y'` (allows vertical scroll, captures horizontal)
  - `drag` → `'none'`
  - Document reasoning in a comment when the value is non-obvious

### 3. Implement `Gestures.attach` (Layer 2, if not yet built)

Add as a static method on the mixin class. It must:
- Accept `(element, type, handler)`
- Set `touch-action` and `user-select` on the element appropriate to the gesture type
- Add pointer event listeners using the same state machine logic as `_gestureDown`/`_gestureMove`/`_gestureUp`
- Return a cleanup function that removes all listeners and clears any pending timers
- **Not share state with the host's `this._gesture`** — child gestures are independent

### 4. Normalised event object

All handlers receive:
```js
{
  type,        // 'tap' | 'longpress' | 'swipe' | 'drag' | ...
  direction,   // 'left' | 'right' | 'up' | 'down' | null
  velocity,    // px/ms | null
  distance,    // px
  startX, startY, endX, endY,
  duration,    // ms
  originalEvent
}
```
Populate only the fields relevant to the gesture. Others remain `null`.

### 5. Gesture coordination rules

These must hold after adding any new gesture:
- Swipe cancels tap (movement threshold crossed → tap cannot fire)
- Long press suppresses tap (longPressFired flag checked in `_gestureUp`)
- Drag cancels tap and long press
- A gesture that fires does not allow another gesture to fire in the same pointer-down sequence

For `Gestures.attach` child gestures: no coordination with the host's gestures — the child element has its own independent gesture state.

### 6. Movement thresholds

- Tap / long press: cancel if movement > 10px from start
- Swipe: lock direction at ~10px; yield to native scroll if vertical intent detected first
- Drag: no cancellation threshold — once pointer capture is acquired, track continuously

### 7. Pointer capture

Use `element.setPointerCapture(e.pointerId)` for drag-style gestures so tracking continues if the pointer leaves the element. Already called in `_gestureDown` for all gestures — check it remains appropriate for the new one.

---

## Tests

Write tests in `modules/gestures/gestures.test.js`:

- Add a new custom element type for the new gesture (e.g. `t-swipe`)
- Mock `setPointerCapture` / `releasePointerCapture` at module level (happy-dom doesn't implement them)
- Use `vi.useFakeTimers()` for any timer-based gestures
- Required test cases:
  - Fires on valid input
  - Does not fire below movement threshold
  - Does not co-fire with an incompatible gesture (e.g. swipe does not also fire tap)
  - Does not fire after disconnect
  - Fires after reconnect (lifecycle test)
  - For `Gestures.attach`: cleanup function removes all listeners (verify handler not called after cleanup)
- Note any aspects that require Playwright (e.g. native scroll yield, pointer capture across element bounds)

---

## Report

State: what was added, the `touch-action` value used and why, any interaction with existing gestures, and any known browser inconsistencies.
