// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { boot, dispatch, getState, reset } from '../../_lib/core/store/store.js';
import { reducer } from '../../app/store/reducer.js';
import '../../app/strings.js';
import '../../app/pages/home-page.js';

let dbSeq = 0;
function freshName() { return `home-page-test-${dbSeq++}`; }

function mount() {
  const el = document.createElement('home-page');
  document.body.appendChild(el);
  return el;
}

beforeEach(() => reset());
afterEach(() => { document.body.innerHTML = ''; });

describe('home-page — rendering', () => {
  it('renders a <main> landmark in shadow DOM', async () => {
    await boot({ dbName: freshName(), reducer });
    const el = mount();
    expect(el.shadowRoot.querySelector('main')).not.toBeNull();
  });

  it('shows initial goal count of 0', async () => {
    await boot({ dbName: freshName(), reducer });
    const el = mount();
    expect(el.shadowRoot.querySelector('#count').textContent).toBe('0');
  });

  it('count paragraph has role="status" for screen reader announcements', async () => {
    await boot({ dbName: freshName(), reducer });
    const el = mount();
    expect(el.shadowRoot.querySelector('p[role="status"]')).not.toBeNull();
  });

});

describe('home-page — store integration', () => {
  it('count updates when a goal is dispatched', async () => {
    await boot({ dbName: freshName(), reducer });
    const el = mount();
    await dispatch('goal:added', { title: 'Test goal' });
    expect(el.shadowRoot.querySelector('#count').textContent).toBe('1');
  });

  it('mounts with correct count when store already has goals', async () => {
    const name = freshName();
    await boot({ dbName: name, reducer });
    await dispatch('goal:added', { title: 'Pre-existing' });
    reset();
    await boot({ dbName: name, reducer });
    const el = mount();
    expect(el.shadowRoot.querySelector('#count').textContent).toBe('1');
  });

  it('add button dispatches goal:added and updates the count', async () => {
    await boot({ dbName: freshName(), reducer });
    const el = mount();
    el.shadowRoot.querySelector('#add').click();
    await vi.waitFor(() => expect(el.shadowRoot.querySelector('#count').textContent).toBe('1'));
    expect(getState().goals).toHaveLength(1);
  });
});

describe('home-page — goal card rendering', () => {
  it('renders a goal-card for each goal in state', async () => {
    await boot({ dbName: freshName(), reducer });
    const el = mount();
    await dispatch('goal:added', { title: 'First' });
    await dispatch('goal:added', { title: 'Second' });
    await vi.waitFor(() => expect(el.shadowRoot.querySelectorAll('goal-card').length).toBe(2));
  });

  it('removes a goal-card when a goal is deleted', async () => {
    await boot({ dbName: freshName(), reducer });
    const el = mount();
    await dispatch('goal:added', { title: 'Ephemeral' });
    await vi.waitFor(() => expect(el.shadowRoot.querySelectorAll('goal-card').length).toBe(1));
    await dispatch('goal:deleted', { id: getState().goals[0].id });
    await vi.waitFor(() => expect(el.shadowRoot.querySelectorAll('goal-card').length).toBe(0));
  });

  it('updates an existing goal-card when completion changes rather than replacing it', async () => {
    await boot({ dbName: freshName(), reducer });
    const el = mount();
    await dispatch('goal:added', { title: 'Stable card' });
    await vi.waitFor(() => expect(el.shadowRoot.querySelectorAll('goal-card').length).toBe(1));
    const cardBefore = el.shadowRoot.querySelector('goal-card');
    await dispatch('goal:completion-changed', { id: getState().goals[0].id, completion: 40 });
    await vi.waitFor(() => expect(getState().goals[0].completion).toBe(40));
    expect(el.shadowRoot.querySelector('goal-card')).toBe(cardBefore);
  });
});

describe('home-page — event wiring', () => {
  it('goal-delete event dispatches goal:deleted to store', async () => {
    await boot({ dbName: freshName(), reducer });
    const el = mount();
    await dispatch('goal:added', { title: 'To remove' });
    await vi.waitFor(() => expect(el.shadowRoot.querySelectorAll('goal-card').length).toBe(1));
    const id = getState().goals[0].id;
    el.shadowRoot.querySelector('#goals').dispatchEvent(
      new CustomEvent('goal-delete', { bubbles: true, composed: true, detail: { id } })
    );
    await vi.waitFor(() => expect(getState().goals).toHaveLength(0));
  });

  it('goal-completion-change event dispatches goal:completion-changed to store', async () => {
    await boot({ dbName: freshName(), reducer });
    const el = mount();
    await dispatch('goal:added', { title: 'Test' });
    await vi.waitFor(() => expect(el.shadowRoot.querySelectorAll('goal-card').length).toBe(1));
    const id = getState().goals[0].id;
    el.shadowRoot.querySelector('#goals').dispatchEvent(
      new CustomEvent('goal-completion-change', { bubbles: true, composed: true, detail: { id, completion: 60 } })
    );
    await vi.waitFor(() => expect(getState().goals[0].completion).toBe(60));
  });

  it('goal-completion-change with completion 100 stores the value', async () => {
    await boot({ dbName: freshName(), reducer });
    const el = mount();
    await dispatch('goal:added', { title: 'Test' });
    await vi.waitFor(() => expect(el.shadowRoot.querySelectorAll('goal-card').length).toBe(1));
    const id = getState().goals[0].id;
    el.shadowRoot.querySelector('#goals').dispatchEvent(
      new CustomEvent('goal-completion-change', { bubbles: true, composed: true, detail: { id, completion: 100 } })
    );
    await vi.waitFor(() => expect(getState().goals[0].completion).toBe(100));
  });
});

describe('home-page — lifecycle', () => {
  it('dispatching after disconnect does not throw and store remains functional', async () => {
    await boot({ dbName: freshName(), reducer });
    const el = mount();
    document.body.removeChild(el);
    await expect(dispatch('goal:added', { title: 'After disconnect' })).resolves.toBeUndefined();
    expect(getState().goals).toHaveLength(1);
  });
});
