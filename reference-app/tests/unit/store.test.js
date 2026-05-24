import { describe, it, expect, beforeEach } from 'vitest';
import { boot, dispatch, subscribe, getState, reset } from '../../_lib/core/store/store.js';
import { reducer } from '../../app/store/reducer.js';

let dbSeq = 0;
function freshName() { return `ref-store-${dbSeq++}`; }

beforeEach(() => reset());

describe('reference-app store integration', () => {
  it('boots with empty state when no events exist', async () => {
    await boot({ dbName: freshName(), reducer });
    expect(getState()).toEqual({});
  });

  it('dispatch goal:added adds a goal to state', async () => {
    await boot({ dbName: freshName(), reducer });
    await dispatch('goal:added', { title: 'Run a 5k' });
    expect(getState().goals).toHaveLength(1);
    expect(getState().goals[0].title).toBe('Run a 5k');
  });

  it('subscriber receives updated goals after dispatch', async () => {
    await boot({ dbName: freshName(), reducer });
    const received = [];
    subscribe('goals', goals => { if (goals) received.push(goals); });
    await dispatch('goal:added', { title: 'Read more' });
    expect(received).toHaveLength(1);
    expect(received[0][0].title).toBe('Read more');
  });

  it('state persists across a simulated reload', async () => {
    const name = freshName();
    await boot({ dbName: name, reducer });
    await dispatch('goal:added', { title: 'Learn Spanish' });
    reset();
    await boot({ dbName: name, reducer });
    expect(getState().goals).toHaveLength(1);
    expect(getState().goals[0].title).toBe('Learn Spanish');
  });

  it('multiple dispatches accumulate goals', async () => {
    await boot({ dbName: freshName(), reducer });
    await dispatch('goal:added', { title: 'First' });
    await dispatch('goal:added', { title: 'Second' });
    expect(getState().goals).toHaveLength(2);
  });

  it('goal:completion-changed updates a goal completion in state', async () => {
    await boot({ dbName: freshName(), reducer });
    await dispatch('goal:added', { title: 'Learn piano' });
    const id = getState().goals[0].id;
    await dispatch('goal:completion-changed', { id, completion: 75 });
    expect(getState().goals[0].completion).toBe(75);
  });

  it('goal:deleted removes the matching goal from state', async () => {
    await boot({ dbName: freshName(), reducer });
    await dispatch('goal:added', { title: 'To delete' });
    const id = getState().goals[0].id;
    await dispatch('goal:deleted', { id });
    expect(getState().goals).toHaveLength(0);
  });

  it('goal:deleted leaves other goals intact', async () => {
    await boot({ dbName: freshName(), reducer });
    await dispatch('goal:added', { title: 'Keep me' });
    await dispatch('goal:added', { title: 'Delete me' });
    const deleteId = getState().goals[1].id;
    await dispatch('goal:deleted', { id: deleteId });
    expect(getState().goals).toHaveLength(1);
    expect(getState().goals[0].title).toBe('Keep me');
  });
});
