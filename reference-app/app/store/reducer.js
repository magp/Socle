export function reducer(state, event) {
  switch (event.type) {
    case 'goal:added':
      return { ...state, goals: [...(state.goals ?? []), { ...event.payload, id: event.id, completed: false }] };
    case 'goal:toggled': {
      const goals = (state.goals ?? []).map(g =>
        g.id === event.payload.id ? { ...g, completed: !g.completed } : g
      );
      return { ...state, goals };
    }
    case 'goal:deleted':
      return { ...state, goals: (state.goals ?? []).filter(g => g.id !== event.payload.id) };
    default:
      return state;
  }
}
