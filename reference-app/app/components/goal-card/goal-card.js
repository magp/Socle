import { AppElement } from '../../../_lib/core/app-element.js';
import { Gestures } from '../../../_lib/modules/gestures/gestures.js';

class GoalCard extends Gestures(AppElement) {
  set goal(value) {
    this._goal = value;
    if (this.shadowRoot) this._update();
  }

  template() {
    return `
      <style>
        :host {
          display: flex;
          align-items: center;
          padding: var(--space-3) var(--space-4);
          background: var(--color-surface-raised);
          border-radius: var(--radius-md);
          cursor: pointer;
          min-block-size: var(--touch-target);
          outline: none;
        }
        :host(:focus-visible) {
          outline: 2px solid var(--color-text-primary);
          outline-offset: 2px;
        }
        :host([completed]) p {
          text-decoration: line-through;
          opacity: 0.5;
        }
        p { margin: 0; }
      </style>
      <p></p>
    `;
  }

  subscribe() {
    this.setAttribute('tabindex', '0');
    this.setAttribute('role', 'button');
    this._onKeyDown = e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.onTap();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        this.onLongPress();
      }
    };
    this.addEventListener('keydown', this._onKeyDown);
    this._update();
  }

  unsubscribe() {
    this.removeEventListener('keydown', this._onKeyDown);
  }

  _update() {
    if (!this.shadowRoot) return;
    const title = this._goal?.title ?? '';
    const completed = !!this._goal?.completed;
    this.shadowRoot.querySelector('p').textContent = title;
    this.toggleAttribute('completed', completed);
    this.setAttribute('aria-pressed', String(completed));
    this.setAttribute('aria-label', title);
  }

  onTap() {
    if (this._goal) this.dispatchEvent(new CustomEvent('goal-tap', {
      bubbles: true, composed: true, detail: { id: this._goal.id },
    }));
  }

  onLongPress() {
    if (this._goal) this.dispatchEvent(new CustomEvent('goal-delete', {
      bubbles: true, composed: true, detail: { id: this._goal.id },
    }));
  }
}

customElements.define('goal-card', GoalCard);
