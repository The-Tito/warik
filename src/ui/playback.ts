/**
 * Controles de reproducción: botones, slider, velocidad, atajos de teclado
 * y el timer de autoplay. Todo el estado vive en el store; aquí solo hay
 * bindings y el efecto del timer.
 */

import type { PlaybackState, Store } from './store';

const BASE_TICK_MS = 550;

export interface PlaybackEls {
  first: HTMLButtonElement;
  prev: HTMLButtonElement;
  play: HTMLButtonElement;
  next: HTMLButtonElement;
  last: HTMLButtonElement;
  slider: HTMLInputElement;
  speed: HTMLSelectElement;
}

export function initPlayback(store: Store<PlaybackState>, els: PlaybackEls): void {
  const goto = (i: number): void => {
    const { frames } = store.get();
    if (!frames.length) return;
    store.set({ curr: Math.max(0, Math.min(frames.length - 1, i)) });
  };
  const step = (d: number): void => {
    store.set({ playing: false });
    goto(store.get().curr + d);
  };
  const togglePlay = (): void => {
    const s = store.get();
    if (s.playing) {
      store.set({ playing: false });
      return;
    }
    if (s.curr >= s.frames.length - 1) goto(0);
    store.set({ playing: true });
  };

  els.first.onclick = () => step(-Infinity);
  els.last.onclick = () => step(Infinity);
  els.prev.onclick = () => step(-1);
  els.next.onclick = () => step(1);
  els.play.onclick = togglePlay;
  els.slider.oninput = () => {
    store.set({ playing: false });
    goto(parseInt(els.slider.value, 10));
  };
  els.speed.onchange = () => store.set({ speed: parseFloat(els.speed.value) });

  document.addEventListener('keydown', (e) => {
    const s = store.get();
    if (s.mode !== 'play' || !s.frames.length) return;
    if (e.target instanceof HTMLElement && e.target.tagName === 'TEXTAREA') return;
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      step(1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      step(-1);
    } else if (e.key === ' ') {
      e.preventDefault();
      togglePlay();
    }
  });

  let timer: ReturnType<typeof setInterval> | null = null;
  const stopTimer = (): void => {
    if (timer !== null) {
      clearInterval(timer);
      timer = null;
    }
  };
  store.subscribe((s, prev) => {
    els.play.textContent = s.playing ? '❚❚' : '▶';
    const shouldRun = s.playing && s.mode === 'play';
    if (!shouldRun) {
      stopTimer();
      return;
    }
    if (timer === null || s.speed !== prev.speed) {
      stopTimer();
      timer = setInterval(() => {
        const cur = store.get();
        if (cur.curr >= cur.frames.length - 1) store.set({ playing: false });
        else store.set({ curr: cur.curr + 1 });
      }, BASE_TICK_MS / s.speed);
    }
  });
}
