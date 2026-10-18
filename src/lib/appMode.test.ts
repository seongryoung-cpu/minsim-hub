import { describe, expect, test } from 'bun:test';
import { getAppModeState } from './appMode';

describe('database-driven app mode', () => {
  test('pending settings do not select an election layout', () => {
    expect(getAppModeState(undefined, true, false, false, false)).toEqual({ mode: null, isError: false, isLoading: true });
  });
  test('auto waits for the election date', () => {
    expect(getAppModeState('auto', null, false, false, true)).toEqual({ mode: null, isError: false, isLoading: true });
  });
  test('auto selects normal after election day', () => {
    expect(getAppModeState('auto', true, false, false, false).mode).toBe('normal');
  });
  test('auto keeps election on or before election day', () => {
    expect(getAppModeState('auto', false, false, false, false).mode).toBe('election');
  });
  test('failed schedule cannot default to election, even with cached dates', () => {
    expect(getAppModeState('auto', true, false, true, false)).toEqual({ mode: null, isError: true, isLoading: false });
  });
  test('failed settings cannot default to auto', () => {
    expect(getAppModeState(undefined, false, true, false, false)).toEqual({ mode: null, isError: true, isLoading: false });
  });
  test('missing current election cannot determine auto mode', () => {
    expect(getAppModeState('auto', null, false, false, false).isError).toBe(true);
  });
  test('explicit modes do not require schedule data', () => {
    expect(getAppModeState('normal', null, false, true, false).mode).toBe('normal');
    expect(getAppModeState('election', null, false, false, true).mode).toBe('election');
  });
});