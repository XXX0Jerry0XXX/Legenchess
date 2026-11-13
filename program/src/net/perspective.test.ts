import { describe, expect, it } from 'vitest';
import { reducer } from '../game/reducer';
import { createInitialState } from '../game/state/initialState';
import { canAct, maskState } from './perspective';

describe('perspective', () => {
  it('masks opponent pieces during setup and reveals after', () => {
    let state = reducer(createInitialState(), { type: 'START_SETUP', firstPlayer: 0 });
    state = reducer(state, { type: 'SELECT_SETUP', pieceType: 'novice' });
    state = reducer(state, { type: 'PLACE_SETUP', r: 0, c: 0 });

    const hostView = maskState(state, 0);
    expect(hostView.board[0][0]).not.toBeNull();
    expect(Object.keys(hostView.pieces)).toHaveLength(1);

    const guestView = maskState(state, 1);
    expect(guestView.board[0][0]).toBeNull();
    expect(Object.keys(guestView.pieces)).toHaveLength(0);

    const revealed = maskState({ ...state, phase: 'observe' }, 1);
    expect(revealed.board[0][0]).not.toBeNull();
    expect(Object.keys(revealed.pieces)).toHaveLength(1);
  });

  it('canAct gates setup, observe and play per owner', () => {
    const setup = reducer(createInitialState(), { type: 'START_SETUP', firstPlayer: 0 });
    expect(canAct(setup, 0)).toBe(true);
    expect(canAct(setup, 1)).toBe(false);
    expect(canAct(setup, null)).toBe(true);

    const observe = { ...setup, phase: 'observe' as const };
    expect(canAct(observe, 0)).toBe(true);
    expect(canAct(observe, 1)).toBe(false);

    const play = { ...setup, phase: 'play' as const, currentPlayer: 1 as const };
    expect(canAct(play, 0)).toBe(false);
    expect(canAct(play, 1)).toBe(true);
  });
});
