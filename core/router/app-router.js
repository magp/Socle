import { AppElement } from '../app-element.js';
import { matchRoute } from './router.js';

class AppRouter extends AppElement {
  set routes(value) {
    this._routes = value;
    // shadowRoot is null if routes is set before connectedCallback; subscribe() calls _route() instead
    if (this.shadowRoot) this._route();
  }

  subscribe() {
    this._onNavigate = () => this._route();
    this._onPopstate = () => this._route();
    window.addEventListener('navigate', this._onNavigate);
    window.addEventListener('popstate', this._onPopstate);
    this._route();
  }

  unsubscribe() {
    window.removeEventListener('navigate', this._onNavigate);
    window.removeEventListener('popstate', this._onPopstate);
  }

  _route() {
    if (!this._routes) return;
    const path = location.pathname;
    if (path === this._currentPath) return;
    this._currentPath = path;
    const matched = matchRoute(this._routes, path);
    if (!matched) return;
    const { route, params } = matched;
    const el = document.createElement(route.component);
    el.params = params;
    this.shadowRoot.replaceChildren(el);
  }

  template() {
    return '';
  }
}

customElements.define('app-router', AppRouter);
