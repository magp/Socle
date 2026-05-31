import { AppElement } from '../../core/app-element.js';

class AppHeader extends AppElement {
  template() {
    return `
      <style>
        :host {
          display: block;
          position: sticky;
          inset-block-start: 0;
          z-index: 100;
          background: var(--color-bg);
          border-block-end: 1px solid var(--color-border);
          padding-block-start: var(--safe-area-top, 0px);
        }
        .inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-block: var(--space-3);
          padding-inline: var(--space-4);
          min-block-size: 44px;
        }
        .title {
          font-size: var(--font-size-heading);
          font-weight: var(--font-weight-bold);
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .action {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          flex-shrink: 0;
        }
      </style>
      <header class="inner">
        <span class="title"><slot></slot></span>
        <div class="action"><slot name="action"></slot></div>
      </header>
    `;
  }
}

customElements.define('app-header', AppHeader);
