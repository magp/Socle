const TAP_THRESHOLD = 10;
const LONG_PRESS_DELAY = 500;

export const Gestures = (Base) => class extends Base {
  connectedCallback() {
    super.connectedCallback?.();

    const hasTap = typeof this.onTap === 'function';
    const hasLongPress = typeof this.onLongPress === 'function';
    if (!hasTap && !hasLongPress) return;

    if (!this._pointerDown) {
      this.style.touchAction = 'manipulation';
      if (hasLongPress) this.style.userSelect = 'none';
      this._pointerDown = this._gestureDown.bind(this);
      this._pointerMove = this._gestureMove.bind(this);
      this._pointerUp = this._gestureUp.bind(this);
      this._pointerCancel = this._gestureCancel.bind(this);
    }

    this.addEventListener('pointerdown', this._pointerDown);
  }

  disconnectedCallback() {
    super.disconnectedCallback?.();
    clearTimeout(this._longPressTimer);
    this._gestureRemoveInflight();
    this._gesture = null;
    if (this._pointerDown) this.removeEventListener('pointerdown', this._pointerDown);
  }

  _gestureDown(e) {
    if (e.button !== 0) return;
    this.setPointerCapture(e.pointerId);
    this.addEventListener('pointermove', this._pointerMove);
    this.addEventListener('pointerup', this._pointerUp);
    this.addEventListener('pointercancel', this._pointerCancel);
    this._gesture = {
      startX: e.clientX, startY: e.clientY,
      startTime: Date.now(),
      longPressFired: false, cancelled: false,
      originalEvent: e,
    };
    if (typeof this.onLongPress === 'function') {
      this._longPressTimer = setTimeout(() => {
        if (!this._gesture?.cancelled) {
          this._gesture.longPressFired = true;
          const g = this._gesture;
          this.onLongPress(this._gestureEvent('longpress', g.startX, g.startY, g.startX, g.startY, g));
        }
      }, LONG_PRESS_DELAY);
    }
  }

  _gestureMove(e) {
    if (!this._gesture || this._gesture.cancelled) return;
    const dx = e.clientX - this._gesture.startX;
    const dy = e.clientY - this._gesture.startY;
    if (Math.sqrt(dx * dx + dy * dy) > TAP_THRESHOLD) {
      this._gesture.cancelled = true;
      clearTimeout(this._longPressTimer);
    }
  }

  _gestureUp(e) {
    const g = this._gesture;
    if (!g) return;
    clearTimeout(this._longPressTimer);
    this._gestureRemoveInflight();
    this._gesture = null;
    if (g.cancelled || g.longPressFired) return;
    if (typeof this.onTap === 'function') {
      this.onTap(this._gestureEvent('tap', g.startX, g.startY, e.clientX, e.clientY, g));
    }
  }

  _gestureCancel() {
    clearTimeout(this._longPressTimer);
    this._gestureRemoveInflight();
    this._gesture = null;
  }

  _gestureRemoveInflight() {
    this.removeEventListener('pointermove', this._pointerMove);
    this.removeEventListener('pointerup', this._pointerUp);
    this.removeEventListener('pointercancel', this._pointerCancel);
  }

  _gestureEvent(type, startX, startY, endX, endY, g) {
    const dx = endX - startX;
    const dy = endY - startY;
    return {
      type, startX, startY, endX, endY,
      distance: Math.sqrt(dx * dx + dy * dy),
      duration: Date.now() - g.startTime,
      direction: null, velocity: null,
      originalEvent: g.originalEvent,
    };
  }
};
