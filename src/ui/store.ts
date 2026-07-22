/**
 * Store observable minimalista (pub/sub). Un solo átomo de estado; los
 * suscriptores reciben (estado, estadoAnterior) y deciden qué les cambió.
 */

import type { Frame, TraceResult } from '../core/frame';

export type Subscriber<T> = (state: T, prev: T) => void;

export interface Store<T> {
  get(): T;
  set(patch: Partial<T>): void;
  subscribe(fn: Subscriber<T>): () => void;
}

export function createStore<T extends object>(initial: T): Store<T> {
  let state = initial;
  const subs = new Set<Subscriber<T>>();
  return {
    get: () => state,
    set(patch) {
      const prev = state;
      state = { ...state, ...patch };
      for (const fn of subs) fn(state, prev);
    },
    subscribe(fn) {
      subs.add(fn);
      return () => subs.delete(fn);
    },
  };
}

export type Mode = 'edit' | 'play';

export interface PlaybackState {
  mode: Mode;
  frames: Frame[];
  meta: TraceResult | null;
  /** Índice del paso actual. */
  curr: number;
  playing: boolean;
  speed: number;
}

export function createPlaybackStore(): Store<PlaybackState> {
  return createStore<PlaybackState>({
    mode: 'edit',
    frames: [],
    meta: null,
    curr: 0,
    playing: false,
    speed: 1,
  });
}
