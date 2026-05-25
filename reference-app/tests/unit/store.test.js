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

  it('goal:title-set creates a new goal for a year', async () => {
    await boot({ dbName: freshName(), reducer });
    await dispatch('goal:title-set', { year: '2026', id: 'abc', title: 'Run a 5k' });
    expect(getState().goals['2026']).toHaveLength(1);
    expect(getState().goals['2026'][0].title).toBe('Run a 5k');
    expect(getState().goals['2026'][0].percentage).toBe(0);
  });

  it('goal:title-set updates an existing goal title', async () => {
    await boot({ dbName: freshName(), reducer });
    await dispatch('goal:title-set', { year: '2026', id: 'abc', title: 'Original' });
    await dispatch('goal:title-set', { year: '2026', id: 'abc', title: 'Updated' });
    expect(getState().goals['2026']).toHaveLength(1);
    expect(getState().goals['2026'][0].title).toBe('Updated');
  });

  it('goal:progress-set updates the percentage for a goal', async () => {
    await boot({ dbName: freshName(), reducer });
    await dispatch('goal:title-set', { year: '2026', id: 'abc', title: 'Learn piano' });
    await dispatch('goal:progress-set', { year: '2026', id: 'abc', percentage: 75 });
    expect(getState().goals['2026'][0].percentage).toBe(75);
  });

  it('subscriber receives updated goals after dispatch', async () => {
    await boot({ dbName: freshName(), reducer });
    const received = [];
    subscribe('goals', goals => { if (goals) received.push(goals); });
    await dispatch('goal:title-set', { year: '2026', id: 'abc', title: 'Read more' });
    expect(received).toHaveLength(1);
    expect(received[0]['2026'][0].title).toBe('Read more');
  });

  it('state persists across a simulated reload', async () => {
    const name = freshName();
    await boot({ dbName: name, reducer });
    await dispatch('goal:title-set', { year: '2026', id: 'abc', title: 'Learn Spanish' });
    reset();
    await boot({ dbName: name, reducer });
    expect(getState().goals['2026'][0].title).toBe('Learn Spanish');
  });

  it('goals for different years are independent', async () => {
    await boot({ dbName: freshName(), reducer });
    await dispatch('goal:title-set', { year: '2025', id: 'id-a', title: 'Past goal' });
    await dispatch('goal:title-set', { year: '2026', id: 'id-b', title: 'This year' });
    expect(getState().goals['2025'][0].title).toBe('Past goal');
    expect(getState().goals['2026'][0].title).toBe('This year');
  });

  it('progress update does not affect other years', async () => {
    await boot({ dbName: freshName(), reducer });
    await dispatch('goal:title-set', { year: '2025', id: 'id-a', title: 'Past' });
    await dispatch('goal:title-set', { year: '2026', id: 'id-b', title: 'Current' });
    await dispatch('goal:progress-set', { year: '2026', id: 'id-b', percentage: 50 });
    expect(getState().goals['2025'][0].percentage).toBe(0);
    expect(getState().goals['2026'][0].percentage).toBe(50);
  });
});
